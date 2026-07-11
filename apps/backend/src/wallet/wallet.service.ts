import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto, TopUpWalletDto, TransferFundsDto, WithdrawFundsDto } from './dto/wallet.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate, buildPaginationQuery } from '../common/utils/pagination.util';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWalletDto) {
    if (!dto.userId && !dto.organizationId) {
      throw new BadRequestException('Either userId or organizationId must be provided');
    }

    const currency = dto.currency || 'NGN';

    // Verify uniqueness
    if (dto.userId) {
      const existing = await this.prisma.energyWallet.findFirst({
        where: { userId: dto.userId, currency },
      });
      if (existing) return existing;
    } else if (dto.organizationId) {
      const existing = await this.prisma.energyWallet.findFirst({
        where: { organizationId: dto.organizationId, currency },
      });
      if (existing) return existing;
    }

    return this.prisma.energyWallet.create({
      data: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        currency,
        balance: 0.0,
        lockedBalance: 0.0,
      },
    });
  }

  async findByOwner(userId?: string, organizationId?: string) {
    return this.prisma.energyWallet.findMany({
      where: {
        ...(userId && { userId }),
        ...(organizationId && { organizationId }),
      },
      include: {
        _count: { select: { transactions: true } },
      },
    });
  }

  async findOne(id: string) {
    const wallet = await this.prisma.energyWallet.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async topUp(walletId: string, dto: TopUpWalletDto, createdBy: string) {
    const wallet = await this.findOne(walletId);
    const ref = dto.reference || `topup_${crypto.randomBytes(8).toString('hex')}`;

    // Create payment entry
    await this.prisma.payment.create({
      data: {
        userId: wallet.userId,
        amount: dto.amount,
        currency: wallet.currency,
        gateway: dto.gateway || 'PAYSTACK',
        gatewayRef: ref,
        status: 'SUCCESS',
        paidAt: new Date(),
      },
    });

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + dto.amount;

    // Update wallet and log transaction in atomic txn
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.energyWallet.update({
        where: { id: walletId },
        data: { balance: { increment: dto.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId,
          type: 'TOP_UP',
          amount: dto.amount,
          currency: wallet.currency,
          balanceBefore,
          balanceAfter,
          reference: ref,
          description: `Wallet top-up via ${dto.gateway || 'payment gateway'}`,
          status: 'COMPLETED',
          createdBy,
        },
      });

      return updated;
    });
  }

  async transfer(senderWalletId: string, dto: TransferFundsDto, createdBy: string) {
    const sender = await this.findOne(senderWalletId);
    const recipient = await this.findOne(dto.recipientWalletId);

    if (sender.id === recipient.id) {
      throw new BadRequestException('Cannot transfer funds to the same wallet');
    }

    if (sender.currency !== recipient.currency) {
      throw new BadRequestException(
        `Currency mismatch: Sender is ${sender.currency}, Recipient is ${recipient.currency}`,
      );
    }

    if (sender.balance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const ref = `tx_${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.$transaction(async (tx) => {
      const updatedSender = await tx.energyWallet.update({
        where: { id: senderWalletId },
        data: { balance: { decrement: dto.amount } },
      });

      await tx.energyWallet.update({
        where: { id: dto.recipientWalletId },
        data: { balance: { increment: dto.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: senderWalletId,
          type: 'DEBIT',
          amount: dto.amount,
          currency: sender.currency,
          balanceBefore: sender.balance,
          balanceAfter: sender.balance - dto.amount,
          reference: ref,
          description: dto.description || `Transfer to wallet ${recipient.id}`,
          status: 'COMPLETED',
          createdBy,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: dto.recipientWalletId,
          type: 'CREDIT',
          amount: dto.amount,
          currency: recipient.currency,
          balanceBefore: recipient.balance,
          balanceAfter: recipient.balance + dto.amount,
          reference: ref,
          description: dto.description || `Transfer from wallet ${sender.id}`,
          status: 'COMPLETED',
          createdBy,
        },
      });

      return updatedSender;
    });
  }

  async lockBalance(walletId: string, amount: number) {
    const wallet = await this.findOne(walletId);
    if (wallet.balance < amount) throw new BadRequestException('Insufficient balance to lock');

    return this.prisma.energyWallet.update({
      where: { id: walletId },
      data: {
        balance: { decrement: amount },
        lockedBalance: { increment: amount },
      },
    });
  }

  async releaseBalance(walletId: string, amount: number) {
    const wallet = await this.findOne(walletId);
    if (wallet.lockedBalance < amount) throw new BadRequestException('Insufficient locked balance to release');

    return this.prisma.energyWallet.update({
      where: { id: walletId },
      data: {
        balance: { increment: amount },
        lockedBalance: { decrement: amount },
      },
    });
  }

  async getTransactions(walletId: string, pagination: PaginationDto) {
    const query = buildPaginationQuery(pagination);
    const where = { walletId };

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        ...query,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }
}

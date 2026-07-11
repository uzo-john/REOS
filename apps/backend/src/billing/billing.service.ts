import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { GenerateBillDto, PayBillDto } from './dto/billing.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate, buildPaginationQuery } from '../common/utils/pagination.util';
import * as crypto from 'crypto';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async generateBill(dto: GenerateBillDto, createdBy: string) {
    const billNumber = `BILL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const baseAmount = dto.energyConsumedKwh * dto.tariffRate;
    const exportCredit = (dto.energyExportedKwh ?? 0.0) * dto.tariffRate;
    const subtotal = Math.max(0, baseAmount - exportCredit);
    const taxAmount = subtotal * 0.075; // 7.5% VAT
    const totalAmount = subtotal + taxAmount;

    const currency = dto.currency || 'NGN';
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days default

    return this.prisma.bill.create({
      data: {
        userId: dto.userId,
        contractId: dto.contractId,
        billNumber,
        billingPeriodStart: new Date(dto.billingPeriodStart),
        billingPeriodEnd: new Date(dto.billingPeriodEnd),
        energyConsumedKwh: dto.energyConsumedKwh,
        energyExportedKwh: dto.energyExportedKwh ?? 0.0,
        tariffRate: dto.tariffRate,
        currency,
        baseAmount: subtotal,
        taxAmount,
        totalAmount,
        status: 'ISSUED',
        dueDate,
        createdBy,
      },
    });
  }

  async getBills(pagination: PaginationDto, userId?: string, status?: string) {
    const query = buildPaginationQuery(pagination);
    const where: any = {
      deletedAt: null,
      ...(userId && { userId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        ...query,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          payments: true,
        },
      }),
      this.prisma.bill.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  async findOne(id: string) {
    const bill = await this.prisma.bill.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        payments: true,
      },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  async payBillWithWallet(billId: string, userId: string) {
    const bill = await this.findOne(billId);
    if (bill.status === 'PAID') throw new BadRequestException('Bill is already paid');
    if (bill.userId !== userId) throw new BadRequestException('Cannot pay bills for other users');

    const wallets = await this.walletService.findByOwner(userId);
    const userWallet = wallets.find((w) => w.currency === bill.currency);
    if (!userWallet) throw new BadRequestException(`No active wallet found for currency ${bill.currency}`);
    if (userWallet.balance < bill.totalAmount) throw new BadRequestException('Insufficient wallet balance');

    const ref = `billpay_${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Deduct wallet
      await tx.energyWallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: bill.totalAmount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          type: 'DEBIT',
          amount: bill.totalAmount,
          currency: bill.currency,
          balanceBefore: userWallet.balance,
          balanceAfter: userWallet.balance - bill.totalAmount,
          reference: ref,
          description: `Direct wallet payment for bill #${bill.billNumber}`,
          status: 'COMPLETED',
          createdBy: userId,
        },
      });

      // 2. Mark bill paid
      const updated = await tx.bill.update({
        where: { id: billId },
        data: { status: 'PAID', paidAt: new Date() },
      });

      // 3. Log payment transaction
      await tx.payment.create({
        data: {
          billId,
          userId,
          amount: bill.totalAmount,
          currency: bill.currency,
          gateway: 'ENERGY_WALLET',
          gatewayRef: ref,
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      return updated;
    });
  }

  async recordGatewayPayment(billId: string, userId: string, dto: PayBillDto) {
    const bill = await this.findOne(billId);
    if (bill.status === 'PAID') throw new BadRequestException('Bill is already paid');

    const ref = dto.gatewayRef || `pay_${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.bill.update({
        where: { id: billId },
        data: { status: 'PAID', paidAt: new Date() },
      });

      await tx.payment.create({
        data: {
          billId,
          userId,
          amount: bill.totalAmount,
          currency: bill.currency,
          gateway: dto.gateway || 'PAYSTACK',
          gatewayRef: ref,
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      return updated;
    });
  }
}

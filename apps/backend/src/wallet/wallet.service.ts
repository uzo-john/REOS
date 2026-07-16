import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWalletDto,
  TopUpWalletDto,
  TransferFundsDto,
  BuyEnergyDto,
  VerifyEscrowDto,
  RequestWithdrawalDto,
  ProcessWithdrawalDto,
  RequestRefundDto,
  OpenDisputeDto,
  ResolveDisputeDto,
  DisputeMessageDto,
} from './dto/wallet.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  paginate,
  buildPaginationQuery,
} from '../common/utils/pagination.util';
import * as crypto from 'crypto';

const PLATFORM_FEE_NGN = 500; // ₦500 flat per transaction

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // WALLET CRUD
  // ──────────────────────────────────────────────────────────────────────────

  async create(dto: CreateWalletDto) {
    if (!dto.userId && !dto.organizationId) {
      throw new BadRequestException(
        'Either userId or organizationId must be provided',
      );
    }
    const currency = dto.currency || 'NGN';
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
        balance: 0,
        lockedBalance: 0,
      },
    });
  }

  async findByOwner(userId?: string, organizationId?: string) {
    return this.prisma.energyWallet.findMany({
      where: {
        ...(userId && { userId }),
        ...(organizationId && { organizationId }),
      },
      include: { _count: { select: { transactions: true } } },
    });
  }

  async findOne(id: string) {
    const wallet = await this.prisma.energyWallet.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: { select: { id: true, name: true } },
      },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CONSUMER DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────

  async getConsumerDashboard(userId: string) {
    const wallets = await this.findByOwner(userId);
    const mainWallet = wallets.find((w) => w.currency === 'NGN') || wallets[0];

    const [escrowHeld, recentTx, pendingRefunds] = await Promise.all([
      this.prisma.escrowTransaction.findMany({
        where: { buyerId: userId, status: 'HOLDING' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.walletTransaction.findMany({
        where: { walletId: mainWallet?.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.refund.count({
        where: { buyerId: userId, status: 'PENDING' },
      }),
    ]);

    const totalEscrowHeld = escrowHeld.reduce((s, e) => s + e.grossAmount, 0);

    return {
      wallet: mainWallet,
      availableBalance: mainWallet?.balance ?? 0,
      lockedInEscrow: mainWallet?.lockedBalance ?? 0,
      totalEscrowHeld,
      escrowItems: escrowHeld,
      recentTransactions: recentTx,
      pendingRefunds,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PLANT OWNER DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────

  async getPlantOwnerDashboard(userId: string) {
    const wallets = await this.findByOwner(userId);
    const mainWallet = wallets.find((w) => w.currency === 'NGN') || wallets[0];

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      pendingSettlements,
      recentSales,
      completedTrades,
      pendingWithdrawals,
    ] = await Promise.all([
      this.prisma.escrowTransaction.findMany({
        where: { sellerId: userId, status: 'HOLDING' },
      }),
      this.prisma.walletTransaction.findMany({
        where: { walletId: mainWallet?.id, type: 'ENERGY_SALE' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.escrowTransaction.count({
        where: { sellerId: userId, status: 'RELEASED' },
      }),
      this.prisma.withdrawalRequest.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] },
        },
      }),
    ]);

    // 7-day revenue data
    const weeklyRevenue = await this.prisma.walletTransaction.groupBy({
      by: ['createdAt'],
      where: {
        walletId: mainWallet?.id,
        type: 'ENERGY_SALE',
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: { amount: true },
    });

    const totalPendingSettlement = pendingSettlements.reduce(
      (s, e) => s + e.netAmountToSeller,
      0,
    );

    return {
      wallet: mainWallet,
      availableBalance: mainWallet?.balance ?? 0,
      pendingSettlement: totalPendingSettlement,
      pendingSettlementItems: pendingSettlements,
      completedTradesCount: completedTrades,
      recentSales,
      weeklyRevenue,
      pendingWithdrawals,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TOP UP
  // ──────────────────────────────────────────────────────────────────────────

  async topUp(walletId: string, dto: TopUpWalletDto, createdBy: string) {
    const wallet = await this.findOne(walletId);
    const ref =
      dto.reference || `topup_${crypto.randomBytes(8).toString('hex')}`;

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
          description: `Wallet funded via ${dto.gateway || 'payment gateway'}`,
          status: 'COMPLETED',
          createdBy,
        },
      });
      // Notify
      if (wallet.userId) {
        await tx.notification.create({
          data: {
            userId: wallet.userId,
            title: 'Wallet Funded ✅',
            message: `₦${dto.amount.toLocaleString()} has been added to your Energy Wallet. New balance: ₦${balanceAfter.toLocaleString()}`,
            type: 'WALLET',
          },
        });
      }
      return updated;
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUY ENERGY → ESCROW
  // ──────────────────────────────────────────────────────────────────────────

  async buyEnergy(buyerId: string, dto: BuyEnergyDto) {
    // 1. Fetch the P2P session (offer)
    const session = await this.prisma.p2PSession.findUnique({
      where: { id: dto.sessionId },
    });
    if (!session) throw new NotFoundException('Energy offer not found');
    if (session.status !== 'PENDING')
      throw new BadRequestException('This energy offer is no longer available');
    if (session.sellerId === buyerId)
      throw new BadRequestException('You cannot buy your own energy listing');
    if (dto.energyKwh > session.energyAmountKwh)
      throw new BadRequestException(
        'Requested amount exceeds available energy',
      );

    const currency = dto.currency || 'NGN';
    const grossAmount = dto.energyKwh * session.offerPricePerKwh;
    const totalCharge = grossAmount + PLATFORM_FEE_NGN; // consumer pays energy cost + ₦500 fee
    const netAmountToSeller = grossAmount;

    // 2. Get buyer wallet
    const buyerWallets = await this.findByOwner(buyerId);
    const buyerWallet = buyerWallets.find((w) => w.currency === currency);
    if (!buyerWallet)
      throw new BadRequestException(
        `No ${currency} wallet found. Please create one first.`,
      );
    if (buyerWallet.balance < totalCharge)
      throw new BadRequestException(
        `Insufficient balance. Need ₦${totalCharge.toLocaleString()} (energy: ₦${grossAmount.toLocaleString()} + fee: ₦${PLATFORM_FEE_NGN})`,
      );

    const ref = `escrow_${crypto.randomBytes(10).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h escrow window

    return this.prisma.$transaction(async (tx) => {
      // 3. Deduct full amount (energy + fee) from buyer wallet
      const balBefore = buyerWallet.balance;
      await tx.energyWallet.update({
        where: { id: buyerWallet.id },
        data: {
          balance: { decrement: totalCharge },
          lockedBalance: { increment: grossAmount },
        },
      });

      // 4. Log buyer debit
      await tx.walletTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: 'ESCROW_HOLD',
          amount: totalCharge,
          currency,
          balanceBefore: balBefore,
          balanceAfter: balBefore - totalCharge,
          reference: ref,
          description: `Energy purchase escrow: ${dto.energyKwh} kWh @ ₦${session.offerPricePerKwh}/kWh + ₦${PLATFORM_FEE_NGN} platform fee`,
          status: 'COMPLETED',
          createdBy: buyerId,
        },
      });

      // 5. Record ₦500 platform fee immediately
      await tx.platformRevenueRecord.create({
        data: {
          source: 'TRANSACTION_FEE',
          amount: PLATFORM_FEE_NGN,
          currency,
          reference: `fee_${ref}`,
          escrowId: undefined, // linked after escrow created
          userId: buyerId,
          description: `Platform fee for energy purchase ${ref}`,
        },
      });

      // 6. Create escrow record
      const escrow = await tx.escrowTransaction.create({
        data: {
          buyerId,
          sellerId: session.sellerId,
          sessionId: session.id,
          energyKwh: dto.energyKwh,
          pricePerKwh: session.offerPricePerKwh,
          grossAmount,
          platformFeeNgn: PLATFORM_FEE_NGN,
          netAmountToSeller,
          currency,
          status: 'HOLDING',
          expiresAt,
        },
      });

      // 7. Update P2P session availability
      const newAvailable = session.energyAmountKwh - dto.energyKwh;
      await tx.p2PSession.update({
        where: { id: session.id },
        data: {
          energyAmountKwh: newAvailable,
          buyerId,
          matchedAt: new Date(),
          status: newAvailable <= 0.01 ? 'MATCHED' : 'PENDING',
        },
      });

      // 8. Notify buyer and seller
      await tx.notification.create({
        data: {
          userId: buyerId,
          title: '⚡ Energy Purchase in Escrow',
          message: `₦${totalCharge.toLocaleString()} held in escrow for ${dto.energyKwh} kWh. Funds release after smart meter confirms delivery.`,
          type: 'ESCROW',
        },
      });
      await tx.notification.create({
        data: {
          userId: session.sellerId,
          title: '🔔 New Energy Sale — Awaiting Delivery',
          message: `${dto.energyKwh} kWh sold. ₦${netAmountToSeller.toLocaleString()} held in escrow. Deliver energy to trigger settlement.`,
          type: 'ESCROW',
        },
      });

      return {
        escrow,
        reference: ref,
        totalCharged: totalCharge,
        platformFee: PLATFORM_FEE_NGN,
      };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VERIFY DELIVERY & RELEASE ESCROW TO SELLER
  // ──────────────────────────────────────────────────────────────────────────

  async verifyAndRelease(escrowId: string, dto: VerifyEscrowDto) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: { buyer: true, seller: true },
    });
    if (!escrow) throw new NotFoundException('Escrow transaction not found');
    if (escrow.status !== 'HOLDING')
      throw new BadRequestException(`Escrow is already ${escrow.status}`);

    // Verify delivered amount is sufficient (at least 90% of ordered)
    const deliveryRatio = dto.deliveredKwh / escrow.energyKwh;
    if (deliveryRatio < 0.9) {
      throw new BadRequestException(
        `Delivery verification failed: delivered ${dto.deliveredKwh} kWh but expected ${escrow.energyKwh} kWh`,
      );
    }

    // Get seller wallet
    const sellerWallets = await this.findByOwner(escrow.sellerId);
    const sellerWallet = sellerWallets.find(
      (w) => w.currency === escrow.currency,
    );
    if (!sellerWallet) throw new BadRequestException('Seller wallet not found');

    // Get buyer wallet to unlock lockedBalance
    const buyerWallets = await this.findByOwner(escrow.buyerId);
    const buyerWallet = buyerWallets.find(
      (w) => w.currency === escrow.currency,
    );
    if (!buyerWallet) throw new BadRequestException('Buyer wallet not found');

    const ref = `release_${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.$transaction(async (tx) => {
      // Release locked balance from buyer wallet record
      await tx.energyWallet.update({
        where: { id: buyerWallet.id },
        data: { lockedBalance: { decrement: escrow.grossAmount } },
      });

      // Credit seller wallet
      const sellerBalBefore = sellerWallet.balance;
      await tx.energyWallet.update({
        where: { id: sellerWallet.id },
        data: { balance: { increment: escrow.netAmountToSeller } },
      });

      // Log seller credit
      await tx.walletTransaction.create({
        data: {
          walletId: sellerWallet.id,
          type: 'ENERGY_SALE',
          amount: escrow.netAmountToSeller,
          currency: escrow.currency,
          balanceBefore: sellerBalBefore,
          balanceAfter: sellerBalBefore + escrow.netAmountToSeller,
          reference: ref,
          description: `Energy sale settlement: ${escrow.energyKwh} kWh delivered. Platform fee ₦${escrow.platformFeeNgn} deducted.`,
          status: 'COMPLETED',
        },
      });

      // Update escrow status
      await tx.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          deliveredKwh: dto.deliveredKwh,
          verificationRef: dto.verificationRef,
          notes: dto.notes,
        },
      });

      // Notify both parties
      await tx.notification.create({
        data: {
          userId: escrow.buyerId,
          title: '✅ Energy Delivered — Transaction Complete',
          message: `${dto.deliveredKwh} kWh of energy successfully delivered. Your transaction is complete.`,
          type: 'ESCROW',
        },
      });
      await tx.notification.create({
        data: {
          userId: escrow.sellerId,
          title: '💰 Payment Released to Your Wallet',
          message: `₦${escrow.netAmountToSeller.toLocaleString()} credited to your wallet after smart meter verification.`,
          type: 'WALLET',
        },
      });

      return {
        success: true,
        amountReleased: escrow.netAmountToSeller,
        reference: ref,
      };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // REFUND
  // ──────────────────────────────────────────────────────────────────────────

  async requestRefund(
    escrowId: string,
    buyerId: string,
    dto: RequestRefundDto,
  ) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
    });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.buyerId !== buyerId)
      throw new BadRequestException(
        'You cannot request a refund for this transaction',
      );
    if (!['HOLDING', 'DISPUTED'].includes(escrow.status))
      throw new BadRequestException(
        `Cannot refund escrow in ${escrow.status} status`,
      );

    const existing = await this.prisma.refund.findUnique({
      where: { escrowId },
    });
    if (existing)
      throw new BadRequestException(
        'A refund has already been requested for this transaction',
      );

    const refundAmount =
      dto.type === 'PARTIAL' && dto.partialAmount
        ? dto.partialAmount
        : escrow.grossAmount;

    return this.prisma.refund.create({
      data: {
        escrowId,
        buyerId,
        amount: refundAmount,
        currency: escrow.currency,
        reason: dto.reason,
        type: dto.type || 'FULL',
        status: 'PENDING',
      },
    });
  }

  async processRefund(refundId: string, adminId: string, approve: boolean) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: { escrow: true },
    });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== 'PENDING')
      throw new BadRequestException('Refund is not pending');

    if (!approve) {
      return this.prisma.refund.update({
        where: { id: refundId },
        data: {
          status: 'REJECTED',
          approvedBy: adminId,
          processedAt: new Date(),
        },
      });
    }

    const buyerWallets = await this.findByOwner(refund.buyerId);
    const buyerWallet = buyerWallets.find(
      (w) => w.currency === refund.currency,
    );
    if (!buyerWallet) throw new BadRequestException('Buyer wallet not found');

    const ref = `refund_${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.$transaction(async (tx) => {
      // Credit buyer
      const balBefore = buyerWallet.balance;
      await tx.energyWallet.update({
        where: { id: buyerWallet.id },
        data: {
          balance: { increment: refund.amount },
          lockedBalance: { decrement: refund.escrow.grossAmount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: 'REFUND',
          amount: refund.amount,
          currency: refund.currency,
          balanceBefore: balBefore,
          balanceAfter: balBefore + refund.amount,
          reference: ref,
          description: `Refund for escrow ${refund.escrowId}: ${refund.reason}`,
          status: 'COMPLETED',
          createdBy: adminId,
        },
      });

      // Update refund and escrow
      await tx.refund.update({
        where: { id: refundId },
        data: {
          status: 'PROCESSED',
          approvedBy: adminId,
          processedAt: new Date(),
          reference: ref,
        },
      });
      await tx.escrowTransaction.update({
        where: { id: refund.escrowId },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });

      // Notify
      await tx.notification.create({
        data: {
          userId: refund.buyerId,
          title: '💸 Refund Processed',
          message: `₦${refund.amount.toLocaleString()} has been refunded to your wallet. Reason: ${refund.reason}`,
          type: 'WALLET',
        },
      });

      return { success: true, amountRefunded: refund.amount, reference: ref };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WITHDRAWAL
  // ──────────────────────────────────────────────────────────────────────────

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    const wallets = await this.findByOwner(userId);
    const wallet = wallets.find((w) => w.currency === (dto.currency || 'NGN'));
    if (!wallet) throw new BadRequestException('Wallet not found');
    if (wallet.balance < dto.amount)
      throw new BadRequestException(
        `Insufficient balance. Available: ₦${wallet.balance.toLocaleString()}`,
      );

    // Lock the amount
    await this.prisma.energyWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: dto.amount },
        lockedBalance: { increment: dto.amount },
      },
    });

    const ref = `wd_${crypto.randomBytes(8).toString('hex')}`;

    const withdrawal = await this.prisma.withdrawalRequest.create({
      data: {
        userId,
        walletId: wallet.id,
        amount: dto.amount,
        currency: dto.currency || 'NGN',
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        status: 'PENDING',
        reference: ref,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: '🏦 Withdrawal Request Submitted',
        message: `Your withdrawal of ₦${dto.amount.toLocaleString()} to ${dto.bankName} (${dto.accountNumber}) is under review.`,
        type: 'WALLET',
      },
    });

    return withdrawal;
  }

  async processWithdrawal(
    withdrawalId: string,
    adminId: string,
    dto: ProcessWithdrawalDto,
  ) {
    const wd = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { wallet: true },
    });
    if (!wd) throw new NotFoundException('Withdrawal request not found');
    if (wd.status !== 'PENDING')
      throw new BadRequestException('Withdrawal is not pending');

    if (dto.decision === 'REJECTED') {
      // Unlock balance
      await this.prisma.energyWallet.update({
        where: { id: wd.walletId },
        data: {
          balance: { increment: wd.amount },
          lockedBalance: { decrement: wd.amount },
        },
      });
      await this.prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'REJECTED',
          processedBy: adminId,
          processedAt: new Date(),
          adminNote: dto.adminNote,
        },
      });
      await this.prisma.notification.create({
        data: {
          userId: wd.userId,
          title: '❌ Withdrawal Rejected',
          message: `Your withdrawal of ₦${wd.amount.toLocaleString()} was rejected. ${dto.adminNote || ''}. Funds returned to wallet.`,
          type: 'WALLET',
        },
      });
      return { success: true, status: 'REJECTED' };
    }

    // Approved — deduct locked balance and log
    const ref = `wd_payout_${crypto.randomBytes(8).toString('hex')}`;
    await this.prisma.$transaction(async (tx) => {
      await tx.energyWallet.update({
        where: { id: wd.walletId },
        data: { lockedBalance: { decrement: wd.amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wd.walletId,
          type: 'WITHDRAWAL',
          amount: wd.amount,
          currency: wd.currency,
          balanceBefore: wd.wallet.balance + wd.amount,
          balanceAfter: wd.wallet.balance,
          reference: ref,
          description: `Withdrawal to ${wd.bankName} - ${wd.accountNumber}`,
          status: 'COMPLETED',
          createdBy: adminId,
        },
      });
      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'COMPLETED',
          processedBy: adminId,
          processedAt: new Date(),
          completedAt: new Date(),
          adminNote: dto.adminNote,
        },
      });
      // Platform withdrawal fee
      await tx.platformRevenueRecord.create({
        data: {
          source: 'WITHDRAWAL_FEE',
          amount: 0, // free for now, can be extended
          currency: wd.currency,
          userId: wd.userId,
          description: `Withdrawal approved: ${ref}`,
        },
      });
      await tx.notification.create({
        data: {
          userId: wd.userId,
          title: '✅ Withdrawal Approved',
          message: `₦${wd.amount.toLocaleString()} successfully transferred to ${wd.bankName} (${wd.accountNumber}).`,
          type: 'WALLET',
        },
      });
    });
    return { success: true, status: 'COMPLETED', reference: ref };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DISPUTES
  // ──────────────────────────────────────────────────────────────────────────

  async openDispute(escrowId: string, raisedBy: string, dto: OpenDisputeDto) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
    });
    if (!escrow) throw new NotFoundException('Escrow transaction not found');
    if (escrow.buyerId !== raisedBy && escrow.sellerId !== raisedBy)
      throw new BadRequestException('You are not part of this transaction');
    if (!['HOLDING', 'RELEASED'].includes(escrow.status))
      throw new BadRequestException(
        `Cannot open dispute for escrow in ${escrow.status} status`,
      );

    const existing = await this.prisma.dispute.findUnique({
      where: { escrowId },
    });
    if (existing)
      throw new BadRequestException(
        'A dispute already exists for this transaction',
      );

    const againstUserId =
      raisedBy === escrow.buyerId ? escrow.sellerId : escrow.buyerId;

    const dispute = await this.prisma.dispute.create({
      data: {
        escrowId,
        raisedBy,
        againstUserId,
        title: dto.title,
        description: dto.description,
        evidence: dto.evidence || [],
        status: 'OPEN',
      },
    });

    await this.prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: { status: 'DISPUTED' },
    });

    await this.prisma.notification.create({
      data: {
        userId: againstUserId,
        title: '⚖️ Dispute Opened Against You',
        message: `A dispute has been raised regarding your energy transaction: "${dto.title}". Our team will review within 24 hours.`,
        type: 'DISPUTE',
      },
    });

    return dispute;
  }

  async addDisputeMessage(
    disputeId: string,
    senderId: string,
    dto: DisputeMessageDto,
    isAdmin = false,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    return this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId,
        message: dto.message,
        attachments: dto.attachments || [],
        isAdmin,
      },
    });
  }

  async resolveDispute(
    disputeId: string,
    adminId: string,
    dto: ResolveDisputeDto,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { escrow: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === 'CLOSED' || dispute.status.startsWith('RESOLVED'))
      throw new BadRequestException('Dispute is already resolved');

    const escrow = dispute.escrow;

    await this.prisma.$transaction(async (tx) => {
      if (dto.resolution === 'RESOLVED_FOR_BUYER') {
        // Refund buyer
        const buyerWallets = await this.findByOwner(escrow.buyerId);
        const buyerWallet = buyerWallets.find(
          (w) => w.currency === escrow.currency,
        );
        if (buyerWallet) {
          await tx.energyWallet.update({
            where: { id: buyerWallet.id },
            data: {
              balance: { increment: escrow.grossAmount },
              lockedBalance: { decrement: escrow.grossAmount },
            },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: buyerWallet.id,
              type: 'REFUND',
              amount: escrow.grossAmount,
              currency: escrow.currency,
              balanceBefore: buyerWallet.balance,
              balanceAfter: buyerWallet.balance + escrow.grossAmount,
              reference: `dispute_refund_${disputeId}`,
              description: `Dispute resolved in your favour — full refund`,
              status: 'COMPLETED',
              createdBy: adminId,
            },
          });
          await tx.escrowTransaction.update({
            where: { id: escrow.id },
            data: { status: 'REFUNDED', refundedAt: new Date() },
          });
          await tx.notification.create({
            data: {
              userId: escrow.buyerId,
              title: '⚖️ Dispute Resolved — Refund Issued',
              message: `Your dispute was resolved in your favour. ₦${escrow.grossAmount.toLocaleString()} refunded.`,
              type: 'DISPUTE',
            },
          });
        }
      } else if (dto.resolution === 'RESOLVED_FOR_SELLER') {
        // Release to seller
        const sellerWallets = await this.findByOwner(escrow.sellerId);
        const sellerWallet = sellerWallets.find(
          (w) => w.currency === escrow.currency,
        );
        const buyerWallets = await this.findByOwner(escrow.buyerId);
        const buyerWallet = buyerWallets.find(
          (w) => w.currency === escrow.currency,
        );
        if (sellerWallet && buyerWallet) {
          await tx.energyWallet.update({
            where: { id: buyerWallet.id },
            data: { lockedBalance: { decrement: escrow.grossAmount } },
          });
          await tx.energyWallet.update({
            where: { id: sellerWallet.id },
            data: { balance: { increment: escrow.netAmountToSeller } },
          });
          await tx.escrowTransaction.update({
            where: { id: escrow.id },
            data: { status: 'RELEASED', releasedAt: new Date() },
          });
          await tx.notification.create({
            data: {
              userId: escrow.sellerId,
              title: '⚖️ Dispute Resolved — Payment Released',
              message: `Dispute resolved in your favour. ₦${escrow.netAmountToSeller.toLocaleString()} credited.`,
              type: 'DISPUTE',
            },
          });
        }
      }

      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: dto.resolution as any,
          resolvedBy: adminId,
          resolvedAt: new Date(),
          adminNote: dto.adminNote,
        },
      });
    });

    return { success: true, resolution: dto.resolution };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TRANSACTION HISTORY
  // ──────────────────────────────────────────────────────────────────────────

  async getTransactions(walletId: string, pagination: PaginationDto) {
    const query = buildPaginationQuery(pagination);
    const where = { walletId };
    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({ where, ...query }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ADMIN FINANCE OVERVIEW
  // ──────────────────────────────────────────────────────────────────────────

  async getAdminFinanceOverview() {
    const [
      totalEscrowHolding,
      totalPlatformRevenue,
      pendingWithdrawals,
      openDisputes,
      pendingRefunds,
      totalWallets,
      recentRevenue,
    ] = await Promise.all([
      this.prisma.escrowTransaction.aggregate({
        _sum: { grossAmount: true },
        where: { status: 'HOLDING' },
      }),
      this.prisma.platformRevenueRecord.aggregate({ _sum: { amount: true } }),
      this.prisma.withdrawalRequest.findMany({
        where: { status: 'PENDING' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.dispute.findMany({
        where: { status: 'OPEN' },
        include: { escrow: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.refund.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.energyWallet.count(),
      this.prisma.platformRevenueRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [dayVolume, weekVolume] = await Promise.all([
      this.prisma.escrowTransaction.aggregate({
        _sum: { grossAmount: true },
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.escrowTransaction.aggregate({
        _sum: { grossAmount: true },
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    return {
      escrowBalance: totalEscrowHolding._sum.grossAmount ?? 0,
      platformRevenue: totalPlatformRevenue._sum.amount ?? 0,
      totalWallets,
      pendingWithdrawals,
      openDisputes,
      pendingRefunds,
      recentRevenue,
      dailyVolume: dayVolume._sum.grossAmount ?? 0,
      weeklyVolume: weekVolume._sum.grossAmount ?? 0,
    };
  }

  async getAllWithdrawals(pagination: PaginationDto, status?: string) {
    const query = buildPaginationQuery(pagination);
    const where: any = { ...(status && { status }) };
    const [data, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        ...query,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async getAllDisputes(pagination: PaginationDto, status?: string) {
    const query = buildPaginationQuery(pagination);
    const where: any = { ...(status && { status }) };
    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        ...query,
        include: {
          escrow: true,
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async getAllEscrow(pagination: PaginationDto, status?: string) {
    const query = buildPaginationQuery(pagination);
    const where: any = { ...(status && { status }) };
    const [data, total] = await Promise.all([
      this.prisma.escrowTransaction.findMany({
        where,
        ...query,
        include: {
          buyer: { select: { id: true, firstName: true, lastName: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.escrowTransaction.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LEGACY HELPERS (preserved for existing code compatibility)
  // ──────────────────────────────────────────────────────────────────────────

  async transfer(
    senderWalletId: string,
    dto: TransferFundsDto,
    createdBy: string,
  ) {
    const sender = await this.findOne(senderWalletId);
    const recipient = await this.findOne(dto.recipientWalletId);
    if (sender.id === recipient.id)
      throw new BadRequestException('Cannot transfer to same wallet');
    if (sender.currency !== recipient.currency)
      throw new BadRequestException('Currency mismatch');
    if (sender.balance < dto.amount)
      throw new BadRequestException('Insufficient balance');

    const ref = `tx_${crypto.randomBytes(8).toString('hex')}`;
    return this.prisma.$transaction(async (tx) => {
      await tx.energyWallet.update({
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
          description: dto.description || `Transfer`,
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
          reference: `${ref}_recv`,
          description: dto.description || `Transfer`,
          status: 'COMPLETED',
          createdBy,
        },
      });
      return { success: true };
    });
  }

  async lockBalance(walletId: string, amount: number) {
    const wallet = await this.findOne(walletId);
    if (wallet.balance < amount)
      throw new BadRequestException('Insufficient balance to lock');
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
    if (wallet.lockedBalance < amount)
      throw new BadRequestException('Insufficient locked balance');
    return this.prisma.energyWallet.update({
      where: { id: walletId },
      data: {
        balance: { increment: amount },
        lockedBalance: { decrement: amount },
      },
    });
  }
}

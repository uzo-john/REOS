import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateP2PSessionDto, BuyEnergyDto, CreateOrderDto } from './dto/trading.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate, buildPaginationQuery } from '../common/utils/pagination.util';
import * as crypto from 'crypto';

@Injectable()
export class TradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async createP2PSession(sellerId: string, dto: CreateP2PSessionDto) {
    // 1. Verify seller has a wallet
    const currency = dto.currency || 'NGN';
    const wallets = await this.walletService.findByOwner(sellerId);
    const sellerWallet = wallets.find((w) => w.currency === currency);
    if (!sellerWallet) {
      throw new BadRequestException(`No active wallet found for currency ${currency}. Create one first.`);
    }

    return this.prisma.p2PSession.create({
      data: {
        sellerId,
        offerPricePerKwh: dto.offerPricePerKwh,
        energyAmountKwh: dto.energyAmountKwh,
        minimumKwh: dto.minimumKwh || 1.0,
        currency,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        status: 'PENDING',
      },
    });
  }

  async purchaseP2PEnergy(sessionId: string, buyerId: string, dto: BuyEnergyDto) {
    const session = await this.prisma.p2PSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Trading session not found');
    if (session.status !== 'PENDING') throw new BadRequestException('Session is no longer active');
    if (session.sellerId === buyerId) throw new BadRequestException('Cannot buy your own energy listing');
    if (dto.energyKwh > session.energyAmountKwh) throw new BadRequestException('Requested energy exceeds availability');
    if (dto.energyKwh < (session.minimumKwh ?? 1.0)) {
      throw new BadRequestException(`Must purchase at least the minimum of ${session.minimumKwh} kWh`);
    }

    const totalCost = dto.energyKwh * session.offerPricePerKwh;

    // Retrieve buyer wallet
    const buyerWallets = await this.walletService.findByOwner(buyerId);
    const buyerWallet = buyerWallets.find((w) => w.currency === session.currency);
    if (!buyerWallet) throw new BadRequestException(`No wallet found for currency ${session.currency}`);
    if (buyerWallet.balance < totalCost) throw new BadRequestException('Insufficient wallet balance');

    // Retrieve seller wallet
    const sellerWallets = await this.walletService.findByOwner(session.sellerId);
    const sellerWallet = sellerWallets.find((w) => w.currency === session.currency);
    if (!sellerWallet) throw new BadRequestException(`Seller wallet missing for currency ${session.currency}`);

    const settlementRef = `p2p_${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Debit buyer wallet
      await tx.energyWallet.update({
        where: { id: buyerWallet.id },
        data: { balance: { decrement: totalCost } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: 'P2P_SENT',
          amount: totalCost,
          currency: session.currency,
          balanceBefore: buyerWallet.balance,
          balanceAfter: buyerWallet.balance - totalCost,
          reference: settlementRef,
          description: `P2P Energy Purchase: ${dto.energyKwh} kWh at ${session.offerPricePerKwh} NGN/kWh`,
          status: 'COMPLETED',
          createdBy: buyerId,
        },
      });

      // 2. Credit seller wallet
      await tx.energyWallet.update({
        where: { id: sellerWallet.id },
        data: { balance: { increment: totalCost } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: sellerWallet.id,
          type: 'P2P_RECEIVED',
          amount: totalCost,
          currency: session.currency,
          balanceBefore: sellerWallet.balance,
          balanceAfter: sellerWallet.balance + totalCost,
          reference: settlementRef,
          description: `P2P Energy Sale: ${dto.energyKwh} kWh at ${session.offerPricePerKwh} NGN/kWh`,
          status: 'COMPLETED',
          createdBy: buyerId,
        },
      });

      // 3. Update P2P Session status
      const updatedSession = await tx.p2PSession.update({
        where: { id: sessionId },
        data: {
          energyAmountKwh: { decrement: dto.energyKwh },
          buyerId,
          matchedAt: new Date(),
          status: session.energyAmountKwh - dto.energyKwh <= 0.01 ? 'EXECUTED' : 'PENDING',
        },
      });

      // 4. Record Transaction
      await tx.p2PTransaction.create({
        data: {
          sessionId,
          sellerId: session.sellerId,
          buyerId,
          energyKwh: dto.energyKwh,
          pricePerKwh: session.offerPricePerKwh,
          totalAmount: totalCost,
          currency: session.currency,
          status: 'EXECUTED',
          settlementRef,
          settledAt: new Date(),
        },
      });

      return updatedSession;
    });
  }

  async listP2PSessions(pagination: PaginationDto, activeOnly = true) {
    const query = buildPaginationQuery(pagination);
    const where = {
      deletedAt: null,
      ...(activeOnly && { status: 'PENDING' as any }),
    };

    const [data, total] = await Promise.all([
      this.prisma.p2PSession.findMany({
        where,
        ...query,
        include: {
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.p2PSession.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  // ─── Order Book / Bid-Ask limit Orders ───

  async createLimitOrder(userId: string, dto: CreateOrderDto) {
    const currency = dto.currency || 'NGN';
    const totalCost = dto.energyKwh * dto.pricePerKwh;

    // Escrow verification for BUY orders
    if (dto.type === 'BUY') {
      const wallets = await this.walletService.findByOwner(userId);
      const userWallet = wallets.find((w) => w.currency === currency);
      if (!userWallet) throw new BadRequestException(`No wallet found for currency ${currency}`);
      if (userWallet.balance < totalCost) throw new BadRequestException('Insufficient wallet balance to place buy order');

      // Escrow the cost
      await this.walletService.lockBalance(userWallet.id, totalCost);
    }

    const order = await this.prisma.tradingOrder.create({
      data: {
        userId,
        type: dto.type,
        status: 'PENDING',
        energyKwh: dto.energyKwh,
        pricePerKwh: dto.pricePerKwh,
        currency,
        remainingKwh: dto.energyKwh,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    // Run Order Matcher asynchronously
    this.matchOrders(order.id).catch((err) =>
      console.error(`Order matching failure for order ${order.id}: ${err.message}`),
    );

    return order;
  }

  async cancelLimitOrder(orderId: string, userId: string) {
    const order = await this.prisma.tradingOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new BadRequestException('Cannot cancel someone else\'s order');
    if (order.status !== 'PENDING') throw new BadRequestException('Order is not in pending state');

    if (order.type === 'BUY') {
      const wallets = await this.walletService.findByOwner(userId);
      const userWallet = wallets.find((w) => w.currency === order.currency);
      if (userWallet) {
        const lockedReturn = order.remainingKwh * order.pricePerKwh;
        await this.walletService.releaseBalance(userWallet.id, lockedReturn);
      }
    }

    return this.prisma.tradingOrder.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });
  }

  async getOrderBook(pagination: PaginationDto) {
    const query = buildPaginationQuery(pagination);
    const where = { status: 'PENDING' as any };

    const [data, total] = await Promise.all([
      this.prisma.tradingOrder.findMany({
        where,
        ...query,
        orderBy: [{ type: 'asc' }, { pricePerKwh: 'desc' }],
      }),
      this.prisma.tradingOrder.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  // ─── Automated Order Matcher Engine ───
  private async matchOrders(newOrderId: string) {
    const order = await this.prisma.tradingOrder.findUnique({ where: { id: newOrderId } });
    if (!order || order.status !== 'PENDING') return;

    // Search matches: opposite order types matching price thresholds
    const matches = await this.prisma.tradingOrder.findMany({
      where: {
        status: 'PENDING',
        type: order.type === 'BUY' ? 'SELL' : 'BUY',
        currency: order.currency,
        userId: { not: order.userId }, // can't match oneself
        pricePerKwh: order.type === 'BUY' ? { lte: order.pricePerKwh } : { gte: order.pricePerKwh },
      },
      orderBy: { createdAt: 'asc' },
    });

    let remainingNewOrderKwh = order.remainingKwh;

    for (const match of matches) {
      if (remainingNewOrderKwh <= 0.01) break;

      const fillKwh = Math.min(remainingNewOrderKwh, match.remainingKwh);
      const tradePrice = match.pricePerKwh; // Maker's price
      const tradeCost = fillKwh * tradePrice;

      const sellerId = order.type === 'SELL' ? order.userId : match.userId;
      const buyerId = order.type === 'BUY' ? order.userId : match.userId;

      try {
        await this.prisma.$transaction(async (tx) => {
          // Update matching order
          await tx.tradingOrder.update({
            where: { id: match.id },
            data: {
              filledKwh: { increment: fillKwh },
              remainingKwh: { decrement: fillKwh },
              status: match.remainingKwh - fillKwh <= 0.01 ? 'EXECUTED' : 'PENDING',
            },
          });

          // Resolve buyer escrow & transfer
          const buyerWallets = await tx.energyWallet.findMany({ where: { userId: buyerId } });
          const buyerWallet = buyerWallets.find((w) => w.currency === order.currency);
          const sellerWallets = await tx.energyWallet.findMany({ where: { userId: sellerId } });
          const sellerWallet = sellerWallets.find((w) => w.currency === order.currency);

          if (buyerWallet && sellerWallet) {
            // Deduct locked escrow from buyer, credit seller
            await tx.energyWallet.update({
              where: { id: buyerWallet.id },
              data: { lockedBalance: { decrement: tradeCost } },
            });
            await tx.energyWallet.update({
              where: { id: sellerWallet.id },
              data: { balance: { increment: tradeCost } },
            });

            // Write logs
            const txRef = `match_${crypto.randomBytes(8).toString('hex')}`;
            await tx.walletTransaction.create({
              data: {
                walletId: buyerWallet.id,
                type: 'P2P_SENT',
                amount: tradeCost,
                currency: order.currency,
                balanceBefore: buyerWallet.balance + tradeCost, // balance was already deducted on lock
                balanceAfter: buyerWallet.balance,
                reference: txRef,
                description: `P2P Order Book Filled: ${fillKwh} kWh at ${tradePrice} NGN/kWh`,
                status: 'COMPLETED',
              },
            });
            await tx.walletTransaction.create({
              data: {
                walletId: sellerWallet.id,
                type: 'P2P_RECEIVED',
                amount: tradeCost,
                currency: order.currency,
                balanceBefore: sellerWallet.balance,
                balanceAfter: sellerWallet.balance + tradeCost,
                reference: txRef,
                description: `P2P Order Book Sold: ${fillKwh} kWh at ${tradePrice} NGN/kWh`,
                status: 'COMPLETED',
              },
            });
          }
        });

        remainingNewOrderKwh -= fillKwh;
      } catch (err) {
        console.error(`Error executing order match step: ${err.message}`);
      }
    }

    // Finally update status of current order
    await this.prisma.tradingOrder.update({
      where: { id: newOrderId },
      data: {
        filledKwh: order.energyKwh - remainingNewOrderKwh,
        remainingKwh: remainingNewOrderKwh,
        status: remainingNewOrderKwh <= 0.01 ? 'EXECUTED' : 'PENDING',
      },
    });
  }
}

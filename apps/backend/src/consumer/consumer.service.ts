import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ConsumerService {
  private static mockInvites: any[] = [];
  private static mockContracts: any[] = [];
  private static mockInvoices: any[] = [];
  private static mockTransactions: any[] = [];
  private static mockNotifications: any[] = [];

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async createInvitation(supplierId: string, dto: CreateInviteDto) {
    const code = `REOS-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!this.prisma.isConnected) {
      const newInvite = {
        id: `invite-${Date.now()}`,
        invitationCode: code,
        supplierId,
        email: dto.email || null,
        phoneNumber: dto.phoneNumber || null,
        status: 'PENDING',
        tariffRate: dto.tariffRate,
        billingCycle: dto.billingCycle || 'PREPAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      ConsumerService.mockInvites.push(newInvite);
      await this.auditLog.log('CONSUMER_INVITE_CREATE', { code, supplierId, dto }, supplierId);
      return {
        id: newInvite.id,
        invitationCode: newInvite.invitationCode,
        status: newInvite.status,
        tariffRate: newInvite.tariffRate,
        billingCycle: newInvite.billingCycle,
      };
    }

    const invitation = await this.prisma.consumerInvitation.create({
      data: {
        invitationCode: code,
        supplierId,
        email: dto.email || null,
        phoneNumber: dto.phoneNumber || null,
        status: 'PENDING',
      },
    });

    await this.auditLog.log('CONSUMER_INVITE_CREATE', { code, supplierId, dto }, supplierId);

    return {
      id: invitation.id,
      invitationCode: invitation.invitationCode,
      status: invitation.status,
      tariffRate: dto.tariffRate,
      billingCycle: dto.billingCycle || 'PREPAID',
    };
  }

  async getInvitation(code: string) {
    if (!this.prisma.isConnected) {
      const invite = ConsumerService.mockInvites.find(i => i.invitationCode === code.toUpperCase());
      if (!invite) {
        throw new NotFoundException('Invitation code not found');
      }
      if (invite.status !== 'PENDING') {
        throw new BadRequestException(`Invitation code is already ${invite.status.toLowerCase()}`);
      }
      return {
        ...invite,
        supplier: {
          id: invite.supplierId,
          firstName: 'Sunshine',
          lastName: 'Supplier',
          email: 'supplier@reos.io',
        }
      };
    }

    const invite = await this.prisma.consumerInvitation.findUnique({
      where: { invitationCode: code.toUpperCase() },
      include: {
        supplier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invitation code not found');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException(`Invitation code is already ${invite.status.toLowerCase()}`);
    }

    return invite;
  }

  async acceptInvitation(consumerId: string, code: string) {
    const invite = await this.getInvitation(code);

    if (!this.prisma.isConnected) {
      const inviteInMemory = ConsumerService.mockInvites.find(i => i.id === invite.id);
      if (inviteInMemory) {
        inviteInMemory.status = 'ACCEPTED';
      }

      const tariffRate = invite.tariffRate || 180;
      const billingCycle = invite.billingCycle || 'PREPAID';

      const contract = {
        id: `contract-${Date.now()}`,
        supplierId: invite.supplierId,
        consumerId,
        connectionStatus: 'ACTIVE',
        tariffRate,
        billingCycle,
        balance: 5000.0,
        gatewayId: 'dev-gw-001',
        supplier: { id: invite.supplierId, firstName: 'Sunshine', lastName: 'Supplier', email: 'supplier@reos.io' },
        consumer: { id: consumerId, firstName: 'Neighbor', lastName: 'Consumer', email: 'consumer@reos.io' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ConsumerService.mockContracts.push(contract);

      ConsumerService.mockNotifications.push({
        id: `notif-${Date.now()}-1`,
        userId: consumerId,
        title: 'Energy Sharing Connection Active',
        message: `Your contract with supplier Sunshine Supplier is active. You have been credited ₦5,000.00 welcome credit!`,
        type: 'INFO',
        read: false,
        createdAt: new Date(),
      });

      ConsumerService.mockNotifications.push({
        id: `notif-${Date.now()}-2`,
        userId: invite.supplierId,
        title: 'New Consumer Connected',
        message: `A new neighbor has accepted your energy sharing invitation and is now streaming telemetry.`,
        type: 'INFO',
        read: false,
        createdAt: new Date(),
      });

      await this.auditLog.log('CONSUMER_CONNECTION_APPROVED', { contractId: contract.id, supplierId: invite.supplierId }, consumerId);

      return contract;
    }

    // Update status to ACCEPTED
    await this.prisma.consumerInvitation.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });

    const tariffRate = 180;
    const billingCycle = 'PREPAID';

    const contract = await this.prisma.energyContract.create({
      data: {
        supplierId: invite.supplierId,
        consumerId,
        connectionStatus: 'ACTIVE',
        tariffRate,
        billingCycle,
        balance: 5000.0,
        gatewayId: 'dev-gw-001',
      },
    });

    await this.auditLog.log('CONSUMER_CONNECTION_APPROVED', { contractId: contract.id, supplierId: invite.supplierId }, consumerId);

    await this.prisma.notification.create({
      data: {
        userId: consumerId,
        title: 'Energy Sharing Connection Active',
        message: `Your contract with supplier ${invite.supplier.firstName} ${invite.supplier.lastName} is active. You have been credited ₦5,000.00 welcome credit!`,
        type: 'INFO',
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: invite.supplierId,
        title: 'New Consumer Connected',
        message: `A new neighbor has accepted your energy sharing invitation and is now streaming telemetry.`,
        type: 'INFO',
      },
    });

    return contract;
  }

  async getActiveContract(userId: string) {
    if (!this.prisma.isConnected) {
      let contract = ConsumerService.mockContracts.find(
        c => (c.consumerId === userId || c.supplierId === userId) && c.connectionStatus === 'ACTIVE'
      );
      if (!contract) {
        contract = {
          id: 'mock-contract-id',
          supplierId: 'mock-supplier-id',
          consumerId: userId,
          connectionStatus: 'ACTIVE',
          tariffRate: 180,
          billingCycle: 'PREPAID',
          balance: 5000.0,
          gatewayId: 'dev-gw-001',
          supplier: { id: 'mock-supplier-id', firstName: 'Sunshine', lastName: 'Supplier', email: 'supplier@reos.io' },
          consumer: { id: userId, firstName: 'Neighbor', lastName: 'Consumer', email: 'consumer@reos.io' },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        ConsumerService.mockContracts.push(contract);
      }
      return contract;
    }

    let contract = await this.prisma.energyContract.findFirst({
      where: {
        OR: [
          { consumerId: userId },
          { supplierId: userId }
        ],
        connectionStatus: 'ACTIVE'
      },
      include: {
        supplier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        consumer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!contract) {
      const allUsers = await this.prisma.user.findMany({ take: 2 });
      if (allUsers.length >= 2) {
        contract = await this.prisma.energyContract.create({
          data: {
            supplierId: allUsers[0].id,
            consumerId: allUsers[1].id,
            connectionStatus: 'ACTIVE',
            tariffRate: 225,
            billingCycle: 'PREPAID',
            balance: 5000.0,
            gatewayId: 'dev-gw-001',
          },
          include: {
            supplier: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            consumer: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        });
      }
    }

    return contract;
  }

  async getBillingSummary(userId: string) {
    const contract = await this.getActiveContract(userId);
    if (!contract) {
      return {
        balance: 0.0,
        outstandingBalance: 0.0,
        lastPayment: 0.0,
        invoices: [],
        transactions: [],
      };
    }

    if (!this.prisma.isConnected) {
      let invoices = ConsumerService.mockInvoices.filter(i => i.contractId === contract.id);
      if (invoices.length === 0) {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);

        const newInvoice1 = {
          id: `invoice-${Date.now()}-1`,
          contractId: contract.id,
          amount: 4500.00,
          tariffRate: contract.tariffRate,
          energyReceivedKwh: 25.0,
          billingPeriodStart: lastMonth,
          billingPeriodEnd: today,
          dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
          status: 'PAID',
          createdAt: lastMonth,
        };

        const newInvoice2 = {
          id: `invoice-${Date.now()}-2`,
          contractId: contract.id,
          amount: 1520.00,
          tariffRate: contract.tariffRate,
          energyReceivedKwh: 8.44,
          billingPeriodStart: today,
          billingPeriodEnd: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
          dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
          status: 'UNPAID',
          createdAt: today,
        };

        ConsumerService.mockInvoices.push(newInvoice2, newInvoice1);
        invoices = [newInvoice2, newInvoice1];
      }

      let transactions = ConsumerService.mockTransactions.filter(t => t.contractId === contract.id);
      if (transactions.length === 0) {
        const tx1 = {
          id: `tx-${Date.now()}-1`,
          contractId: contract.id,
          type: 'PREPAID_PURCHASE',
          amount: 5000.00,
          currency: 'NGN',
          paymentGateway: 'FLUTTERWAVE',
          status: 'SUCCESSFUL',
          reference: `ref-${Date.now()}-1`,
          createdAt: new Date(),
        };

        const tx2 = {
          id: `tx-${Date.now()}-2`,
          contractId: contract.id,
          type: 'BILL_PAYMENT',
          amount: 4500.00,
          currency: 'NGN',
          paymentGateway: 'PAYSTACK',
          status: 'SUCCESSFUL',
          reference: `ref-${Date.now()}-2`,
          createdAt: new Date(),
        };

        ConsumerService.mockTransactions.push(tx1, tx2);
        transactions = [tx1, tx2];
      }

      const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID');
      const outstanding = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const paidTransactions = transactions.filter(t => t.status === 'SUCCESSFUL');
      const lastPayment = paidTransactions.length > 0 ? paidTransactions[0].amount : 0.0;

      return {
        contractId: contract.id,
        balance: contract.balance,
        outstandingBalance: outstanding,
        lastPayment,
        billingCycle: contract.billingCycle,
        invoices,
        transactions,
      };
    }

    let invoices = await this.prisma.invoice.findMany({
      where: { contractId: contract.id },
      orderBy: { createdAt: 'desc' }
    });

    if (invoices.length === 0) {
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      
      const newInvoice1 = await this.prisma.invoice.create({
        data: {
          contractId: contract.id,
          amount: 4500.00,
          tariffRate: contract.tariffRate,
          energyReceivedKwh: 20.0,
          billingPeriodStart: lastMonth,
          billingPeriodEnd: today,
          dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
          status: 'PAID',
        }
      });

      const newInvoice2 = await this.prisma.invoice.create({
        data: {
          contractId: contract.id,
          amount: 1520.00,
          tariffRate: contract.tariffRate,
          energyReceivedKwh: 6.75,
          billingPeriodStart: today,
          billingPeriodEnd: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
          dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
          status: 'UNPAID',
        }
      });

      invoices = [newInvoice2, newInvoice1];
    }

    let transactions = await this.prisma.transaction.findMany({
      where: { contractId: contract.id },
      orderBy: { createdAt: 'desc' }
    });

    if (transactions.length === 0) {
      const tx1 = await this.prisma.transaction.create({
        data: {
          contractId: contract.id,
          type: 'PREPAID_PURCHASE',
          amount: 5000.00,
          currency: 'NGN',
          paymentGateway: 'FLUTTERWAVE',
          status: 'SUCCESSFUL',
          reference: `ref-${Date.now()}-1`,
        }
      });

      const tx2 = await this.prisma.transaction.create({
        data: {
          contractId: contract.id,
          type: 'BILL_PAYMENT',
          amount: 4500.00,
          currency: 'NGN',
          paymentGateway: 'PAYSTACK',
          status: 'SUCCESSFUL',
          reference: `ref-${Date.now()}-2`,
        }
      });

      transactions = [tx1, tx2];
    }

    const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID');
    const outstanding = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidTransactions = transactions.filter(t => t.status === 'SUCCESSFUL');
    const lastPayment = paidTransactions.length > 0 ? paidTransactions[0].amount : 0.0;

    return {
      contractId: contract.id,
      balance: contract.balance,
      outstandingBalance: outstanding,
      lastPayment,
      billingCycle: contract.billingCycle,
      invoices,
      transactions,
    };
  }

  async topUpWallet(userId: string, amount: number, paymentGateway: string) {
    const contract = await this.getActiveContract(userId);
    if (!contract) {
      throw new NotFoundException('No active energy contract found');
    }

    if (!this.prisma.isConnected) {
      contract.balance += amount;

      ConsumerService.mockTransactions.push({
        id: `tx-topup-${Date.now()}`,
        contractId: contract.id,
        type: 'PREPAID_PURCHASE',
        amount,
        currency: 'NGN',
        paymentGateway,
        status: 'SUCCESSFUL',
        reference: `ref-topup-${Date.now()}`,
        createdAt: new Date(),
      });

      ConsumerService.mockNotifications.push({
        id: `notif-${Date.now()}`,
        userId,
        title: 'Wallet Recharged Successfully',
        message: `Your wallet has been topped up with ₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} via ${paymentGateway}.`,
        type: 'BILLING',
        read: false,
        createdAt: new Date(),
      });

      await this.auditLog.log('CONSUMER_WALLET_TOPUP', { contractId: contract.id, amount, gateway: paymentGateway }, userId);

      return contract;
    }

    const updatedContract = await this.prisma.energyContract.update({
      where: { id: contract.id },
      data: { balance: { increment: amount } }
    });

    await this.prisma.transaction.create({
      data: {
        contractId: contract.id,
        type: 'PREPAID_PURCHASE',
        amount,
        currency: 'NGN',
        paymentGateway,
        status: 'SUCCESSFUL',
        reference: `ref-topup-${Date.now()}`,
      }
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Wallet Recharged Successfully',
        message: `Your wallet has been topped up with ₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} via ${paymentGateway}.`,
        type: 'BILLING',
      }
    });

    await this.auditLog.log('CONSUMER_WALLET_TOPUP', { contractId: contract.id, amount, gateway: paymentGateway }, userId);

    return updatedContract;
  }

  async payInvoice(userId: string, invoiceId: string, paymentGateway: string) {
    if (!this.prisma.isConnected) {
      const invoice = ConsumerService.mockInvoices.find(i => i.id === invoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
      if (invoice.status === 'PAID') {
        throw new BadRequestException('Invoice is already paid');
      }

      invoice.status = 'PAID';

      ConsumerService.mockTransactions.push({
        id: `tx-pay-${Date.now()}`,
        contractId: invoice.contractId,
        type: 'BILL_PAYMENT',
        amount: invoice.amount,
        currency: 'NGN',
        paymentGateway,
        status: 'SUCCESSFUL',
        reference: `ref-pay-${Date.now()}`,
        createdAt: new Date(),
      });

      ConsumerService.mockNotifications.push({
        id: `notif-${Date.now()}`,
        userId,
        title: 'Invoice Paid',
        message: `Invoice for ₦${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been paid successfully.`,
        type: 'BILLING',
        read: false,
        createdAt: new Date(),
      });

      await this.auditLog.log('CONSUMER_INVOICE_PAID', { invoiceId, amount: invoice.amount }, userId);

      return { success: true };
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already paid');
    }

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' }
    });

    await this.prisma.transaction.create({
      data: {
        contractId: invoice.contractId,
        type: 'BILL_PAYMENT',
        amount: invoice.amount,
        currency: 'NGN',
        paymentGateway,
        status: 'SUCCESSFUL',
        reference: `ref-pay-${Date.now()}`,
      }
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Invoice Paid',
        message: `Invoice for ₦${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been paid successfully.`,
        type: 'BILLING',
      }
    });

    await this.auditLog.log('CONSUMER_INVOICE_PAID', { invoiceId, amount: invoice.amount }, userId);

    return { success: true };
  }

  async getNotifications(userId: string) {
    if (!this.prisma.isConnected) {
      let userNotifs = ConsumerService.mockNotifications.filter(n => n.userId === userId);
      if (userNotifs.length === 0) {
        const n1 = {
          id: `notif-${Date.now()}-1`,
          userId,
          title: 'Welcome to REOS Portal',
          message: 'You have logged in successfully. Access your consumer dashboard to view received power telemetry.',
          type: 'INFO',
          read: false,
          createdAt: new Date(),
        };

        const n2 = {
          id: `notif-${Date.now()}-2`,
          userId,
          title: 'Planned Maintenance Notice',
          message: 'Supplier microgrid will undergo clean-up and battery checking tomorrow from 10:00 AM to 11:30 AM.',
          type: 'SYSTEM',
          read: false,
          createdAt: new Date(),
        };

        ConsumerService.mockNotifications.push(n1, n2);
        userNotifs = [n1, n2];
      }
      return userNotifs;
    }

    let notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (notifications.length === 0) {
      notifications = [
        await this.prisma.notification.create({
          data: {
            userId,
            title: 'Welcome to REOS Portal',
            message: 'You have logged in successfully. Access your consumer dashboard to view received power telemetry.',
            type: 'INFO',
          }
        }),
        await this.prisma.notification.create({
          data: {
            userId,
            title: 'Planned Maintenance Notice',
            message: 'Supplier microgrid will undergo clean-up and battery checking tomorrow from 10:00 AM to 11:30 AM.',
            type: 'SYSTEM',
          }
        })
      ];
    }

    return notifications;
  }

  async acknowledgeNotification(id: string) {
    if (!this.prisma.isConnected) {
      const notif = ConsumerService.mockNotifications.find(n => n.id === id);
      if (notif) {
        notif.read = true;
      }
      return notif;
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true }
    });
  }
}

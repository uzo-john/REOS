import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ProcurementService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async getProducts() {
    return this.prisma.product.findMany({
      include: {
        suppliers: {
          include: {
            supplier: true,
          },
        },
      },
    });
  }

  async getInstallers() {
    return this.prisma.installer.findMany();
  }

  async generateQuotation(userId: string, dto: CreateQuotationDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.productIds } },
      include: {
        suppliers: true,
      },
    });

    let totalHardwareCost = 0;
    const items = [];

    for (const product of products) {
      let lowestPrice = Infinity;
      let selectedSupplierId = '';

      for (const sp of product.suppliers) {
        if (sp.price < lowestPrice) {
          lowestPrice = sp.price;
          selectedSupplierId = sp.supplierId;
        }
      }

      const itemPrice = lowestPrice === Infinity ? 500 : lowestPrice;
      totalHardwareCost += itemPrice;

      items.push({
        productId: product.id,
        name: product.name,
        category: product.category,
        model: product.model,
        rating: product.rating,
        price: itemPrice,
        supplierId: selectedSupplierId || null,
      });
    }

    let laborCost = 0;
    if (dto.installerId) {
      const installer = await this.prisma.installer.findUnique({
        where: { id: dto.installerId },
      });
      if (installer) {
        laborCost = installer.baseRate;
      }
    } else {
      laborCost = totalHardwareCost * 0.12;
    }

    const grandTotal = totalHardwareCost + laborCost;

    const quotation = await this.prisma.quotation.create({
      data: {
        projectId: dto.projectId,
        installerId: dto.installerId || null,
        totalHardwareCost,
        installationCost: laborCost,
        grandTotal,
        itemsJson: JSON.stringify(items),
      },
    });

    await this.auditLog.log(
      'PROCUREMENT_QUOTE_GENERATE',
      { quotationId: quotation.id, total: grandTotal },
      userId
    );

    return {
      quotation,
      items,
    };
  }
}

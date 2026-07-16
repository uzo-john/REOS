import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculateRoiDto } from './dto/calculate-roi.dto';
import { calculateFinancials } from '@reos/engineering';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class FinancialService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async calculateAndSaveRoi(userId: string, dto: CalculateRoiDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    const capex =
      dto.equipmentCost +
      dto.installationCost +
      (dto.laborCost ?? 0) +
      (dto.taxes ?? 0);

    const results = calculateFinancials(
      capex,
      dto.annualSavings,
      dto.annualOpex ?? 0,
      dto.lifespanYrs ?? 25,
      dto.discountRate ?? 0.1,
    );

    const simResult = await this.prisma.simulationResult.create({
      data: {
        projectId: dto.projectId,
        hourlySolarGen: [],
        hourlyLoadDemand: [],
        hourlyBatterySoC: [],
        totalCost: results.totalCapex,
        paybackPeriodYrs: results.paybackPeriodYrs,
        roiPercentage: results.roiPercentage,
        exportedGridKwh: 0,
        gridRevenueEarned: 0,
      },
    });

    await this.auditLog.log(
      'FINANCIAL_CALCULATE',
      {
        projectId: dto.projectId,
        capex: results.totalCapex,
        payback: results.paybackPeriodYrs,
      },
      userId,
    );

    return {
      simulationResultId: simResult.id,
      ...results,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigureGridDto } from './dto/configure-grid.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class GridService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async configureGrid(userId: string, dto: ConfigureGridDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    await this.auditLog.log(
      'GRID_CONFIGURE',
      { projectId: dto.projectId, country: dto.country, provider: dto.utilityProvider, rates: { import: dto.importTariffRate, export: dto.exportTariffRate } },
      userId
    );

    return {
      success: true,
      config: dto,
    };
  }

  async calculateBilling(
    userId: string,
    projectId: string,
    importedKwh: number,
    exportedKwh: number,
    importRate: number,
    exportRate: number,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const costOfImport = importedKwh * importRate;
    const creditOfExport = exportedKwh * exportRate;
    const netBill = costOfImport - creditOfExport;

    return {
      costOfImport,
      creditOfExport,
      netBill,
    };
  }
}

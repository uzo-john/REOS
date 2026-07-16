import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestReportDto } from './dto/reports.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  paginate,
  buildPaginationQuery,
} from '../common/utils/pagination.util';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: RequestReportDto, userId: string) {
    const report = await this.prisma.report.create({
      data: {
        userId,
        title: dto.title,
        type: dto.type,
        status: 'PENDING',
        parameters: dto.parameters || undefined,
        organizationId: dto.organizationId,
        createdBy: userId,
      },
    });

    // Run report simulation generation async
    this.generateReportFile(report.id).catch((err) =>
      console.error(
        `Report generation failed for ${report.id}: ${err.message}`,
      ),
    );

    return report;
  }

  async findAll(pagination: PaginationDto, userId?: string, orgId?: string) {
    const query = buildPaginationQuery(pagination);
    const where: any = {
      deletedAt: null,
      ...(userId && { userId }),
      ...(orgId && { organizationId: orgId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        ...query,
      }),
      this.prisma.report.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findFirst({
      where: { id, deletedAt: null },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.report.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async generateReportFile(reportId: string) {
    // Simulated report builder (in production this calls a PDF/CSV builder and stores in S3/Supabase Storage)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'READY',
        fileUrl: `https://storage.reos.io/reports/${reportId}.pdf`,
        fileSize: 1024 * 342, // Mock 342 KB
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
      },
    });
  }
}

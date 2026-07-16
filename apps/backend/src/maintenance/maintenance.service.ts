import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  ResolveFaultDto,
} from './dto/maintenance.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  paginate,
  buildPaginationQuery,
  buildSearchFilter,
} from '../common/utils/pagination.util';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMaintenanceDto, reporterId: string) {
    return this.prisma.maintenanceRecord.create({
      data: {
        deviceId: dto.deviceId,
        plantId: dto.plantId,
        title: dto.title,
        description: dto.description,
        type: dto.type || 'PREVENTIVE',
        priority: dto.priority || 'MEDIUM',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        assignedTo: dto.assignedTo,
        reportedBy: reporterId,
        status: 'SCHEDULED',
      },
    });
  }

  async findAll(
    pagination: PaginationDto,
    status?: string,
    deviceId?: string,
    assignedTo?: string,
  ) {
    const query = buildPaginationQuery(pagination);
    const searchFilter = buildSearchFilter(
      ['title', 'description', 'notes'],
      pagination.search,
    );
    const where: any = {
      deletedAt: null,
      ...(status && { status: status as any }),
      ...(deviceId && { deviceId }),
      ...(assignedTo && { assignedTo }),
      ...(searchFilter ?? {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where,
        ...query,
        include: {
          device: { select: { id: true, name: true, type: true } },
          assignedUser: {
            select: { id: true, firstName: true, lastName: true },
          },
          reporter: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.maintenanceRecord.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  async findOne(id: string) {
    const record = await this.prisma.maintenanceRecord.findFirst({
      where: { id, deletedAt: null },
      include: {
        device: true,
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reporter: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        faultLogs: true,
      },
    });
    if (!record) throw new NotFoundException('Maintenance record not found');
    return record;
  }

  async update(id: string, dto: UpdateMaintenanceDto) {
    await this.findOne(id);
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes,
        cost: dto.cost,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
    });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
  }

  // ── Alarms / Fault Logs ────────────────────────────

  async getActiveFaults(pagination: PaginationDto, severity?: string) {
    const query = buildPaginationQuery(pagination);
    const where = {
      resolvedAt: null,
      ...(severity && { severity: severity as any }),
    };

    const [data, total] = await Promise.all([
      this.prisma.faultLog.findMany({
        where,
        ...query,
        include: {
          device: {
            select: { id: true, name: true, serialNumber: true, status: true },
          },
        },
      }),
      this.prisma.faultLog.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  async resolveFault(id: string, dto: ResolveFaultDto, userId: string) {
    const fault = await this.prisma.faultLog.findUnique({ where: { id } });
    if (!fault) throw new NotFoundException('Fault log entry not found');

    return this.prisma.$transaction(async (tx) => {
      const resolved = await tx.faultLog.update({
        where: { id },
        data: {
          resolvedAt: new Date(),
          acknowledgedBy: userId,
          metadata: { notes: dto.notes },
        },
      });

      // If device status is currently FAULT, evaluate if there are other unresolved faults
      const openFaults = await tx.faultLog.count({
        where: { deviceId: fault.deviceId, resolvedAt: null },
      });

      if (openFaults === 0) {
        // Return device status to ONLINE
        await tx.device.update({
          where: { id: fault.deviceId },
          data: { status: 'ONLINE' },
        });
      }

      return resolved;
    });
  }
}

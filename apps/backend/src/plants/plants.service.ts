import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlantDto, UpdatePlantDto, CreateSiteDto, AssignDeviceDto } from './dto/plant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate, buildPaginationQuery, buildSearchFilter } from '../common/utils/pagination.util';

@Injectable()
export class PlantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlantDto, createdBy: string) {
    return this.prisma.plant.create({
      data: { ...dto, createdBy },
      include: { organization: { select: { id: true, name: true } } },
    });
  }

  async findAll(pagination: PaginationDto, orgId?: string) {
    const query = buildPaginationQuery(pagination);
    const searchFilter = buildSearchFilter(['name', 'address', 'city'], pagination.search);
    const where: any = {
      deletedAt: null,
      ...(orgId && { organizationId: orgId }),
      ...(searchFilter ?? {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.plant.findMany({
        where,
        ...query,
        include: {
          organization: { select: { id: true, name: true } },
          _count: { select: { sites: true, plantDevices: true } },
        },
      }),
      this.prisma.plant.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  async findOne(id: string) {
    const plant = await this.prisma.plant.findFirst({
      where: { id, deletedAt: null },
      include: {
        organization: true,
        sites: { where: { deletedAt: null } },
        plantDevices: {
          include: { device: { select: { id: true, name: true, type: true, status: true } } },
        },
      },
    });
    if (!plant) throw new NotFoundException('Plant not found');
    return plant;
  }

  async update(id: string, dto: UpdatePlantDto) {
    await this.findOne(id);
    return this.prisma.plant.update({ where: { id }, data: dto });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.plant.update({ where: { id }, data: { deletedAt: new Date(), status: 'DECOMMISSIONED' } });
  }

  // ── Sites ─────────────────────────────────────────
  async createSite(plantId: string, dto: CreateSiteDto, createdBy: string) {
    await this.findOne(plantId);
    return this.prisma.site.create({ data: { ...dto, plantId, createdBy } });
  }

  async getSites(plantId: string) {
    return this.prisma.site.findMany({
      where: { plantId, deletedAt: null },
      include: { _count: { select: { plantDevices: true } } },
    });
  }

  async deleteSite(siteId: string) {
    const site = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!site) throw new NotFoundException('Site not found');
    return this.prisma.site.update({ where: { id: siteId }, data: { deletedAt: new Date() } });
  }

  // ── Device Assignment ──────────────────────────────
  async assignDevice(plantId: string, dto: AssignDeviceDto) {
    await this.findOne(plantId);
    return this.prisma.plantDevice.upsert({
      where: { plantId_deviceId: { plantId, deviceId: dto.deviceId } },
      update: { siteId: dto.siteId },
      create: { plantId, deviceId: dto.deviceId, siteId: dto.siteId },
    });
  }

  async unassignDevice(plantId: string, deviceId: string) {
    return this.prisma.plantDevice.delete({
      where: { plantId_deviceId: { plantId, deviceId } },
    });
  }

  async getPlantSummary(plantId: string) {
    const plant = await this.findOne(plantId);
    const [totalDevices, onlineDevices, faultDevices] = await Promise.all([
      this.prisma.plantDevice.count({ where: { plantId } }),
      this.prisma.plantDevice.count({ where: { plantId, device: { status: 'ONLINE' } } }),
      this.prisma.plantDevice.count({ where: { plantId, device: { status: 'FAULT' } } }),
    ]);
    return {
      ...plant,
      summary: { totalDevices, onlineDevices, offlineDevices: totalDevices - onlineDevices, faultDevices },
    };
  }
}

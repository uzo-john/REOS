import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSystemSettingDto,
  UpdateSystemSettingDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createSetting(dto: CreateSystemSettingDto, userId: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key: dto.key },
    });
    if (existing)
      throw new ConflictException(`Setting with key ${dto.key} already exists`);

    return this.prisma.systemSetting.create({
      data: {
        key: dto.key,
        value: dto.value,
        type: dto.type || 'STRING',
        category: dto.category || 'GENERAL',
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        updatedBy: userId,
      },
    });
  }

  async getSettings(category?: string, publicOnly = false) {
    return this.prisma.systemSetting.findMany({
      where: {
        ...(category && { category }),
        ...(publicOnly && { isPublic: true }),
      },
    });
  }

  async getSetting(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    if (!setting)
      throw new NotFoundException(`Setting with key ${key} not found`);
    return setting;
  }

  async updateSetting(
    key: string,
    dto: UpdateSystemSettingDto,
    userId: string,
  ) {
    await this.getSetting(key);
    return this.prisma.systemSetting.update({
      where: { key },
      data: {
        value: dto.value,
        description: dto.description,
        isPublic: dto.isPublic,
        updatedBy: userId,
      },
    });
  }

  async getPlatformStats() {
    const [
      users,
      organizations,
      plants,
      devices,
      powerReadings,
      walletTxTotal,
      openTickets,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.plant.count({ where: { deletedAt: null } }),
      this.prisma.device.count({ where: { deletedAt: null } }),
      this.prisma.powerReading.count(),
      this.prisma.walletTransaction.count({ where: { status: 'COMPLETED' } }),
      this.prisma.maintenanceRecord.count({
        where: {
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          deletedAt: null,
        },
      }),
    ]);

    return {
      users,
      organizations,
      plants,
      devices,
      telemetryPoints: powerReadings,
      completedTransactions: walletTxTotal,
      activeMaintenanceTickets: openTickets,
    };
  }
}

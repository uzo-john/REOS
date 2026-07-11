import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDeviceDto,
  UpdateDeviceDto,
  DeviceProvisionDto,
  RegisterInverterProfileDto,
  RegisterSmartMeterProfileDto,
  RegisterGatewayProfileDto,
  RegisterBatteryProfileDto,
} from './dto/devices.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate, buildPaginationQuery, buildSearchFilter } from '../common/utils/pagination.util';
import * as crypto from 'crypto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: RegisterDeviceDto, createdBy: string) {
    if (dto.serialNumber) {
      const existing = await this.prisma.device.findUnique({ where: { serialNumber: dto.serialNumber } });
      if (existing) throw new ConflictException('Device with this serial number already exists');
    }
    if (dto.qrCode) {
      const existing = await this.prisma.device.findUnique({ where: { qrCode: dto.qrCode } });
      if (existing) throw new ConflictException('Device with this QR code already exists');
    }

    const deviceAuthToken = crypto.randomBytes(32).toString('hex');

    return this.prisma.device.create({
      data: {
        ...dto,
        deviceAuthToken,
        createdBy,
        status: 'PROVISIONED',
      },
    });
  }

  async provision(dto: DeviceProvisionDto, ownerId: string) {
    const device = await this.prisma.device.findUnique({ where: { serialNumber: dto.serialNumber } });
    if (!device) throw new NotFoundException('Device with this serial number not found in provisioned factory list');
    if (device.ownerId) throw new ConflictException('Device is already registered to an owner');

    return this.prisma.device.update({
      where: { id: device.id },
      data: {
        ownerId,
        status: 'ONLINE',
        name: dto.name || device.name,
      },
    });
  }

  async findAll(pagination: PaginationDto, ownerId?: string, type?: string) {
    const query = buildPaginationQuery(pagination);
    const searchFilter = buildSearchFilter(['name', 'serialNumber', 'manufacturer', 'model'], pagination.search);
    const where: any = {
      deletedAt: null,
      ...(ownerId && { ownerId }),
      ...(type && { type: type as any }),
      ...(searchFilter ?? {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        ...query,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          solarInverter: true,
          smartMeter: true,
          iotGateway: true,
          batterySystem: true,
        },
      }),
      this.prisma.device.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        solarInverter: true,
        smartMeter: true,
        iotGateway: true,
        batterySystem: true,
        weatherStation: true,
        plantDevices: { include: { plant: true } },
      },
    });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async update(id: string, dto: UpdateDeviceDto) {
    await this.findOne(id);
    return this.prisma.device.update({
      where: { id },
      data: {
        ...dto,
        lastCommTime: dto.status === 'ONLINE' ? new Date() : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.device.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DECOMMISSIONED' },
    });
  }

  async logEvent(deviceId: string, level: string, message: string, payload?: any) {
    return this.prisma.deviceLog.create({
      data: {
        deviceId,
        level,
        message,
        payload: payload ?? undefined,
      },
    });
  }

  async getDeviceLogs(deviceId: string, pagination: PaginationDto) {
    const query = buildPaginationQuery(pagination);
    const where = { deviceId };
    const [data, total] = await Promise.all([
      this.prisma.deviceLog.findMany({
        where,
        ...query,
      }),
      this.prisma.deviceLog.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  // ─── Sub-Profile Specific Creation/Updates ───

  async registerInverter(dto: RegisterInverterProfileDto) {
    await this.findOne(dto.deviceId);
    return this.prisma.solarInverter.upsert({
      where: { deviceId: dto.deviceId },
      update: dto,
      create: dto,
    });
  }

  async registerSmartMeter(dto: RegisterSmartMeterProfileDto) {
    await this.findOne(dto.deviceId);
    return this.prisma.smartMeter.upsert({
      where: { deviceId: dto.deviceId },
      update: dto,
      create: dto,
    });
  }

  async registerGateway(dto: RegisterGatewayProfileDto) {
    await this.findOne(dto.deviceId);
    return this.prisma.ioTGateway.upsert({
      where: { deviceId: dto.deviceId },
      update: dto,
      create: dto,
    });
  }

  async registerBattery(dto: RegisterBatteryProfileDto) {
    await this.findOne(dto.deviceId);
    return this.prisma.batterySystem.upsert({
      where: { deviceId: dto.deviceId },
      update: dto,
      create: dto,
    });
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
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
import {
  RegisterProducerOnboardingDto,
  RegisterConsumerSmartMeterDto,
  SubmitConnectionRequestDto,
  ProcessConnectionApprovalDto,
  SearchProducerPlantsDto,
} from './dto/onboarding.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  paginate,
  buildPaginationQuery,
  buildSearchFilter,
} from '../common/utils/pagination.util';
import * as crypto from 'crypto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: RegisterDeviceDto, createdBy: string) {
    if (dto.serialNumber) {
      const existing = await this.prisma.device.findUnique({
        where: { serialNumber: dto.serialNumber },
      });
      if (existing)
        throw new ConflictException(
          'Device with this serial number already exists',
        );
    }
    if (dto.qrCode) {
      const existing = await this.prisma.device.findUnique({
        where: { qrCode: dto.qrCode },
      });
      if (existing)
        throw new ConflictException('Device with this QR code already exists');
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
    const device = await this.prisma.device.findUnique({
      where: { serialNumber: dto.serialNumber },
    });
    if (!device)
      throw new NotFoundException(
        'Device with this serial number not found in provisioned factory list',
      );
    if (device.ownerId)
      throw new ConflictException('Device is already registered to an owner');

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
    const searchFilter = buildSearchFilter(
      ['name', 'serialNumber', 'manufacturer', 'model'],
      pagination.search,
    );
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
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
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
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
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

  async logEvent(
    deviceId: string,
    level: string,
    message: string,
    payload?: any,
  ) {
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

  // ─── PRODUCER DEVICE ONBOARDING WIZARD ───

  async onboardProducerPlantAndDevices(dto: RegisterProducerOnboardingDto, userId: string) {
    // 1. Get or Create Organization for user
    let userOrg = await this.prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    let orgId = dto.organizationId || userOrg?.organizationId;
    if (!orgId) {
      const newOrg = await this.prisma.organization.create({
        data: {
          name: `${dto.plantName} Organization`,
          type: 'COMMERCIAL',
          code: `ORG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        },
      });
      await this.prisma.organizationMember.create({
        data: { organizationId: newOrg.id, userId, role: 'OWNER' },
      });
      orgId = newOrg.id;
    }

    // 2. Create Plant
    const plant = await this.prisma.plant.create({
      data: {
        name: dto.plantName,
        type: (dto.plantType as any) || 'SOLAR_FARM',
        organizationId: orgId,
        installedCapacityKw: dto.installedCapacityKw || 50.0,
        availableCapacityKw: dto.installedCapacityKw || 50.0,
        status: 'ACTIVE',
        operatingStatus: 'OPERATIONAL',
      },
    });

    const createdDevices = [];

    // 3. Register each device
    for (const devDto of dto.devices) {
      const serialNumber = devDto.serialNumber || `SN-${devDto.type}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const qrCode = devDto.qrCode || `QR-${serialNumber}`;
      const deviceAuthToken = crypto.randomBytes(32).toString('hex');

      const device = await this.prisma.device.create({
        data: {
          name: devDto.name,
          type: devDto.type,
          manufacturer: devDto.manufacturer || 'REOS Certified',
          model: devDto.model || 'GEN-2026',
          serialNumber,
          qrCode,
          protocol: devDto.protocol || 'MQTT',
          ipAddress: devDto.ipAddress || '192.168.1.100',
          gatewayId: devDto.gatewayId,
          firmwareVersion: devDto.firmwareVersion || 'v2.4.1',
          installationLocation: devDto.installationLocation || 'Main Plant Compound',
          commissioningDate: devDto.commissioningDate ? new Date(devDto.commissioningDate) : new Date(),
          ownerId: userId,
          status: 'ONLINE',
          verificationStatus: 'VERIFIED',
          deviceAuthToken,
          signalStrength: 94,
          communicationQuality: 98,
          lastCommTime: new Date(),
          hbLatencyMs: Math.floor(Math.random() * 20) + 15,
        },
      });

      // Bind device to plant
      await this.prisma.plantDevice.create({
        data: {
          plantId: plant.id,
          deviceId: device.id,
        },
      });

      // Create sub-profile
      if (devDto.type === 'SOLAR_INVERTER') {
        await this.prisma.solarInverter.create({
          data: {
            deviceId: device.id,
            ratedPowerKw: dto.installedCapacityKw || 50.0,
            brand: devDto.manufacturer || 'REOS Solar',
            model: devDto.model || 'INV-50K',
          },
        });
      } else if (devDto.type === 'SMART_METER') {
        await this.prisma.smartMeter.create({
          data: {
            deviceId: device.id,
            meterNumber: `PRD-MTR-${serialNumber.slice(-6)}`,
            meterType: 'BIDIRECTIONAL',
          },
        });
      } else if (devDto.type === 'IOT_GATEWAY' || devDto.type === 'METER_GATEWAY') {
        await this.prisma.ioTGateway.create({
          data: {
            deviceId: device.id,
            ipAddress: devDto.ipAddress || '192.168.1.1',
            mqttClientId: `gw_${device.id.slice(0, 8)}`,
          },
        });
      } else if (devDto.type === 'BATTERY_BMS') {
        await this.prisma.batterySystem.create({
          data: {
            deviceId: device.id,
            nominalCapacityKwh: 100.0,
            nominalVoltage: 480.0,
          },
        });
      }

      createdDevices.push(device);
    }

    return {
      message: 'Producer plant and hardware devices onboarded successfully',
      plant,
      devices: createdDevices,
    };
  }

  // ─── CONSUMER SMART METER REGISTRATION ───

  async registerConsumerSmartMeter(dto: RegisterConsumerSmartMeterDto, consumerId: string) {
    if (dto.serialNumber) {
      const existing = await this.prisma.device.findUnique({
        where: { serialNumber: dto.serialNumber },
      });
      if (existing && existing.ownerId && existing.ownerId !== consumerId) {
        throw new ConflictException('This Smart Meter serial number is registered to another user.');
      }
    }

    const serialNumber = dto.serialNumber || `CNS-MTR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const qrCode = dto.qrCode || `QR-${serialNumber}`;
    const deviceAuthToken = crypto.randomBytes(32).toString('hex');

    const device = await this.prisma.device.create({
      data: {
        name: dto.meterName,
        type: 'SMART_METER',
        manufacturer: dto.manufacturer || 'Smart Grid Tech',
        model: dto.model || 'SM-BIDIR-2026',
        serialNumber,
        qrCode,
        protocol: dto.protocol || 'MQTT',
        gatewayId: dto.gatewayId,
        installationLocation: dto.installationAddress || 'Main Distribution Board',
        ownerId: consumerId,
        status: 'ONLINE',
        verificationStatus: 'VERIFIED',
        deviceAuthToken,
        signalStrength: 92,
        communicationQuality: 96,
        lastCommTime: new Date(),
        hbLatencyMs: 18,
      },
    });

    const smartMeter = await this.prisma.smartMeter.create({
      data: {
        deviceId: device.id,
        meterNumber: dto.meterNumber || `MTR-${serialNumber.slice(-8)}`,
        meterType: 'BIDIRECTIONAL',
        phaseType: dto.phaseType || 'SINGLE_PHASE',
      },
    });

    return {
      message: 'Consumer Smart Meter registered and bound to account successfully',
      device,
      smartMeter,
    };
  }

  // ─── AUTOMATED DEVICE VERIFICATION ENGINE ───

  async verifyDevice(deviceId: string, userId: string) {
    const device = await this.findOne(deviceId);

    // Ownership check
    if (device.ownerId && device.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to verify this device');
    }

    // Ping / Gateway reachability simulation
    const commOk = device.status !== 'DECOMMISSIONED';
    const latency = commOk ? Math.floor(Math.random() * 25) + 12 : 999;
    const verificationStatus = commOk ? 'VERIFIED' : 'OFFLINE';

    const updated = await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        verificationStatus,
        verificationError: commOk ? null : 'Communication failure or gateway unreachable',
        signalStrength: commOk ? 95 : 0,
        communicationQuality: commOk ? 97 : 0,
        lastCommTime: commOk ? new Date() : device.lastCommTime,
        hbLatencyMs: latency,
        status: commOk ? 'ONLINE' : 'OFFLINE',
      },
    });

    await this.logEvent(
      deviceId,
      commOk ? 'INFO' : 'ERROR',
      `Automated verification run: status ${verificationStatus}`,
      { latencyMs: latency, commOk },
    );

    return {
      deviceId,
      verificationStatus,
      latencyMs: latency,
      signalStrength: updated.signalStrength,
      verifiedAt: new Date(),
    };
  }

  // ─── SEARCH PRODUCER PLANTS FOR CONNECTION ───

  async searchProducerPlants(dto: SearchProducerPlantsDto) {
    const where: any = {
      status: 'ACTIVE',
    };

    if (dto.plantId) {
      where.id = dto.plantId;
    } else if (dto.query) {
      where.OR = [
        { name: { contains: dto.query, mode: 'insensitive' } },
        { id: { contains: dto.query, mode: 'insensitive' } },
      ];
    }

    const plants = await this.prisma.plant.findMany({
      where,
      include: {
        organization: true,
        plantDevices: {
          include: {
            device: {
              include: { smartMeter: true },
            },
          },
        },
        consumerConnections: {
          include: {
            consumer: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
      take: 20,
    });

    return plants.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      capacityKw: p.installedCapacityKw,
      organizationName: p.organization?.name,
      connectedConsumers: p.consumerConnections.filter(c => c.connectionStatus === 'CONNECTED').length,
      producerMeters: p.plantDevices
        .filter(pd => pd.device.type === 'SMART_METER')
        .map(pd => ({ id: pd.device.id, name: pd.device.name, meterNumber: pd.device.smartMeter?.meterNumber })),
    }));
  }

  // ─── CONNECTION REQUEST & APPROVAL LIFECYCLE ───

  async submitConnectionRequest(dto: SubmitConnectionRequestDto, consumerId: string) {
    // Ensure consumer has registered smart meter
    const consumerMeterDevice = await this.prisma.device.findFirst({
      where: { ownerId: consumerId, type: 'SMART_METER', deletedAt: null },
      include: { smartMeter: true },
    });

    if (!consumerMeterDevice || !consumerMeterDevice.smartMeter) {
      throw new BadRequestException('You must register a Smart Meter before connecting to an Energy Producer.');
    }

    const plant = await this.prisma.plant.findUnique({
      where: { id: dto.plantId },
    });
    if (!plant) throw new NotFoundException('Target Energy Producer Plant not found.');

    // Check existing connection
    const existing = await this.prisma.consumerConnection.findFirst({
      where: { consumerId, plantId: dto.plantId },
    });

    if (existing) {
      return this.prisma.consumerConnection.update({
        where: { id: existing.id },
        data: {
          connectionStatus: 'PENDING',
          requestMessage: dto.requestMessage,
          invitationCode: dto.invitationCode,
          smartMeterId: consumerMeterDevice.smartMeter.id,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.consumerConnection.create({
      data: {
        consumerId,
        plantId: dto.plantId,
        smartMeterId: consumerMeterDevice.smartMeter.id,
        allocatedPowerKw: dto.requestedPowerKw || 5.0,
        connectionStatus: 'PENDING',
        requestMessage: dto.requestMessage,
        invitationCode: dto.invitationCode,
      },
    });
  }

  async getProducerConnectionRequests(producerId: string) {
    // Find all plants owned by or in user's organizations
    const userOrgs = await this.prisma.organizationMember.findMany({
      where: { userId: producerId },
      select: { organizationId: true },
    });
    const orgIds = userOrgs.map(o => o.organizationId);

    const plants = await this.prisma.plant.findMany({
      where: { organizationId: { in: orgIds } },
      select: { id: true },
    });
    const plantIds = plants.map(p => p.id);

    return this.prisma.consumerConnection.findMany({
      where: { plantId: { in: plantIds } },
      include: {
        consumer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        plant: { select: { id: true, name: true, type: true } },
        smartMeter: { include: { device: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processConnectionApproval(dto: ProcessConnectionApprovalDto, producerId: string) {
    const connection = await this.prisma.consumerConnection.findUnique({
      where: { id: dto.connectionId },
      include: { plant: true },
    });

    if (!connection) throw new NotFoundException('Connection request not found.');

    let newStatus = connection.connectionStatus;
    if (dto.action === 'APPROVE') newStatus = 'CONNECTED';
    if (dto.action === 'REJECT') newStatus = 'REJECTED';
    if (dto.action === 'SUSPEND') newStatus = 'SUSPENDED';
    if (dto.action === 'DISCONNECT') newStatus = 'DISCONNECTED';
    if (dto.action === 'REQUEST_INFO') newStatus = 'PENDING';

    return this.prisma.consumerConnection.update({
      where: { id: dto.connectionId },
      data: {
        connectionStatus: newStatus,
        rejectionReason: dto.action === 'REJECT' ? dto.rejectionReason : null,
        approvedAt: dto.action === 'APPROVE' ? new Date() : connection.approvedAt,
        isVerified: dto.action === 'APPROVE' ? true : connection.isVerified,
        allocatedPowerKw: dto.allocatedPowerKw || connection.allocatedPowerKw,
      },
    });
  }

  // ─── NETWORK TOPOLOGY GENERATOR ───

  async getNetworkTopology(plantId: string) {
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        plantDevices: {
          include: {
            device: {
              include: { smartMeter: true, solarInverter: true, batterySystem: true, iotGateway: true },
            },
          },
        },
        consumerConnections: {
          include: {
            consumer: { select: { id: true, firstName: true, lastName: true, email: true } },
            smartMeter: { include: { device: true } },
          },
        },
      },
    });

    if (!plant) throw new NotFoundException('Plant not found.');

    const producerMeters = plant.plantDevices
      .filter(pd => pd.device.type === 'SMART_METER')
      .map(pd => ({
        id: pd.device.id,
        name: pd.device.name,
        serialNumber: pd.device.serialNumber,
        status: pd.device.status,
        meterNumber: pd.device.smartMeter?.meterNumber,
        signalStrength: pd.device.signalStrength ?? 95,
      }));

    const connectedConsumers = plant.consumerConnections.map(c => ({
      connectionId: c.id,
      consumerId: c.consumerId,
      consumerName: `${c.consumer.firstName} ${c.consumer.lastName}`,
      consumerEmail: c.consumer.email,
      connectionStatus: c.connectionStatus,
      allocatedPowerKw: c.allocatedPowerKw,
      meterName: c.smartMeter?.device?.name || 'Consumer Smart Meter',
      meterSerial: c.smartMeter?.device?.serialNumber || 'N/A',
      meterStatus: c.smartMeter?.device?.status || 'ONLINE',
      signalStrength: c.smartMeter?.device?.signalStrength ?? 90,
      isVerified: c.isVerified,
    }));

    return {
      plantId: plant.id,
      plantName: plant.name,
      plantCapacityKw: plant.installedCapacityKw,
      operatingStatus: plant.operatingStatus || 'OPERATIONAL',
      producerMeters,
      consumers: connectedConsumers,
      activeFlowCount: connectedConsumers.filter(c => c.connectionStatus === 'CONNECTED').length,
    };
  }

  // ─── DEVICE HEALTH & DIAGNOSTICS ───

  async getDeviceHealthAndDiagnostics(deviceId: string) {
    const device = await this.findOne(deviceId);
    const logs = await this.prisma.deviceLog.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const commFailures = logs.filter(l => l.level === 'ERROR').length;
    const latency = device.hbLatencyMs || 22;

    return {
      deviceId: device.id,
      name: device.name,
      type: device.type,
      status: device.status,
      verificationStatus: device.verificationStatus,
      signalStrength: device.signalStrength ?? 92,
      communicationQuality: device.communicationQuality ?? 96,
      latencyMs: latency,
      firmwareVersion: device.firmwareVersion || 'v2.4.1',
      lastCommTime: device.lastCommTime,
      commFailuresCount: commFailures,
      alarmsCount: commFailures,
      ipAddress: device.ipAddress || '192.168.1.100',
      protocol: device.protocol,
      recentLogs: logs,
    };
  }
}


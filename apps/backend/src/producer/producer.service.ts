import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  RegisterPlantDto,
  UpdatePlantDto,
  CreateFeederDto,
  CreateZoneDto,
  ConnectConsumerDto,
  AllocateEnergyDto,
  DispatchEnergyDto,
  LogGridExportDto,
} from './dto/producer.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ── IN-MEMORY FALLBACK DATABASE FOR DATABASE-OFFLINE MODE ──────────────────
  private static mockPlants: any[] = [];
  private static mockFeeders: any[] = [];
  private static mockZones: any[] = [];
  private static mockConnections: any[] = [];
  private static mockAllocations: any[] = [];
  private static mockDispatches: any[] = [];
  private static mockGridExports: any[] = [];
  private static mockDispatchLogs: any[] = [];

  // Seed default data if arrays are empty
  private checkAndSeedMock() {
    if (ProducerService.mockPlants.length === 0) {
      const defaultPlantId = 'plant-default-123';
      ProducerService.mockPlants.push({
        id: defaultPlantId,
        name: 'Kano Industrial Solar Grid',
        type: 'HYBRID',
        status: 'ACTIVE',
        organizationId: 'org-123',
        latitude: 12.0022,
        longitude: 8.5919,
        address: 'Sharada Industrial Estate',
        city: 'Kano',
        state: 'Kano',
        country: 'NG',
        timezone: 'Africa/Lagos',
        installedCapacityKw: 2500, // 2.5 MW
        availableCapacityKw: 1800,
        gridConnectionStatus: 'CONNECTED',
        utilityDetails: 'TCN Kano Transmission Substation (132kV Line)',
        operatingStatus: 'OPERATIONAL',
        ownerInfo: 'Kano Clean Energy Consortium Ltd.',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add mock Feeders
      const feederA = 'feeder-A-123';
      const feederB = 'feeder-B-123';
      ProducerService.mockFeeders.push(
        {
          id: feederA,
          name: 'Sharada Feeder A (Zone 1)',
          plantId: defaultPlantId,
          capacityKw: 1000,
          status: 'ACTIVE',
          createdAt: new Date(),
        },
        {
          id: feederB,
          name: 'Bompai Feeder B (Zone 2)',
          plantId: defaultPlantId,
          capacityKw: 1500,
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      );

      // Add mock Zones
      const zone1 = 'zone-1-123';
      ProducerService.mockZones.push({
        id: zone1,
        name: 'Sharada Heavy Industry Zone',
        plantId: defaultPlantId,
        status: 'ACTIVE',
        createdAt: new Date(),
      });

      // Add mock consumers and smart meters
      ProducerService.mockConnections.push(
        {
          id: 'conn-1',
          consumerId: 'user-consumer-1',
          consumer: {
            id: 'user-consumer-1',
            firstName: 'Standard',
            lastName: 'Brewery Ltd.',
            email: 'brewery@kanoclean.com',
          },
          plantId: defaultPlantId,
          feederId: feederA,
          zoneId: zone1,
          smartMeterId: 'SM-MTR-8822A',
          allocatedPowerKw: 450.0,
          actualPowerKw: 382.4,
          remainingAllocationKwh: 4500.0,
          connectionStatus: 'CONNECTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'conn-2',
          consumerId: 'user-consumer-2',
          consumer: {
            id: 'user-consumer-2',
            firstName: 'Kano Glass',
            lastName: 'Works',
            email: 'glassworks@kanoclean.com',
          },
          plantId: defaultPlantId,
          feederId: feederA,
          zoneId: zone1,
          smartMeterId: 'SM-MTR-9031B',
          allocatedPowerKw: 300.0,
          actualPowerKw: 295.1,
          remainingAllocationKwh: 2100.0,
          connectionStatus: 'CONNECTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'conn-3',
          consumerId: 'user-consumer-3',
          consumer: {
            id: 'user-consumer-3',
            firstName: 'Challawa',
            lastName: 'Water Works',
            email: 'challawa@kano.gov',
          },
          plantId: defaultPlantId,
          feederId: feederB,
          zoneId: null,
          smartMeterId: 'SM-MTR-5544C',
          allocatedPowerKw: 800.0,
          actualPowerKw: 720.0,
          remainingAllocationKwh: 920.0,
          connectionStatus: 'CONNECTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      );

      // Add mock allocations
      ProducerService.mockAllocations.push(
        {
          id: 'alloc-1',
          plantId: defaultPlantId,
          targetType: 'FEEDER',
          targetId: feederA,
          allocatedKw: 750.0,
          priority: 1,
          allocationType: 'MANUAL',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'alloc-2',
          plantId: defaultPlantId,
          targetType: 'FEEDER',
          targetId: feederB,
          allocatedKw: 800.0,
          priority: 2,
          allocationType: 'MANUAL',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'alloc-3',
          plantId: defaultPlantId,
          targetType: 'GRID',
          targetId: 'NATIONAL-GRID',
          allocatedKw: 250.0,
          priority: 3,
          allocationType: 'AUTO',
          isActive: true,
          createdAt: new Date(),
        },
      );

      // Add mock dispatches
      ProducerService.mockDispatches.push(
        {
          id: 'disp-1',
          plantId: defaultPlantId,
          feederId: feederA,
          targetType: 'FEEDER',
          targetId: feederA,
          allocatedKw: 750.0,
          dispatchedKw: 677.5,
          status: 'ACTIVE',
          createdAt: new Date(),
        },
        {
          id: 'disp-2',
          plantId: defaultPlantId,
          feederId: feederB,
          targetType: 'FEEDER',
          targetId: feederB,
          allocatedKw: 800.0,
          dispatchedKw: 720.0,
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      );

      // Add mock Grid Export logs
      ProducerService.mockGridExports.push(
        {
          id: 'export-1',
          plantId: defaultPlantId,
          exportedEnergyKwh: 2450.0,
          importedEnergyKwh: 120.0,
          revenue: 551250,
          feedInTariff: 225.0,
          netMeteringCredit: 524250,
          settlementStatus: 'SETTLED',
          timestamp: new Date(Date.now() - 24 * 3600 * 1000),
        },
        {
          id: 'export-2',
          plantId: defaultPlantId,
          exportedEnergyKwh: 1800.0,
          importedEnergyKwh: 95.0,
          revenue: 405000,
          feedInTariff: 225.0,
          netMeteringCredit: 383625,
          settlementStatus: 'PENDING',
          timestamp: new Date(),
        },
      );
    }
  }

  // ── PLANT REGISTRATION ─────────────────────────────────────────────────────
  async registerPlant(ownerId: string, dto: RegisterPlantDto) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const newPlant = {
        id: `plant-${uuidv4()}`,
        name: dto.name,
        type: dto.type.toUpperCase(),
        status: 'ACTIVE',
        organizationId: 'org-123',
        latitude: dto.latitude ?? 12.0022,
        longitude: dto.longitude ?? 8.5919,
        address: dto.address ?? '',
        city: dto.city ?? '',
        state: dto.state ?? '',
        country: dto.country ?? 'NG',
        timezone: 'Africa/Lagos',
        installedCapacityKw: dto.installedCapacityKw,
        availableCapacityKw: dto.availableCapacityKw ?? dto.installedCapacityKw,
        gridConnectionStatus: dto.gridConnectionStatus ?? 'DISCONNECTED',
        utilityDetails: dto.utilityDetails ?? '',
        operatingStatus: dto.operatingStatus ?? 'OPERATIONAL',
        ownerInfo: dto.ownerInfo ?? '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      ProducerService.mockPlants.push(newPlant);
      await this.auditLog.log(
        'PRODUCER_PLANT_REGISTER',
        { plantId: newPlant.id, name: newPlant.name },
        ownerId,
      );
      return newPlant;
    }

    const org = await this.prisma.organization.findFirst({
      where: { members: { some: { userId: ownerId } } },
    });

    const plant = await this.prisma.plant.create({
      data: {
        name: dto.name,
        type: dto.type as any,
        installedCapacityKw: dto.installedCapacityKw,
        availableCapacityKw: dto.availableCapacityKw ?? dto.installedCapacityKw,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country ?? 'NG',
        gridConnectionStatus: dto.gridConnectionStatus,
        utilityDetails: dto.utilityDetails,
        operatingStatus: dto.operatingStatus,
        ownerInfo: dto.ownerInfo,
        organizationId: org ? org.id : 'default-org-id', // handle fallback org if none exists
      },
    });

    await this.auditLog.log(
      'PRODUCER_PLANT_REGISTER',
      { plantId: plant.id, name: plant.name },
      ownerId,
    );
    return plant;
  }

  async updatePlant(id: string, dto: UpdatePlantDto, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const plant = ProducerService.mockPlants.find((p) => p.id === id);
      if (!plant) throw new NotFoundException('Plant not found');
      Object.assign(plant, dto, { updatedAt: new Date() });
      await this.auditLog.log(
        'PRODUCER_PLANT_UPDATE',
        { plantId: id, updates: dto },
        operatorId,
      );
      return plant;
    }

    const updated = await this.prisma.plant.update({
      where: { id },
      data: dto as any,
    });
    await this.auditLog.log(
      'PRODUCER_PLANT_UPDATE',
      { plantId: id, updates: dto },
      operatorId,
    );
    return updated;
  }

  async getPlants(ownerId?: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      return ProducerService.mockPlants;
    }
    return this.prisma.plant.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            feeders: true,
            consumerConnections: true,
          },
        },
      },
    });
  }

  async getPlantDetails(id: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const plant = ProducerService.mockPlants.find((p) => p.id === id);
      if (!plant) throw new NotFoundException('Plant not found');
      const feeders = ProducerService.mockFeeders.filter(
        (f) => f.plantId === id,
      );
      const connections = ProducerService.mockConnections.filter(
        (c) => c.plantId === id,
      );
      const zones = ProducerService.mockZones.filter((z) => z.plantId === id);

      return {
        ...plant,
        feedersCount: feeders.length,
        consumersCount: connections.length,
        metersCount: connections.filter((c) => c.smartMeterId).length,
        feeders,
        connections,
        zones,
      };
    }

    const plant = await this.prisma.plant.findUnique({
      where: { id },
      include: {
        feeders: true,
        distributionZones: true,
        consumerConnections: {
          include: { consumer: true, smartMeter: true },
        },
      },
    });
    if (!plant) throw new NotFoundException('Plant not found');
    return {
      ...plant,
      feedersCount: plant.feeders.length,
      consumersCount: plant.consumerConnections.length,
      metersCount: plant.consumerConnections.filter((c) => c.smartMeterId)
        .length,
    };
  }

  // ── FEEDERS ────────────────────────────────────────────────────────────────
  async createFeeder(dto: CreateFeederDto, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const newFeeder = {
        id: `feeder-${uuidv4()}`,
        name: dto.name,
        plantId: dto.plantId,
        capacityKw: dto.capacityKw,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      ProducerService.mockFeeders.push(newFeeder);
      await this.auditLog.log('PRODUCER_FEEDER_CREATE', newFeeder, operatorId);
      return newFeeder;
    }

    const feeder = await this.prisma.feeder.create({
      data: {
        name: dto.name,
        plantId: dto.plantId,
        capacityKw: dto.capacityKw,
      },
    });
    await this.auditLog.log('PRODUCER_FEEDER_CREATE', feeder, operatorId);
    return feeder;
  }

  async getFeeders(plantId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      return ProducerService.mockFeeders.filter((f) => f.plantId === plantId);
    }
    return this.prisma.feeder.findMany({ where: { plantId } });
  }

  // ── DISTRIBUTION ZONES ─────────────────────────────────────────────────────
  async createZone(dto: CreateZoneDto, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const newZone = {
        id: `zone-${uuidv4()}`,
        name: dto.name,
        plantId: dto.plantId,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      ProducerService.mockZones.push(newZone);
      await this.auditLog.log('PRODUCER_ZONE_CREATE', newZone, operatorId);
      return newZone;
    }

    const zone = await this.prisma.distributionZone.create({
      data: {
        name: dto.name,
        plantId: dto.plantId,
      },
    });
    await this.auditLog.log('PRODUCER_ZONE_CREATE', zone, operatorId);
    return zone;
  }

  async getZones(plantId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      return ProducerService.mockZones.filter((z) => z.plantId === plantId);
    }
    return this.prisma.distributionZone.findMany({ where: { plantId } });
  }

  // ── CONSUMER CONNECTIONS ───────────────────────────────────────────────────
  async connectConsumer(dto: ConnectConsumerDto, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const newConn = {
        id: `conn-${uuidv4()}`,
        consumerId: dto.consumerId,
        consumer: {
          id: dto.consumerId,
          firstName: 'Consumer',
          lastName: 'Customer',
          email: 'consumer@reos.io',
        },
        plantId: dto.plantId,
        feederId: dto.feederId || null,
        zoneId: dto.zoneId || null,
        smartMeterId:
          dto.smartMeterId || `SM-${Math.floor(1000 + Math.random() * 9000)}`,
        allocatedPowerKw: dto.allocatedPowerKw ?? 50.0,
        actualPowerKw: 0.0,
        remainingAllocationKwh: (dto.allocatedPowerKw ?? 50.0) * 10,
        connectionStatus: 'CONNECTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      ProducerService.mockConnections.push(newConn);
      await this.auditLog.log('PRODUCER_CONSUMER_CONNECT', newConn, operatorId);
      return newConn;
    }

    const conn = await this.prisma.consumerConnection.create({
      data: {
        consumerId: dto.consumerId,
        plantId: dto.plantId,
        feederId: dto.feederId,
        zoneId: dto.zoneId,
        smartMeterId: dto.smartMeterId,
        allocatedPowerKw: dto.allocatedPowerKw ?? 0.0,
        remainingAllocationKwh: (dto.allocatedPowerKw ?? 0.0) * 10,
      },
      include: { consumer: true, smartMeter: true },
    });
    await this.auditLog.log('PRODUCER_CONSUMER_CONNECT', conn, operatorId);
    return conn;
  }

  async getConnections(plantId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      // Periodically simulate variable power consumption
      ProducerService.mockConnections.forEach((c) => {
        if (c.plantId === plantId && c.connectionStatus === 'CONNECTED') {
          const delta = (Math.random() - 0.5) * 10;
          c.actualPowerKw = Math.max(
            0.1,
            Math.min(c.allocatedPowerKw, c.actualPowerKw + delta),
          );
          c.remainingAllocationKwh = Math.max(
            0,
            c.remainingAllocationKwh - c.actualPowerKw / 1200,
          ); // reduce remaining
        }
      });
      return ProducerService.mockConnections.filter(
        (c) => c.plantId === plantId,
      );
    }
    return this.prisma.consumerConnection.findMany({
      where: { plantId },
      include: { consumer: true, smartMeter: true },
    });
  }

  async disconnectConsumer(connectionId: string, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const conn = ProducerService.mockConnections.find(
        (c) => c.id === connectionId,
      );
      if (!conn) throw new NotFoundException('Connection not found');
      conn.connectionStatus = 'DISCONNECTED';
      conn.actualPowerKw = 0.0;
      await this.auditLog.log(
        'PRODUCER_CONSUMER_DISCONNECT',
        { connectionId },
        operatorId,
      );
      return conn;
    }

    const conn = await this.prisma.consumerConnection.update({
      where: { id: connectionId },
      data: { connectionStatus: 'DISCONNECTED', actualPowerKw: 0.0 },
    });
    await this.auditLog.log(
      'PRODUCER_CONSUMER_DISCONNECT',
      { connectionId },
      operatorId,
    );
    return conn;
  }

  async reconnectConsumer(connectionId: string, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const conn = ProducerService.mockConnections.find(
        (c) => c.id === connectionId,
      );
      if (!conn) throw new NotFoundException('Connection not found');
      conn.connectionStatus = 'CONNECTED';
      await this.auditLog.log(
        'PRODUCER_CONSUMER_RECONNECT',
        { connectionId },
        operatorId,
      );
      return conn;
    }

    const conn = await this.prisma.consumerConnection.update({
      where: { id: connectionId },
      data: { connectionStatus: 'CONNECTED' },
    });
    await this.auditLog.log(
      'PRODUCER_CONSUMER_RECONNECT',
      { connectionId },
      operatorId,
    );
    return conn;
  }

  // ── ENERGY ALLOCATION ENGINE ──────────────────────────────────────────────
  async allocateEnergy(dto: AllocateEnergyDto, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const newAlloc = {
        id: `alloc-${uuidv4()}`,
        plantId: dto.plantId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        allocatedKw: dto.allocatedKw,
        priority: dto.priority ?? 1,
        allocationType: dto.allocationType ?? 'MANUAL',
        scheduledStart: dto.scheduledStart
          ? new Date(dto.scheduledStart)
          : null,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      ProducerService.mockAllocations.push(newAlloc);

      // Log dispatch actions inside DispatchLog
      ProducerService.mockDispatchLogs.push({
        id: `log-${uuidv4()}`,
        plantId: dto.plantId,
        operatorId,
        operator: { firstName: 'Plant', lastName: 'Operator' },
        action: 'ALLOCATE',
        targetType: dto.targetType,
        targetId: dto.targetId,
        details: `Allocated ${dto.allocatedKw} kW. Priority: ${newAlloc.priority}. Type: ${newAlloc.allocationType}`,
        timestamp: new Date(),
      });

      // If allocating directly to a connected consumer, let's update their connection
      if (dto.targetType === 'CONSUMER') {
        const conn = ProducerService.mockConnections.find(
          (c) => c.consumerId === dto.targetId,
        );
        if (conn) {
          conn.allocatedPowerKw = dto.allocatedKw;
          conn.remainingAllocationKwh = dto.allocatedKw * 10;
        }
      }

      await this.auditLog.log('PRODUCER_ALLOCATION_SET', newAlloc, operatorId);
      return newAlloc;
    }

    const allocation = await this.prisma.energyAllocation.create({
      data: {
        plantId: dto.plantId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        allocatedKw: dto.allocatedKw,
        priority: dto.priority,
        allocationType: dto.allocationType,
        scheduledStart: dto.scheduledStart
          ? new Date(dto.scheduledStart)
          : null,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : null,
        feederId: dto.feederId,
        zoneId: dto.zoneId,
        connectionId: dto.connectionId,
      },
    });

    if (dto.targetType === 'CONSUMER') {
      await this.prisma.consumerConnection.updateMany({
        where: { consumerId: dto.targetId, plantId: dto.plantId },
        data: {
          allocatedPowerKw: dto.allocatedKw,
          remainingAllocationKwh: dto.allocatedKw * 10,
        },
      });
    }

    await this.prisma.dispatchLog.create({
      data: {
        plantId: dto.plantId,
        operatorId,
        action: 'ALLOCATE',
        targetType: dto.targetType,
        targetId: dto.targetId,
        details: `Allocated ${dto.allocatedKw} kW. Priority: ${dto.priority ?? 1}. Type: ${dto.allocationType ?? 'MANUAL'}`,
      },
    });

    await this.auditLog.log('PRODUCER_ALLOCATION_SET', allocation, operatorId);
    return allocation;
  }

  async getAllocations(plantId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      return ProducerService.mockAllocations.filter(
        (a) => a.plantId === plantId,
      );
    }
    return this.prisma.energyAllocation.findMany({ where: { plantId } });
  }

  // ── ENERGY DISPATCH & SCHEDULING ───────────────────────────────────────────
  async dispatchEnergy(dto: DispatchEnergyDto, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const newDispatch = {
        id: `disp-${uuidv4()}`,
        plantId: dto.plantId,
        feederId: dto.feederId || null,
        targetType: dto.targetType,
        targetId: dto.targetId,
        allocatedKw: dto.allocatedKw,
        dispatchedKw: dto.dispatchedKw ?? dto.allocatedKw,
        status: 'ACTIVE',
        scheduledTime: dto.scheduledTime ? new Date(dto.scheduledTime) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      ProducerService.mockDispatches.push(newDispatch);

      ProducerService.mockDispatchLogs.push({
        id: `log-${uuidv4()}`,
        plantId: dto.plantId,
        operatorId,
        operator: { firstName: 'Plant', lastName: 'Operator' },
        action: 'ALLOCATE',
        targetType: dto.targetType,
        targetId: dto.targetId,
        details: `Dispatched ${newDispatch.dispatchedKw} kW to ${dto.targetType} with scheduling status ACTIVE.`,
        timestamp: new Date(),
      });

      await this.auditLog.log('PRODUCER_DISPATCH_SET', newDispatch, operatorId);
      return newDispatch;
    }

    const dispatch = await this.prisma.energyDispatch.create({
      data: {
        plantId: dto.plantId,
        feederId: dto.feederId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        allocatedKw: dto.allocatedKw,
        dispatchedKw: dto.dispatchedKw ?? dto.allocatedKw,
        status: 'ACTIVE',
        scheduledTime: dto.scheduledTime ? new Date(dto.scheduledTime) : null,
      },
    });

    await this.prisma.dispatchLog.create({
      data: {
        plantId: dto.plantId,
        operatorId,
        action: 'ALLOCATE',
        targetType: dto.targetType,
        targetId: dto.targetId,
        details: `Dispatched ${dispatch.dispatchedKw} kW to ${dto.targetType} with scheduling status ACTIVE.`,
      },
    });

    await this.auditLog.log('PRODUCER_DISPATCH_SET', dispatch, operatorId);
    return dispatch;
  }

  async getDispatches(plantId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      return ProducerService.mockDispatches.filter(
        (d) => d.plantId === plantId,
      );
    }
    return this.prisma.energyDispatch.findMany({ where: { plantId } });
  }

  async pauseDispatch(id: string, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const dispatch = ProducerService.mockDispatches.find((d) => d.id === id);
      if (!dispatch) throw new NotFoundException('Dispatch not found');
      dispatch.status = 'PAUSED';
      dispatch.dispatchedKw = 0.0;

      ProducerService.mockDispatchLogs.push({
        id: `log-${uuidv4()}`,
        plantId: dispatch.plantId,
        operatorId,
        operator: { firstName: 'Plant', lastName: 'Operator' },
        action: 'PAUSE',
        targetType: dispatch.targetType,
        targetId: dispatch.targetId,
        details: `Paused energy dispatch for dispatch reference ${id}.`,
        timestamp: new Date(),
      });

      await this.auditLog.log('PRODUCER_DISPATCH_PAUSE', { id }, operatorId);
      return dispatch;
    }

    const dispatch = await this.prisma.energyDispatch.update({
      where: { id },
      data: { status: 'PAUSED', dispatchedKw: 0.0 },
    });

    await this.prisma.dispatchLog.create({
      data: {
        plantId: dispatch.plantId,
        operatorId,
        action: 'PAUSE',
        targetType: dispatch.targetType,
        targetId: dispatch.targetId,
        details: `Paused energy dispatch for dispatch reference ${id}.`,
      },
    });

    await this.auditLog.log('PRODUCER_DISPATCH_PAUSE', { id }, operatorId);
    return dispatch;
  }

  async resumeDispatch(id: string, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const dispatch = ProducerService.mockDispatches.find((d) => d.id === id);
      if (!dispatch) throw new NotFoundException('Dispatch not found');
      dispatch.status = 'ACTIVE';
      dispatch.dispatchedKw = dispatch.allocatedKw;

      ProducerService.mockDispatchLogs.push({
        id: `log-${uuidv4()}`,
        plantId: dispatch.plantId,
        operatorId,
        operator: { firstName: 'Plant', lastName: 'Operator' },
        action: 'RESUME',
        targetType: dispatch.targetType,
        targetId: dispatch.targetId,
        details: `Resumed energy dispatch for dispatch reference ${id}.`,
        timestamp: new Date(),
      });

      await this.auditLog.log('PRODUCER_DISPATCH_RESUME', { id }, operatorId);
      return dispatch;
    }

    const dispatch = await this.prisma.energyDispatch.findUnique({
      where: { id },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');

    const updated = await this.prisma.energyDispatch.update({
      where: { id },
      data: { status: 'ACTIVE', dispatchedKw: dispatch.allocatedKw },
    });

    await this.prisma.dispatchLog.create({
      data: {
        plantId: dispatch.plantId,
        operatorId,
        action: 'RESUME',
        targetType: dispatch.targetType,
        targetId: dispatch.targetId,
        details: `Resumed energy dispatch for dispatch reference ${id}.`,
      },
    });

    await this.auditLog.log('PRODUCER_DISPATCH_RESUME', { id }, operatorId);
    return updated;
  }

  async getDispatchLogs(plantId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      return ProducerService.mockDispatchLogs
        .filter((l) => l.plantId === plantId)
        .reverse();
    }
    return this.prisma.dispatchLog.findMany({
      where: { plantId },
      include: { operator: { select: { firstName: true, lastName: true } } },
      orderBy: { timestamp: 'desc' },
    });
  }

  // ── NATIONAL GRID EXPORT ──────────────────────────────────────────────────
  async logGridExport(dto: LogGridExportDto, operatorId: string) {
    const tariff = dto.feedInTariff;
    const revenue = dto.exportedEnergyKwh * tariff;
    const netCredit = Math.max(
      0,
      (dto.exportedEnergyKwh - (dto.importedEnergyKwh ?? 0)) * tariff,
    );

    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      const newRec = {
        id: `grid-exp-${uuidv4()}`,
        plantId: dto.plantId,
        exportedEnergyKwh: dto.exportedEnergyKwh,
        importedEnergyKwh: dto.importedEnergyKwh ?? 0.0,
        revenue,
        feedInTariff: tariff,
        netMeteringCredit: netCredit,
        settlementStatus: 'PENDING',
        timestamp: new Date(),
      };
      ProducerService.mockGridExports.push(newRec);
      await this.auditLog.log(
        'PRODUCER_GRID_EXPORT_RECORD',
        newRec,
        operatorId,
      );
      return newRec;
    }

    const rec = await this.prisma.gridExportRecord.create({
      data: {
        plantId: dto.plantId,
        exportedEnergyKwh: dto.exportedEnergyKwh,
        importedEnergyKwh: dto.importedEnergyKwh ?? 0.0,
        revenue,
        feedInTariff: tariff,
        netMeteringCredit: netCredit,
      },
    });

    await this.auditLog.log('PRODUCER_GRID_EXPORT_RECORD', rec, operatorId);
    return rec;
  }

  async getGridExports(plantId: string) {
    if (!this.prisma.isConnected) {
      this.checkAndSeedMock();
      return ProducerService.mockGridExports.filter(
        (e) => e.plantId === plantId,
      );
    }
    return this.prisma.gridExportRecord.findMany({
      where: { plantId },
      orderBy: { timestamp: 'desc' },
    });
  }

  // ── ANALYTICS, AI FORECASTS & BILLING REPORTS ──────────────────────────────
  async getAnalytics(plantId: string) {
    this.checkAndSeedMock();
    const liveLoad = ProducerService.mockConnections
      .filter(
        (c) => c.plantId === plantId && c.connectionStatus === 'CONNECTED',
      )
      .reduce((acc, c) => acc + c.actualPowerKw, 0);

    const liveGen = liveLoad * 1.15 + Math.random() * 50; // generation is load + export + losses
    const losses = liveGen * 0.04;
    const efficiency = 96.0;

    return {
      plantId,
      liveGenerationKw: liveGen,
      liveLoadKw: liveLoad,
      gridExportKw: Math.max(0, liveGen - liveLoad - losses),
      batterySocPercent: 78 + Math.round((Math.random() - 0.5) * 4),
      batteryVoltage: 402.1 + (Math.random() - 0.5) * 2,
      powerQuality: {
        voltageV: 400.2 + (Math.random() - 0.5) * 1.5,
        frequencyHz: 50.02 + (Math.random() - 0.5) * 0.04,
        powerFactor: 0.985 + (Math.random() - 0.5) * 0.005,
      },
      efficiencyPct: efficiency,
      lossesKw: losses,
      faultsCount: 0,
      historicalGenKwh: {
        daily: [1120, 1340, 1450, 1280, 1510, 1720, liveGen * 5.5],
        weekly: [8200, 8900, 9400, 9900],
        monthly: [36200, 38100, 39500, 41200, 42000, 43900],
      },
    };
  }

  async getAiForecasts(plantId: string) {
    // Generate realistic forecasting arrays based on capacity
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const genCapacity = 1800; // available capacity

    const generationForecast = hours.map((_, i) => {
      // bell curve around peak sun (hour 12)
      if (i < 6 || i > 18) return 0.0;
      const x = (i - 12) / 3;
      return Math.round(genCapacity * Math.exp(-0.5 * x * x));
    });

    const demandForecast = hours.map((_, i) => {
      // typical industrial plant load double peak (hour 9 and 15)
      const base = 400;
      const peak1 = 800 * Math.exp(-0.5 * Math.pow((i - 10) / 2, 2));
      const peak2 = 700 * Math.exp(-0.5 * Math.pow((i - 16) / 2, 2));
      return Math.round(base + peak1 + peak2);
    });

    const batterySocForecast = hours.map((_, i) => {
      // charges during midday, discharges during evening
      if (i < 6) return 40 + i * 2;
      if (i < 16) return Math.min(100, 50 + (i - 6) * 6);
      return Math.max(30, 100 - (i - 16) * 5);
    });

    return {
      plantId,
      timeLabels: hours,
      generationForecastKw: generationForecast,
      demandForecastKw: demandForecast,
      batterySocForecastPercent: batterySocForecast,
      lossForecastKw: demandForecast.map((d) => Math.round(d * 0.045)),
      revenueForecast: {
        directConsumer: 2450000,
        gridExport: 540000,
        unallocatedSurplus: 120000,
      },
      recommendations: [
        {
          id: 'rec-1',
          category: 'BATTERY_OPTIMIZATION',
          priority: 'HIGH',
          title: 'Charge Battery from 08:00 - 10:00',
          description:
            'Midday generation will exceed consumer demands. Absorb excess 450 kW in Battery Storage to defer grid charging charges.',
          savingsImpact: '₦145,000/day',
        },
        {
          id: 'rec-2',
          category: 'PEAK_SHAVING',
          priority: 'MEDIUM',
          title: 'Shave peak demand at Bompai Substation',
          description:
            'Industrial feeders will spike by 15% at 15:30. Limit community allocation manually or discharge battery by 150 kW during peak hours.',
          savingsImpact: '₦95,000/day',
        },
        {
          id: 'rec-3',
          category: 'DISPATCH_BALANCING',
          priority: 'INFO',
          title: 'Shift Grid Export to Peak Tariff Hours',
          description:
            'Exporting during off-peak provides lower margins. Throttle grid connection to 50 kW until peak period (17:00-20:00) when Feed-in Tariffs spike by 25%.',
          savingsImpact: '₦210,000/day',
        },
      ],
    };
  }

  async getBillingSettlements(plantId: string) {
    this.checkAndSeedMock();
    const connections = ProducerService.mockConnections.filter(
      (c) => c.plantId === plantId,
    );

    const directConsumerRevenue = connections.reduce(
      (sum, c) => sum + c.allocatedPowerKw * 125 * 30,
      0,
    ); // ₦125 per kW/h rate approximation
    const gridExportRevenue = ProducerService.mockGridExports
      .filter((g) => g.plantId === plantId)
      .reduce((sum, g) => sum + g.revenue, 0);

    const transactionHistory = [
      {
        id: 'tx-201',
        consumerName: 'Standard Brewery Ltd.',
        energySoldKwh: 12450.0,
        amount: 1556250,
        status: 'PAID',
        date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      },
      {
        id: 'tx-202',
        consumerName: 'Kano Glass Works',
        energySoldKwh: 8900.0,
        amount: 1112500,
        status: 'PAID',
        date: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      },
      {
        id: 'tx-203',
        consumerName: 'Challawa Water Works',
        energySoldKwh: 21500.0,
        amount: 2687500,
        status: 'PENDING',
        date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      },
    ];

    return {
      plantId,
      outstandingPayments: 2687500,
      totalBillingRevenue: directConsumerRevenue + gridExportRevenue,
      escrowLockedBalance: 1200000.0,
      walletBalance: 3450890.0,
      gridExportRevenue,
      settlementReports: [
        {
          month: 'June 2026',
          energySoldMwh: 45.8,
          revenue: 5725000,
          status: 'SETTLED',
        },
        {
          month: 'May 2026',
          energySoldMwh: 42.1,
          revenue: 5262500,
          status: 'SETTLED',
        },
        {
          month: 'April 2026',
          energySoldMwh: 38.6,
          revenue: 4825000,
          status: 'SETTLED',
        },
      ],
      transactions: transactionHistory,
    };
  }
}

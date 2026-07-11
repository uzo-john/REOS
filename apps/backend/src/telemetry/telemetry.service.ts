import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestTelemetryDto, BatchTelemetryDto } from './dto/telemetry.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate, buildPaginationQuery } from '../common/utils/pagination.util';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TelemetryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async ingest(dto: IngestTelemetryDto) {
    // 1. Verify device exists
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
    });
    if (!device) throw new NotFoundException(`Device ${dto.deviceId} not found`);

    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    // 2. Insert into master Telemetry table
    const telemetry = await this.prisma.telemetry.create({
      data: {
        deviceId: dto.deviceId,
        timestamp,
        voltage: dto.voltage,
        current: dto.current,
        activePower: dto.activePower,
        reactivePower: dto.reactivePower,
        apparentPower: dto.apparentPower,
        frequency: dto.frequency,
        powerFactor: dto.powerFactor,
        energyImported: dto.energyImported,
        energyExported: dto.energyExported,
        batterySoc: dto.batterySoc,
        status: dto.status,
        alarmStatus: dto.alarmStatus,
        commQuality: dto.commQuality,
        rawPayload: dto.rawPayload,
      },
    });

    // Update last seen status on the device
    await this.prisma.device.update({
      where: { id: dto.deviceId },
      data: {
        lastCommTime: timestamp,
        status: dto.alarmStatus ? 'FAULT' : 'ONLINE',
        signalStrength: dto.commQuality ? Math.round(dto.commQuality) : undefined,
      },
    });

    // 3. Populate optimized analytics tables based on device type
    const promises: Promise<any>[] = [];

    // General power metrics
    if (dto.voltage !== undefined || dto.current !== undefined || dto.activePower !== undefined) {
      promises.push(
        this.prisma.powerReading.create({
          data: {
            deviceId: dto.deviceId,
            timestamp,
            voltageV: dto.voltage,
            currentA: dto.current,
            activePowerW: dto.activePower,
            reactivePowerVar: dto.reactivePower,
            apparentPowerVa: dto.apparentPower,
            frequencyHz: dto.frequency,
            powerFactor: dto.powerFactor,
          },
        }),
      );
    }

    // Solar generations
    if (device.type === 'SOLAR_INVERTER' && dto.activePower !== undefined) {
      promises.push(
        this.prisma.solarGeneration.create({
          data: {
            deviceId: dto.deviceId,
            timestamp,
            acPowerW: dto.activePower,
            energyTodayKwh: dto.energyExported ? dto.energyExported % 24 : undefined, // estimation mock
            energyTotalKwh: dto.energyExported,
            efficiency: device.metadata ? (device.metadata as any).efficiency : undefined,
          },
        }),
      );
    }

    // Battery BMS data
    if (dto.batterySoc !== undefined || device.type === 'BATTERY_BMS') {
      promises.push(
        this.prisma.batteryData.create({
          data: {
            deviceId: dto.deviceId,
            timestamp,
            socPercent: dto.batterySoc,
            voltageV: dto.voltage,
            currentA: dto.current,
            state: dto.current && dto.current > 0 ? 'CHARGING' : dto.current && dto.current < 0 ? 'DISCHARGING' : 'IDLE',
          },
        }),
      );
    }

    // Alarm / Fault generation
    if (dto.alarmStatus && dto.alarmStatus !== 'OK' && dto.alarmStatus !== 'NORMAL') {
      promises.push(
        this.prisma.faultLog.create({
          data: {
            deviceId: dto.deviceId,
            code: dto.alarmStatus,
            description: `Automatic alarm reported from telemetry stream: ${dto.alarmStatus}`,
            severity: 'WARNING',
            occurredAt: timestamp,
          },
        }),
      );
    }

    await Promise.all(promises);

    // 4. Emit internal event for WebSockets and processing engines
    this.eventEmitter.emit('telemetry.ingested', telemetry);

    return telemetry;
  }

  async ingestBatch(dto: BatchTelemetryDto) {
    const device = await this.prisma.device.findUnique({ where: { id: dto.deviceId } });
    if (!device) throw new NotFoundException(`Device ${dto.deviceId} not found`);

    const startTs = new Date(Math.min(...dto.readings.map(r => new Date(r.timestamp || new Date()).getTime())));
    const endTs = new Date(Math.max(...dto.readings.map(r => new Date(r.timestamp || new Date()).getTime())));

    // Create a batch tracking record
    await this.prisma.telemetryBatch.create({
      data: {
        deviceId: dto.deviceId,
        batchSize: dto.readings.length,
        startTs,
        endTs,
        payload: dto.readings as any,
        processed: true,
      },
    });

    // Ingest all readings
    const results = await Promise.all(
      dto.readings.map(reading =>
        this.ingest({
          ...reading,
          deviceId: dto.deviceId,
        }).catch(err => {
          console.error(`Failed to ingest record inside batch: ${err.message}`);
          return null;
        }),
      ),
    );

    return {
      deviceId: dto.deviceId,
      totalReceived: dto.readings.length,
      totalProcessed: results.filter(r => r !== null).length,
    };
  }

  async getHistory(
    deviceId: string,
    pagination: PaginationDto,
    startDate?: string,
    endDate?: string,
  ) {
    const query = buildPaginationQuery(pagination);
    const where: any = {
      deviceId,
      ...(startDate || endDate ? {
        timestamp: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.telemetry.findMany({
        where,
        ...query,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.telemetry.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  async getPowerReadings(deviceId: string, rangeMinutes = 60) {
    const cutoff = new Date(Date.now() - rangeMinutes * 60 * 1000);
    return this.prisma.powerReading.findMany({
      where: {
        deviceId,
        timestamp: { gte: cutoff },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getSolarGeneration(deviceId: string, rangeHours = 24) {
    const cutoff = new Date(Date.now() - rangeHours * 60 * 60 * 1000);
    return this.prisma.solarGeneration.findMany({
      where: {
        deviceId,
        timestamp: { gte: cutoff },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getBatteryData(deviceId: string, rangeHours = 24) {
    const cutoff = new Date(Date.now() - rangeHours * 60 * 60 * 1000);
    return this.prisma.batteryData.findMany({
      where: {
        deviceId,
        timestamp: { gte: cutoff },
      },
      orderBy: { timestamp: 'asc' },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MonitoringService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlantLiveMetrics(plantId: string) {
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        plantDevices: {
          include: {
            device: {
              select: {
                id: true,
                name: true,
                type: true,
                status: true,
                lastCommTime: true,
              },
            },
          },
        },
      },
    });

    if (!plant) throw new NotFoundException('Plant not found');

    const deviceIds = plant.plantDevices.map((pd) => pd.deviceId);

    // Get the latest telemetry record for each device
    const latestTelemetries = await Promise.all(
      deviceIds.map((deviceId) =>
        this.prisma.telemetry.findFirst({
          where: { deviceId },
          orderBy: { timestamp: 'desc' },
        }),
      ),
    );

    // Compute aggregations
    let totalSolarGenerationKw = 0;
    let totalConsumptionKw = 0;
    let totalBatterySoc = 0;
    let batteryCount = 0;
    let gridImportKw = 0;
    let gridExportKw = 0;

    latestTelemetries.forEach((t, idx) => {
      if (!t) return;
      const device = plant.plantDevices[idx].device;

      const power = t.activePower ?? 0;

      if (device.type === 'SOLAR_INVERTER') {
        totalSolarGenerationKw += power;
      } else if (device.type === 'ENERGY_SENSOR') {
        totalConsumptionKw += power;
      } else if (device.type === 'BATTERY_BMS') {
        if (t.batterySoc !== null && t.batterySoc !== undefined) {
          totalBatterySoc += t.batterySoc;
          batteryCount++;
        }
      } else if (device.type === 'SMART_METER') {
        gridImportKw += t.energyImported ?? 0;
        gridExportKw += t.energyExported ?? 0;
      }
    });

    return {
      plantId,
      plantName: plant.name,
      timestamp: new Date().toISOString(),
      metrics: {
        solarGenerationKw: totalSolarGenerationKw / 1000, // W to kW
        consumptionKw: totalConsumptionKw / 1000,
        averageBatterySoc: batteryCount > 0 ? totalBatterySoc / batteryCount : null,
        gridImportKwh: gridImportKw,
        gridExportKwh: gridExportKw,
        netGridFlowKw: (gridImportKw - gridExportKw) / 1000,
      },
    };
  }

  async getRealTimeSystemHealth() {
    const [totalDevices, online, offline, fault, decommissioned] = await Promise.all([
      this.prisma.device.count({ where: { deletedAt: null } }),
      this.prisma.device.count({ where: { status: 'ONLINE', deletedAt: null } }),
      this.prisma.device.count({ where: { status: 'OFFLINE', deletedAt: null } }),
      this.prisma.device.count({ where: { status: 'FAULT', deletedAt: null } }),
      this.prisma.device.count({ where: { status: 'DECOMMISSIONED', deletedAt: null } }),
    ]);

    // Retrieve active alarms
    const activeAlarms = await this.prisma.faultLog.findMany({
      where: { resolvedAt: null },
      orderBy: { occurredAt: 'desc' },
      take: 10,
      include: {
        device: { select: { id: true, name: true, type: true } },
      },
    });

    return {
      devices: {
        total: totalDevices,
        online,
        offline,
        fault,
        decommissioned,
      },
      activeAlarms,
    };
  }
}

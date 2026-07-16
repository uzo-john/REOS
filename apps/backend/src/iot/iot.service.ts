import { Injectable, Logger } from '@nestjs/common';

export interface Device {
  id: string;
  name: string;
  type:
    | 'INVERTER'
    | 'SMART_METER'
    | 'BMS'
    | 'WEATHER_STATION'
    | 'NEIGHBOUR_METER'
    | 'EDGE_GATEWAY';
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  projectId: string;
  firmwareVersion: string;
  lastCommTime: string;
  signalStrength: number; // dBm
  communicationQuality: number; // percentage 0-100
}

export interface TelemetryData {
  timestamp: string;
  inverter: {
    powerKw: number;
    voltageV: number;
    currentA: number;
    efficiencyPercent: number;
    frequencyHz: number;
    gridSynchronized: boolean;
    antiIslandingActive: boolean;
    status: string;
  };
  smartMeter: {
    voltageV: number;
    currentA: number;
    activePowerKw: number;
    reactivePowerKvar: number;
    apparentPowerKva: number;
    powerFactor: number;
    frequencyHz: number;
    importEnergyKwh: number;
    exportEnergyKwh: number;
    netEnergyKwh: number;
    dailyExportKwh: number;
    monthlyExportKwh: number;
    lifetimeExportKwh: number;
    voltageImbalancePercent: number;
    harmonicsThdPercent: number;
    phaseLoss: boolean;
  };
  battery: {
    socPercent: number;
    voltageV: number;
    currentA: number;
    temperatureC: number;
    healthPercent: number;
    chargingState: 'CHARGING' | 'DISCHARGING' | 'IDLE';
  };
  neighbourTrading: {
    voltageV: number;
    currentA: number;
    instantaneousPowerKw: number;
    energyDeliveredKwh: number;
    energyReceivedKwh: number;
    currentPricePerKwh: number;
    earnedCredits: number;
    purchasedCredits: number;
    settlementBalance: number;
    connectedNeighboursCount: number;
    activeTransactionsCount: number;
    availableExportCapacityKw: number;
  };
  weather: {
    solarIrradianceWm2: number;
    ambientTempC: number;
    windSpeedMs: number;
  };
}

export interface SystemAlert {
  id: string;
  code: string;
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: string;
  recommendedAction: string;
  acknowledged: boolean;
}

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  // In-memory mock databases for resilience when DB is offline
  private devices: Device[] = [];
  private alerts: SystemAlert[] = [];

  // Running system states that can be toggled by commands
  private gridExportEnabled = true;
  private neighbourTransferEnabled = true;
  private edgeGatewayBufferingActive = false;

  // Accumulative variables to simulate progress
  private totalExportKwh = 0;
  private totalImportKwh = 0;
  private totalNeighborDeliveredKwh = 0;
  private totalNeighborReceivedKwh = 0;
  private earnedCredits = 0; // In selected currency (e.g. NGN)
  private neighborSettlementBalance = 0;

  constructor() {
    this.seedDefaultDevices();
  }

  private seedDefaultDevices() {
    this.devices = [
      {
        id: 'dev-inv-001',
        name: 'Hybrid Solar Inverter',
        type: 'INVERTER',
        status: 'ONLINE',
        projectId: 'default',
        firmwareVersion: 'v2.1.4',
        lastCommTime: new Date().toISOString(),
        signalStrength: -60,
        communicationQuality: 95,
      },
      {
        id: 'dev-met-001',
        name: 'Bidirectional Smart Net Meter',
        type: 'SMART_METER',
        status: 'ONLINE',
        projectId: 'default',
        firmwareVersion: 'v1.0.8',
        lastCommTime: new Date().toISOString(),
        signalStrength: -72,
        communicationQuality: 92,
      },
      {
        id: 'dev-bms-001',
        name: 'Lithium BMS Controller',
        type: 'BMS',
        status: 'ONLINE',
        projectId: 'default',
        firmwareVersion: 'v4.1.2',
        lastCommTime: new Date().toISOString(),
        signalStrength: -55,
        communicationQuality: 99,
      },
      {
        id: 'dev-wth-001',
        name: 'Outdoor Weather Station',
        type: 'WEATHER_STATION',
        status: 'ONLINE',
        projectId: 'default',
        firmwareVersion: 'v0.9.4',
        lastCommTime: new Date().toISOString(),
        signalStrength: -88,
        communicationQuality: 74,
      },
      {
        id: 'dev-ngb-001',
        name: 'Neighbour Grid Tie Link',
        type: 'NEIGHBOUR_METER',
        status: 'ONLINE',
        projectId: 'default',
        firmwareVersion: 'v1.2.0',
        lastCommTime: new Date().toISOString(),
        signalStrength: -81,
        communicationQuality: 81,
      },
      {
        id: 'dev-gw-001',
        name: 'REOS Edge Gateway v1',
        type: 'EDGE_GATEWAY',
        status: 'ONLINE',
        projectId: 'default',
        firmwareVersion: 'v3.0.0',
        lastCommTime: new Date().toISOString(),
        signalStrength: -45,
        communicationQuality: 100,
      },
    ];
  }

  // Registry Actions
  getDevices(): Device[] {
    return this.devices;
  }

  registerDevice(
    device: Omit<
      Device,
      'lastCommTime' | 'signalStrength' | 'communicationQuality'
    >,
  ): Device {
    const newDevice: Device = {
      ...device,
      lastCommTime: new Date().toISOString(),
      signalStrength: -65,
      communicationQuality: 95,
    };
    this.devices.push(newDevice);
    this.logger.log(
      `Registered new device: ${newDevice.name} (${newDevice.id})`,
    );
    return newDevice;
  }

  removeDevice(id: string): { success: boolean } {
    const initialLength = this.devices.length;
    this.devices = this.devices.filter((d) => d.id !== id);
    const success = this.devices.length < initialLength;
    if (success) {
      this.logger.log(`Removed device with ID: ${id}`);
    }
    return { success };
  }

  updateDeviceStatus(id: string, status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE') {
    const dev = this.devices.find((d) => d.id === id);
    if (dev) {
      dev.status = status;
      dev.lastCommTime = new Date().toISOString();
      this.logger.log(`Device ${id} status updated to ${status}`);
      this.evaluateAlerts();
    }
  }

  // Command control toggles
  setGridExport(enabled: boolean) {
    this.gridExportEnabled = enabled;
    this.logger.log(
      `Grid Export command dispatched: ${enabled ? 'ENABLED' : 'DISABLED'}`,
    );
    this.evaluateAlerts();
  }

  setNeighbourTransfer(enabled: boolean) {
    this.neighbourTransferEnabled = enabled;
    this.logger.log(
      `Neighbour Transfer command dispatched: ${enabled ? 'ENABLED' : 'DISABLED'}`,
    );
    this.evaluateAlerts();
  }

  setEdgeGatewayBuffering(enabled: boolean) {
    this.edgeGatewayBufferingActive = enabled;
    this.logger.log(
      `Edge Gateway local buffering updated: ${enabled ? 'ACTIVE' : 'INACTIVE'}`,
    );
  }

  // Telemetry query
  getLiveTelemetry(): TelemetryData {
    // Dynamically advance accumulated states slightly on each request to simulate continuous usage
    const deltaSec = 2; // Simulated time passed between fetches
    const solarP = 2.8 + (Math.random() * 0.4 - 0.2); // Sized around 3 kWp
    const loadP = 1.2 + (Math.random() * 0.2 - 0.1); // Home consumption around 1.2 kW

    // Calculate Grid Import / Export
    let gridExportKw = 0;
    let gridImportKw = 0;
    let neighborExportKw = 0;

    const surplus = solarP - loadP; // e.g. 1.5 kW
    if (surplus > 0) {
      if (this.neighbourTransferEnabled) {
        // Share 0.6 kW with neighbor first
        neighborExportKw = Math.min(surplus, 0.6);
      }
      if (this.gridExportEnabled) {
        gridExportKw = surplus - neighborExportKw;
      }
    } else {
      gridImportKw = Math.abs(surplus);
    }

    // Advance accumulative counters
    this.totalExportKwh += (gridExportKw * deltaSec) / 3600;
    this.totalImportKwh += (gridImportKw * deltaSec) / 3600;
    this.totalNeighborDeliveredKwh += (neighborExportKw * deltaSec) / 3600;

    // Add export revenue credit
    const rate = 225; // NGN per kWh
    this.earnedCredits += ((gridExportKw * deltaSec) / 3600) * rate;
    this.neighborSettlementBalance +=
      ((neighborExportKw * deltaSec) / 3600) * rate;

    // Simulate fluctuations
    const gridVolt = 228 + (Math.random() * 6 - 3); // Hovering around 228V (slightly low, checking thresholds)
    const currentA =
      gridExportKw > 0
        ? (gridExportKw * 1000) / gridVolt
        : (gridImportKw * 1000) / gridVolt;
    const nbrVolt = 226 + (Math.random() * 4 - 2);

    // Evaluate alerts dynamically before returning telemetry
    const gridSynced = gridVolt >= 230 && gridVolt <= 253;
    const activePowerKw = gridExportKw > 0 ? gridExportKw : -gridImportKw;
    this.evaluateAlerts(gridVolt, gridSynced, activePowerKw);

    return {
      timestamp: new Date().toISOString(),
      inverter: {
        powerKw: solarP,
        voltageV: gridVolt + 1,
        currentA: (solarP * 1000) / (gridVolt + 1),
        efficiencyPercent: 97.4,
        frequencyHz: 50.0 + (Math.random() * 0.1 - 0.05),
        gridSynchronized: gridSynced, // Only syncs if voltage complies with 230V threshold!
        antiIslandingActive: false,
        status: solarP > 0.1 ? 'GENERATING' : 'STANDBY',
      },
      smartMeter: {
        voltageV: gridVolt,
        currentA: currentA,
        activePowerKw: gridExportKw > 0 ? gridExportKw : -gridImportKw,
        reactivePowerKvar: 0.12 + Math.random() * 0.05,
        apparentPowerKva:
          Math.abs(gridExportKw > 0 ? gridExportKw : gridImportKw) * 1.02,
        powerFactor: 0.98,
        frequencyHz: 50.0 + (Math.random() * 0.08 - 0.04),
        importEnergyKwh: this.totalImportKwh,
        exportEnergyKwh: this.totalExportKwh,
        netEnergyKwh: this.totalExportKwh - this.totalImportKwh,
        dailyExportKwh: this.totalExportKwh * 0.15,
        monthlyExportKwh: this.totalExportKwh * 0.8,
        lifetimeExportKwh: this.totalExportKwh,
        voltageImbalancePercent: 0.4,
        harmonicsThdPercent: 1.8,
        phaseLoss: false,
      },
      battery: {
        socPercent: 82 + (Math.random() * 2 - 1),
        voltageV: 51.2 + (Math.random() * 0.4 - 0.2),
        currentA: surplus > 0 ? 15 : -25,
        temperatureC: 28.5 + (Math.random() * 0.5 - 0.25),
        healthPercent: 98.0,
        chargingState: surplus > 0 ? 'CHARGING' : 'DISCHARGING',
      },
      neighbourTrading: {
        voltageV: nbrVolt,
        currentA: (neighborExportKw * 1000) / nbrVolt,
        instantaneousPowerKw: neighborExportKw,
        energyDeliveredKwh: this.totalNeighborDeliveredKwh,
        energyReceivedKwh: this.totalNeighborReceivedKwh,
        currentPricePerKwh: rate,
        earnedCredits: this.neighborSettlementBalance,
        purchasedCredits: this.totalNeighborReceivedKwh * rate,
        settlementBalance:
          this.neighborSettlementBalance - this.totalNeighborReceivedKwh * rate,
        connectedNeighboursCount: 3,
        activeTransactionsCount: neighborExportKw > 0 ? 1 : 0,
        availableExportCapacityKw: Math.max(0, 1.5 - neighborExportKw),
      },
      weather: {
        solarIrradianceWm2: solarP > 0.5 ? 780 + (Math.random() * 40 - 20) : 0,
        ambientTempC: 31.0 + (Math.random() * 1.0 - 0.5),
        windSpeedMs: 3.4 + (Math.random() * 0.8 - 0.4),
      },
    };
  }

  // Alerts logic
  getAlerts(): SystemAlert[] {
    return this.alerts;
  }

  acknowledgeAlert(id: string): { success: boolean } {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      this.logger.log(`Acknowledged alert: ${alert.title} (${alert.id})`);
      return { success: true };
    }
    return { success: false };
  }

  private evaluateAlerts(
    gridVolt: number = 230,
    gridSynced: boolean = true,
    activePowerKw: number = 0,
  ) {
    // Generate alerts based on current system conditions
    const activeAlerts: SystemAlert[] = [];

    // 1. Grid Undervoltage check (User configured threshold: V < 230V)
    if (gridVolt < 230) {
      activeAlerts.push({
        id: 'alert-undervoltage',
        code: 'GRID_UNDERVOLTAGE',
        title: 'Grid Undervoltage Fault',
        severity: 'WARNING',
        timestamp: new Date().toISOString(),
        recommendedAction:
          'Grid voltage falls below 230V threshold. Ensure automatic voltage regulator is active and check inverters settings.',
        acknowledged: this.isAlertAcked('alert-undervoltage'),
      });
    }

    // 2. Grid Synchronization failure
    if (!gridSynced) {
      activeAlerts.push({
        id: 'alert-sync-fail',
        code: 'GRID_SYNC_FAILURE',
        title: 'Inverter Synchronization Failure',
        severity: 'CRITICAL',
        timestamp: new Date().toISOString(),
        recommendedAction:
          'Inverter is out of sync with utility grid parameters. Check utility voltage/frequency ranges.',
        acknowledged: this.isAlertAcked('alert-sync-fail'),
      });
    }

    // 3. Device Offline check
    for (const dev of this.devices) {
      if (dev.status === 'OFFLINE') {
        activeAlerts.push({
          id: `alert-dev-${dev.id}`,
          code: 'DEVICE_OFFLINE',
          title: `Device Offline: ${dev.name}`,
          severity:
            dev.type === 'SMART_METER' || dev.type === 'INVERTER'
              ? 'CRITICAL'
              : 'WARNING',
          timestamp: new Date().toISOString(),
          recommendedAction: `Inspect connection links, verify Zigbee/Wi-Fi signal strength, and restart the ${dev.name}.`,
          acknowledged: this.isAlertAcked(`alert-dev-${dev.id}`),
        });
      }
    }

    // 4. Reverse Power fault (if export is off but smart meter is exporting)
    if (!this.gridExportEnabled && activePowerKw > 0) {
      activeAlerts.push({
        id: 'alert-rev-power',
        code: 'REVERSE_POWER_FAULT',
        title: 'Reverse Power Flow Detected',
        severity: 'CRITICAL',
        timestamp: new Date().toISOString(),
        recommendedAction:
          'Grid export is disabled but power export is detected. Check inverter export prevention settings.',
        acknowledged: this.isAlertAcked('alert-rev-power'),
      });
    }

    // Maintain in-memory alerts
    this.alerts = activeAlerts;
  }

  private isAlertAcked(id: string): boolean {
    const existing = this.alerts.find((a) => a.id === id);
    return existing ? existing.acknowledged : false;
  }
}

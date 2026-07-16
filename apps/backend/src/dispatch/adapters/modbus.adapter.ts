import { Injectable, Logger } from '@nestjs/common';
import { DeviceAdapter, IApsTelemetry } from '../interfaces/adapters.interface';

@Injectable()
export class ModbusAdapter implements DeviceAdapter {
  private readonly logger = new Logger(ModbusAdapter.name);

  getName(): string {
    return 'MODBUS_TCP';
  }

  async readTelemetry(deviceId: string): Promise<IApsTelemetry> {
    this.logger.log(`Reading Modbus registers via TCP on device ${deviceId}`);
    // Simulate reading input registers
    return {
      generationKw: 1540.2 + (Math.random() - 0.5) * 50,
      batterySoc: 74 + Math.round((Math.random() - 0.5) * 2),
      loadKw: 1100.5 + (Math.random() - 0.5) * 40,
      gridImportKw: 0.0,
      gridExportKw: 420.0 + (Math.random() - 0.5) * 10,
      frequencyHz: 50.01,
      voltageV: 400.1,
      powerFactor: 0.988,
    };
  }

  async writeControlCommand(
    deviceId: string,
    commandType: string,
    params: any,
  ): Promise<boolean> {
    this.logger.log(
      `Writing Modbus holding registers on device ${deviceId}. Command: ${commandType}, params: ${JSON.stringify(
        params,
      )}`,
    );
    // Simulate successful register write (e.g. setting power limit register 40021)
    return true;
  }
}

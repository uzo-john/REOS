import { Injectable, Logger } from '@nestjs/common';
import { DeviceAdapter, IApsTelemetry } from '../interfaces/adapters.interface';

@Injectable()
export class RestAdapter implements DeviceAdapter {
  private readonly logger = new Logger(RestAdapter.name);

  getName(): string {
    return 'REST_API';
  }

  async readTelemetry(deviceId: string): Promise<IApsTelemetry> {
    this.logger.log(
      `Performing HTTP GET to vendor cloud API for device ${deviceId}`,
    );
    return {
      generationKw: 1538.5,
      batterySoc: 74,
      loadKw: 1115.0,
      gridImportKw: 0.0,
      gridExportKw: 395.0,
      frequencyHz: 49.99,
      voltageV: 399.8,
      powerFactor: 0.985,
    };
  }

  async writeControlCommand(
    deviceId: string,
    commandType: string,
    params: any,
  ): Promise<boolean> {
    this.logger.log(
      `Performing HTTP POST command to vendor API endpoint: /control/${deviceId}. Command: ${commandType}, params: ${JSON.stringify(
        params,
      )}`,
    );
    return true;
  }
}

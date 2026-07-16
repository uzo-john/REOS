import { Injectable, Logger } from '@nestjs/common';
import { DeviceAdapter, IApsTelemetry } from '../interfaces/adapters.interface';

@Injectable()
export class MqttAdapter implements DeviceAdapter {
  private readonly logger = new Logger(MqttAdapter.name);

  getName(): string {
    return 'MQTT';
  }

  async readTelemetry(deviceId: string): Promise<IApsTelemetry> {
    this.logger.log(
      `Fetching latest retained telemetry payload for MQTT device ${deviceId}`,
    );
    return {
      generationKw: 1545.0,
      batterySoc: 75,
      loadKw: 1080.0,
      gridImportKw: 0.0,
      gridExportKw: 440.0,
      frequencyHz: 50.02,
      voltageV: 400.3,
      powerFactor: 0.99,
    };
  }

  async writeControlCommand(
    deviceId: string,
    commandType: string,
    params: any,
  ): Promise<boolean> {
    const topic = `reos/control/${deviceId}/${commandType.toLowerCase()}`;
    this.logger.log(
      `Publishing control payload to MQTT topic: ${topic}, payload: ${JSON.stringify(
        params,
      )}`,
    );
    return true;
  }
}

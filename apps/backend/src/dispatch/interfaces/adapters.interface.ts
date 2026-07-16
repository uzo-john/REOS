export interface IApsTelemetry {
  generationKw: number;
  batterySoc: number;
  loadKw: number;
  gridImportKw: number;
  gridExportKw: number;
  frequencyHz: number;
  voltageV: number;
  powerFactor: number;
}

export interface DeviceAdapter {
  getName(): string;
  readTelemetry(deviceId: string): Promise<IApsTelemetry>;
  writeControlCommand(
    deviceId: string,
    commandType: string,
    params: any,
  ): Promise<boolean>;
}

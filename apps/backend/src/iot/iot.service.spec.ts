import { Test, TestingModule } from '@nestjs/testing';
import { IotService } from './iot.service';

describe('IotService', () => {
  let service: IotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IotService],
    }).compile();

    service = module.get<IotService>(IotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start with default devices registered', () => {
    const devices = service.getDevices();
    expect(devices.length).toBe(6);
    expect(devices.find((d) => d.type === 'INVERTER')).toBeDefined();
    expect(devices.find((d) => d.type === 'SMART_METER')).toBeDefined();
  });

  it('should register a new device successfully', () => {
    const newDevice = service.registerDevice({
      id: 'dev-tst-999',
      name: 'Test Charger',
      type: 'EDGE_GATEWAY',
      status: 'ONLINE',
      projectId: 'default',
      firmwareVersion: 'v1.0.0',
    });

    expect(newDevice.id).toBe('dev-tst-999');
    expect(service.getDevices().length).toBe(7);
  });

  it('should remove a device successfully', () => {
    const res = service.removeDevice('dev-inv-001');
    expect(res.success).toBe(true);
    expect(service.getDevices().length).toBe(5);
  });

  it('should calculate live telemetry with correct structures', () => {
    const telemetry = service.getLiveTelemetry();
    expect(telemetry.timestamp).toBeDefined();
    expect(telemetry.inverter.powerKw).toBeGreaterThan(0);
    expect(telemetry.smartMeter.voltageV).toBeGreaterThan(0);
    expect(telemetry.battery.socPercent).toBeGreaterThan(0);
    expect(telemetry.neighbourTrading.instantaneousPowerKw).toBeDefined();
  });

  it('should generate undervoltage alarm if grid voltage is below 230V', () => {
    // Mock Math.random to return 0, guaranteeing gridVolt is 225V (< 230V)
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0);

    // Generate telemetry, which runs evaluateAlerts() internally
    service.getLiveTelemetry();

    // We expect alerts to contain the undervoltage warning if voltage < 230V
    const alerts = service.getAlerts();
    const undervoltageAlert = alerts.find(
      (a) => a.code === 'GRID_UNDERVOLTAGE',
    );

    expect(undervoltageAlert).toBeDefined();
    expect(undervoltageAlert?.severity).toBe('WARNING');
    expect(undervoltageAlert?.acknowledged).toBe(false);
    spy.mockRestore();
  });

  it('should generate sync failure if voltage is out of synchronized limits', () => {
    // Mock Math.random to return 0, guaranteeing gridVolt is 225V (not synced)
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0);

    service.getLiveTelemetry();
    const alerts = service.getAlerts();
    const syncAlert = alerts.find((a) => a.code === 'GRID_SYNC_FAILURE');
    expect(syncAlert).toBeDefined();
    spy.mockRestore();
  });
});

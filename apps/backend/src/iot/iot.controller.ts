import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IotService, Device } from './iot.service';

@Controller('iot')
export class IotController {
  constructor(private readonly iotService: IotService) {}

  @Get('devices')
  getDevices() {
    return this.iotService.getDevices();
  }

  @Post('devices')
  registerDevice(@Body() device: Omit<Device, 'lastCommTime' | 'signalStrength' | 'communicationQuality'>) {
    return this.iotService.registerDevice(device);
  }

  @Delete('devices/:id')
  removeDevice(@Param('id') id: string) {
    return this.iotService.removeDevice(id);
  }

  @Post('devices/:id/status')
  updateDeviceStatus(@Param('id') id: string, @Body('status') status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE') {
    this.iotService.updateDeviceStatus(id, status);
    return { success: true };
  }

  @Get('telemetry/live')
  getLiveTelemetry() {
    return this.iotService.getLiveTelemetry();
  }

  @Post('grid-export')
  @HttpCode(HttpStatus.OK)
  setGridExport(@Body('enabled') enabled: boolean) {
    this.iotService.setGridExport(enabled);
    return { success: true };
  }

  @Post('neighbour-transfer')
  @HttpCode(HttpStatus.OK)
  setNeighbourTransfer(@Body('enabled') enabled: boolean) {
    this.iotService.setNeighbourTransfer(enabled);
    return { success: true };
  }

  @Post('edge-gateway/buffering')
  @HttpCode(HttpStatus.OK)
  setEdgeGatewayBuffering(@Body('enabled') enabled: boolean) {
    this.iotService.setEdgeGatewayBuffering(enabled);
    return { success: true };
  }

  @Get('alerts')
  getAlerts() {
    return this.iotService.getAlerts();
  }

  @Post('alerts/:id/acknowledge')
  @HttpCode(HttpStatus.OK)
  acknowledgeAlert(@Param('id') id: string) {
    return this.iotService.acknowledgeAlert(id);
  }
}

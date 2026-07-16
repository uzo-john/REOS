import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Real-time Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly service: MonitoringService) {}

  @Get('plant/:plantId/live')
  @ApiOperation({
    summary: 'Get aggregated live electrical flow charts data for a plant',
  })
  getPlantLive(@Param('plantId') plantId: string) {
    return this.service.getPlantLiveMetrics(plantId);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Get global system health dashboard and active device alarms list',
  })
  getHealth() {
    return this.service.getRealTimeSystemHealth();
  }
}

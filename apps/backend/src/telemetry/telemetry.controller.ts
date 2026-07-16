import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { IngestTelemetryDto, BatchTelemetryDto } from './dto/telemetry.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Telemetry')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly service: TelemetryService) {}

  @Public() // Devices might bypass standard user auth using direct JWT or ApiKeys in production
  @Post('ingest')
  @ApiOperation({ summary: 'Ingest single device telemetry reading' })
  ingest(@Body() dto: IngestTelemetryDto) {
    return this.service.ingest(dto);
  }

  @Public()
  @Post('ingest/batch')
  @ApiOperation({ summary: 'Ingest batch telemetry data' })
  ingestBatch(@Body() dto: BatchTelemetryDto) {
    return this.service.ingestBatch(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('device/:deviceId/history')
  @ApiOperation({
    summary: 'Get historical telemetry for a device with filters',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getHistory(
    @Param('deviceId') deviceId: string,
    @Query() pagination: PaginationDto,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getHistory(deviceId, pagination, startDate, endDate);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('device/:deviceId/power')
  @ApiOperation({ summary: 'Get recent power readings' })
  @ApiQuery({
    name: 'rangeMinutes',
    required: false,
    type: Number,
    description: 'Default: 60 minutes',
  })
  getPower(
    @Param('deviceId') deviceId: string,
    @Query('rangeMinutes') rangeMinutes?: number,
  ) {
    const mins = rangeMinutes ? Number(rangeMinutes) : 60;
    return this.service.getPowerReadings(deviceId, mins);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('device/:deviceId/solar')
  @ApiOperation({ summary: 'Get recent solar generation statistics' })
  @ApiQuery({
    name: 'rangeHours',
    required: false,
    type: Number,
    description: 'Default: 24 hours',
  })
  getSolar(
    @Param('deviceId') deviceId: string,
    @Query('rangeHours') rangeHours?: number,
  ) {
    const hrs = rangeHours ? Number(rangeHours) : 24;
    return this.service.getSolarGeneration(deviceId, hrs);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('device/:deviceId/battery')
  @ApiOperation({ summary: 'Get recent battery charging/status profiles' })
  @ApiQuery({
    name: 'rangeHours',
    required: false,
    type: Number,
    description: 'Default: 24 hours',
  })
  getBattery(
    @Param('deviceId') deviceId: string,
    @Query('rangeHours') rangeHours?: number,
  ) {
    const hrs = rangeHours ? Number(rangeHours) : 24;
    return this.service.getBatteryData(deviceId, hrs);
  }
}

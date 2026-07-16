import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProducerService } from './producer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  RegisterPlantDto,
  UpdatePlantDto,
  CreateFeederDto,
  CreateZoneDto,
  ConnectConsumerDto,
  AllocateEnergyDto,
  DispatchEnergyDto,
  LogGridExportDto,
} from './dto/producer.dto';

@ApiTags('Commercial Energy Producer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('producer')
export class ProducerController {
  constructor(private readonly service: ProducerService) {}

  // ── PLANTS ─────────────────────────────────────────────────────────────────
  @Post('plants')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Register a generating plant' })
  registerPlant(
    @Body() dto: RegisterPlantDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.registerPlant(userId, dto);
  }

  @Put('plants/:id')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Update a generating plant' })
  updatePlant(
    @Param('id') id: string,
    @Body() dto: UpdatePlantDto,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.updatePlant(id, dto, operatorId);
  }

  @Get('plants')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'List all generating plants' })
  getPlants(@CurrentUser('id') userId: string) {
    return this.service.getPlants(userId);
  }

  @Get('plants/:id')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get details of a generating plant' })
  getPlantDetails(@Param('id') id: string) {
    return this.service.getPlantDetails(id);
  }

  // ── FEEDERS ────────────────────────────────────────────────────────────────
  @Post('feeders')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Create a feeder' })
  createFeeder(
    @Body() dto: CreateFeederDto,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.createFeeder(dto, operatorId);
  }

  @Get('plants/:id/feeders')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get all feeders connected to plant' })
  getFeeders(@Param('id') plantId: string) {
    return this.service.getFeeders(plantId);
  }

  // ── DISTRIBUTION ZONES ─────────────────────────────────────────────────────
  @Post('zones')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Create a distribution zone' })
  createZone(
    @Body() dto: CreateZoneDto,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.createZone(dto, operatorId);
  }

  @Get('plants/:id/zones')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get all distribution zones in a plant' })
  getZones(@Param('id') plantId: string) {
    return this.service.getZones(plantId);
  }

  // ── CONSUMERS CONNECTIONS ──────────────────────────────────────────────────
  @Post('connections')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Connect a consumer to feeder/zone' })
  connectConsumer(
    @Body() dto: ConnectConsumerDto,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.connectConsumer(dto, operatorId);
  }

  @Get('plants/:id/connections')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get connected consumers and meters' })
  getConnections(@Param('id') plantId: string) {
    return this.service.getConnections(plantId);
  }

  @Post('connections/:id/disconnect')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Disconnect consumer' })
  disconnectConsumer(
    @Param('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.disconnectConsumer(id, operatorId);
  }

  @Post('connections/:id/reconnect')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Reconnect consumer' })
  reconnectConsumer(
    @Param('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.reconnectConsumer(id, operatorId);
  }

  // ── ALLOCATIONS ────────────────────────────────────────────────────────────
  @Post('allocations')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Set available capacity / allocate energy' })
  allocateEnergy(
    @Body() dto: AllocateEnergyDto,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.allocateEnergy(dto, operatorId);
  }

  @Get('plants/:id/allocations')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'List allocations' })
  getAllocations(@Param('id') plantId: string) {
    return this.service.getAllocations(plantId);
  }

  // ── DISPATCH ───────────────────────────────────────────────────────────────
  @Post('dispatch')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Create dispatch / scheduling limits' })
  dispatchEnergy(
    @Body() dto: DispatchEnergyDto,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.dispatchEnergy(dto, operatorId);
  }

  @Get('plants/:id/dispatch')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get active energy dispatches' })
  getDispatches(@Param('id') plantId: string) {
    return this.service.getDispatches(plantId);
  }

  @Post('dispatch/:id/pause')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Pause energy dispatch allocation' })
  pauseDispatch(
    @Param('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.pauseDispatch(id, operatorId);
  }

  @Post('dispatch/:id/resume')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Resume energy dispatch allocation' })
  resumeDispatch(
    @Param('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.resumeDispatch(id, operatorId);
  }

  @Get('plants/:id/dispatch-logs')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get logs of energy dispatch operations' })
  getDispatchLogs(@Param('id') plantId: string) {
    return this.service.getDispatchLogs(plantId);
  }

  // ── GRID EXPORT ────────────────────────────────────────────────────────────
  @Post('grid-export')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Log a grid export transaction' })
  logGridExport(
    @Body() dto: LogGridExportDto,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.logGridExport(dto, operatorId);
  }

  @Get('plants/:id/grid-export')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get grid export settlement records' })
  getGridExports(@Param('id') plantId: string) {
    return this.service.getGridExports(plantId);
  }

  // ── ANALYTICS, AI FORECASTS & BILLING ──────────────────────────────────────
  @Get('plants/:id/analytics')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get real-time distribution analytics' })
  getAnalytics(@Param('id') plantId: string) {
    return this.service.getAnalytics(plantId);
  }

  @Get('plants/:id/ai-forecast')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({
    summary: 'Get AI forecasting and optimization recommendations',
  })
  getAiForecasts(@Param('id') plantId: string) {
    return this.service.getAiForecasts(plantId);
  }

  @Get('plants/:id/billing-settlements')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get billing overview, escrow and settlements' })
  getBillingSettlements(@Param('id') plantId: string) {
    return this.service.getBillingSettlements(plantId);
  }
}

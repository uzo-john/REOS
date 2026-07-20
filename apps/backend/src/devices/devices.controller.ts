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
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import {
  RegisterDeviceDto,
  UpdateDeviceDto,
  DeviceProvisionDto,
  RegisterInverterProfileDto,
  RegisterSmartMeterProfileDto,
  RegisterGatewayProfileDto,
  RegisterBatteryProfileDto,
} from './dto/devices.dto';
import {
  RegisterProducerOnboardingDto,
  RegisterConsumerSmartMeterDto,
  SubmitConnectionRequestDto,
  ProcessConnectionApprovalDto,
  SearchProducerPlantsDto,
} from './dto/onboarding.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly service: DevicesService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register factory device (Admin/Installer)' })
  register(@Body() dto: RegisterDeviceDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Post('provision')
  @ApiOperation({
    summary: 'Provision/claim device via Serial number or QR code',
  })
  provision(
    @Body() dto: DeviceProvisionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.provision(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all devices with pagination' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('ownerId') ownerId?: string,
    @Query('type') type?: string,
  ) {
    return this.service.findAll(pagination, ownerId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device metadata & sub-profiles' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device settings or status' })
  update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete / Decommission device' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get communication logs of a device' })
  getLogs(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.service.getDeviceLogs(id, pagination);
  }

  @Post(':id/logs')
  @ApiOperation({ summary: 'Add a new log message from the device' })
  addLog(
    @Param('id') id: string,
    @Body('level') level: string,
    @Body('message') message: string,
    @Body('payload') payload?: any,
  ) {
    return this.service.logEvent(id, level, message, payload);
  }

  // ─── Sub-Profile Specific Endpoints ───

  @Post('profile/inverter')
  @ApiOperation({ summary: 'Upsert solar inverter specific fields' })
  upsertInverter(@Body() dto: RegisterInverterProfileDto) {
    return this.service.registerInverter(dto);
  }

  @Post('profile/smart-meter')
  @ApiOperation({ summary: 'Upsert smart meter specific fields' })
  upsertSmartMeter(@Body() dto: RegisterSmartMeterProfileDto) {
    return this.service.registerSmartMeter(dto);
  }

  @Post('profile/gateway')
  @ApiOperation({ summary: 'Upsert gateway specific fields' })
  upsertGateway(@Body() dto: RegisterGatewayProfileDto) {
    return this.service.registerGateway(dto);
  }

  @Post('profile/battery')
  @ApiOperation({ summary: 'Upsert battery storage specific fields' })
  upsertBattery(@Body() dto: RegisterBatteryProfileDto) {
    return this.service.registerBattery(dto);
  }

  // ─── PRODUCER ONBOARDING & SETUP WIZARD ───

  @Post('onboard-producer')
  @ApiOperation({ summary: 'Onboard Plant, Inverter, Meter, BMS, and Gateway setup wizard' })
  onboardProducer(
    @Body() dto: RegisterProducerOnboardingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.onboardProducerPlantAndDevices(dto, userId);
  }

  // ─── CONSUMER SMART METER REGISTRATION ───

  @Post('register-consumer-meter')
  @ApiOperation({ summary: 'Register Smart Meter and bind to Consumer account' })
  registerConsumerMeter(
    @Body() dto: RegisterConsumerSmartMeterDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.registerConsumerSmartMeter(dto, userId);
  }

  // ─── DEVICE AUTOMATED VERIFICATION ENGINE ───

  @Post(':id/verify')
  @ApiOperation({ summary: 'Run automated ownership, serial, and communication verification test' })
  verifyDevice(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.verifyDevice(id, userId);
  }

  // ─── CONNECTION MANAGEMENT & PRODUCER SEARCH ───

  @Get('plants/search')
  @ApiOperation({ summary: 'Search active producer energy plants by name, ID, or invitation code' })
  searchPlants(@Query() dto: SearchProducerPlantsDto) {
    return this.service.searchProducerPlants(dto);
  }

  @Post('connections/request')
  @ApiOperation({ summary: 'Submit connection request from Consumer to Producer Plant' })
  submitConnectionRequest(
    @Body() dto: SubmitConnectionRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.submitConnectionRequest(dto, userId);
  }

  @Get('connections/producer-requests')
  @ApiOperation({ summary: 'Get incoming consumer connection requests for Producer plants' })
  getProducerRequests(@CurrentUser('id') userId: string) {
    return this.service.getProducerConnectionRequests(userId);
  }

  @Post('connections/approve')
  @ApiOperation({ summary: 'Approve, Reject, Suspend, or Disconnect consumer connection' })
  processApproval(
    @Body() dto: ProcessConnectionApprovalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.processConnectionApproval(dto, userId);
  }

  // ─── NETWORK TOPOLOGY & DIAGNOSTICS ───

  @Get('topology/:plantId')
  @ApiOperation({ summary: 'Get visual network topology tree for plant and connected meters' })
  getTopology(@Param('plantId') plantId: string) {
    return this.service.getNetworkTopology(plantId);
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Get device health, signal strength, latency, and communication logs' })
  getHealth(@Param('id') id: string) {
    return this.service.getDeviceHealthAndDiagnostics(id);
  }
}


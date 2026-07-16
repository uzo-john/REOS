import { IsString, IsEnum, IsOptional, IsInt, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DeviceType,
  DeviceStatus,
  CommunicationProtocol,
} from '@prisma/client';

export class RegisterDeviceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiProperty({ enum: DeviceType })
  @IsEnum(DeviceType)
  type: DeviceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hardwareVersion?: string;

  @ApiPropertyOptional({
    enum: CommunicationProtocol,
    default: CommunicationProtocol.MQTT,
  })
  @IsOptional()
  @IsEnum(CommunicationProtocol)
  protocol?: CommunicationProtocol;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: DeviceStatus })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  signalStrength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  diagnosticsJson?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class DeviceProvisionDto {
  @ApiProperty()
  @IsString()
  serialNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class RegisterInverterProfileDto {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  ratedPowerKw?: number;

  @ApiPropertyOptional()
  @IsOptional()
  maxVoltageV?: number;

  @ApiPropertyOptional()
  @IsOptional()
  maxCurrentA?: number;

  @ApiPropertyOptional()
  @IsOptional()
  mpptChannels?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  gridTied?: boolean;

  @ApiPropertyOptional({ default: 'THREE_PHASE' })
  @IsOptional()
  @IsString()
  phaseType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  efficiency?: number;
}
export class RegisterSmartMeterProfileDto {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meterNumber?: string;

  @ApiPropertyOptional({ default: 'BIDIRECTIONAL' })
  @IsOptional()
  @IsString()
  meterType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utilityAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tariffCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  ctRatio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  ptRatio?: number;

  @ApiPropertyOptional({ default: 'THREE_PHASE' })
  @IsOptional()
  @IsString()
  phaseType?: string;
}

export class RegisterGatewayProfileDto {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  macAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mqttClientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mqttTopic?: string;
}
export class RegisterBatteryProfileDto {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiPropertyOptional({ default: 'LITHIUM_ION' })
  @IsOptional()
  @IsString()
  chemistry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  nominalCapacityKwh?: number;

  @ApiPropertyOptional()
  @IsOptional()
  nominalVoltage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  maxChargeRateKw?: number;

  @ApiPropertyOptional()
  @IsOptional()
  maxDischargeRateKw?: number;
}

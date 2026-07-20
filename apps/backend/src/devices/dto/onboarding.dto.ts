import { IsString, IsEnum, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceType, CommunicationProtocol } from '@prisma/client';

export class DeviceHardwareSpecDto {
  @ApiProperty()
  @IsString()
  name: string;

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
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional({ enum: CommunicationProtocol, default: CommunicationProtocol.MQTT })
  @IsOptional()
  @IsEnum(CommunicationProtocol)
  protocol?: CommunicationProtocol;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gatewayId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  installationLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  commissioningDate?: Date;
}

export class RegisterProducerOnboardingDto {
  @ApiProperty()
  @IsString()
  plantName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plantType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  installedCapacityKw?: number;

  @ApiProperty({ type: [DeviceHardwareSpecDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceHardwareSpecDto)
  devices: DeviceHardwareSpecDto[];
}

export class RegisterConsumerSmartMeterDto {
  @ApiProperty()
  @IsString()
  meterName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meterNumber?: string;

  @ApiProperty()
  @IsString()
  serialNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ enum: CommunicationProtocol, default: CommunicationProtocol.MQTT })
  @IsOptional()
  @IsEnum(CommunicationProtocol)
  protocol?: CommunicationProtocol;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gatewayId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  installationAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phaseType?: string;
}

export class SubmitConnectionRequestDto {
  @ApiProperty()
  @IsString()
  plantId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smartMeterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestMessage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invitationCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  requestedPowerKw?: number;
}

export class ProcessConnectionApprovalDto {
  @ApiProperty()
  @IsString()
  connectionId: string;

  @ApiProperty({ description: 'APPROVE, REJECT, REQUEST_INFO, SUSPEND, DISCONNECT' })
  @IsString()
  action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND' | 'DISCONNECT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  allocatedPowerKw?: number;
}

export class SearchProducerPlantsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invitationCode?: string;
}

export class VerifyDeviceDto {
  @ApiProperty()
  @IsString()
  deviceId: string;
}

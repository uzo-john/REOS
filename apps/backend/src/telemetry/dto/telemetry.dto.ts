import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IngestTelemetryDto {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  voltage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  current?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  activePower?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  reactivePower?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  apparentPower?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  frequency?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  powerFactor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  energyImported?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  energyExported?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  batterySoc?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alarmStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  commQuality?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rawPayload?: any;
}

export class BatchTelemetryDto {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiProperty({ type: [IngestTelemetryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngestTelemetryDto)
  readings: IngestTelemetryDto[];
}

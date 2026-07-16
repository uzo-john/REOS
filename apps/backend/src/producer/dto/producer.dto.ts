import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, IsDateString, IsUUID } from 'class-validator';

export class RegisterPlantDto {
  @IsString()
  name: string;

  @IsString()
  type: string; // SOLAR, WIND, HYDRO, HYBRID, DIESEL, GAS, BATTERY_STORAGE

  @IsNumber()
  installedCapacityKw: number;

  @IsNumber()
  @IsOptional()
  availableCapacityKw?: number;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  gridConnectionStatus?: string; // CONNECTED, DISCONNECTED

  @IsString()
  @IsOptional()
  utilityDetails?: string;

  @IsString()
  @IsOptional()
  operatingStatus?: string; // OPERATIONAL, MAINTENANCE, OFFLINE

  @IsString()
  @IsOptional()
  ownerInfo?: string;
}

export class UpdatePlantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  installedCapacityKw?: number;

  @IsNumber()
  @IsOptional()
  availableCapacityKw?: number;

  @IsString()
  @IsOptional()
  gridConnectionStatus?: string;

  @IsString()
  @IsOptional()
  utilityDetails?: string;

  @IsString()
  @IsOptional()
  operatingStatus?: string;

  @IsString()
  @IsOptional()
  ownerInfo?: string;
}

export class CreateFeederDto {
  @IsString()
  name: string;

  @IsUUID()
  plantId: string;

  @IsNumber()
  capacityKw: number;
}

export class CreateZoneDto {
  @IsString()
  name: string;

  @IsUUID()
  plantId: string;
}

export class ConnectConsumerDto {
  @IsUUID()
  consumerId: string;

  @IsUUID()
  plantId: string;

  @IsUUID()
  @IsOptional()
  feederId?: string;

  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @IsString()
  @IsOptional()
  smartMeterId?: string;

  @IsNumber()
  @IsOptional()
  allocatedPowerKw?: number;
}

export class AllocateEnergyDto {
  @IsUUID()
  plantId: string;

  @IsString()
  targetType: string; // CONSUMER, GROUP, COMMUNITY, FEEDER, ZONE, GRID

  @IsString()
  targetId: string;

  @IsNumber()
  allocatedKw: number;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsString()
  @IsOptional()
  allocationType?: string; // MANUAL, AUTO, PRIORITY, DEMAND, TIME

  @IsDateString()
  @IsOptional()
  scheduledStart?: string;

  @IsDateString()
  @IsOptional()
  scheduledEnd?: string;

  @IsUUID()
  @IsOptional()
  feederId?: string;

  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @IsUUID()
  @IsOptional()
  connectionId?: string;
}

export class DispatchEnergyDto {
  @IsUUID()
  plantId: string;

  @IsString()
  @IsOptional()
  feederId?: string;

  @IsString()
  targetType: string; // CONSUMER, FEEDER, COMMUNITY

  @IsString()
  targetId: string;

  @IsNumber()
  allocatedKw: number;

  @IsNumber()
  @IsOptional()
  dispatchedKw?: number;

  @IsString()
  @IsOptional()
  scheduledTime?: string;
}

export class LogGridExportDto {
  @IsUUID()
  plantId: string;

  @IsNumber()
  exportedEnergyKwh: number;

  @IsNumber()
  @IsOptional()
  importedEnergyKwh?: number;

  @IsNumber()
  feedInTariff: number;
}

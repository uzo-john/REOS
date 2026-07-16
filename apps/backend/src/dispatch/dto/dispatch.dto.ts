import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  IsUUID,
  IsJSON,
} from 'class-validator';

export class SetPlantRuleDto {
  @IsUUID()
  plantId: string;

  @IsNumber()
  maxExportPowerKw: number;

  @IsNumber()
  maxDailyExportKwh: number;

  @IsNumber()
  batteryMinSoc: number;

  @IsNumber()
  batteryReserveSoc: number;

  @IsBoolean()
  gridExportAllowed: boolean;

  @IsBoolean()
  gridImportAllowed: boolean;

  @IsArray()
  priorityOrder: string[]; // e.g. ["CRITICAL", "CONSUMERS", "BATTERY", "GRID", "CURTAIL"]
}

export class TriggerOverrideDto {
  @IsUUID()
  plantId: string;

  @IsString()
  commandType: string; // SET_EXPORT_LIMIT, SET_BATTERY_CHARGE, CURTAIL_INVERTER, TRIGGER_SHUTDOWN

  @IsString()
  targetDevice: string;

  @IsJSON()
  parameters: string; // Stringified JSON parameters
}

export class LogCommandDto {
  @IsUUID()
  plantId: string;

  @IsString()
  commandType: string;

  @IsString()
  targetDevice: string;

  @IsOptional()
  parameters?: any;
}

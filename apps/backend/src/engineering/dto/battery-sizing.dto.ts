import { IsNumber, Min, Max, IsOptional } from 'class-validator';

export class BatterySizingDto {
  @IsNumber()
  @Min(0)
  dailyKwh: number;

  @IsNumber()
  @Min(1)
  systemVoltage: number;

  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  @IsOptional()
  dod?: number;

  @IsNumber()
  @Min(0.5)
  @IsOptional()
  autonomyDays?: number;

  @IsNumber()
  @Min(0.5)
  @Max(1.0)
  @IsOptional()
  efficiency?: number;

  @IsNumber()
  @Min(10)
  @IsOptional()
  singleBatteryAh?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  singleBatteryVoltage?: number;
}

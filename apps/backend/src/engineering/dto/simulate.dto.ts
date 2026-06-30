import { IsArray, IsNumber, Min, IsOptional } from 'class-validator';

export class SimulateDto {
  @IsArray()
  @IsNumber({}, { each: true })
  hourlySolarGenKwh: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  hourlyLoadDemandKwh: number[];

  @IsNumber()
  @Min(0)
  batteryCapacityKwh: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  batteryMaxPowerKw?: number;
}

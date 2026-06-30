import { IsNumber, Min, IsOptional } from 'class-validator';

export class InverterSizingDto {
  @IsNumber()
  @Min(0)
  loadMaxPowerW: number;

  @IsNumber()
  @Min(0)
  loadSurgePowerW: number;

  @IsNumber()
  @Min(1.0)
  @IsOptional()
  safetyMargin?: number;
}

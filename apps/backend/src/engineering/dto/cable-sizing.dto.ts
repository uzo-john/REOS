import { IsNumber, Min, IsOptional } from 'class-validator';

export class CableSizingDto {
  @IsNumber()
  @Min(0)
  currentA: number;

  @IsNumber()
  @Min(0)
  lengthMeters: number;

  @IsNumber()
  @Min(1)
  voltageV: number;

  @IsNumber()
  @Min(0.1)
  areaMm2: number;

  @IsNumber()
  @IsOptional()
  resistivity?: number;
}

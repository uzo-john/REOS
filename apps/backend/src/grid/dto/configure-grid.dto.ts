import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class ConfigureGridDto {
  @IsString()
  projectId: string;

  @IsString()
  country: string;

  @IsString()
  utilityProvider: string;

  @IsNumber()
  @Min(0)
  importTariffRate: number;

  @IsNumber()
  @Min(0)
  exportTariffRate: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  gridExportLimitKw?: number;
}

import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class CalculateRoiDto {
  @IsString()
  projectId: string;

  @IsNumber()
  @Min(0)
  equipmentCost: number;

  @IsNumber()
  @Min(0)
  installationCost: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  laborCost?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxes?: number;

  @IsNumber()
  @Min(0)
  annualSavings: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  annualOpex?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  lifespanYrs?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountRate?: number;
}

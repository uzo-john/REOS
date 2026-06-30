import { IsNumber, Min, IsOptional } from 'class-validator';

export class FinancialAnalysisDto {
  @IsNumber()
  @Min(0)
  capex: number;

  @IsNumber()
  @Min(0)
  annualSavings: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  opex?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  lifespanYrs?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountRate?: number;
}

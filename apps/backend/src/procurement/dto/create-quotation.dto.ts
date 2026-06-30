import { IsString, IsArray, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateQuotationDto {
  @IsString()
  projectId: string;

  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @IsString()
  @IsOptional()
  installerId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  financingYears?: number;
}

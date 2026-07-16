import {
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ApplianceItemDto {
  @IsNumber()
  @Min(0)
  powerW: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsArray()
  @IsNumber({}, { each: true })
  hoursOn: number[];
}

export class LoadAnalysisDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplianceItemDto)
  appliances: ApplianceItemDto[];

  @IsNumber()
  @IsOptional()
  demandFactor?: number;

  @IsNumber()
  @IsOptional()
  diversityFactor?: number;
}

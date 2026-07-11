import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateBillDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiProperty()
  @IsDateString()
  billingPeriodStart: string;

  @ApiProperty()
  @IsDateString()
  billingPeriodEnd: string;

  @ApiProperty()
  @IsNumber()
  energyConsumedKwh: number;

  @ApiPropertyOptional({ default: 0.0 })
  @IsOptional()
  @IsNumber()
  energyExportedKwh?: number;

  @ApiProperty()
  @IsNumber()
  tariffRate: number;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class PayBillDto {
  @ApiPropertyOptional({ default: 'PAYSTACK' })
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gatewayRef?: string;
}

import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TradeType } from '@prisma/client';

export class CreateP2PSessionDto {
  @ApiProperty({ description: 'Price in local currency per kWh' })
  @IsNumber()
  offerPricePerKwh: number;

  @ApiProperty({ description: 'Total energy amount in kWh' })
  @IsNumber()
  energyAmountKwh: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minimumKwh?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class BuyEnergyDto {
  @ApiProperty()
  @IsNumber()
  energyKwh: number;
}

export class CreateOrderDto {
  @ApiProperty({ enum: TradeType })
  @IsEnum(TradeType)
  type: TradeType;

  @ApiProperty()
  @IsNumber()
  energyKwh: number;

  @ApiProperty()
  @IsNumber()
  pricePerKwh: number;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

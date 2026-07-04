import { IsEmail, IsString, IsNumber, IsEnum, IsOptional, IsPositive } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsNumber()
  @IsPositive()
  tariffRate: number;

  @IsEnum(['PREPAID', 'POSTPAID', 'HYBRID'])
  @IsOptional()
  billingCycle?: 'PREPAID' | 'POSTPAID' | 'HYBRID';
}

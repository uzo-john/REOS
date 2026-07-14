import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class TopUpWalletDto {
  @ApiProperty()
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({ default: 'PAYSTACK' })
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class TransferFundsDto {
  @ApiProperty()
  @IsString()
  recipientWalletId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class WithdrawFundsDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  bankCode: string;

  @ApiProperty()
  @IsString()
  accountNumber: string;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;
}

// ── Escrow / Energy Purchase ─────────────────────────────────────

export class BuyEnergyDto {
  @ApiProperty({ description: 'The P2P session / offer ID to buy from' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Energy amount in kWh to purchase' })
  @IsNumber()
  @Min(0.1)
  energyKwh: number;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class VerifyEscrowDto {
  @ApiProperty({ description: 'kWh confirmed delivered by smart meter' })
  @IsNumber()
  deliveredKwh: number;

  @ApiPropertyOptional({ description: 'Smart meter verification reference' })
  @IsOptional()
  @IsString()
  verificationRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ── Withdrawal ───────────────────────────────────────────────────

export class RequestWithdrawalDto {
  @ApiProperty()
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiProperty()
  @IsString()
  bankName: string;

  @ApiProperty()
  @IsString()
  accountNumber: string;

  @ApiProperty()
  @IsString()
  accountName: string;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class ProcessWithdrawalDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;
}

// ── Refund ───────────────────────────────────────────────────────

export class RequestRefundDto {
  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ default: 'FULL', enum: ['FULL', 'PARTIAL'] })
  @IsOptional()
  @IsEnum(['FULL', 'PARTIAL'])
  type?: 'FULL' | 'PARTIAL';

  @ApiPropertyOptional({ description: 'Partial refund amount (NGN)' })
  @IsOptional()
  @IsNumber()
  partialAmount?: number;
}

// ── Dispute ──────────────────────────────────────────────────────

export class OpenDisputeDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ type: [String], description: 'File URL evidence' })
  @IsOptional()
  @IsArray()
  evidence?: string[];
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ['RESOLVED_FOR_BUYER', 'RESOLVED_FOR_SELLER', 'CLOSED'] })
  @IsEnum(['RESOLVED_FOR_BUYER', 'RESOLVED_FOR_SELLER', 'CLOSED'])
  resolution: 'RESOLVED_FOR_BUYER' | 'RESOLVED_FOR_SELLER' | 'CLOSED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class DisputeMessageDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  attachments?: string[];
}

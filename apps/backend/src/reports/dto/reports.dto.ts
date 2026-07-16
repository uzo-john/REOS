import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';

export class RequestReportDto {
  @ApiProperty({ description: 'Report Title' })
  @IsString()
  title: string;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Optional custom parameters like startDate, endDate',
  })
  @IsOptional()
  @IsObject()
  parameters?: any;
}

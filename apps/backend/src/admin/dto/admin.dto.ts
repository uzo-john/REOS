import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSystemSettingDto {
  @ApiProperty()
  @IsString()
  value: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class CreateSystemSettingDto extends UpdateSystemSettingDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiPropertyOptional({ default: 'STRING' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ default: 'GENERAL' })
  @IsOptional()
  @IsString()
  category?: string;
}

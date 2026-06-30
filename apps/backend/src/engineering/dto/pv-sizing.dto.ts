import { IsNumber, Min, Max, IsOptional } from 'class-validator';

export class PvSizingDto {
  @IsNumber()
  @Min(0)
  dailyKwh: number;

  @IsNumber()
  @Min(0)
  peakSunHours: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  losses?: number;

  @IsNumber()
  @Min(0.1)
  @Max(1)
  @IsOptional()
  tempDerating?: number;

  @IsNumber()
  @Min(50)
  @IsOptional()
  panelRatingW?: number;
}

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EngineeringService } from './engineering.service';
import { LoadAnalysisDto } from './dto/load-analysis.dto';
import { PvSizingDto } from './dto/pv-sizing.dto';
import { BatterySizingDto } from './dto/battery-sizing.dto';
import { InverterSizingDto } from './dto/inverter-sizing.dto';
import { CableSizingDto } from './dto/cable-sizing.dto';
import { FinancialAnalysisDto } from './dto/financial-analysis.dto';
import { SimulateDto } from './dto/simulate.dto';

@Controller('engineering')
export class EngineeringController {
  constructor(private readonly engineeringService: EngineeringService) {}

  @Post('load-analysis')
  @HttpCode(HttpStatus.OK)
  runLoadAnalysis(@Body() dto: LoadAnalysisDto) {
    return this.engineeringService.runLoadAnalysis(dto);
  }

  @Post('pv-sizing')
  @HttpCode(HttpStatus.OK)
  runPvSizing(@Body() dto: PvSizingDto) {
    return this.engineeringService.runPvSizing(dto);
  }

  @Post('battery-sizing')
  @HttpCode(HttpStatus.OK)
  runBatterySizing(@Body() dto: BatterySizingDto) {
    return this.engineeringService.runBatterySizing(dto);
  }

  @Post('inverter-sizing')
  @HttpCode(HttpStatus.OK)
  runInverterSizing(@Body() dto: InverterSizingDto) {
    return this.engineeringService.runInverterSizing(dto);
  }

  @Post('cable-sizing')
  @HttpCode(HttpStatus.OK)
  runCableSizing(@Body() dto: CableSizingDto) {
    return this.engineeringService.runCableSizing(dto);
  }

  @Post('financial-analysis')
  @HttpCode(HttpStatus.OK)
  runFinancialAnalysis(@Body() dto: FinancialAnalysisDto) {
    return this.engineeringService.runFinancialAnalysis(dto);
  }

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  runSimulation(@Body() dto: SimulateDto) {
    return this.engineeringService.runSimulation(dto);
  }
}

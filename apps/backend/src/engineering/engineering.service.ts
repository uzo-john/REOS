import { Injectable } from '@nestjs/common';
import { 
  calculateLoadProfile, 
  sizeSolarPV, 
  sizeBattery, 
  sizeInverter, 
  calculateVoltageDrop, 
  calculateFinancials, 
  runEnergySimulation,
  LoadProfileResult,
  SolarSizingResult,
  BatterySizingResult,
  InverterSizingResult,
  CableSizingResult,
  FinancialResult,
  SimulationResult
} from '@reos/engineering';
import { LoadAnalysisDto } from './dto/load-analysis.dto';
import { PvSizingDto } from './dto/pv-sizing.dto';
import { BatterySizingDto } from './dto/battery-sizing.dto';
import { InverterSizingDto } from './dto/inverter-sizing.dto';
import { CableSizingDto } from './dto/cable-sizing.dto';
import { FinancialAnalysisDto } from './dto/financial-analysis.dto';
import { SimulateDto } from './dto/simulate.dto';

@Injectable()
export class EngineeringService {
  
  runLoadAnalysis(dto: LoadAnalysisDto): LoadProfileResult {
    return calculateLoadProfile(
      dto.appliances,
      dto.demandFactor ?? 1.0,
      dto.diversityFactor ?? 1.0
    );
  }

  runPvSizing(dto: PvSizingDto): SolarSizingResult {
    return sizeSolarPV(
      dto.dailyKwh,
      dto.peakSunHours,
      dto.losses ?? 0.15,
      dto.tempDerating ?? 0.9,
      dto.panelRatingW ?? 400
    );
  }

  runBatterySizing(dto: BatterySizingDto): BatterySizingResult {
    return sizeBattery(
      dto.dailyKwh,
      dto.systemVoltage,
      dto.dod ?? 0.8,
      dto.autonomyDays ?? 1.0,
      dto.efficiency ?? 0.95,
      dto.singleBatteryAh ?? 200,
      dto.singleBatteryVoltage ?? 12
    );
  }

  runInverterSizing(dto: InverterSizingDto): InverterSizingResult {
    return sizeInverter(
      dto.loadMaxPowerW,
      dto.loadSurgePowerW,
      dto.safetyMargin ?? 1.25
    );
  }

  runCableSizing(dto: CableSizingDto): CableSizingResult {
    return calculateVoltageDrop(
      dto.currentA,
      dto.lengthMeters,
      dto.voltageV,
      dto.areaMm2,
      dto.resistivity ?? 1.72e-8
    );
  }

  runFinancialAnalysis(dto: FinancialAnalysisDto): FinancialResult {
    return calculateFinancials(
      dto.capex,
      dto.annualSavings,
      dto.opex ?? 0,
      dto.lifespanYrs ?? 25,
      dto.discountRate ?? 0.1
    );
  }

  runSimulation(dto: SimulateDto): SimulationResult {
    return runEnergySimulation(
      dto.hourlySolarGenKwh,
      dto.hourlyLoadDemandKwh,
      dto.batteryCapacityKwh,
      dto.batteryMaxPowerKw ?? 3.0
    );
  }
}

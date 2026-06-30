export type UserRole = 'CUSTOMER' | 'INSTALLER' | 'ENGINEER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appliance {
  id: string;
  name: string;
  defaultPower: number;
  category: string;
  isCustom: boolean;
}

export interface ProjectAppliance {
  id: string;
  projectId: string;
  applianceId: string;
  appliance?: Appliance;
  quantity: number;
  hoursOnDay: number[]; // 24 numbers representing load factor/multiplier per hour
}

export interface SolarPanel {
  id: string;
  manufacturer: string;
  model: string;
  technology: string; // e.g., Monocrystalline, Polycrystalline
  efficiency: number; // percentage (e.g. 21.5)
  tempCoefficientPmax: number; // %/°C (e.g. -0.35)
  voc: number; // Open Circuit Voltage
  isc: number; // Short Circuit Current
  vmp: number; // Max Power Voltage
  imp: number; // Max Power Current
  pmax: number; // Nominal max power (Watts)
  warrantyYrs: number;
  degradationRate: number; // annual degradation rate %
}

export interface Battery {
  id: string;
  manufacturer: string;
  model: string;
  chemistry: 'LFP' | 'NMC' | 'AGM' | 'GEL' | 'FLOODED_LEAD_ACID';
  capacityAh: number;
  voltage: number;
  cycleLife: number;
  dod: number; // depth of discharge (0.0 to 1.0)
  chargeEfficiency: number;
  dischargeEfficiency: number;
}

export interface Inverter {
  id: string;
  manufacturer: string;
  model: string;
  type: 'HYBRID' | 'GRID_TIED' | 'OFF_GRID';
  ratedPowerKw: number;
  surgePowerKw: number;
  mpptInputs: number;
  efficiency: number;
  minDcVoltage: number;
  maxDcVoltage: number;
}

export interface ProjectDesign {
  id: string;
  projectId: string;
  pvModuleQty?: number | null;
  pvTotalPower?: number | null;
  batteryQty?: number | null;
  inverterPowerRating?: number | null;
  cableSizeMm2?: number | null;
  fuseRatingAmps?: number | null;
  circuitBreakerAmps?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimulationResult {
  id: string;
  projectId: string;
  hourlySolarGen: number[];
  hourlyLoadDemand: number[];
  hourlyBatterySoC: number[];
  totalCost: number;
  paybackPeriodYrs: number;
  roiPercentage: number;
  exportedGridKwh: number;
  gridRevenueEarned: number;
  createdAt: Date;
}

export interface ReportMetadata {
  id: string;
  projectId: string;
  name: string;
  type: 'ENGINEERING' | 'QUOTATION' | 'BOM' | 'FINANCIAL' | 'SIMULATION';
  fileUrl: string;
  createdAt: Date;
}

export interface AIResponse {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

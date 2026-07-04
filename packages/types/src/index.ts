export type UserRole = 'CUSTOMER' | 'SYSTEM_OWNER' | 'CONSUMER' | 'INSTALLER' | 'ENGINEER' | 'ADMIN' | 'PLANT_OPERATOR';

export interface PlantConfig {
  plantName: string;
  plantCapacityKwp: number;
  numberOfInverters: number;
  gridConnectionType: 'GRID_TIED' | 'HYBRID' | 'ISLAND';
  numberOfNeighborSubscribers: number;
  batteryReservePercent: number;  // minimum battery % before exporting to grid
  neighborMaxShareKw: number;     // max kW per neighbor subscriber
  gridExportCapPercent: number;   // % of output to cap grid export at
  gridExportAllowed: boolean;     // allow export to public grid
  tariffPerKwh: number;
  currency: string;
}

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

export interface ConsumerInvitation {
  id: string;
  invitationCode: string;
  supplierId: string;
  email?: string | null;
  phoneNumber?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

export interface EnergyContract {
  id: string;
  supplierId: string;
  consumerId: string;
  connectionStatus: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  contractDate: Date;
  tariffRate: number;
  billingCycle: 'PREPAID' | 'POSTPAID' | 'HYBRID';
  balance: number;
  gatewayId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  manufacturer?: string | null;
  model?: string | null;
  firmwareVersion?: string | null;
  protocol: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  signalStrength?: number | null;
  communicationQuality?: number | null;
  lastCommTime: Date;
  ownerId?: string | null;
  projectId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Telemetry {
  id: string;
  deviceId: string;
  timestamp: Date;
  voltage?: number | null;
  current?: number | null;
  activePower?: number | null;
  reactivePower?: number | null;
  apparentPower?: number | null;
  frequency?: number | null;
  powerFactor?: number | null;
  energyImported?: number | null;
  energyExported?: number | null;
  batterySoc?: number | null;
  status?: string | null;
  alarmStatus?: string | null;
  commQuality?: number | null;
}

export interface Invoice {
  id: string;
  contractId: string;
  amount: number;
  tariffRate: number;
  energyReceivedKwh: number;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  pdfUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  contractId: string;
  type: 'PREPAID_PURCHASE' | 'BILL_PAYMENT' | 'CREDIT_TRANSFER';
  amount: number;
  currency: string;
  paymentGateway?: string | null;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reference?: string | null;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ALERT' | 'BILLING' | 'SYSTEM' | 'INFO';
  read: boolean;
  createdAt: Date;
}


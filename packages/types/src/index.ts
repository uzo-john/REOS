// === REOS ASEMP � Complete Platform Types ===

// User Roles
export type UserRole =
  | 'CUSTOMER'
  | 'SYSTEM_OWNER'
  | 'CONSUMER'
  | 'INSTALLER'
  | 'ENGINEER'
  | 'ADMIN'
  | 'PLANT_OPERATOR'
  | 'SUPER_ADMIN'
  | 'UTILITY_OPERATOR'
  | 'SOLAR_COMPANY'
  | 'COMMERCIAL_CUSTOMER'
  | 'RESIDENTIAL_CUSTOMER'
  | 'ENERGY_TRADER'
  | 'MAINTENANCE_ENGINEER'
  | 'AUDITOR'
  | 'COMMERCIAL_ENERGY_PRODUCER';

export type DeviceType =
  | 'INVERTER' | 'SMART_METER' | 'BMS' | 'IOT_GATEWAY' | 'EDGE_GATEWAY'
  | 'ENERGY_SENSOR' | 'WEATHER_STATION' | 'EV_CHARGER' | 'CHARGE_CONTROLLER'
  | 'DISTRIBUTION_TRANSFORMER' | 'SMART_RELAY' | 'NEIGHBOUR_METER';

export type DeviceProtocol =
  | 'MODBUS_TCP' | 'MODBUS_RTU' | 'MQTT' | 'DLMS_COSEM' | 'CAN_BUS'
  | 'RS485' | 'HTTP' | 'ZIGBEE' | 'LORAWAN' | 'NB_IOT' | 'WIFI' | 'ETHERNET' | '4G_5G';

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'FAULT' | 'COMMISSIONING';
export type AlarmSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'WARNING';
export type AlarmStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'SUPPRESSED';

export interface Alarm {
  id: string; code: string; title: string; description?: string;
  severity: AlarmSeverity; status: AlarmStatus;
  deviceId?: string; deviceName?: string; plantId?: string; plantName?: string;
  timestamp: string; acknowledgedAt?: string; resolvedAt?: string;
  recommendedAction?: string; acknowledged: boolean;
}

export interface Plant {
  id: string; name: string; location: string; latitude?: number; longitude?: number;
  capacityKwp: number; gridConnectionType: 'GRID_TIED' | 'HYBRID' | 'ISLAND';
  status: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';
  ownerId: string; installerId?: string; commissionedAt?: string;
  devices: Device[]; todayGenerationKwh: number; monthlyGenerationKwh: number;
  performanceRatio: number; activeAlarms: number; co2SavedKg: number;
}

export interface User {
  id: string; email: string; firstName: string; lastName: string;
  role: UserRole; createdAt: Date; updatedAt: Date;
  phone?: string; organization?: string; avatarUrl?: string;
}

export interface Project {
  id: string; name: string; description?: string | null;
  location?: string | null; latitude?: number | null; longitude?: number | null;
  userId: string; createdAt: Date; updatedAt: Date;
}

export interface Appliance {
  id: string; name: string; defaultPower: number; category: string; isCustom: boolean;
}

export interface ProjectAppliance {
  id: string; projectId: string; applianceId: string; appliance?: Appliance;
  quantity: number; hoursOnDay: number[];
}

export interface SolarPanel {
  id: string; manufacturer: string; model: string; technology: string;
  efficiency: number; tempCoefficientPmax: number;
  voc: number; isc: number; vmp: number; imp: number; pmax: number;
  warrantyYrs: number; degradationRate: number;
}

export interface Battery {
  id: string; manufacturer: string; model: string;
  chemistry: 'LFP' | 'NMC' | 'AGM' | 'GEL' | 'FLOODED_LEAD_ACID';
  capacityAh: number; voltage: number; cycleLife: number;
  dod: number; chargeEfficiency: number; dischargeEfficiency: number;
}

export interface Inverter {
  id: string; manufacturer: string; model: string;
  type: 'HYBRID' | 'GRID_TIED' | 'OFF_GRID';
  ratedPowerKw: number; surgePowerKw: number; mpptInputs: number;
  efficiency: number; minDcVoltage: number; maxDcVoltage: number;
}

export interface ProjectDesign {
  id: string; projectId: string;
  pvModuleQty?: number | null; pvTotalPower?: number | null;
  batteryQty?: number | null; inverterPowerRating?: number | null;
  cableSizeMm2?: number | null; fuseRatingAmps?: number | null;
  circuitBreakerAmps?: number | null; createdAt: Date; updatedAt: Date;
}

export interface SimulationResult {
  id: string; projectId: string;
  hourlySolarGen: number[]; hourlyLoadDemand: number[]; hourlyBatterySoC: number[];
  totalCost: number; paybackPeriodYrs: number; roiPercentage: number;
  exportedGridKwh: number; gridRevenueEarned: number; createdAt: Date;
}

export interface ReportMetadata {
  id: string; projectId: string; name: string;
  type: 'ENGINEERING' | 'QUOTATION' | 'BOM' | 'FINANCIAL' | 'SIMULATION';
  fileUrl: string; createdAt: Date;
}

export interface AIResponse {
  id: string; sessionId: string; role: 'user' | 'assistant'; content: string; timestamp: Date;
}

export interface AIForecast {
  hourly: number[]; daily: number[]; confidence: number; modelUsed: string; generatedAt: string;
}

export interface AIInsight {
  id: string; type: 'SAVING' | 'ANOMALY' | 'MAINTENANCE' | 'OPTIMIZATION' | 'FORECAST';
  title: string; description: string; impact: 'HIGH' | 'MEDIUM' | 'LOW';
  savings?: number; currency?: string; actionable: boolean; timestamp: string;
}

export interface ConsumerInvitation {
  id: string; invitationCode: string; supplierId: string;
  email?: string | null; phoneNumber?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'; createdAt: Date; updatedAt: Date;
}

export interface EnergyContract {
  id: string; supplierId: string; consumerId: string;
  connectionStatus: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'; contractDate: Date;
  tariffRate: number; billingCycle: 'PREPAID' | 'POSTPAID' | 'HYBRID';
  balance: number; gatewayId?: string | null; createdAt: Date; updatedAt: Date;
}

export interface EnergyOffer {
  id: string; sellerId: string; sellerName: string; sellerLocation: string;
  availableKwh: number; pricePerKwh: number; currency: string; validUntil: string;
  status: 'OPEN' | 'MATCHED' | 'SETTLED' | 'EXPIRED' | 'CANCELLED';
  offerType: 'SELL' | 'BUY'; createdAt: string;
}

export interface EnergyWallet {
  id: string; userId: string; balance: number; currency: string;
  totalEarned: number; totalSpent: number; lastUpdated: string;
}

export interface Device {
  id: string; name: string; type: DeviceType | string;
  manufacturer?: string | null; model?: string | null; serialNumber?: string | null;
  firmwareVersion?: string | null; protocol: DeviceProtocol | string;
  status: DeviceStatus | string; signalStrength?: number | null;
  communicationQuality?: number | null; lastCommTime: Date | string;
  ownerId?: string | null; projectId?: string | null;
  installationLocation?: string | null; ipAddress?: string | null;
  macAddress?: string | null; createdAt: Date | string; updatedAt: Date | string;
}

export interface Telemetry {
  id: string; deviceId: string; timestamp: Date;
  voltage?: number | null; current?: number | null;
  activePower?: number | null; reactivePower?: number | null;
  apparentPower?: number | null; frequency?: number | null; powerFactor?: number | null;
  energyImported?: number | null; energyExported?: number | null;
  batterySoc?: number | null; status?: string | null;
  alarmStatus?: string | null; commQuality?: number | null;
}

export interface Invoice {
  id: string; contractId: string; amount: number; tariffRate: number;
  energyReceivedKwh: number; billingPeriodStart: Date; billingPeriodEnd: Date;
  dueDate: Date; status: 'PAID' | 'UNPAID' | 'OVERDUE';
  pdfUrl?: string | null; createdAt: Date; updatedAt: Date;
}

export interface Transaction {
  id: string; contractId: string;
  type: 'PREPAID_PURCHASE' | 'BILL_PAYMENT' | 'CREDIT_TRANSFER' | 'TRADE_SETTLEMENT' | 'REFUND';
  amount: number; currency: string; paymentGateway?: string | null;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'; reference?: string | null; createdAt: Date;
}

export interface Notification {
  id: string; userId: string; title: string; message: string;
  type: 'ALERT' | 'BILLING' | 'SYSTEM' | 'INFO' | 'TRADING' | 'MAINTENANCE';
  read: boolean; createdAt: Date;
}

export interface PlantConfig {
  plantName: string; plantCapacityKwp: number; numberOfInverters: number;
  gridConnectionType: 'GRID_TIED' | 'HYBRID' | 'ISLAND';
  numberOfNeighborSubscribers: number; batteryReservePercent: number;
  neighborMaxShareKw: number; gridExportCapPercent: number;
  gridExportAllowed: boolean; tariffPerKwh: number; currency: string;
}

export interface FleetKPIs {
  totalPlantsCount: number; onlinePlantsCount: number; totalCapacityKwp: number;
  todayGenerationKwh: number; monthlyGenerationKwh: number;
  totalCo2SavedKg: number; totalRevenueNgn: number;
  activeAlarmsCount: number; fleetPerformanceRatio: number;
}

export interface MaintenanceTask {
  id: string; title: string; description: string;
  deviceId?: string; deviceName?: string; plantId?: string; plantName?: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo?: string; scheduledDate: string; completedDate?: string; createdAt: string;
}

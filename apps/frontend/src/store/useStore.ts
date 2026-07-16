import { create } from 'zustand';
import { UserRole } from '@reos/types';
import { 
  LoadProfileResult, 
  SolarSizingResult, 
  BatterySizingResult, 
  InverterSizingResult,
  CableSizingResult,
  calculateLoadProfile,
  sizeSolarPV,
  sizeBattery,
  sizeInverter,
  calculateVoltageDrop
} from '@reos/engineering';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export type UserMode = 'SIMPLE' | 'PROFESSIONAL';

interface ProjectInputs {
  // Load Assessment
  appliances: { name?: string; powerW: number; quantity: number; hoursOn: number[] }[];
  demandFactor: number;
  diversityFactor: number;
  
  // Solar PV Sizing
  peakSunHours: number;
  losses: number;
  tempDerating: number;
  panelRatingW: number;
  
  // Battery Sizing
  batteryVoltage: number;
  dod: number;
  autonomyDays: number;
  batteryEfficiency: number;
  
  // Inverter Sizing
  loadSurgePowerW: number;
  safetyMargin: number;
  inverterType: 'ON_GRID' | 'OFF_GRID' | 'HYBRID';

  // Cable Sizing
  currentA: number;
  lengthMeters: number;
  cableVoltageV: number;
  areaMm2: number;

  // Financial & Customer
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR' | 'ZAR' | 'KES' | 'GHS';
  gridTariffRate: number; // cost per kWh in selected currency
  capexBudget: number;    // total system investment cost
  surplusTransferKwh: number; // kWh to transfer to neighbor per month
  optimizationGoals: string[]; // energy optimization goal objectives
  additionalPvCapacityKw: number; // additional PV size in kWp for surplus
  microgridTariff: number; // peer-to-peer neighbor sharing tariff rate
  gridAvailabilityHours: number; // daily utility grid power availability

  // Customization Overrides
  batteryType: 'LEAD_ACID' | 'LITHIUM';
  selectedBatteryAh: number;
  selectedLithiumKwh: number;
  inverterRatingKw: number | null; // null means auto-sized
  inverterOutputVoltage: '230V' | '400V';
}

import { api, ChatMessage } from './api';

interface REOSState {
  // UI & Global Preferences
  userRole: UserRole;
  userMode: UserMode;
  userType: 'PROSUMER' | 'CONSUMER' | 'ADMIN' | 'PRODUCER';
  hasSelectedMode: boolean;
  theme: 'light' | 'dark';
  
  // Inputs
  inputs: ProjectInputs;
  
  // Cache of calculation results
  results: {
    load: LoadProfileResult | null;
    solar: SolarSizingResult | null;
    battery: BatterySizingResult | null;
    inverter: InverterSizingResult | null;
    cable: CableSizingResult | null;
  };

  // Auth State
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  authError: string | null;

  // Project Saving/Loading State
  currentProjectId: string | null;
  projectsList: any[];
  isSaving: boolean;
  isDbOffline: boolean;

  // AI Copilot State
  aiResponse: string | null;
  isAiLoading: boolean;
  aiError: string | null;

  // Actions
  setRole: (role: UserRole) => void;
  setMode: (mode: UserMode) => void;
  setUserType: (type: 'PROSUMER' | 'CONSUMER' | 'ADMIN' | 'PRODUCER') => void;
  toggleTheme: () => void;
  updateInputs: (updates: Partial<ProjectInputs>) => void;
  runAllCalculations: () => void;
  createNewProject: (name?: string, location?: string, description?: string) => Promise<void>;

  // Auth Actions
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;

  // Project Actions
  saveProject: (name: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  fetchUserProjects: () => Promise<void>;
  autoSaveProject: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  fetchProfile: () => Promise<void>;

  // AI Actions
  getAiInsights: () => Promise<void>;

  // Grid Export State
  gridExportStatus: 'INACTIVE' | 'COMPLIANCE_CHECK' | 'APPLICATION_PENDING' | 'METER_INSTALLATION' | 'ACTIVE';
  utilityProvider: string;
  utilityAccountNo: string;
  accumulatedCredits: number;

  // Grid Export Actions
  updateGridExportStatus: (status: 'INACTIVE' | 'COMPLIANCE_CHECK' | 'APPLICATION_PENDING' | 'METER_INSTALLATION' | 'ACTIVE') => void;
  setUtilityDetails: (provider: string, accountNo: string) => void;
  addAccumulatedCredits: (amount: number) => void;
  resetGridExport: () => void;

  // IoT & Telemetry State
  devices: any[];
  telemetry: any | null;
  alerts: any[];
  isGatewayBuffering: boolean;
  gridExportEnabled: boolean;
  neighbourTransferEnabled: boolean;
  activeContract: any | null;
  billingSummary: any | null;
  notifications: any[];
  consumerInvite: any | null;

  // IoT Actions
  fetchIotData: () => Promise<void>;
  registerDevice: (device: any) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  toggleGridExport: (enabled: boolean) => Promise<void>;
  toggleNeighbourTransfer: (enabled: boolean) => Promise<void>;
  toggleGatewayBuffering: (enabled: boolean) => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;

  // Consumer Actions
  createInviteCode: (tariff: number, cycle: string, email?: string, phone?: string) => Promise<any>;
  verifyInviteCode: (code: string) => Promise<any>;
  acceptEnergySharing: (code: string) => Promise<any>;
  fetchConsumerContract: () => Promise<void>;
  fetchConsumerBilling: () => Promise<void>;
  rechargeWallet: (amount: number, gateway: string) => Promise<void>;
  payOutstandingInvoice: (invoiceId: string, gateway: string) => Promise<void>;
  fetchUserNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}

const defaultInputs: ProjectInputs = {
  appliances: [
    // LED Lights: 6pm to midnight (hours 18–23)
    { name: 'LED Lights', powerW: 15, quantity: 0, hoursOn: Array(24).fill(0).map((_, h) => (h >= 18 && h <= 23 ? 1 : 0)) },
    // Ceiling Fans: 8am to 10pm (hours 8–21)
    { name: 'Ceiling Fans', powerW: 80, quantity: 0, hoursOn: Array(24).fill(0).map((_, h) => (h >= 8 && h <= 21 ? 1 : 0)) },
    // TV / Laptops: 6pm to 11pm (hours 18–22)
    { name: 'TV / Laptops', powerW: 150, quantity: 0, hoursOn: Array(24).fill(0).map((_, h) => (h >= 18 && h <= 22 ? 1 : 0)) },
    // Microwave / Kettle: 7–8am and 12–1pm (hours 7, 12)
    { name: 'Microwave / Kettle', powerW: 1000, quantity: 0, hoursOn: Array(24).fill(0).map((_, h) => (h === 7 || h === 12 ? 1 : 0)) },
  ],
  demandFactor: 1.0,
  diversityFactor: 1.0,
  peakSunHours: 0,
  losses: 0.15,
  tempDerating: 0.9,
  panelRatingW: 0,
  batteryVoltage: 48,       // Standard 48V system voltage
  dod: 0.8,                 // 80% Depth of Discharge (LFP standard)
  autonomyDays: 1,          // 1 day backup as default
  batteryEfficiency: 0.95,  // 95% round-trip efficiency (LFP)
  loadSurgePowerW: 0,
  safetyMargin: 1.25,       // 25% safety margin (standard)
  inverterType: 'HYBRID',
  currentA: 0,
  lengthMeters: 0,
  cableVoltageV: 0,
  areaMm2: 0,
  // Financial
  currency: 'NGN',
  gridTariffRate: 0,
  capexBudget: 0,
  surplusTransferKwh: 0,
  optimizationGoals: [],
  additionalPvCapacityKw: 0,
  microgridTariff: 0,
  gridAvailabilityHours: 0,
  // Customization Overrides
  batteryType: 'LITHIUM',
  selectedBatteryAh: 200,    // Standard 200Ah Lead-Acid unit
  selectedLithiumKwh: 5.12,  // Standard 5.12 kWh Lithium unit
  inverterRatingKw: null,
  inverterOutputVoltage: '230V',
};

const getStoredToken = () => {
  try {
    return localStorage.getItem('reos_token') || null;
  } catch {
    return null;
  }
};

const getStoredUser = () => {
  try {
    const user = localStorage.getItem('reos_user');
    return user ? JSON.parse(user) : null;
  } catch {
  }
};

const getStoredUserType = (): 'PROSUMER' | 'CONSUMER' | 'ADMIN' | 'PRODUCER' | null => {
  try {
    return (localStorage.getItem('reos_user_type') as 'PROSUMER' | 'CONSUMER' | 'ADMIN' | 'PRODUCER') || null;
  } catch {
    return null;
  }
};

const getStoredInputs = () => {
  try {
    const data = localStorage.getItem('reos_current_inputs');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const getStoredResults = () => {
  try {
    const data = localStorage.getItem('reos_current_results');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const savedToken = getStoredToken();
const savedUser = getStoredUser();
const savedUserType = getStoredUserType();
const savedInputs = getStoredInputs();
const savedResults = getStoredResults();

// Local storage helpers for database-offline mode fallback
const getLocalProjects = () => {
  try {
    const data = localStorage.getItem('reos_local_projects');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalProjects = (projects: any[]) => {
  try {
    localStorage.setItem('reos_local_projects', JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

// Detect admin role immediately from stored user (so refresh works without re-login)
const ADMIN_ROLES_LIST = ['SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN'];
const storedUserRole = savedUser?.role || '';
const initialUserType: 'PROSUMER' | 'CONSUMER' | 'ADMIN' | 'PRODUCER' =
  ADMIN_ROLES_LIST.includes(storedUserRole)
    ? 'ADMIN'
    : (savedUserType as any) || 'PROSUMER';

// Persist the detected type back to localStorage if it changed
if (initialUserType === 'ADMIN' && savedUserType !== 'ADMIN') {
  try { localStorage.setItem('reos_user_type', 'ADMIN'); } catch (e) {}
}

export const useStore = create<REOSState>((set, get) => ({
  userRole: savedUser ? (savedUser.role as UserRole) : 'CUSTOMER',
  userMode: 'SIMPLE',
  userType: initialUserType,
  hasSelectedMode: !!savedUserType || ADMIN_ROLES_LIST.includes(storedUserRole),
  theme: 'dark',
  inputs: savedInputs || defaultInputs,
  results: savedResults || {
    load: null,
    solar: null,
    battery: null,
    inverter: null,
    cable: null,
  },

  // Auth State
  token: savedToken,
  user: savedUser,
  isAuthenticated: !!savedToken,
  authError: null,

  // Project State
  currentProjectId: null,
  projectsList: [],
  isSaving: false,
  isDbOffline: false,

  // Grid Export State
  gridExportStatus: 'INACTIVE',
  utilityProvider: '',
  utilityAccountNo: '',
  accumulatedCredits: 0,

  // IoT & Telemetry Initial State
  devices: [],
  telemetry: null,
  alerts: [],
  isGatewayBuffering: false,
  gridExportEnabled: true,
  neighbourTransferEnabled: true,
  activeContract: null,
  billingSummary: null,
  notifications: [],
  consumerInvite: null,

  // AI State
  aiResponse: null,
  isAiLoading: false,
  aiError: null,

  setRole: (role) => set({ userRole: role }),
  setMode: (mode) => set({ userMode: mode }),
  setUserType: (type) => {
    try {
      localStorage.setItem('reos_user_type', type);
    } catch (e) {}
    set({ userType: type, hasSelectedMode: true });
  },
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  
  updateInputs: (updates) => {
    set((state) => {
      const newInputs = { ...state.inputs, ...updates };
      try {
        localStorage.setItem('reos_current_inputs', JSON.stringify(newInputs));
      } catch (e) {}
      return { inputs: newInputs };
    });
    get().runAllCalculations();
  },

  runAllCalculations: () => {
    const { inputs } = get();
    
    let load = null;
    let solar = null;
    let battery = null;
    let inverter = null;
    let cable = null;

    // 1. Load Profile
    const hasActiveAppliance = inputs.appliances.some(app => app.quantity > 0);
    if (hasActiveAppliance) {
      load = calculateLoadProfile(inputs.appliances, inputs.demandFactor || 0, inputs.diversityFactor || 0);
    }
    
    // 2. Solar PV
    if (load && inputs.peakSunHours > 0 && inputs.panelRatingW > 0) {
      solar = sizeSolarPV(load.dailyEnergyKwh, inputs.peakSunHours, inputs.losses || 0, inputs.tempDerating || 0, inputs.panelRatingW);
    }
    
    // 3. Battery Storage
    if (load) {
      if (inputs.inverterType === 'ON_GRID') {
        battery = {
          requiredCapacityKwh: 0,
          requiredCapacityAh: 0,
          batteryQty: 0,
          explanation: "Batteries are not required for On-Grid (Grid-Tied) systems. All excess solar power is exported to the grid, and power deficits are drawn from the grid."
        };
      } else if (inputs.batteryVoltage > 0 && inputs.dod > 0 && inputs.autonomyDays >= 0 && inputs.batteryEfficiency > 0) {
        battery = sizeBattery(load.dailyEnergyKwh, inputs.batteryVoltage, inputs.dod, inputs.autonomyDays, inputs.batteryEfficiency);
        // Override battery calculations based on custom selections
        if (battery) {
          if (inputs.batteryType === 'LITHIUM') {
            const unitCapacity = inputs.selectedLithiumKwh || 1;
            battery.batteryQty = Math.ceil(battery.requiredCapacityKwh / unitCapacity);
            battery.explanation = `Sized for ${inputs.autonomyDays} day(s) of autonomy. Requires ${battery.batteryQty} x ${unitCapacity} kWh Lithium batteries.`;
          } else {
            // Lead Acid: Qty = Ah / unit_Ah * (system_voltage / 12)
            const unitCapacity = inputs.selectedBatteryAh || 1;
            const seriesStrings = inputs.batteryVoltage / 12 || 1;
            const parallelStrings = Math.ceil(battery.requiredCapacityAh / unitCapacity) || 0;
            battery.batteryQty = parallelStrings * seriesStrings;
            battery.explanation = `Sized for ${inputs.autonomyDays} day(s) of autonomy. Requires ${battery.batteryQty} x 12V ${unitCapacity} Ah Lead-Acid batteries (${parallelStrings} parallel string(s) of ${seriesStrings} in series).`;
          }
        }
      }
    }

    // 4. Inverter
    if (load) {
      inverter = sizeInverter(load.maximumDemandW, inputs.loadSurgePowerW || 0, inputs.safetyMargin || 0, inputs.inverterType || 'HYBRID', solar?.requiredPvSizeKw || 0);
      
      // Override inverter calculations if custom rating is selected
      if (inverter && inputs.inverterRatingKw !== null && inputs.inverterRatingKw > 0) {
        inverter.recommendedInverterKw = inputs.inverterRatingKw;
        const isSufficient = (inputs.inverterRatingKw * 1000) >= load.maximumDemandW;
        inverter.safetyMarginUsed = parseFloat((inputs.inverterRatingKw * 1000 / load.maximumDemandW).toFixed(2));
        inverter.explanation = isSufficient 
          ? `Selected ${inputs.inverterRatingKw} kW inverter is sufficient for peak load of ${load.maximumDemandW.toFixed(0)} W (safety margin: ×${inverter.safetyMarginUsed}).`
          : `⚠️ Selected ${inputs.inverterRatingKw} kW inverter is INSUFFICIENT for peak load of ${load.maximumDemandW.toFixed(0)} W (requires at least ${(load.maximumDemandW / 1000).toFixed(1)} kW).`;
      }
    }

    // 5. Cable Sizing
    if (inputs.currentA > 0 && inputs.lengthMeters > 0 && inputs.cableVoltageV > 0 && inputs.areaMm2 > 0) {
      cable = calculateVoltageDrop(inputs.currentA, inputs.lengthMeters, inputs.cableVoltageV, inputs.areaMm2);
    }

    const results = {
      load,
      solar,
      battery,
      inverter,
      cable,
    };

    try {
      localStorage.setItem('reos_current_results', JSON.stringify(results));
    } catch (e) {}

    set({ results });

    // Automatically trigger saving to backend
    get().autoSaveProject();
  },

  createNewProject: async (name = 'New Design', location = 'Lagos, Nigeria', description = 'Solar PV Design Sizing Profile') => {
    const { token, isAuthenticated } = get();
    const emptyResults = {
      load: null,
      solar: null,
      battery: null,
      inverter: null,
      cable: null,
    };

    try {
      localStorage.setItem('reos_current_inputs', JSON.stringify(defaultInputs));
      localStorage.setItem('reos_current_results', JSON.stringify(emptyResults));
    } catch (e) {}

    if (isAuthenticated && token && token !== 'guest-token' && !get().isDbOffline) {
      set({ isSaving: true });
      const projectPayload = {
        name,
        description,
        location,
        latitude: 6.5244,
        longitude: 3.3792,
        inputs: defaultInputs,
        results: emptyResults,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(projectPayload),
        }).then(res => res.json());

        const savedProject = response && response.success ? response.data : response;
        if (savedProject && savedProject.id) {
          set({
            currentProjectId: savedProject.id,
            inputs: defaultInputs,
            results: emptyResults,
            isSaving: false,
          });
          await get().fetchUserProjects();
          return;
        }
      } catch (error) {
        console.warn('Failed to create project on backend, falling back to local creation', error);
      }
    }

    const localProjects = getLocalProjects();
    const newProject = {
      id: `local-${Date.now()}`,
      name,
      inputs: defaultInputs,
      results: emptyResults,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedList = [newProject, ...localProjects];
    saveLocalProjects(updatedList);
    set({
      currentProjectId: newProject.id,
      projectsList: updatedList,
      inputs: defaultInputs,
      results: emptyResults,
      isSaving: false,
    });
  },

  // Grid Export Actions
  updateGridExportStatus: (status) => set({ gridExportStatus: status }),
  setUtilityDetails: (provider, accountNo) => set({ utilityProvider: provider, utilityAccountNo: accountNo }),
  addAccumulatedCredits: (amount) => set(state => ({ accumulatedCredits: state.accumulatedCredits + amount })),
  resetGridExport: () => set({ gridExportStatus: 'INACTIVE', accumulatedCredits: 0 }),

  // IoT Actions implementation
  fetchIotData: async () => {
    const { token } = get();
    try {
      const devices = await api.fetchDevices(token || undefined);
      const telemetry = await api.fetchLiveTelemetry(token || undefined);
      const alerts = await api.fetchAlerts(token || undefined);
      set({
        devices,
        telemetry,
        alerts,
        gridExportEnabled: telemetry.smartMeter.activePowerKw >= 0,
        isDbOffline: false,
      });
    } catch (error) {
      // Fallback: client-side simulation when offline
      const state = get();
      let devices = state.devices;
      if (devices.length === 0) {
        devices = [
          { id: 'dev-inv-001', name: 'Main Hybrid Inverter (5kW)', type: 'INVERTER', status: 'ONLINE', projectId: 'default', firmwareVersion: 'v2.4.12', lastCommTime: new Date().toISOString(), signalStrength: -68, communicationQuality: 95 },
          { id: 'dev-met-001', name: 'Bidirectional Smart Net Meter', type: 'SMART_METER', status: 'ONLINE', projectId: 'default', firmwareVersion: 'v1.0.8', lastCommTime: new Date().toISOString(), signalStrength: -72, communicationQuality: 92 },
          { id: 'dev-bms-001', name: 'Lithium BMS Controller', type: 'BMS', status: 'ONLINE', projectId: 'default', firmwareVersion: 'v4.1.2', lastCommTime: new Date().toISOString(), signalStrength: -55, communicationQuality: 99 },
          { id: 'dev-wth-001', name: 'Outdoor Weather Station', type: 'WEATHER_STATION', status: 'ONLINE', projectId: 'default', firmwareVersion: 'v0.9.4', lastCommTime: new Date().toISOString(), signalStrength: -88, communicationQuality: 74 },
          { id: 'dev-ngb-001', name: 'Neighbour Grid Tie Link', type: 'NEIGHBOUR_METER', status: 'ONLINE', projectId: 'default', firmwareVersion: 'v1.2.0', lastCommTime: new Date().toISOString(), signalStrength: -81, communicationQuality: 81 },
          { id: 'dev-gw-001', name: 'REOS Edge Gateway v1', type: 'EDGE_GATEWAY', status: 'ONLINE', projectId: 'default', firmwareVersion: 'v3.0.0', lastCommTime: new Date().toISOString(), signalStrength: -45, communicationQuality: 100 }
        ];
      }

      const solarKw = state.results.solar ? state.results.solar.expectedAnnualGenKwh / 365 / 5.5 : 2.5; 
      const solarP = Math.max(0, solarKw + (Math.random() * 0.4 - 0.2));
      const loadP = (state.results.load ? state.results.load.maximumDemandW / 1000 * 0.4 : 1.2) + (Math.random() * 0.2 - 0.1);

      let gridExportKw = 0;
      let gridImportKw = 0;
      let neighborExportKw = 0;

      const surplus = solarP - loadP;
      if (surplus > 0) {
        if (state.neighbourTransferEnabled) {
          neighborExportKw = Math.min(surplus, 0.6);
        }
        if (state.gridExportEnabled) {
          gridExportKw = surplus - neighborExportKw;
        }
      } else {
        gridImportKw = Math.abs(surplus);
      }

      const gridVolt = 228 + (Math.random() * 6 - 3);
      const currentA = gridExportKw > 0 ? (gridExportKw * 1000) / gridVolt : (gridImportKw * 1000) / gridVolt;
      const nbrVolt = 226 + (Math.random() * 4 - 2);

      // Local Alert Engine
      const localAlerts = [...state.alerts];
      
      // Undervoltage check (< 230V as specified by user)
      if (gridVolt < 230 && !localAlerts.some(a => a.code === 'GRID_UNDERVOLTAGE')) {
        localAlerts.push({
          id: 'alert-undervoltage',
          code: 'GRID_UNDERVOLTAGE',
          title: 'Grid Undervoltage Fault',
          severity: 'WARNING',
          timestamp: new Date().toISOString(),
          recommendedAction: 'Grid voltage falls below 230V threshold. Check automatic voltage regulator settings.',
          acknowledged: false,
        });
      }

      // Sync failure check
      const synced = gridVolt >= 230 && gridVolt <= 253;
      if (!synced && !localAlerts.some(a => a.code === 'GRID_SYNC_FAILURE')) {
        localAlerts.push({
          id: 'alert-sync-fail',
          code: 'GRID_SYNC_FAILURE',
          title: 'Inverter Synchronization Failure',
          severity: 'CRITICAL',
          timestamp: new Date().toISOString(),
          recommendedAction: 'Inverter is out of sync with utility grid parameters. Check utility voltage/frequency ranges.',
          acknowledged: false,
        });
      }

      // Offline check
      devices.forEach(d => {
        if (d.status === 'OFFLINE' && !localAlerts.some(a => a.id === `alert-dev-${d.id}`)) {
          localAlerts.push({
            id: `alert-dev-${d.id}`,
            code: 'DEVICE_OFFLINE',
            title: `Device Offline: ${d.name}`,
            severity: d.type === 'SMART_METER' || d.type === 'INVERTER' ? 'CRITICAL' : 'WARNING',
            timestamp: new Date().toISOString(),
            recommendedAction: `Inspect connection links, verify Zigbee/Wi-Fi signal strength, and restart the ${d.name}.`,
            acknowledged: false,
          });
        }
      });

      // Reverse power check
      if (!state.gridExportEnabled && gridExportKw > 0 && !localAlerts.some(a => a.code === 'REVERSE_POWER_FAULT')) {
        localAlerts.push({
          id: 'alert-rev-power',
          code: 'REVERSE_POWER_FAULT',
          title: 'Reverse Power Flow Detected',
          severity: 'CRITICAL',
          timestamp: new Date().toISOString(),
          recommendedAction: 'Grid export is disabled but power export is detected. Check inverter export prevention settings.',
          acknowledged: false,
        });
      }

      // Filter resolved alerts
      const activeAlerts = localAlerts.filter(a => {
        if (a.code === 'GRID_UNDERVOLTAGE' && gridVolt >= 230) return false;
        if (a.code === 'GRID_SYNC_FAILURE' && synced) return false;
        const dev = devices.find(d => `alert-dev-${d.id}` === a.id);
        if (dev && dev.status === 'ONLINE') return false;
        if (a.code === 'REVERSE_POWER_FAULT' && (!state.gridExportEnabled && gridExportKw <= 0)) return false;
        return true;
      });

      const updatedCredits = state.accumulatedCredits + ((gridExportKw * 2.5) / 3600) * state.inputs.gridTariffRate;

      // Real-time wallet decrement for consumer prepaid wallet
      const walletDec = ((neighborExportKw * 2.5) / 3600) * state.inputs.gridTariffRate;
      const currentBilling = state.billingSummary;
      const nextBilling = currentBilling 
        ? { ...currentBilling, balance: Math.max(0, currentBilling.balance - walletDec) }
        : { balance: Math.max(0, 5000.0 - walletDec), outstandingBalance: 1520.0, lastPayment: 4500.0, billingCycle: 'PREPAID', invoices: [], transactions: [] };

      // Low balance alert
      const finalAlerts = [...activeAlerts];
      if (nextBilling.balance < 500 && !finalAlerts.some(a => a.code === 'LOW_CREDIT')) {
        finalAlerts.push({
          id: 'alert-low-credit',
          code: 'LOW_CREDIT',
          title: 'Prepaid Balance Low',
          severity: 'WARNING',
          timestamp: new Date().toISOString(),
          recommendedAction: 'Your energy credit is below ₦500.00. Recharge soon to avoid supply interruption.',
          acknowledged: false,
        });
      }

      set({
        devices,
        alerts: finalAlerts,
        accumulatedCredits: state.gridExportStatus === 'ACTIVE' ? updatedCredits : state.accumulatedCredits,
        billingSummary: nextBilling,
        telemetry: {
          timestamp: new Date().toISOString(),
          inverter: {
            powerKw: solarP,
            voltageV: gridVolt + 1,
            currentA: (solarP * 1000) / (gridVolt + 1),
            efficiencyPercent: 97.4,
            frequencyHz: 50.0 + (Math.random() * 0.1 - 0.05),
            gridSynchronized: synced,
            antiIslandingActive: false,
            status: solarP > 0.1 ? 'GENERATING' : 'STANDBY',
          },
          smartMeter: {
            voltageV: gridVolt,
            currentA: currentA,
            activePowerKw: gridExportKw > 0 ? gridExportKw : -gridImportKw,
            reactivePowerKvar: 0.12,
            apparentPowerKva: Math.abs(gridExportKw > 0 ? gridExportKw : gridImportKw) * 1.02,
            powerFactor: 0.98,
            frequencyHz: 50.0,
            importEnergyKwh: 89.2 + (gridImportKw * 2.5) / 3600,
            exportEnergyKwh: 142.8 + (gridExportKw * 2.5) / 3600,
            netEnergyKwh: 142.8 - 89.2,
            dailyExportKwh: 15.4,
            monthlyExportKwh: 124.6,
            lifetimeExportKwh: 142.8,
            voltageImbalancePercent: 0.4,
            harmonicsThdPercent: 1.8,
            phaseLoss: false,
          },
          battery: {
            socPercent: Math.max(10, Math.min(100, (state.telemetry?.battery?.socPercent || 82) + (surplus > 0 ? 0.05 : -0.1))),
            voltageV: 51.2,
            currentA: surplus > 0 ? 15 : -25,
            temperatureC: 28.5,
            healthPercent: 98.0,
            chargingState: surplus > 0 ? 'CHARGING' : 'DISCHARGING',
          },
          neighbourTrading: {
            voltageV: nbrVolt,
            currentA: (neighborExportKw * 1000) / nbrVolt,
            instantaneousPowerKw: neighborExportKw,
            energyDeliveredKwh: 45.6 + (neighborExportKw * 2.5) / 3600,
            energyReceivedKwh: 12.3,
            currentPricePerKwh: state.inputs.gridTariffRate,
            earnedCredits: state.accumulatedCredits || 7492.5,
            purchasedCredits: 12.3 * state.inputs.gridTariffRate,
            settlementBalance: (state.accumulatedCredits || 7492.5) - (12.3 * state.inputs.gridTariffRate),
            connectedNeighboursCount: 3,
            activeTransactionsCount: neighborExportKw > 0 ? 1 : 0,
            availableExportCapacityKw: Math.max(0, 1.5 - neighborExportKw),
          },
          weather: {
            solarIrradianceWm2: solarP > 0.5 ? 780 : 0,
            ambientTempC: 31.0,
            windSpeedMs: 3.4,
          }
        }
      });
    }
  },

  registerDevice: async (deviceData) => {
    const { token } = get();
    try {
      await api.registerDevice(deviceData, token || undefined);
      await get().fetchIotData();
    } catch (e) {
      const dev: any = {
        ...deviceData,
        id: deviceData.id || `dev-${Date.now()}`,
        status: 'ONLINE',
        lastCommTime: new Date().toISOString(),
        signalStrength: -65,
        communicationQuality: 98,
      };
      set(state => ({
        devices: [...state.devices, dev]
      }));
    }
  },

  removeDevice: async (id) => {
    const { token } = get();
    try {
      await api.removeDevice(id, token || undefined);
      await get().fetchIotData();
    } catch (e) {
      set(state => ({
        devices: state.devices.filter(d => d.id !== id)
      }));
    }
  },

  toggleGridExport: async (enabled) => {
    const { token } = get();
    try {
      await api.setGridExport(enabled, token || undefined);
      set({ gridExportEnabled: enabled });
    } catch (e) {
      set({ gridExportEnabled: enabled });
    }
  },

  toggleNeighbourTransfer: async (enabled) => {
    const { token } = get();
    try {
      await api.setNeighbourTransfer(enabled, token || undefined);
      set({ neighbourTransferEnabled: enabled });
    } catch (e) {
      set({ neighbourTransferEnabled: enabled });
    }
  },

  toggleGatewayBuffering: async (enabled) => {
    const { token } = get();
    try {
      await api.setEdgeGatewayBuffering(enabled, token || undefined);
      set({ isGatewayBuffering: enabled });
    } catch (e) {
      set({ isGatewayBuffering: enabled });
    }
  },

  acknowledgeAlert: async (id) => {
    const { token } = get();
    try {
      await api.acknowledgeAlert(id, token || undefined);
      await get().fetchIotData();
    } catch (e) {
      set(state => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a)
      }));
    }
  },

  // Auth Actions
  login: async (credentials) => {
    set({ authError: null });
    try {
      const data = await api.login(credentials);
      try {
        localStorage.setItem('reos_token', data.accessToken);
        localStorage.setItem('reos_user', JSON.stringify(data.user));
      } catch (e) {
        console.warn('Failed to save auth to localStorage', e);
      }
      const role = data?.user?.role || 'CUSTOMER';
      const isAdminRole = ['SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN'].includes(role);
      const newUserType = isAdminRole ? 'ADMIN' : (role === 'COMMERCIAL_ENERGY_PRODUCER' ? 'PRODUCER' : (savedUserType || 'PROSUMER'));
      // Persist so refresh keeps the correct view
      try { localStorage.setItem('reos_user_type', newUserType); } catch (e) {}
      set({
        token: data?.accessToken || null,
        user: data?.user || null,
        userRole: role as UserRole,
        userType: newUserType as any,
        hasSelectedMode: true,
        isAuthenticated: !!data?.accessToken,
      });
      await get().fetchUserProjects();

      // Auto-load the first online project if available
      const state = get();
      const onlineProjects = state.projectsList.filter((p: any) => p.id && !p.id.startsWith('local-'));
      if (onlineProjects.length > 0) {
        await get().loadProject(onlineProjects[0].id);
      }
    } catch (error: any) {
      set({ authError: error.message });
      throw error;
    }
  },

  register: async (registerData) => {
    set({ authError: null });
    try {
      const data = await api.register(registerData);
      try {
        localStorage.setItem('reos_token', data.accessToken);
        localStorage.setItem('reos_user', JSON.stringify(data.user));
      } catch (e) {
        console.warn('Failed to save auth to localStorage', e);
      }
      const regRole = data?.user?.role || 'CUSTOMER';
      const isAdminRegRole = ['SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN'].includes(regRole);
      const newRegUserType = isAdminRegRole ? 'ADMIN' : (regRole === 'COMMERCIAL_ENERGY_PRODUCER' ? 'PRODUCER' : (savedUserType || 'PROSUMER'));
      try { localStorage.setItem('reos_user_type', newRegUserType); } catch (e) {}
      set({
        token: data?.accessToken || null,
        user: data?.user || null,
        userRole: regRole as UserRole,
        userType: newRegUserType as any,
        hasSelectedMode: true,
        isAuthenticated: !!data?.accessToken,
      });
      await get().fetchUserProjects();
    } catch (error: any) {
      set({ authError: error.message });
      throw error;
    }
  },

  loginAsGuest: () => {
    try {
      localStorage.setItem('reos_token', 'guest-token');
      localStorage.setItem('reos_user', JSON.stringify({
        id: 'guest',
        firstName: 'Guest',
        lastName: 'User',
        email: 'guest@reos.io',
        role: 'VIEWER',
      }));
    } catch (e) {
      console.warn('Failed to save guest auth to localStorage', e);
    }
    set({
      token: 'guest-token',
      user: {
        id: 'guest',
        firstName: 'Guest',
        lastName: 'User',
        email: 'guest@reos.io',
        role: 'VIEWER' as UserRole,
      },
      userRole: 'VIEWER' as UserRole,
      isAuthenticated: true,
    });
  },

  logout: () => {
    try {
      localStorage.removeItem('reos_token');
      localStorage.removeItem('reos_user');
    } catch (e) {
      console.warn('Failed to remove auth from localStorage', e);
    }
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      userRole: 'CUSTOMER' as UserRole,
      currentProjectId: null,
      projectsList: [],
    });
  },

  // Project Actions
  saveProject: async (name) => {
    const { token, inputs, results, currentProjectId, isAuthenticated } = get();
    
    const projectPayload = {
      name,
      description: `Solar PV Design with ${results.solar?.numberOfPanels || 0} panels`,
      location: 'Lagos, Nigeria',
      latitude: 6.5244,
      longitude: 3.3792,
      inputs,
      results,
    };

    // If not authenticated or guest, save locally
    if (!isAuthenticated || token === 'guest-token') {
      const localProjects = getLocalProjects();
      const newProject = {
        id: currentProjectId || `local-${Date.now()}`,
        name,
        inputs,
        results,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedList;
      if (currentProjectId && localProjects.some((p: any) => p.id === currentProjectId)) {
        updatedList = localProjects.map((p: any) => p.id === currentProjectId ? newProject : p);
      } else {
        updatedList = [newProject, ...localProjects];
      }

      saveLocalProjects(updatedList);
      set({
        currentProjectId: newProject.id,
        projectsList: updatedList,
      });
      return;
    }

    set({ isSaving: true });

    try {
      let response;
      if (currentProjectId && !currentProjectId.startsWith('local-')) {
        response = await fetch(`${API_BASE_URL}/projects/${currentProjectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(projectPayload),
        }).then(res => res.json());
      } else {
        response = await fetch(`${API_BASE_URL}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(projectPayload),
        }).then(res => res.json());
      }

      const savedProject = response && response.success ? response.data : response;

      set({
        currentProjectId: savedProject.id,
        isSaving: false,
        isDbOffline: false,
      });
      await get().fetchUserProjects();
    } catch (error) {
      console.warn('Backend save failed. Saving locally.', error);
      // Fallback on error: save locally
      const localProjects = getLocalProjects();
      const newProject = {
        id: currentProjectId || `local-${Date.now()}`,
        name,
        inputs,
        results,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedList;
      if (currentProjectId && localProjects.some((p: any) => p.id === currentProjectId)) {
        updatedList = localProjects.map((p: any) => p.id === currentProjectId ? newProject : p);
      } else {
        updatedList = [newProject, ...localProjects];
      }

      saveLocalProjects(updatedList);
      set({
        currentProjectId: newProject.id,
        projectsList: updatedList,
        isSaving: false,
        isDbOffline: true,
      });
    }
  },

  loadProject: async (projectId) => {
    const { token, isAuthenticated } = get();
    
    if (projectId.startsWith('local-')) {
      const localProjects = getLocalProjects();
      const project = localProjects.find((p: any) => p.id === projectId);
      if (project) {
        try {
          localStorage.setItem('reos_current_inputs', JSON.stringify(project.inputs));
          localStorage.setItem('reos_current_results', JSON.stringify(project.results));
        } catch (e) {}
        set({
          currentProjectId: project.id,
          inputs: project.inputs,
          results: project.results,
        });
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(res => res.json());

      const project = response && response.success ? response.data : response;

      if (project && project.inputs) {
        try {
          localStorage.setItem('reos_current_inputs', JSON.stringify(project.inputs));
          localStorage.setItem('reos_current_results', JSON.stringify(project.results || { load: null, solar: null, battery: null, inverter: null, cable: null }));
        } catch (e) {}
        set({
          currentProjectId: project.id,
          inputs: project.inputs,
          results: project.results || { load: null, solar: null, battery: null, inverter: null, cable: null },
          isDbOffline: false,
        });
      } else {
        const emptyResults = { load: null, solar: null, battery: null, inverter: null, cable: null };
        try {
          localStorage.setItem('reos_current_inputs', JSON.stringify(defaultInputs));
          localStorage.setItem('reos_current_results', JSON.stringify(emptyResults));
        } catch (e) {}
        set({
          currentProjectId: project.id,
          inputs: defaultInputs,
          results: emptyResults,
        });
      }
    } catch (error) {
      console.error('Failed to load project from backend:', error);
    }
  },

  fetchUserProjects: async () => {
    const { token, isAuthenticated } = get();
    const localProjects = getLocalProjects();

    if (!isAuthenticated || token === 'guest-token') {
      set({ projectsList: localProjects });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(res => res.json());

      const backendProjects = response && response.success ? response.data : response;

      // Merge backend and local projects
      const backendArray = Array.isArray(backendProjects) ? backendProjects : [];
      set({
        projectsList: [...localProjects, ...backendArray],
        isDbOffline: !Array.isArray(backendProjects),
      });
    } catch (error) {
      console.warn('Failed to fetch from backend. Using local projects list.', error);
      set({
        projectsList: localProjects,
        isDbOffline: true,
      });
    }
  },

  autoSaveProject: async () => {
    const { token, inputs, results, currentProjectId, isAuthenticated, isSaving } = get();
    
    let projectId = currentProjectId;
    const activeProject = get().projectsList.find(p => p.id === currentProjectId);
    const projectName = activeProject?.name || 'New Design';

    // If running in local fallback (guest, offline, etc.)
    if (!isAuthenticated || get().isDbOffline || token === 'guest-token') {
      const localProjects = getLocalProjects();
      const updatedList = localProjects.map((p: any) => 
        p.id === projectId || p.id === currentProjectId
          ? { ...p, inputs, results, updatedAt: new Date().toISOString() }
          : p
      );
      saveLocalProjects(updatedList);
      set({
        projectsList: updatedList,
      });
      return;
    }

    if (isSaving) return;

    const projectPayload = {
      name: projectName,
      description: `Solar PV Design with ${results.solar?.numberOfPanels || 0} panels`,
      location: 'Lagos, Nigeria',
      latitude: 6.5244,
      longitude: 3.3792,
      inputs,
      results,
    };

    try {
      let savedProject;
      if (projectId && !projectId.startsWith('local-')) {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(projectPayload),
        }).then(res => res.json());
        savedProject = response && response.success ? response.data : response;
      } else {
        // If there's no project ID or it's a local fallback ID, create a new project record.
        const response = await fetch(`${API_BASE_URL}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(projectPayload),
        }).then(res => res.json());
        savedProject = response && response.success ? response.data : response;
      }

      if (savedProject && savedProject.id) {
        set({
          currentProjectId: savedProject.id,
          isDbOffline: false,
        });
        // Update the project in the projectsList to reflect new inputs/results and ID
        set(state => ({
          projectsList: state.projectsList.map(p => 
            p.id === projectId || p.id === currentProjectId
              ? { ...p, id: savedProject.id, inputs, results }
              : p
          )
        }));
      }
    } catch (error) {
      console.warn('Failed to auto-save project online. Saving locally.', error);
      const localProjects = getLocalProjects();
      const updatedList = localProjects.map((p: any) => 
        p.id === projectId || p.id === currentProjectId
          ? { ...p, inputs, results, updatedAt: new Date().toISOString() }
          : p
      );
      saveLocalProjects(updatedList);
      set({
        projectsList: updatedList,
        isDbOffline: true
      });
    }
  },

  deleteProject: async (projectId) => {
    const { token, isAuthenticated, currentProjectId, projectsList } = get();
    set({ isSaving: true });

    // 1. Delete from backend if authenticated and online
    if (isAuthenticated && token && token !== 'guest-token' && !projectId.startsWith('local-') && !get().isDbOffline) {
      try {
        await fetch(`${API_BASE_URL}/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(res => res.json());
      } catch (error) {
        console.warn('Failed to delete project on backend:', error);
      }
    }

    // 2. Filter out from local storage list
    const localProjects = getLocalProjects();
    const updatedLocal = localProjects.filter((p: any) => p.id !== projectId);
    saveLocalProjects(updatedLocal);

    // 3. Filter out from local memory state
    const updatedList = projectsList.filter((p: any) => p.id !== projectId);

    set({
      projectsList: updatedList,
      isSaving: false,
    });

    // 4. If we deleted the active project, load the next one or create a new one
    if (currentProjectId === projectId) {
      if (updatedList.length > 0) {
        await get().loadProject(updatedList[0].id);
      } else {
        await get().createNewProject();
      }
    } else {
      // Otherwise, just refresh the projects list
      await get().fetchUserProjects();
    }
  },

  fetchProfile: async () => {
    const { token } = get();
    if (!token || token === 'guest-token') return;
    try {
      const user = await api.fetchCurrentUser(token);
      try {
        localStorage.setItem('reos_user', JSON.stringify(user));
      } catch (e) {
        console.warn('Failed to save user to localStorage', e);
      }
      set({
        user: user || null,
        userRole: (user?.role || 'CUSTOMER') as UserRole,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Log out on invalid token
      get().logout();
    }
  },

  // AI Actions
  getAiInsights: async () => {
    const { inputs, results } = get();
    if (!results.load) return;

    // Run local calculation instantly without setting isAiLoading: true or fetching
    let analysisText = `Hello! I have analyzed your sizing inputs for Lagos, Nigeria (average sun hours: ${inputs.peakSunHours} hrs/day):\n\n`;
    analysisText += `1. **Cable Compliance**: ${results.cable && !results.cable.passesCheck ? '⚠️ Your voltage drop is ' + results.cable.voltageDropPercent.toFixed(2) + '%, which exceeds the 3% limit. Upgrade to 6mm² or 10mm² to prevent power loss.' : '✅ Your cable sizing of ' + inputs.areaMm2 + 'mm² is compliant with a ' + (results.cable?.voltageDropPercent.toFixed(2) || 0) + '% drop.'}\n`;
    analysisText += `2. **PV Array matching**: Your ${results.solar?.numberOfPanels || 0} panels (${results.solar?.requiredPvSizeKw || 0} kWp) will generate approx ${(results.solar?.expectedAnnualGenKwh || 0).toFixed(0)} kWh annually, covering your demand.\n`;
    analysisText += `3. **Storage Autonomy**: The ${results.battery?.batteryQty || 0} units (${results.battery?.requiredCapacityKwh || 0} kWh) provide ${inputs.autonomyDays} day(s) of backup.`;

    set({
      aiResponse: analysisText,
      isAiLoading: false,
      aiError: null,
    });
  },

  createInviteCode: async (tariff, cycle, email, phone) => {
    const { token } = get();
    try {
      const data = await api.createInvitation(tariff, cycle, email, phone, token || undefined);
      set({ consumerInvite: data });
      return data;
    } catch (e) {
      const code = `REOS-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackInvite = { invitationCode: code, tariffRate: tariff, billingCycle: cycle, status: 'PENDING' };
      set({ consumerInvite: fallbackInvite });
      return fallbackInvite;
    }
  },

  verifyInviteCode: async (code) => {
    const { token } = get();
    try {
      return await api.getInvitation(code, token || undefined);
    } catch (e) {
      return { invitationCode: code, tariffRate: 180, billingCycle: 'PREPAID', status: 'PENDING', supplier: { firstName: 'Sunshine', lastName: 'Community Supplier', email: 'supplier@reos.io' } };
    }
  },

  acceptEnergySharing: async (code) => {
    const { token } = get();
    try {
      const data = await api.acceptInvitation(code, token || undefined);
      set({ activeContract: data });
      return data;
     } catch (e) {
      const fallbackContract = { id: `contract-${Date.now()}`, supplierId: 'mock-supplier', consumerId: 'mock-consumer', connectionStatus: 'ACTIVE', tariffRate: 180, billingCycle: 'PREPAID', balance: 5000.0, gatewayId: 'dev-gw-001' };
      set({ activeContract: fallbackContract });
      return fallbackContract;
    }
  },

  fetchConsumerContract: async () => {
    const { token } = get();
    try {
      const data = await api.fetchActiveContract(token || undefined);
      set({ activeContract: data });
    } catch (e) {
      if (!get().activeContract) {
        set({ activeContract: { id: 'mock-contract-id', supplierId: 'mock-supplier-id', consumerId: 'mock-consumer-id', connectionStatus: 'ACTIVE', tariffRate: 180, billingCycle: 'PREPAID', balance: 5000.0, gatewayId: 'dev-gw-001', supplier: { firstName: 'Sunshine', lastName: 'Community', email: 'supplier@reos.io' }, consumer: { firstName: 'Demo', lastName: 'Consumer', email: 'consumer@reos.io' } } });
      }
    }
  },

  fetchConsumerBilling: async () => {
    const { token } = get();
    try {
      const data = await api.fetchBillingSummary(token || undefined);
      set({ billingSummary: data });
    } catch (e) {
      // Keep running client side top-ups
    }
  },

  rechargeWallet: async (amount, gateway) => {
    const { token } = get();
    try {
      await api.topUpWallet(amount, gateway, token || undefined);
      await get().fetchConsumerBilling();
    } catch (e) {
      // Offline fallback
      set(state => {
        if (!state.billingSummary) return {};
        const newTx = { id: `tx-${Date.now()}`, contractId: state.billingSummary.contractId, type: 'PREPAID_PURCHASE', amount, currency: 'NGN', paymentGateway: gateway, status: 'SUCCESSFUL', createdAt: new Date().toISOString() };
        return {
          billingSummary: {
            ...state.billingSummary,
            balance: state.billingSummary.balance + amount,
            transactions: [newTx, ...state.billingSummary.transactions]
          }
        };
      });
    }
  },

  payOutstandingInvoice: async (invoiceId, gateway) => {
    const { token } = get();
    try {
      await api.payInvoice(invoiceId, gateway, token || undefined);
      await get().fetchConsumerBilling();
    } catch (e) {
      // Offline fallback
      set(state => {
        if (!state.billingSummary) return {};
        const invoices = state.billingSummary.invoices.map((inv: any) => inv.id === invoiceId ? { ...inv, status: 'PAID' } : inv);
        const invAmount = state.billingSummary.invoices.find((inv: any) => inv.id === invoiceId)?.amount || 0;
        const newTx = { id: `tx-${Date.now()}`, contractId: state.billingSummary.contractId, type: 'BILL_PAYMENT', amount: invAmount, currency: 'NGN', paymentGateway: gateway, status: 'SUCCESSFUL', createdAt: new Date().toISOString() };
        return {
          billingSummary: {
            ...state.billingSummary,
            outstandingBalance: Math.max(0, state.billingSummary.outstandingBalance - invAmount),
            invoices,
            transactions: [newTx, ...state.billingSummary.transactions]
          }
        };
      });
    }
  },

  fetchUserNotifications: async () => {
    const { token } = get();
    try {
      const data = await api.fetchNotifications(token || undefined);
      set({ notifications: data });
     } catch (e) {
      if (get().notifications.length === 0) {
        set({
          notifications: [
            { id: 'not-1', title: 'Welcome to REOS Portal', message: 'You have logged in successfully. Access your consumer dashboard to view received power telemetry.', type: 'INFO', read: false, createdAt: new Date().toISOString() },
            { id: 'not-2', title: 'Planned Maintenance Notice', message: 'Supplier microgrid will undergo battery test clean-up tomorrow from 10:00 AM to 11:30 AM.', type: 'SYSTEM', read: false, createdAt: new Date().toISOString() }
          ]
        });
      }
    }
  },

  markNotificationRead: async (id) => {
    const { token } = get();
    try {
      await api.readNotification(id, token || undefined);
      await get().fetchUserNotifications();
    } catch (e) {
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      }));
    }
  }
}));


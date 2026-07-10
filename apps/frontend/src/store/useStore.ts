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
  toggleTheme: () => void;
  updateInputs: (updates: Partial<ProjectInputs>) => void;
  runAllCalculations: () => void;

  // Auth Actions
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;

  // Project Actions
  saveProject: (name: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  fetchUserProjects: () => Promise<void>;

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
    { name: 'LED Lights', powerW: 15, quantity: 0, hoursOn: Array(24).fill(0) },
    { name: 'Ceiling Fans', powerW: 80, quantity: 0, hoursOn: Array(24).fill(0) },
    { name: 'TV / Laptops', powerW: 150, quantity: 0, hoursOn: Array(24).fill(0) },
    { name: 'Microwave / Kettle', powerW: 1000, quantity: 0, hoursOn: Array(24).fill(0) },
  ],
  demandFactor: 0,
  diversityFactor: 0,
  peakSunHours: 0,
  losses: 0,
  tempDerating: 0,
  panelRatingW: 0,
  batteryVoltage: 0,
  dod: 0,
  autonomyDays: 0,
  batteryEfficiency: 0,
  loadSurgePowerW: 0,
  safetyMargin: 0,
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
  selectedBatteryAh: 0,
  selectedLithiumKwh: 0,
  inverterRatingKw: null,
  inverterOutputVoltage: '230V',
};

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

export const useStore = create<REOSState>((set, get) => ({
  userRole: 'CUSTOMER',
  userMode: 'SIMPLE',
  theme: 'dark',
  inputs: defaultInputs,
  results: {
    load: null,
    solar: null,
    battery: null,
    inverter: null,
    cable: null,
  },

  // Auth State
  token: null,
  user: null,
  isAuthenticated: false,
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
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  
  updateInputs: (updates) => set((state) => ({
    inputs: { ...state.inputs, ...updates }
  })),

  runAllCalculations: () => {
    const { inputs } = get();
    
    // Check if key inputs are zero or unset, to avoid errors or NaN values
    const hasActiveAppliance = inputs.appliances.some(app => app.quantity > 0);
    if (!hasActiveAppliance || inputs.peakSunHours <= 0 || inputs.panelRatingW <= 0) {
      set({
        results: {
          load: null,
          solar: null,
          battery: null,
          inverter: null,
          cable: null,
        },
        aiResponse: null
      });
      return;
    }

    // 1. Load Profile
    const load = calculateLoadProfile(inputs.appliances, inputs.demandFactor, inputs.diversityFactor);
    
    // 2. Solar PV
    const solar = sizeSolarPV(load.dailyEnergyKwh, inputs.peakSunHours, inputs.losses, inputs.tempDerating, inputs.panelRatingW);
    
    // 3. Battery Storage
    let battery = null;
    if (inputs.inverterType === 'ON_GRID') {
      battery = {
        requiredCapacityKwh: 0,
        requiredCapacityAh: 0,
        batteryQty: 0,
        explanation: "Batteries are not required for On-Grid (Grid-Tied) systems. All excess solar power is exported to the grid, and power deficits are drawn from the grid."
      };
    } else {
      battery = sizeBattery(load.dailyEnergyKwh, inputs.batteryVoltage, inputs.dod, inputs.autonomyDays, inputs.batteryEfficiency);
      // Override battery calculations based on custom selections
      if (battery) {
        if (inputs.batteryType === 'LITHIUM') {
          battery.batteryQty = Math.ceil(battery.requiredCapacityKwh / inputs.selectedLithiumKwh);
          battery.explanation = `Sized for ${inputs.autonomyDays} day(s) of autonomy. Requires ${battery.batteryQty} x ${inputs.selectedLithiumKwh} kWh Lithium batteries.`;
        } else {
          // Lead Acid: Qty = Ah / unit_Ah * (system_voltage / 12)
          const seriesStrings = inputs.batteryVoltage / 12;
          const parallelStrings = Math.ceil(battery.requiredCapacityAh / inputs.selectedBatteryAh);
          battery.batteryQty = parallelStrings * seriesStrings;
          battery.explanation = `Sized for ${inputs.autonomyDays} day(s) of autonomy. Requires ${battery.batteryQty} x 12V ${inputs.selectedBatteryAh} Ah Lead-Acid batteries (${parallelStrings} parallel string(s) of ${seriesStrings} in series).`;
        }
      }
    }

    // 4. Inverter
    const inverter = sizeInverter(load.maximumDemandW, inputs.loadSurgePowerW, inputs.safetyMargin, inputs.inverterType, solar?.requiredPvSizeKw || 0);
    
    // Override inverter calculations if custom rating is selected
    if (inverter && inputs.inverterRatingKw !== null) {
      inverter.recommendedInverterKw = inputs.inverterRatingKw;
      const isSufficient = (inputs.inverterRatingKw * 1000) >= load.maximumDemandW;
      inverter.safetyMarginUsed = parseFloat((inputs.inverterRatingKw * 1000 / load.maximumDemandW).toFixed(2));
      inverter.explanation = isSufficient 
        ? `Selected ${inputs.inverterRatingKw} kW inverter is sufficient for peak load of ${load.maximumDemandW.toFixed(0)} W (safety margin: ×${inverter.safetyMarginUsed}).`
        : `⚠️ Selected ${inputs.inverterRatingKw} kW inverter is INSUFFICIENT for peak load of ${load.maximumDemandW.toFixed(0)} W (requires at least ${(load.maximumDemandW / 1000).toFixed(1)} kW).`;
    }

    // 5. Cable Sizing
    const cable = calculateVoltageDrop(inputs.currentA, inputs.lengthMeters, inputs.cableVoltageV, inputs.areaMm2);

    set({
      results: {
        load,
        solar,
        battery,
        inverter,
        cable,
      }
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
      // Fallback: client-side simulation starting in zero state for fresh testing
      const state = get();
      let devices = state.devices;

      set({
        devices,
        alerts: [],
        accumulatedCredits: 0,
        billingSummary: state.billingSummary || { balance: 0, outstandingBalance: 0, lastPayment: 0, billingCycle: 'PREPAID', invoices: [], transactions: [] },
        telemetry: {
          timestamp: new Date().toISOString(),
          inverter: {
            powerKw: 0,
            voltageV: 0,
            currentA: 0,
            efficiencyPercent: 0,
            frequencyHz: 0,
            gridSynchronized: false,
            antiIslandingActive: false,
            status: 'STANDBY',
          },
          smartMeter: {
            voltageV: 0,
            currentA: 0,
            activePowerKw: 0,
            reactivePowerKvar: 0,
            apparentPowerKva: 0,
            powerFactor: 0,
            frequencyHz: 0,
            importEnergyKwh: 0,
            exportEnergyKwh: 0,
            netEnergyKwh: 0,
            dailyExportKwh: 0,
            monthlyExportKwh: 0,
            lifetimeExportKwh: 0,
            voltageImbalancePercent: 0,
            harmonicsThdPercent: 0,
            phaseLoss: false,
          },
          battery: {
            socPercent: 0,
            voltageV: 0,
            currentA: 0,
            temperatureC: 0,
            healthPercent: 0,
            chargingState: 'STANDBY',
          },
          neighbourTrading: {
            voltageV: 0,
            currentA: 0,
            instantaneousPowerKw: 0,
            energyDeliveredKwh: 0,
            energyReceivedKwh: 0,
            currentPricePerKwh: 0,
            earnedCredits: 0,
            purchasedCredits: 0,
            settlementBalance: 0,
            connectedNeighboursCount: 0,
            activeTransactionsCount: 0,
            availableExportCapacityKw: 0,
          },
          weather: {
            solarIrradianceWm2: 0,
            ambientTempC: 0,
            windSpeedMs: 0,
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
      set({
        token: data.accessToken,
        user: data.user,
        isAuthenticated: true,
      });
      await get().fetchUserProjects();
    } catch (error: any) {
      set({ authError: error.message });
      throw error;
    }
  },

  register: async (registerData) => {
    set({ authError: null });
    try {
      const data = await api.register(registerData);
      set({
        token: data.accessToken,
        user: data.user,
        isAuthenticated: true,
      });
      await get().fetchUserProjects();
    } catch (error: any) {
      set({ authError: error.message });
      throw error;
    }
  },

  logout: () => {
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      currentProjectId: null,
      projectsList: [],
    });
  },

  // Project Actions
  saveProject: async (name) => {
    const { token, inputs, results, currentProjectId, projectsList, isAuthenticated } = get();
    set({ isSaving: true });
    
    const projectPayload = {
      name,
      description: `Solar PV Design with ${results.solar?.numberOfPanels || 0} panels`,
      location: 'Lagos, Nigeria',
      latitude: 6.5244,
      longitude: 3.3792,
    };

    // If not authenticated or if the database is offline, save locally
    if (!isAuthenticated || get().isDbOffline) {
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
        isDbOffline: true, // Tag that we are running in local fallback
      });
      return;
    }

    try {
      let savedProject;
      if (currentProjectId && !currentProjectId.startsWith('local-')) {
        savedProject = await fetch(`http://localhost:3000/api/projects/${currentProjectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(projectPayload),
        }).then(res => res.json());
      } else {
        savedProject = await fetch('http://localhost:3000/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(projectPayload),
        }).then(res => res.json());
      }

      set({
        currentProjectId: savedProject.id,
        isSaving: false,
        isDbOffline: false,
      });
      await get().fetchUserProjects();
    } catch (error) {
      console.warn('Backend save failed. Falling back to local storage.', error);
      // Fallback on error
      set({ isDbOffline: true });
      await get().saveProject(name);
    }
  },

  loadProject: async (projectId) => {
    const { token, isAuthenticated } = get();
    
    if (projectId.startsWith('local-')) {
      const localProjects = getLocalProjects();
      const project = localProjects.find((p: any) => p.id === projectId);
      if (project) {
        set({
          currentProjectId: project.id,
          inputs: project.inputs,
          results: project.results,
        });
      }
      return;
    }

    try {
      const project = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(res => res.json());

      // Map backend project back to inputs if saved
      // (For now, since we only save basic details on the backend, we load what we have and run calculations)
      set({
        currentProjectId: project.id,
      });
      get().runAllCalculations();
    } catch (error) {
      console.error('Failed to load project from backend:', error);
    }
  },

  fetchUserProjects: async () => {
    const { token, isAuthenticated } = get();
    const localProjects = getLocalProjects();

    if (!isAuthenticated || get().isDbOffline) {
      set({ projectsList: localProjects });
      return;
    }

    try {
      const backendProjects = await fetch('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(res => res.json());

      // Merge backend and local projects
      set({
        projectsList: [...localProjects, ...backendProjects],
        isDbOffline: false,
      });
    } catch (error) {
      console.warn('Failed to fetch from backend. Using local projects list.', error);
      set({
        projectsList: localProjects,
        isDbOffline: true,
      });
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
      const fallbackContract = { id: `contract-${Date.now()}`, supplierId: 'mock-supplier', consumerId: 'mock-consumer', connectionStatus: 'ACTIVE', tariffRate: 180, billingCycle: 'PREPAID', balance: 0.0, gatewayId: 'dev-gw-001' };
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
        set({ activeContract: { id: 'mock-contract-id', supplierId: 'mock-supplier-id', consumerId: 'mock-consumer-id', connectionStatus: 'ACTIVE', tariffRate: 180, billingCycle: 'PREPAID', balance: 0.0, gatewayId: 'dev-gw-001', supplier: { firstName: 'Sunshine', lastName: 'Community', email: 'supplier@reos.io' }, consumer: { firstName: 'Demo', lastName: 'Consumer', email: 'consumer@reos.io' } } });
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
          notifications: []
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


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
}

const defaultInputs: ProjectInputs = {
  appliances: [
    { name: 'LED Lights', powerW: 15, quantity: 0, hoursOn: [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1] },
    { name: 'Ceiling Fans', powerW: 80, quantity: 0, hoursOn: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { name: 'TV / Laptops', powerW: 150, quantity: 0, hoursOn: [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0] },
    { name: 'Microwave / Kettle', powerW: 1000, quantity: 0, hoursOn: [0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0] },
  ],
  demandFactor: 0.8,
  diversityFactor: 0.9,
  peakSunHours: 4.8, // Lagos/West African average daily equivalent
  losses: 0.15,
  tempDerating: 0.89,
  panelRatingW: 450,
  batteryVoltage: 48,
  dod: 0.8,
  autonomyDays: 1.0,
  batteryEfficiency: 0.95,
  loadSurgePowerW: 2500,
  safetyMargin: 1.25,
  inverterType: 'HYBRID',
  currentA: 25,
  lengthMeters: 15,
  cableVoltageV: 230,
  areaMm2: 4,
  // Financial
  currency: 'NGN',
  gridTariffRate: 225,
  capexBudget: 2500000,
  surplusTransferKwh: 0,
  // Customization Overrides
  batteryType: 'LITHIUM',
  selectedBatteryAh: 200,
  selectedLithiumKwh: 5.12,
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
  addAccumulatedCredits: (amount) => set((state) => ({ accumulatedCredits: state.accumulatedCredits + amount })),
  resetGridExport: () => set({
    gridExportStatus: 'INACTIVE',
    utilityProvider: '',
    utilityAccountNo: '',
    accumulatedCredits: 0,
  }),

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
    const { inputs, results, token } = get();
    if (!results.load) return;

    set({ isAiLoading: true, aiError: null });

    const prompt = `
Analyze the following solar PV sizing project for Lagos, Nigeria (PSH: ${inputs.peakSunHours} hrs/day):
- Peak continuous load: ${results.load.maximumDemandW.toFixed(0)} W
- Daily energy consumption: ${results.load.dailyEnergyKwh.toFixed(2)} kWh
- Annual energy demand: ${results.load.annualEnergyKwh.toFixed(0)} kWh
- Proposed Solar PV capacity: ${results.solar?.requiredPvSizeKw || 0} kWp (${results.solar?.numberOfPanels || 0} panels of ${inputs.panelRatingW}W)
- Proposed Battery storage: ${results.battery?.requiredCapacityKwh || 0} kWh (${results.battery?.batteryQty || 0} units of 12V 200Ah, bus voltage ${inputs.batteryVoltage}V, DoD: ${inputs.dod * 100}%)
- Proposed Inverter: ${results.inverter?.recommendedInverterKw || 0} kW (based on continuous demand and ${inputs.loadSurgePowerW}W surge)
- Cable run: ${inputs.lengthMeters}m of ${inputs.areaMm2}mm² copper wire at ${inputs.cableVoltageV}V, yielding ${results.cable?.voltageDropPercent.toFixed(2)}% voltage drop.

Provide 3 short, high-impact engineering recommendations for this design. Keep them extremely concise and technical.
`;

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are REOS Copilot, a premium solar engineering assistant. Provide professional, code-compliant sizing advice.' },
      { role: 'user', content: prompt }
    ];

    try {
      // Call backend AI chat endpoint
      const data = await api.chatWithAi(messages, token || undefined);
      set({
        aiResponse: data.content,
        isAiLoading: false,
      });
    } catch (error: any) {
      console.warn('AI API call failed. Using local engineering fallback.', error);
      
      // Fallback logic
      let fallbackText = `Hello! I have analyzed your sizing inputs for Lagos, Nigeria (average sun hours: ${inputs.peakSunHours} hrs/day):\n\n`;
      fallbackText += `1. **Cable Compliance**: ${results.cable && !results.cable.passesCheck ? '⚠️ Your voltage drop is ' + results.cable.voltageDropPercent.toFixed(2) + '%, which exceeds the 3% limit. Upgrade to 6mm² or 10mm² to prevent power loss.' : '✅ Your cable sizing of ' + inputs.areaMm2 + 'mm² is compliant with a ' + (results.cable?.voltageDropPercent.toFixed(2) || 0) + '% drop.'}\n`;
      fallbackText += `2. **PV Array matching**: Your ${results.solar?.numberOfPanels || 0} panels (${results.solar?.requiredPvSizeKw || 0} kWp) will generate approx ${(results.solar?.expectedAnnualGenKwh || 0).toFixed(0)} kWh annually, covering your demand.\n`;
      fallbackText += `3. **Storage Autonomy**: The ${results.battery?.batteryQty || 0} units (${results.battery?.requiredCapacityKwh || 0} kWh) provide ${inputs.autonomyDays} day(s) of backup.`;

      set({
        aiResponse: fallbackText,
        isAiLoading: false,
      });
    }
  }
}));


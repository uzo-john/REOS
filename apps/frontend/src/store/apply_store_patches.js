const fs = require('fs');

const path = 'c:/Users/Hp/Desktop/new project/apps/frontend/src/store/useStore.ts';
let content = fs.readFileSync(path, 'utf8');

// Normalize line endings to LF for matching
const originalHasCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. ADD PRODUCER STATE FIELDS AND ACTIONS TO REOSState INTERFACE
const interfaceTarget = `  fetchUserNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}`;

const interfaceReplacement = `  fetchUserNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;

  // Producer State Fields
  producerPlants: any[];
  producerFeeders: any[];
  producerZones: any[];
  producerConnections: any[];
  producerAllocations: any[];
  producerDispatches: any[];
  producerDispatchLogs: any[];
  producerGridExports: any[];
  producerAnalytics: any | null;
  producerAiForecast: any | null;
  producerBillingSettlements: any | null;
  selectedProducerPlantId: string | null;

  // Producer Actions
  fetchProducerPlants: () => Promise<void>;
  registerProducerPlant: (dto: any) => Promise<void>;
  updateProducerPlant: (id: string, dto: any) => Promise<void>;
  selectProducerPlant: (id: string | null) => void;
  fetchFeeders: (plantId: string) => Promise<void>;
  createFeeder: (dto: any) => Promise<void>;
  fetchZones: (plantId: string) => Promise<void>;
  createZone: (dto: any) => Promise<void>;
  fetchConnections: (plantId: string) => Promise<void>;
  connectConsumer: (dto: any) => Promise<void>;
  disconnectConsumer: (connectionId: string) => Promise<void>;
  reconnectConsumer: (connectionId: string) => Promise<void>;
  allocateEnergy: (dto: any) => Promise<void>;
  fetchAllocations: (plantId: string) => Promise<void>;
  dispatchEnergy: (dto: any) => Promise<void>;
  fetchDispatches: (plantId: string) => Promise<void>;
  pauseDispatch: (id: string) => Promise<void>;
  resumeDispatch: (id: string) => Promise<void>;
  fetchDispatchLogs: (plantId: string) => Promise<void>;
  logGridExport: (dto: any) => Promise<void>;
  fetchGridExports: (plantId: string) => Promise<void>;
  fetchProducerAnalytics: (plantId: string) => Promise<void>;
  fetchProducerAiForecast: (plantId: string) => Promise<void>;
  fetchProducerBillingSettlements: (plantId: string) => Promise<void>;

  // DERMS Dispatch State Fields
  dermsOverview: any | null;
  dermsRules: any | null;
  dermsCurtailments: any[];
  dermsConstraints: any[];
  dermsSafetyLogs: any[];
  dermsControlLogs: any[];

  // DERMS Dispatch Actions
  fetchDermsOverview: (plantId: string) => Promise<void>;
  fetchDermsRules: (plantId: string) => Promise<void>;
  setDermsRules: (dto: any) => Promise<void>;
  triggerDermsOverride: (dto: any) => Promise<any>;
  fetchDermsCurtailments: (plantId: string) => Promise<void>;
  fetchDermsConstraints: (plantId: string) => Promise<void>;
  fetchDermsSafetyLogs: (plantId: string) => Promise<void>;
  fetchDermsControlLogs: (plantId: string) => Promise<void>;
}`;

if (!content.includes('producerPlants: any[];')) {
  if (content.includes(interfaceTarget)) {
    content = content.replace(interfaceTarget, interfaceReplacement);
    console.log('Successfully patched REOSState interface.');
  } else {
    console.error('Could not find interface target in useStore.ts.');
  }
}

// 2. ADD INITIAL STATES
const initialTarget = `  notifications: [],
  consumerInvite: null,`;

const initialReplacement = `  notifications: [],
  consumerInvite: null,

  // Producer Initial State
  producerPlants: [],
  producerFeeders: [],
  producerZones: [],
  producerConnections: [],
  producerAllocations: [],
  producerDispatches: [],
  producerDispatchLogs: [],
  producerGridExports: [],
  producerAnalytics: null,
  producerAiForecast: null,
  producerBillingSettlements: null,
  selectedProducerPlantId: null,

  // DERMS Initial State
  dermsOverview: null,
  dermsRules: null,
  dermsCurtailments: [],
  dermsConstraints: [],
  dermsSafetyLogs: [],
  dermsControlLogs: [],`;

if (!content.includes('producerPlants: [],')) {
  if (content.includes(initialTarget)) {
    content = content.replace(initialTarget, initialReplacement);
    console.log('Successfully patched initial state fields.');
  } else {
    console.error('Could not find initial target in useStore.ts.');
  }
}

// 3. LOGIC UPDATES
if (!content.includes("role === 'COMMERCIAL_ENERGY_PRODUCER'")) {
  content = content.replace(
    "const newUserType = isAdminRole ? 'ADMIN' : (savedUserType || 'PROSUMER');",
    "const newUserType = isAdminRole ? 'ADMIN' : (role === 'COMMERCIAL_ENERGY_PRODUCER' ? 'PRODUCER' : (savedUserType || 'PROSUMER'));"
  );
  content = content.replace(
    "const newRegUserType = isAdminRegRole ? 'ADMIN' : (savedUserType || 'PROSUMER');",
    "const newRegUserType = isAdminRegRole ? 'ADMIN' : (regRole === 'COMMERCIAL_ENERGY_PRODUCER' ? 'PRODUCER' : (savedUserType || 'PROSUMER'));"
  );
  console.log('Successfully patched role types.');
}

// 4. APPEND IMPLEMENTATIONS
const actionTarget = `  markNotificationRead: async (id) => {
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
}));`;

const actionReplacement = `  markNotificationRead: async (id) => {
    const { token } = get();
    try {
      await api.readNotification(id, token || undefined);
      await get().fetchUserNotifications();
    } catch (e) {
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      }));
    }
  },

  // ── Producer Action Implementations ────────────────────────────────────────
  fetchProducerPlants: async () => {
    const { token } = get();
    try {
      const data = await api.fetchProducerPlants(token || undefined);
      set({ producerPlants: data });
      if (data && data.length > 0 && !get().selectedProducerPlantId) {
        set({ selectedProducerPlantId: data[0].id });
      }
    } catch (e) {
      const mock = [
        { id: 'plant-default-123', name: 'Kano Industrial Solar Grid', type: 'HYBRID', installedCapacityKw: 2500, availableCapacityKw: 1800, gridConnectionStatus: 'CONNECTED', utilityDetails: 'TCN Kano Substation (132kV)', operatingStatus: 'OPERATIONAL', ownerInfo: 'Kano Clean Energy Consortium' }
      ];
      set({ producerPlants: mock, selectedProducerPlantId: 'plant-default-123' });
    }
  },

  registerProducerPlant: async (dto) => {
    const { token } = get();
    try {
      await api.registerProducerPlant(dto, token || undefined);
      await get().fetchProducerPlants();
    } catch (e) {
      const newPlant = { id: 'plant-' + Date.now(), ...dto, status: 'ACTIVE', operatingStatus: 'OPERATIONAL', gridConnectionStatus: dto.gridConnectionStatus || 'DISCONNECTED' };
      set(state => ({
        producerPlants: [...state.producerPlants, newPlant],
        selectedProducerPlantId: newPlant.id
      }));
    }
  },

  updateProducerPlant: async (id, dto) => {
    const { token } = get();
    try {
      await api.updateProducerPlant(id, dto, token || undefined);
      await get().fetchProducerPlants();
    } catch (e) {
      set(state => ({
        producerPlants: state.producerPlants.map(p => p.id === id ? { ...p, ...dto } : p)
      }));
    }
  },

  selectProducerPlant: (id) => {
    set({ selectedProducerPlantId: id });
  },

  fetchFeeders: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchFeeders(plantId, token || undefined);
      set({ producerFeeders: data });
    } catch (e) {
      set({ producerFeeders: [{ id: 'feeder-1', name: 'Sharada Feeder A', capacityKw: 1500, activePowerKw: 840, currentA: 1200, voltageV: 400 }] });
    }
  },

  createFeeder: async (dto) => {
    const { token } = get();
    try {
      await api.createFeeder(dto, token || undefined);
      await get().fetchFeeders(dto.plantId);
    } catch (e) {
      const newFeeder = { id: 'feeder-' + Date.now(), ...dto, activePowerKw: 0 };
      set(state => ({ producerFeeders: [...state.producerFeeders, newFeeder] }));
    }
  },

  fetchZones: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchZones(plantId, token || undefined);
      set({ producerZones: data });
    } catch (e) {
      set({ producerZones: [{ id: 'zone-1', name: 'Sharada Industrial Zone', feederId: 'feeder-1', loadLimitKw: 2000 }] });
    }
  },

  createZone: async (dto) => {
    const { token } = get();
    try {
      await api.createZone(dto, token || undefined);
      await get().fetchZones(dto.plantId);
    } catch (e) {
      const newZone = { id: 'zone-' + Date.now(), ...dto };
      set(state => ({ producerZones: [...state.producerZones, newZone] }));
    }
  },

  fetchConnections: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchConnections(plantId, token || undefined);
      set({ producerConnections: data });
    } catch (e) {
      set({
        producerConnections: [
          { id: 'conn-1', plantId, consumerId: 'user-consumer-1', smartMeterId: 'SM-882001', connectionStatus: 'CONNECTED', allocatedPowerKw: 500, actualPowerKw: 380, remainingAllocationKwh: 3450, consumer: { firstName: 'Aliyu', lastName: 'Dangote', email: 'aliyu@dangotegroup.ng' } },
          { id: 'conn-2', plantId, consumerId: 'user-consumer-2', smartMeterId: 'SM-882002', connectionStatus: 'CONNECTED', allocatedPowerKw: 300, actualPowerKw: 210, remainingAllocationKwh: 2100, consumer: { firstName: 'Ibrahim', lastName: 'Kabir', email: 'ibrahim@kabirindustries.com' } }
        ]
      });
    }
  },

  connectConsumer: async (dto) => {
    const { token } = get();
    try {
      await api.connectConsumer(dto, token || undefined);
      await get().fetchConnections(dto.plantId);
    } catch (e) {
      const newConn = { id: 'conn-' + Date.now(), ...dto, connectionStatus: 'CONNECTED', actualPowerKw: 0, remainingAllocationKwh: 5000 };
      set(state => ({ producerConnections: [...state.producerConnections, newConn] }));
    }
  },

  disconnectConsumer: async (connectionId) => {
    const { token } = get();
    try {
      await api.disconnectConsumer(connectionId, token || undefined);
      set(state => ({
        producerConnections: state.producerConnections.map(c => c.id === connectionId ? { ...c, connectionStatus: 'DISCONNECTED', actualPowerKw: 0 } : c)
      }));
    } catch (e) {
      set(state => ({
        producerConnections: state.producerConnections.map(c => c.id === connectionId ? { ...c, connectionStatus: 'DISCONNECTED', actualPowerKw: 0 } : c)
      }));
    }
  },

  reconnectConsumer: async (connectionId) => {
    const { token } = get();
    try {
      await api.reconnectConsumer(connectionId, token || undefined);
      set(state => ({
        producerConnections: state.producerConnections.map(c => c.id === connectionId ? { ...c, connectionStatus: 'CONNECTED' } : c)
      }));
    } catch (e) {
      set(state => ({
        producerConnections: state.producerConnections.map(c => c.id === connectionId ? { ...c, connectionStatus: 'CONNECTED' } : c)
      }));
    }
  },

  allocateEnergy: async (dto) => {
    const { token } = get();
    try {
      await api.allocateEnergy(dto, token || undefined);
      await get().fetchAllocations(dto.plantId);
    } catch (e) {
      const newAlloc = { id: 'alloc-' + Date.now(), ...dto, createdAt: new Date().toISOString() };
      set(state => ({ producerAllocations: [...state.producerAllocations, newAlloc] }));
    }
  },

  fetchAllocations: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchAllocations(plantId, token || undefined);
      set({ producerAllocations: data });
    } catch (e) {
      set({
        producerAllocations: [
          { id: 'alloc-1', plantId, targetType: 'FEEDER', targetId: 'Sharada Feeder A', allocatedKw: 1500, priority: 1, allocationType: 'MANUAL' }
        ]
      });
    }
  },

  dispatchEnergy: async (dto) => {
    const { token } = get();
    try {
      await api.dispatchEnergy(dto, token || undefined);
      await get().fetchDispatches(dto.plantId);
    } catch (e) {
      const newDisp = { id: 'disp-' + Date.now(), ...dto, status: 'ACTIVE', dispatchedKw: dto.allocatedKw };
      set(state => ({ producerDispatches: [...state.producerDispatches, newDisp] }));
    }
  },

  fetchDispatches: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchDispatches(plantId, token || undefined);
      set({ producerDispatches: data });
    } catch (e) {
      set({
        producerDispatches: [
          { id: 'disp-1', plantId, targetType: 'FEEDER', targetId: 'Sharada Feeder A', allocatedKw: 1500, dispatchedKw: 840, status: 'ACTIVE' }
        ]
      });
    }
  },

  pauseDispatch: async (id) => {
    const { token } = get();
    try {
      await api.pauseDispatch(id, token || undefined);
      set(state => ({
        producerDispatches: state.producerDispatches.map(d => d.id === id ? { ...d, status: 'PAUSED' } : d)
      }));
    } catch (e) {
      set(state => ({
        producerDispatches: state.producerDispatches.map(d => d.id === id ? { ...d, status: 'PAUSED' } : d)
      }));
    }
  },

  resumeDispatch: async (id) => {
    const { token } = get();
    try {
      await api.resumeDispatch(id, token || undefined);
      set(state => ({
        producerDispatches: state.producerDispatches.map(d => d.id === id ? { ...d, status: 'ACTIVE' } : d)
      }));
    } catch (e) {
      set(state => ({
        producerDispatches: state.producerDispatches.map(d => d.id === id ? { ...d, status: 'ACTIVE' } : d)
      }));
    }
  },

  fetchDispatchLogs: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchDispatchLogs(plantId, token || undefined);
      set({ producerDispatchLogs: data });
    } catch (e) {
      set({
        producerDispatchLogs: [
          { id: 'log-1', action: 'START', details: 'Dispatched 840kW to Feeder A', timestamp: new Date().toISOString() }
        ]
      });
    }
  },

  logGridExport: async (dto) => {
    const { token } = get();
    try {
      await api.logGridExport(dto, token || undefined);
    } catch (e) {}
  },

  fetchGridExports: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchGridExports(plantId, token || undefined);
      set({ producerGridExports: data });
    } catch (e) {}
  },

  fetchProducerAnalytics: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchProducerAnalytics(plantId, token || undefined);
      set({ producerAnalytics: data });
    } catch (e) {
      set({
        producerAnalytics: {
          liveGenerationKw: 1680.0,
          liveLoadKw: 1120.0,
          gridExportKw: 310.0,
          batterySocPercent: 72,
          batteryVoltage: 402,
          powerQuality: { voltageV: 230.5, frequencyHz: 50.01, powerFactor: 0.992 },
          efficiencyPct: 98.2,
          lossesKw: 42.0,
          faultsCount: 0,
          historicalGenKwh: { daily: [420, 890, 1540, 1680, 1610, 950, 210] }
        }
      });
    }
  },

  fetchProducerAiForecast: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchProducerAiForecast(plantId, token || undefined);
      set({ producerAiForecast: data });
    } catch (e) {
      set({
        producerAiForecast: {
          timeLabels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
          generationForecastKw: [800, 1400, 2100, 2300, 1700, 400],
          demandForecastKw: [900, 1100, 1200, 1150, 1050, 950],
          batterySocForecastPercent: [50, 70, 90, 100, 95, 80],
          lossForecastKw: [20, 35, 50, 55, 40, 10],
          revenueForecast: { directConsumer: 4200000, gridExport: 180000, unallocatedSurplus: 45000 },
          recommendations: [
            { id: 'ai-rec-1', priority: 'HIGH', title: 'Solar Peak Export Optimization', description: 'Surplus generation peak predicted between 12:00 and 14:00. Increase grid exports to capture higher peak tariffs.', savingsImpact: '₦45,000/day' },
            { id: 'ai-rec-2', priority: 'MEDIUM', title: 'Battery Peak Shaving Schedule', description: 'Discharge battery bank between 18:00 and 20:00 to shave off peak tariff rates for residential consumers.', savingsImpact: '₦22,000/day' }
          ]
        }
      });
    }
  },

  fetchProducerBillingSettlements: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchProducerBillingSettlements(plantId, token || undefined);
      set({ producerBillingSettlements: data });
    } catch (e) {
      set({
        producerBillingSettlements: {
          outstandingPayments: 340000,
          totalBillingRevenue: 8900000,
          escrowLockedBalance: 1200000,
          walletBalance: 7700000,
          gridExportRevenue: 540000,
          settlementReports: [
            { month: 'June 2026', energySoldMwh: 48.5, revenue: 2425000, status: 'SETTLED' },
            { month: 'May 2026', energySoldMwh: 52.1, revenue: 2605000, status: 'SETTLED' }
          ],
          transactions: [
            { id: 'tx-1', consumerName: 'Dangote Group', energySoldKwh: 3450, amount: 172500, date: '2026-07-15T12:00:00Z', status: 'PAID' },
            { id: 'tx-2', consumerName: 'Kabir Industries', energySoldKwh: 2100, amount: 105000, date: '2026-07-14T11:00:00Z', status: 'PENDING' }
          ]
        }
      });
    }
  },

  // ── DERMS Dispatch Action Implementations ──────────────────────────────────
  fetchDermsOverview: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchLiveDispatchOverview(plantId, token || undefined);
      set({ dermsOverview: data });
    } catch (e) {
      set({
        dermsOverview: {
          plantId,
          liveGenerationKw: 1680.0,
          liveLoadKw: 1120.0,
          batterySocPercent: 72,
          batteryKw: 250.0,
          gridKw: 260.0,
          curtailedKw: 0.0,
          curtailmentStatus: 'INACTIVE',
          rules: { maxExportPowerKw: 500, batteryMinSoc: 20, batteryReserveSoc: 50 }
        }
      });
    }
  },

  fetchDermsRules: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchDispatchRules(plantId, token || undefined);
      set({ dermsRules: data });
    } catch (e) {
      set({
        dermsRules: {
          plantId,
          maxExportPowerKw: 500.0,
          maxDailyExportKwh: 5000.0,
          batteryMinSoc: 20.0,
          batteryReserveSoc: 50.0,
          gridExportAllowed: true,
          gridImportAllowed: true,
          priorityOrder: ['CRITICAL', 'CONSUMERS', 'BATTERY', 'GRID', 'CURTAIL']
        }
      });
    }
  },

  setDermsRules: async (dto) => {
    const { token } = get();
    try {
      const data = await api.setDispatchRules(dto, token || undefined);
      set({ dermsRules: data });
    } catch (e) {
      set(state => ({
        dermsRules: state.dermsRules ? { ...state.dermsRules, ...dto } : dto
      }));
    }
  },

  triggerDermsOverride: async (dto) => {
    const { token } = get();
    try {
      return await api.triggerOverride(dto, token || undefined);
    } catch (e) {
      const mockResult = {
        id: 'cmd-' + Date.now(),
        status: 'EXECUTED',
        timestamp: new Date().toISOString(),
        ...dto
      };
      set(state => ({
        dermsControlLogs: [mockResult, ...state.dermsControlLogs]
      }));
      return mockResult;
    }
  },

  fetchDermsCurtailments: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchCurtailments(plantId, token || undefined);
      set({ dermsCurtailments: data });
    } catch (e) {
      set({
        dermsCurtailments: [
          { id: 'curtail-1', plantId, triggeredAt: new Date().toISOString(), resolvedAt: null, curtailedKw: 120.0, originalCapacityKw: 1800.0, reason: 'GRID_OVERVOLTAGE', status: 'ACTIVE' }
        ]
      });
    }
  },

  fetchDermsConstraints: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchGridConstraints(plantId, token || undefined);
      set({ dermsConstraints: data });
    } catch (e) {
      set({
        dermsConstraints: [
          { id: 'const-1', constraintType: 'EXPORT_CAP', limitValue: 500.0, isActive: true },
          { id: 'const-2', constraintType: 'GRID_VOLTAGE_MAX', limitValue: 245.0, isActive: true }
        ]
      });
    }
  },

  fetchDermsSafetyLogs: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchSafetyInterlockLogs(plantId, token || undefined);
      set({ dermsSafetyLogs: data });
    } catch (e) {
      set({
        dermsSafetyLogs: [
          { timestamp: new Date().toISOString(), level: 'WARNING', category: 'SAFETY', message: 'Safety Interlock Triggered: Battery SOC (18%) is below configured Min SOC (20%). Discharging blocked.' }
        ]
      });
    }
  },

  fetchDermsControlLogs: async (plantId) => {
    const { token } = get();
    try {
      const data = await api.fetchControlLogs(plantId, token || undefined);
      set({ dermsControlLogs: data });
    } catch (e) {
      set({
        dermsControlLogs: [
          { id: 'cmd-1', targetDevice: 'INVERTER_01', commandType: 'CURTAIL_INVERTER', status: 'EXECUTED', timestamp: new Date().toISOString() }
        ]
      });
    }
  }
}`;

if (!content.includes('fetchProducerPlants: async () => {')) {
  if (content.includes(actionTarget)) {
    content = content.replace(actionTarget, actionReplacement);
    console.log('Successfully patched action implementations.');
  } else {
    console.error('Could not find action target in useStore.ts.');
  }
}

// Restore line endings
if (originalHasCrlf) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Finished updating useStore.ts.');

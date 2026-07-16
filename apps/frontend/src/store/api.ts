import { UserRole } from '@reos/types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Request failed');
  }
  const json = await response.json();
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data;
  }
  return json;
};

export const api = {
  async chatWithAi(messages: ChatMessage[], token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages }),
    });

    return handleResponse(response);
  },

  // Auth endpoints
  async login(credentials: any) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  async register(data: any) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async fetchCurrentUser(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // Sizing endpoints (if we want to delegate calculations to the backend)
  async runLoadAnalysis(data: any) {
    const response = await fetch(`${API_BASE_URL}/engineering/load-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async runPvSizing(data: any) {
    const response = await fetch(`${API_BASE_URL}/engineering/pv-sizing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async runBatterySizing(data: any) {
    const response = await fetch(`${API_BASE_URL}/engineering/battery-sizing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async runInverterSizing(data: any) {
    const response = await fetch(`${API_BASE_URL}/engineering/inverter-sizing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async runCableSizing(data: any) {
    const response = await fetch(`${API_BASE_URL}/engineering/cable-sizing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // IoT & Telemetry endpoints
  async fetchDevices(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/iot/devices`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async registerDevice(device: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/iot/devices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(device),
    });
    return handleResponse(response);
  },

  async removeDevice(id: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/iot/devices/${id}`, { method: 'DELETE', headers });
    return handleResponse(response);
  },

  async fetchLiveTelemetry(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/iot/telemetry/live`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async setGridExport(enabled: boolean, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/iot/grid-export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ enabled }),
    });
    return handleResponse(response);
  },

  async setNeighbourTransfer(enabled: boolean, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/iot/neighbour-transfer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ enabled }),
    });
    return handleResponse(response);
  },

  async setEdgeGatewayBuffering(enabled: boolean, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/iot/edge-gateway/buffering`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ enabled }),
    });
    return handleResponse(response);
  },

  async fetchAlerts(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/iot/alerts`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async acknowledgeAlert(id: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/iot/alerts/${id}/acknowledge`, { method: 'POST', headers });
    return handleResponse(response);
  },

  // Consumer API Endpoints
  async createInvitation(tariffRate: number, billingCycle: string, email?: string, phoneNumber?: string, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/consumer/invite`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tariffRate, billingCycle, email, phoneNumber }),
    });
    return handleResponse(response);
  },

  async getInvitation(code: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/consumer/invitation/${code}`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async acceptInvitation(invitationCode: string, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/consumer/accept`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ invitationCode }),
    });
    return handleResponse(response);
  },

  async fetchActiveContract(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/consumer/contract`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async fetchBillingSummary(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/consumer/billing`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async topUpWallet(amount: number, paymentGateway: string, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/consumer/topup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount, paymentGateway }),
    });
    return handleResponse(response);
  },

  async payInvoice(invoiceId: string, paymentGateway: string, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/consumer/pay-invoice/${invoiceId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ paymentGateway }),
    });
    return handleResponse(response);
  },

  async fetchNotifications(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/consumer/notifications`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async readNotification(id: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/consumer/notifications/${id}/read`, { method: 'POST', headers });
    return handleResponse(response);
  },

  // Producer API Endpoints
  async fetchProducerPlants(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async registerProducerPlant(dto: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  },

  async updateProducerPlant(id: string, dto: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  },

  async fetchProducerPlantDetails(id: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${id}`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async createFeeder(dto: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/feeders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  },

  async fetchFeeders(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${plantId}/feeders`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async createDistributionZone(dto: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/zones`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  },

  async fetchDistributionZones(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${plantId}/zones`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async connectConsumerToFeeder(dto: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/connections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  },

  async fetchConnections(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${plantId}/connections`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async disconnectConsumer(connectionId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/connections/${connectionId}/disconnect`, { method: 'POST', headers });
    return handleResponse(response);
  },

  async reconnectConsumer(connectionId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/connections/${connectionId}/reconnect`, { method: 'POST', headers });
    return handleResponse(response);
  },

  async allocateEnergy(dto: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/allocations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  },

  async fetchAllocations(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${plantId}/allocations`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async dispatchEnergy(dto: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/dispatch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  },

  async fetchDispatches(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${plantId}/dispatch`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async pauseDispatch(id: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/dispatch/${id}/pause`, { method: 'POST', headers });
    return handleResponse(response);
  },

  async resumeDispatch(id: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/dispatch/${id}/resume`, { method: 'POST', headers });
    return handleResponse(response);
  },

  async fetchDispatchLogs(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${plantId}/dispatch-logs`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async logGridExport(dto: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/grid-export`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  },

  async fetchGridExports(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${plantId}/grid-export`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async fetchProducerAnalytics(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${plantId}/analytics`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async fetchProducerAiForecast(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${plantId}/ai-forecast`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async fetchProducerBillingSettlements(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/producer/plants/${plantId}/billing-settlements`, { method: 'GET', headers });
    return handleResponse(response);
  },

  // DERMS Dispatch API Endpoints
  async fetchLiveDispatchOverview(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/dispatch/${plantId}/overview`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async fetchDispatchRules(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/dispatch/${plantId}/rules`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async setDispatchRules(dto: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/dispatch/rules`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  },

  async triggerOverride(dto: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/dispatch/override`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  },

  async fetchCurtailments(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/dispatch/${plantId}/curtailments`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async fetchGridConstraints(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/dispatch/${plantId}/constraints`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async fetchSafetyInterlockLogs(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/dispatch/${plantId}/safety-logs`, { method: 'GET', headers });
    return handleResponse(response);
  },

  async fetchControlLogs(plantId: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/dispatch/${plantId}/control-logs`, { method: 'GET', headers });
    return handleResponse(response);
  }
};

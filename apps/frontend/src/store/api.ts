import { UserRole } from '@reos/types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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

    if (!response.ok) {
      throw new Error(`AI Request failed with status ${response.status}`);
    }

    return response.json(); // returns { content: string, tokensUsed?: number }
  },

  // Auth endpoints
  async login(credentials: any) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Login failed');
    }
    return response.json(); // returns { accessToken: string, user: any }
  },

  async register(data: any) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Registration failed');
    }
    return response.json(); // returns { accessToken: string, user: any }
  },

  async fetchCurrentUser(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch current user');
    }
    return response.json();
  },

  // Sizing endpoints (if we want to delegate calculations to the backend)
  async runLoadAnalysis(data: any) {
    const response = await fetch(`${API_BASE_URL}/engineering/load-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async runPvSizing(data: any) {
    const response = await fetch(`${API_BASE_URL}/engineering/pv-sizing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async runBatterySizing(data: any) {
    const response = await fetch(`${API_BASE_URL}/engineering/battery-sizing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async runInverterSizing(data: any) {
    const response = await fetch(`${API_BASE_URL}/engineering/inverter-sizing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async runCableSizing(data: any) {
    const response = await fetch(`${API_BASE_URL}/engineering/cable-sizing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // IoT & Telemetry endpoints
  async fetchDevices(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/iot/devices`, { method: 'GET', headers }).then(res => res.json());
  },

  async registerDevice(device: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/iot/devices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(device),
    }).then(res => res.json());
  },

  async removeDevice(id: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/iot/devices/${id}`, { method: 'DELETE', headers }).then(res => res.json());
  },

  async fetchLiveTelemetry(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/iot/telemetry/live`, { method: 'GET', headers }).then(res => res.json());
  },

  async setGridExport(enabled: boolean, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/iot/grid-export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ enabled }),
    }).then(res => res.json());
  },

  async setNeighbourTransfer(enabled: boolean, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/iot/neighbour-transfer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ enabled }),
    }).then(res => res.json());
  },

  async setEdgeGatewayBuffering(enabled: boolean, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/iot/edge-gateway/buffering`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ enabled }),
    }).then(res => res.json());
  },

  async fetchAlerts(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/iot/alerts`, { method: 'GET', headers }).then(res => res.json());
  },

  async acknowledgeAlert(id: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/iot/alerts/${id}/acknowledge`, { method: 'POST', headers }).then(res => res.json());
  },

  // Consumer API Endpoints
  async createInvitation(tariffRate: number, billingCycle: string, email?: string, phoneNumber?: string, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/consumer/invite`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tariffRate, billingCycle, email, phoneNumber }),
    }).then(res => res.json());
  },

  async getInvitation(code: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/consumer/invitation/${code}`, { method: 'GET', headers }).then(res => res.json());
  },

  async acceptInvitation(invitationCode: string, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/consumer/accept`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ invitationCode }),
    }).then(res => res.json());
  },

  async fetchActiveContract(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/consumer/contract`, { method: 'GET', headers }).then(res => res.json());
  },

  async fetchBillingSummary(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/consumer/billing`, { method: 'GET', headers }).then(res => res.json());
  },

  async topUpWallet(amount: number, paymentGateway: string, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/consumer/topup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount, paymentGateway }),
    }).then(res => res.json());
  },

  async payInvoice(invoiceId: string, paymentGateway: string, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/consumer/pay-invoice/${invoiceId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ paymentGateway }),
    }).then(res => res.json());
  },

  async fetchNotifications(token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/consumer/notifications`, { method: 'GET', headers }).then(res => res.json());
  },

  async readNotification(id: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/consumer/notifications/${id}/read`, { method: 'POST', headers }).then(res => res.json());
  }
};


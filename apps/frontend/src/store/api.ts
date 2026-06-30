import { UserRole } from '@reos/types';

const API_BASE_URL = 'http://localhost:3000/api';

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
  }
};

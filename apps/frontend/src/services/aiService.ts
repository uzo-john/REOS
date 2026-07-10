// REOS AI Service — Real LLM integration with configurable provider
// Configure your API key in apps/backend/.env (AI_PROVIDER, OPENAI_API_KEY, GEMINI_API_KEY)

const API_BASE = 'http://localhost:3000/api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIServiceConfig {
  provider: 'openai' | 'gemini' | 'mock';
  model?: string;
}

// AI Chat via backend proxy (keeps API keys server-side)
export const aiChat = async (
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt }),
    });
    if (!response.ok) throw new Error('AI backend unavailable');
    const data = await response.json();
    return data.content || data.message || 'No response from AI.';
  } catch {
    // Fallback: intelligent mock responses for demo
    return generateMockAIResponse(messages);
  }
};

// AI Forecasting
export const fetchSolarForecast = async (plantId?: string) => {
  try {
    const res = await fetch(`${API_BASE}/ai/forecast/solar${plantId ? `?plantId=${plantId}` : ''}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return generateMockSolarForecast();
  }
};

export const fetchLoadForecast = async (plantId?: string) => {
  try {
    const res = await fetch(`${API_BASE}/ai/forecast/load${plantId ? `?plantId=${plantId}` : ''}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return generateMockLoadForecast();
  }
};

export const fetchAIInsights = async () => {
  try {
    const res = await fetch(`${API_BASE}/ai/insights`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return generateMockInsights();
  }
};

// ── Mock Generators (used when backend unavailable) ──────────────────────────

export function generateMockAIResponse(messages: ChatMessage[]): string {
  const last = messages[messages.length - 1]?.content?.toLowerCase() || '';
  if (last.includes('battery') || last.includes('soc'))
    return '🔋 Based on current telemetry, your battery SoC is at 82%. I recommend setting a charge threshold of 90% during peak solar hours (10 AM–3 PM) to maximize storage. This can reduce your grid dependency by up to 35%.';
  if (last.includes('solar') || last.includes('pv') || last.includes('panel'))
    return '☀️ Your solar generation is performing at 94% of the expected output. The slight underperformance may be due to dust accumulation on modules. I recommend a cleaning cycle this weekend. Estimated recovery: +8% generation efficiency.';
  if (last.includes('bill') || last.includes('cost') || last.includes('tariff'))
    return '💰 Based on your consumption pattern, switching to Time-of-Use tariff optimization could save you ₦12,400/month. Your peak consumption window is 6–9 PM — consider scheduling heavy loads to solar peak hours instead.';
  if (last.includes('alarm') || last.includes('alert') || last.includes('fault'))
    return '⚠️ The grid undervoltage alarm (228V) is within acceptable range but trending downward. I recommend checking your AVR settings. No immediate action required, but flag for next maintenance visit.';
  if (last.includes('forecast') || last.includes('tomorrow') || last.includes('predict'))
    return '📈 Tomorrow\'s solar forecast: Peak generation expected between 10 AM–2 PM (estimated 4.2 kWh). Morning cloud cover possible before 9 AM. Recommend pre-charging battery to 95% tonight for maximum autonomy tomorrow.';
  return '🤖 I\'m your REOS AI Energy Assistant. I can help you analyze solar performance, optimize battery usage, explain billing, forecast generation, detect anomalies, and provide energy-saving recommendations. What would you like to explore?';
}

export function generateMockSolarForecast() {
  const hourly = Array.from({ length: 24 }, (_, h) => {
    if (h < 6 || h > 18) return 0;
    const peak = Math.sin(((h - 6) / 12) * Math.PI);
    return parseFloat((peak * (3.5 + Math.random() * 1.2)).toFixed(2));
  });
  const daily = Array.from({ length: 7 }, () =>
    parseFloat((18 + Math.random() * 8).toFixed(1))
  );
  return { hourly, daily, confidence: 87, modelUsed: 'REOS-Solar-v2', generatedAt: new Date().toISOString() };
}

export function generateMockLoadForecast() {
  const hourly = Array.from({ length: 24 }, (_, h) => {
    const base = h >= 6 && h <= 22 ? 1.8 : 0.6;
    const peak = (h >= 18 && h <= 21) ? 2.4 : base;
    return parseFloat((peak + Math.random() * 0.4).toFixed(2));
  });
  const daily = Array.from({ length: 7 }, () =>
    parseFloat((28 + Math.random() * 6).toFixed(1))
  );
  return { hourly, daily, confidence: 91, modelUsed: 'REOS-Load-v2', generatedAt: new Date().toISOString() };
}

export function generateMockInsights() {
  return [
    {
      id: 'ins-1', type: 'SAVING', title: 'Battery Dispatch Optimization',
      description: 'Shifting 2.1 kWh of evening load to battery discharge window could save ₦8,200/month.',
      impact: 'HIGH', savings: 8200, currency: 'NGN', actionable: true, timestamp: new Date().toISOString(),
    },
    {
      id: 'ins-2', type: 'ANOMALY', title: 'Inverter Efficiency Drop',
      description: 'Inverter efficiency has dropped from 97.4% to 95.1% over the past 7 days. Possible MPPT mismatch.',
      impact: 'MEDIUM', actionable: true, timestamp: new Date().toISOString(),
    },
    {
      id: 'ins-3', type: 'MAINTENANCE', title: 'Panel Cleaning Recommended',
      description: 'Soiling loss estimated at 6.3%. Last cleaning: 34 days ago. Recommend cleaning before end of week.',
      impact: 'MEDIUM', savings: 3400, currency: 'NGN', actionable: true, timestamp: new Date().toISOString(),
    },
    {
      id: 'ins-4', type: 'OPTIMIZATION', title: 'P2P Trade Window',
      description: 'Your neighbour network has 3 active buyers. Current surplus: 1.8 kW. Recommend listing at ₦195/kWh.',
      impact: 'HIGH', savings: 5850, currency: 'NGN', actionable: true, timestamp: new Date().toISOString(),
    },
    {
      id: 'ins-5', type: 'FORECAST', title: 'High Generation Week Ahead',
      description: 'Weather models predict above-average irradiance next week (+22%). Consider battery pre-conditioning.',
      impact: 'LOW', actionable: false, timestamp: new Date().toISOString(),
    },
  ];
}
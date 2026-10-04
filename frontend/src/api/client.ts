import {
  HealthResponse,
  RiskPrediction,
  DistrictForecast,
  SubscriptionCreate,
  Subscription,
  Alert,
  ModelMetricsResponse,
  DemoEventRequest,
  HazardType,
  District
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error(`[DRIS API Error] Request to ${endpoint} failed:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: (): Promise<HealthResponse> => fetchJSON<HealthResponse>('/health'),

  // Risk Predictions & Map
  getRisk: (hazard?: HazardType | 'all', state?: string, district?: string): Promise<RiskPrediction[]> => {
    const params = new URLSearchParams();
    if (hazard && hazard !== 'all') params.append('hazard', hazard);
    if (state) params.append('state', state);
    if (district) params.append('district', district);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJSON<RiskPrediction[]>(`/api/risk${query}`);
  },

  // Districts GeoJSON
  getDistricts: (): Promise<District[]> => fetchJSON<District[]>('/api/districts'),

  // District 7-day Forecast
  getDistrictForecast: (districtId: string, hazard: HazardType = 'flood'): Promise<DistrictForecast> => {
    return fetchJSON<DistrictForecast>(`/api/risk/${districtId}/forecast?hazard=${hazard}`);
  },

  // Subscriptions
  subscribe: (data: SubscriptionCreate): Promise<Subscription> => {
    return fetchJSON<Subscription>('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  unsubscribe: (subscriptionId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJSON<{ success: boolean; message: string }>(`/api/subscribe/${subscriptionId}`, {
      method: 'DELETE',
    });
  },

  // Alerts History
  getAlerts: (): Promise<Alert[]> => fetchJSON<Alert[]>('/api/alerts'),

  // Model Metrics
  getModelMetrics: (): Promise<ModelMetricsResponse> => fetchJSON<ModelMetricsResponse>('/api/models/metrics'),

  // Admin / Demo
  triggerDemoEvent: (data: DemoEventRequest, adminToken: string): Promise<Alert> => {
    return fetchJSON<Alert>('/api/admin/demo-event', {
      method: 'POST',
      headers: {
        'X-Admin-Token': adminToken,
      },
      body: JSON.stringify(data),
    });
  },

  testAlertChannel: (adminToken: string, channel: string = 'console'): Promise<{ success: boolean; message: string }> => {
    return fetchJSON<{ success: boolean; message: string }>('/api/admin/alerts/test', {
      method: 'POST',
      headers: {
        'X-Admin-Token': adminToken,
      },
      body: JSON.stringify({ channel }),
    });
  }
};

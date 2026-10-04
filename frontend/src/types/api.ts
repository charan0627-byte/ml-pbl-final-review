export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe';
export type HazardType = 'flood' | 'heatwave' | 'drought';
export type ContactType = 'email' | 'sms';
export type Language = 'en' | 'hi' | 'ta';

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  version: string;
  alert_mode: string;
  demo_mode: boolean;
  districts_loaded: number;
}

export interface District {
  id: string;
  district_name: string;
  state_name: string;
  lat: number;
  lon: number;
  geojson?: any;
}

export interface ForecastDay {
  date: string;
  risk_level: RiskLevel;
  probability: number;
  rainfall_mm: number;
  temp_max_c: number;
  humidity_pct: number;
  river_level_m?: number;
  explanation: string;
}

export interface RiskPrediction {
  district_id: string;
  district_name: string;
  state_name: string;
  hazard_type: HazardType;
  risk_level: RiskLevel;
  probability: number;
  prediction_date: string;
  top_factors: string[];
  is_fallback: boolean;
  is_simulated: boolean;
}

export interface DistrictForecast {
  district_id: string;
  district_name: string;
  state_name: string;
  hazard_type: HazardType;
  current_risk_level: RiskLevel;
  current_probability: number;
  forecast_days: ForecastDay[];
  top_factors: string[];
  is_fallback: boolean;
  is_simulated: boolean;
  last_updated: string;
}

export interface SubscriptionCreate {
  subscriber_name: string;
  contact_type: ContactType;
  contact_value: string;
  district_ids: string[];
  hazards: string[];
  min_threshold: string;
  language: Language;
}

export interface Subscription {
  id: string;
  subscriber_name: string;
  contact_type: ContactType;
  contact_value: string;
  district_ids: string[];
  hazards: string[];
  min_threshold: string;
  language: Language;
  is_active: boolean;
  created_at: string;
}

export interface Alert {
  id: string;
  district_id: string;
  district_name?: string;
  state_name?: string;
  hazard_type: HazardType;
  risk_level: RiskLevel;
  probability: number;
  headline: string;
  message_en: string;
  message_hi: string;
  cap_xml: string;
  safety_actions: string[];
  source: string;
  is_demo: boolean;
  created_at: string;
}

export interface SingleModelMetric {
  model_name: string;
  hazard_type: HazardType;
  model_version: string;
  trained_date: string;
  test_period: string;
  precision: number;
  recall: number;
  f1_score: number;
  pr_auc: number;
  false_alarm_rate: number;
  confusion_matrix: number[][];
  top_features: Array<{ feature: string; importance: number }>;
  calibration_status: string;
}

export interface ModelMetricsResponse {
  models: SingleModelMetric[];
}

export interface DemoEventRequest {
  district_id: string;
  hazard_type?: HazardType;
  risk_level?: RiskLevel;
  probability?: number;
}

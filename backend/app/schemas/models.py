from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

# --- Health ---
class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "DRIS Backend API"
    timestamp: str
    version: str = "1.0.0"
    alert_mode: str = "console"
    demo_mode: bool = False
    districts_loaded: int = 0

# --- GeoJSON & District ---
class DistrictProperties(BaseModel):
    district_id: str
    district_name: str
    state_name: str
    lat: float
    lon: float
    iso_code: str = "IN"
    source: str = "Government of India Official Boundaries (Simplified)"
    data_status: str = "REAL_GEOGRAPHY"

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    properties: DistrictProperties
    geometry: Dict[str, Any]

class DistrictResponse(BaseModel):
    id: str
    district_name: str
    state_name: str
    lat: float
    lon: float
    geojson: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

# --- Risk & Forecast ---
class ForecastDay(BaseModel):
    date: str
    risk_level: str  # Low, Moderate, High, Severe
    probability: float
    rainfall_mm: float
    temp_max_c: float
    humidity_pct: float
    river_level_m: Optional[float] = None
    explanation: str

class RiskPredictionResponse(BaseModel):
    district_id: str
    district_name: str
    state_name: str
    hazard_type: str
    risk_level: str
    probability: float
    prediction_date: str
    top_factors: List[str]
    is_fallback: bool
    is_simulated: bool

class DistrictForecastResponse(BaseModel):
    district_id: str
    district_name: str
    state_name: str
    hazard_type: str
    current_risk_level: str
    current_probability: float
    forecast_days: List[ForecastDay]
    top_factors: List[str]
    is_fallback: bool
    is_simulated: bool
    last_updated: str

# --- Subscriptions ---
class SubscriptionCreate(BaseModel):
    subscriber_name: str = Field(..., min_length=2, max_length=100)
    contact_type: str = Field(..., description="email or sms")
    contact_value: str = Field(..., min_length=3, max_length=150)
    district_ids: List[str] = Field(default=["ALL"])
    hazards: List[str] = Field(default=["ALL"])
    min_threshold: str = Field(default="High")
    language: str = Field(default="en")

class SubscriptionResponse(BaseModel):
    id: str
    subscriber_name: str
    contact_type: str
    contact_value: str
    district_ids: List[str]
    hazards: List[str]
    min_threshold: str
    language: str
    is_active: bool
    created_at: str

    model_config = ConfigDict(from_attributes=True)

# --- Alerts ---
class AlertResponse(BaseModel):
    id: str
    district_id: str
    district_name: Optional[str] = None
    state_name: Optional[str] = None
    hazard_type: str
    risk_level: str
    probability: float
    headline: str
    message_en: str
    message_hi: str
    cap_xml: str
    safety_actions: List[str]
    source: str
    is_demo: bool
    created_at: str

    model_config = ConfigDict(from_attributes=True)

# --- Model Metrics ---
class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float

class SingleModelMetric(BaseModel):
    model_name: str
    hazard_type: str
    model_version: str
    trained_date: str
    test_period: str
    precision: float
    recall: float
    f1_score: float
    pr_auc: float
    false_alarm_rate: float
    confusion_matrix: List[List[int]]
    top_features: List[FeatureImportanceItem]
    calibration_status: str

class ModelMetricsResponse(BaseModel):
    models: List[SingleModelMetric]

# --- Admin & Demo ---
class DemoEventRequest(BaseModel):
    district_id: str
    hazard_type: str = "flood"  # flood, heatwave, drought
    risk_level: str = "Severe"  # High or Severe
    probability: float = 0.92

class TestAlertRequest(BaseModel):
    subscriber_id: Optional[str] = None
    test_contact: Optional[str] = None
    channel: str = "console"

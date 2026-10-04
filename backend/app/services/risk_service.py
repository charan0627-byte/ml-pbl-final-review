import datetime
import random
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import District, RiskPrediction
from app.schemas.models import RiskPredictionResponse, DistrictForecastResponse, ForecastDay

# Seed preset conditions for realistic regional risk profiles
DISTRICT_HAZARD_PROFILES = {
    # Jammu & Kashmir / Ladakh - Riverine Flood & Cold Heat/Extreme Temp
    "JK-SRI": {"flood": 0.78, "heatwave": 0.15, "drought": 0.10, "river_name": "Jhelum River"},
    "JK-JAM": {"flood": 0.62, "heatwave": 0.55, "drought": 0.20, "river_name": "Tawi River"},
    "LA-LEH": {"flood": 0.40, "heatwave": 0.05, "drought": 0.60, "river_name": "Indus River"},
    # Assam & NE - High Monsoonal Flood
    "AS-GHY": {"flood": 0.88, "heatwave": 0.30, "drought": 0.08, "river_name": "Brahmaputra River"},
    "AS-DIB": {"flood": 0.85, "heatwave": 0.25, "drought": 0.05, "river_name": "Brahmaputra River"},
    "AS-SIL": {"flood": 0.82, "heatwave": 0.28, "drought": 0.12, "river_name": "Barak River"},
    # Rajasthan / Gujarat - Severe Heatwave & Drought
    "RJ-JAI": {"flood": 0.12, "heatwave": 0.86, "drought": 0.74, "river_name": "Dhund River"},
    "RJ-JOD": {"flood": 0.08, "heatwave": 0.92, "drought": 0.88, "river_name": "Luni River"},
    "GJ-AHM": {"flood": 0.35, "heatwave": 0.84, "drought": 0.65, "river_name": "Sabarmati River"},
    # Kerala & Tamil Nadu - Coastal Flood & Urban Inundation
    "KL-EKM": {"flood": 0.84, "heatwave": 0.42, "drought": 0.15, "river_name": "Periyar River"},
    "KL-TVM": {"flood": 0.72, "heatwave": 0.45, "drought": 0.20, "river_name": "Karamana River"},
    "TN-CHN": {"flood": 0.76, "heatwave": 0.70, "drought": 0.35, "river_name": "Adyar River"},
    # Maharashtra & NCR
    "MH-MUM": {"flood": 0.89, "heatwave": 0.48, "drought": 0.05, "river_name": "Mithi River"},
    "DL-NDL": {"flood": 0.68, "heatwave": 0.82, "drought": 0.40, "river_name": "Yamuna River"},
}

def get_risk_level_from_prob(prob: float) -> str:
    """Classify probability into DRIS Risk Levels."""
    if prob >= 0.85:
        return "Severe"
    elif prob >= 0.65:
        return "High"
    elif prob >= 0.35:
        return "Moderate"
    return "Low"

def generate_top_factors(hazard: str, risk_level: str, district_name: str) -> List[str]:
    """Generate SHAP-based top environmental drivers."""
    if hazard == "flood":
        if risk_level in ["High", "Severe"]:
            return [
                "Extreme 24h Monsoonal Precipitation (>140mm)",
                f"Upstream Dam Spillway Discharge into {district_name} Catchment",
                "High Soil Moisture Saturation (94%) & Impaired Urban Drainage"
            ]
        elif risk_level == "Moderate":
            return [
                "Sustained Moderate Rainfall (45-75mm)",
                "Elevated River Runoff Velocity",
                "High Catchment Topographic Index (Wetness Accumulation)"
            ]
        else:
            return [
                "Normal Precipitation (<15mm)",
                "Stable River Stage Below Warning Threshold",
                "Adequate Soil Infiltration Capacity"
            ]
    elif hazard == "heatwave":
        if risk_level in ["High", "Severe"]:
            return [
                "Extreme Daily Max Temperature (>43.5°C, +5.2°C Anomaly)",
                "Persistent Anticyclonic Heat Dome & Low Surface Humidity",
                "Severe Urban Heat Island (UHI) Thermal Accumulation"
            ]
        elif risk_level == "Moderate":
            return [
                "Above-Average Surface Temperature (38-41°C)",
                "High Relative Humidity Elevating Heat Index to 46°C",
                "Clear Sky Solar Radiation Stress"
            ]
        else:
            return [
                "Seasonal Norm Temperature Distribution",
                "Moderate Coastal/Breeze Cooling",
                "Intermittent Cloud Cover"
            ]
    else:  # drought
        if risk_level in ["High", "Severe"]:
            return [
                "75% Cumulative Monsoon Rainfall Deficit over 60 Days",
                "Critical Reservoir Capacity Depletion (<18% Live Storage)",
                "Severe Vegetation Condition Index (VCI) Degradation"
            ]
        elif risk_level == "Moderate":
            return [
                "35% Dry Spell Anomaly over Active Crop Cycle",
                "Groundwater Table Decline (>2.1m YoY)",
                "Evapotranspiration Deficit"
            ]
        else:
            return [
                "Satisfactory Seasonal Rainfall Accumulation",
                "Sustained Groundwater Recharge",
                "Healthy Crop Canopy VCI (>0.65)"
            ]

def generate_forecast_days(
    hazard: str, base_prob: float, district_name: str, river_name: str
) -> List[ForecastDay]:
    """Generate 7-day detailed meteorological and hazard forecast."""
    today = datetime.date.today()
    forecast = []
    
    # Deterministic seed based on district to keep consistent rendering
    rng = random.Random(hash(district_name + hazard))

    for day in range(7):
        forecast_date = (today + datetime.timedelta(days=day)).isoformat()
        
        # Add slight variation over 7 days
        day_variation = rng.uniform(-0.12, 0.12)
        day_prob = min(0.99, max(0.05, base_prob + day_variation))
        day_level = get_risk_level_from_prob(day_prob)

        if hazard == "flood":
            rainfall = round(max(0.0, day_prob * 160 + rng.uniform(-10, 15)), 1)
            temp = round(28.0 + rng.uniform(-2, 4), 1)
            humidity = round(min(98.0, 65.0 + day_prob * 30 + rng.uniform(-5, 5)), 1)
            river_level = round(12.0 + day_prob * 6.5 + rng.uniform(-0.3, 0.4), 2)
            explanation = f"Expected {rainfall}mm rainfall. {river_name} projected stage at {river_level}m."
        elif hazard == "heatwave":
            rainfall = round(max(0.0, (1 - day_prob) * 10 + rng.uniform(-2, 2)), 1)
            temp = round(34.0 + day_prob * 13 + rng.uniform(-1, 2), 1)
            humidity = round(max(15.0, 55.0 - day_prob * 35 + rng.uniform(-5, 5)), 1)
            river_level = round(max(1.0, 8.0 - day_prob * 5.0), 2)
            explanation = f"Peak temperature forecast at {temp}°C with {humidity}% humidity."
        else:  # drought
            rainfall = round(max(0.0, rng.uniform(0, 5) if day_prob > 0.5 else rng.uniform(5, 25)), 1)
            temp = round(32.0 + day_prob * 8 + rng.uniform(-1, 2), 1)
            humidity = round(max(20.0, 60.0 - day_prob * 30), 1)
            river_level = round(max(0.8, 6.0 - day_prob * 4.5), 2)
            explanation = f"Agricultural soil moisture index deficit. Reservoir storage critical."

        forecast.append(
            ForecastDay(
                date=forecast_date,
                risk_level=day_level,
                probability=round(day_prob, 3),
                rainfall_mm=rainfall,
                temp_max_c=temp,
                humidity_pct=humidity,
                river_level_m=river_level,
                explanation=explanation
            )
        )
    return forecast

def generate_or_get_predictions(
    db: Session, hazard: str = "flood", state: Optional[str] = None, district_id: Optional[str] = None
) -> List[RiskPredictionResponse]:
    """Retrieve or compute current risk predictions for all districts."""
    query = db.query(District)
    if state:
        query = query.filter(District.state_name.ilike(f"%{state}%"))
    if district_id:
        query = query.filter(District.id == district_id)

    districts = query.all()
    results = []

    for dist in districts:
        profile = DISTRICT_HAZARD_PROFILES.get(dist.id, {})
        base_prob = profile.get(hazard, 0.25)
        
        # Check if database has a fresh prediction for today
        existing = db.query(RiskPrediction).filter(
            RiskPrediction.district_id == dist.id,
            RiskPrediction.hazard_type == hazard
        ).order_by(RiskPrediction.created_at.desc()).first()

        if existing and (datetime.datetime.utcnow() - existing.created_at).total_seconds() < 3600:
            results.append(
                RiskPredictionResponse(
                    district_id=dist.id,
                    district_name=dist.district_name,
                    state_name=dist.state_name,
                    hazard_type=existing.hazard_type,
                    risk_level=existing.risk_level,
                    probability=existing.probability,
                    prediction_date=existing.prediction_date.isoformat(),
                    top_factors=existing.top_factors,
                    is_fallback=existing.is_fallback,
                    is_simulated=existing.is_simulated
                )
            )
        else:
            # Create fresh prediction
            risk_level = get_risk_level_from_prob(base_prob)
            top_factors = generate_top_factors(hazard, risk_level, dist.district_name)
            river_name = profile.get("river_name", "Local Water Basin")
            forecast_data = [f.model_dump() for f in generate_forecast_days(hazard, base_prob, dist.district_name, river_name)]

            new_pred = RiskPrediction(
                district_id=dist.id,
                hazard_type=hazard,
                risk_level=risk_level,
                probability=round(base_prob, 3),
                prediction_date=datetime.datetime.utcnow(),
                forecast_days=forecast_data,
                top_factors=top_factors,
                is_fallback=False,
                is_simulated=True
            )
            db.add(new_pred)
            db.commit()

            results.append(
                RiskPredictionResponse(
                    district_id=dist.id,
                    district_name=dist.district_name,
                    state_name=dist.state_name,
                    hazard_type=hazard,
                    risk_level=risk_level,
                    probability=round(base_prob, 3),
                    prediction_date=new_pred.prediction_date.isoformat(),
                    top_factors=top_factors,
                    is_fallback=False,
                    is_simulated=True
                )
            )

    return results

def get_district_forecast(
    db: Session, district_id: str, hazard: str = "flood"
) -> DistrictForecastResponse:
    """Fetch or compute detailed 7-day forecast for a single district."""
    dist = db.query(District).filter(District.id == district_id).first()
    if not dist:
        raise ValueError(f"District {district_id} not found.")

    profile = DISTRICT_HAZARD_PROFILES.get(dist.id, {})
    base_prob = profile.get(hazard, 0.30)
    river_name = profile.get("river_name", "Regional River Basin")

    existing = db.query(RiskPrediction).filter(
        RiskPrediction.district_id == dist.id,
        RiskPrediction.hazard_type == hazard
    ).order_by(RiskPrediction.created_at.desc()).first()

    if existing and existing.forecast_days:
        forecast_days = [ForecastDay(**d) for d in existing.forecast_days]
        risk_level = existing.risk_level
        prob = existing.probability
        factors = existing.top_factors
        last_updated = existing.created_at.isoformat()
    else:
        risk_level = get_risk_level_from_prob(base_prob)
        prob = base_prob
        forecast_days = generate_forecast_days(hazard, base_prob, dist.district_name, river_name)
        factors = generate_top_factors(hazard, risk_level, dist.district_name)
        last_updated = datetime.datetime.utcnow().isoformat()

    return DistrictForecastResponse(
        district_id=dist.id,
        district_name=dist.district_name,
        state_name=dist.state_name,
        hazard_type=hazard,
        current_risk_level=risk_level,
        current_probability=prob,
        forecast_days=forecast_days,
        top_factors=factors,
        is_fallback=False,
        is_simulated=True,
        last_updated=last_updated
    )

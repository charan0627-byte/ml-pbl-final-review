from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import District
from app.schemas.models import (
    RiskPredictionResponse,
    DistrictForecastResponse,
    DistrictResponse
)
from app.services.risk_service import (
    generate_or_get_predictions,
    get_district_forecast
)

router = APIRouter(prefix="/api", tags=["Risk & Forecasts"])

@router.get("/risk", response_model=List[RiskPredictionResponse])
def get_risk_predictions(
    hazard: str = Query("flood", description="Hazard type: flood, heatwave, or drought"),
    state: Optional[str] = Query(None, description="Filter by state name"),
    district: Optional[str] = Query(None, description="Filter by district name or ID"),
    db: Session = Depends(get_db)
):
    """Retrieve multi-hazard risk predictions across Indian districts."""
    valid_hazards = ["flood", "heatwave", "drought"]
    hazard_clean = hazard.lower()
    if hazard_clean not in valid_hazards:
        hazard_clean = "flood"

    return generate_or_get_predictions(db, hazard=hazard_clean, state=state, district_id=district)

@router.get("/risk/{district_id}/forecast", response_model=DistrictForecastResponse)
def get_forecast_for_district(
    district_id: str,
    hazard: str = Query("flood", description="Hazard type: flood, heatwave, drought"),
    db: Session = Depends(get_db)
):
    """Fetch 7-day risk and meteorological forecast for a specific district."""
    try:
        return get_district_forecast(db, district_id=district_id, hazard=hazard.lower())
    except ValueError as e:
        raise HTTPException(status_code=444, detail=str(e))

@router.get("/districts", response_model=List[DistrictResponse])
def get_all_districts(db: Session = Depends(get_db)):
    """List all seeded Indian districts with GeoJSON geometry."""
    return db.query(District).all()

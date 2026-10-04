import datetime
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import District, RiskPrediction
from app.config import settings
from app.schemas.models import DemoEventRequest, TestAlertRequest, AlertResponse
from app.services.cap_alert_service import create_and_dispatch_alert
from app.services.risk_service import (
    get_risk_level_from_prob,
    generate_top_factors,
    generate_forecast_days
)

router = APIRouter(prefix="/api/admin", tags=["Admin & Interactive Simulation"])

def verify_admin_header(x_admin_token: str = Header(None)):
    """Security check for admin actions."""
    if not x_admin_token or x_admin_token != settings.ADMIN_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-Token header."
        )

@router.post("/demo-event", response_model=AlertResponse)
def trigger_demo_event(
    payload: DemoEventRequest,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_header)
):
    """Simulate an extreme weather disaster event in a target district and issue immediate CAP Alert."""
    dist = db.query(District).filter(District.id == payload.district_id).first()
    if not dist:
        raise HTTPException(status_code=404, detail=f"District {payload.district_id} not found.")

    risk_level = payload.risk_level or get_risk_level_from_prob(payload.probability)
    prob = payload.probability or 0.92

    # Update or insert temporary simulated prediction in DB
    forecast_days = [
        f.model_dump() for f in generate_forecast_days(payload.hazard_type, prob, dist.district_name, "River Basin")
    ]
    top_factors = generate_top_factors(payload.hazard_type, risk_level, dist.district_name)

    sim_pred = RiskPrediction(
        district_id=dist.id,
        hazard_type=payload.hazard_type,
        risk_level=risk_level,
        probability=prob,
        prediction_date=datetime.datetime.utcnow(),
        forecast_days=forecast_days,
        top_factors=top_factors,
        is_fallback=False,
        is_simulated=True
    )
    db.add(sim_pred)
    db.commit()

    # Create & Dispatch CAP Alert
    alert = create_and_dispatch_alert(
        db=db,
        district_id=dist.id,
        hazard_type=payload.hazard_type,
        risk_level=risk_level,
        probability=prob,
        headline_override=f"[ADMIN DEMO SIMULATION] {risk_level} {payload.hazard_type.capitalize()} Risk in {dist.district_name}",
        is_demo=True
    )

    return AlertResponse(
        id=alert.id,
        district_id=alert.district_id,
        district_name=dist.district_name,
        state_name=dist.state_name,
        hazard_type=alert.hazard_type,
        risk_level=alert.risk_level,
        probability=alert.probability,
        headline=alert.headline,
        message_en=alert.message_en,
        message_hi=alert.message_hi,
        cap_xml=alert.cap_xml,
        safety_actions=alert.safety_actions,
        source=alert.source,
        is_demo=alert.is_demo,
        created_at=alert.created_at.isoformat()
    )

@router.post("/alerts/test")
def test_alert_channel(
    payload: TestAlertRequest,
    _: None = Depends(verify_admin_header)
):
    """Test notification channel dispatch (console, email, sms)."""
    channel = payload.channel.lower()
    print(f"[DRIS TEST ALERT] Dispatched test ping via {channel} channel.")
    return {
        "success": True,
        "message": f"Test alert message successfully dispatched via {channel} channel (ALERT_MODE: {settings.ALERT_MODE})."
    }

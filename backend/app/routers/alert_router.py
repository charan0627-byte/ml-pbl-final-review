from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Alert, District
from app.schemas.models import AlertResponse

router = APIRouter(prefix="/api/alerts", tags=["Alerts & CAP XML"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    hazard: Optional[str] = None,
    risk_level: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieve historical and live disaster alerts issued by DRIS."""
    query = db.query(Alert)
    if hazard:
        query = query.filter(Alert.hazard_type == hazard.lower())
    if risk_level:
        query = query.filter(Alert.risk_level == risk_level)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    
    results = []
    for a in alerts:
        dist = db.query(District).filter(District.id == a.district_id).first()
        results.append(
            AlertResponse(
                id=a.id,
                district_id=a.district_id,
                district_name=dist.district_name if dist else "Unknown",
                state_name=dist.state_name if dist else "Unknown",
                hazard_type=a.hazard_type,
                risk_level=a.risk_level,
                probability=a.probability,
                headline=a.headline,
                message_en=a.message_en,
                message_hi=a.message_hi,
                cap_xml=a.cap_xml,
                safety_actions=a.safety_actions,
                source=a.source,
                is_demo=a.is_demo,
                created_at=a.created_at.isoformat()
            )
        )
    return results

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_detail(alert_id: str, db: Session = Depends(get_db)):
    """Fetch details of a single alert."""
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    dist = db.query(District).filter(District.id == a.district_id).first()
    return AlertResponse(
        id=a.id,
        district_id=a.district_id,
        district_name=dist.district_name if dist else "Unknown",
        state_name=dist.state_name if dist else "Unknown",
        hazard_type=a.hazard_type,
        risk_level=a.risk_level,
        probability=a.probability,
        headline=a.headline,
        message_en=a.message_en,
        message_hi=a.message_hi,
        cap_xml=a.cap_xml,
        safety_actions=a.safety_actions,
        source=a.source,
        is_demo=a.is_demo,
        created_at=a.created_at.isoformat()
    )

@router.get("/{alert_id}/cap.xml")
def get_alert_cap_xml(alert_id: str, db: Session = Depends(get_db)):
    """Serve raw OASIS Common Alerting Protocol (CAP v1.2) XML payload."""
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return Response(content=a.cap_xml, media_type="application/xml")

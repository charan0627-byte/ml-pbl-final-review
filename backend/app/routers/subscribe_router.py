import datetime
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Subscription
from app.schemas.models import SubscriptionCreate, SubscriptionResponse

router = APIRouter(prefix="/api/subscribe", tags=["Subscriptions"])

@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(payload: SubscriptionCreate, db: Session = Depends(get_db)):
    """Register a new email/SMS alert subscription."""
    sub_id = f"SUB-{uuid.uuid4().hex[:8].upper()}"
    
    sub = Subscription(
        id=sub_id,
        subscriber_name=payload.subscriber_name,
        contact_type=payload.contact_type.lower(),
        contact_value=payload.contact_value.strip(),
        district_ids=payload.district_ids,
        hazards=payload.hazards,
        min_threshold=payload.min_threshold,
        language=payload.language,
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(sub)
    db.commit()

    return SubscriptionResponse(
        id=sub.id,
        subscriber_name=sub.subscriber_name,
        contact_type=sub.contact_type,
        contact_value=sub.contact_value,
        district_ids=sub.district_ids,
        hazards=sub.hazards,
        min_threshold=sub.min_threshold,
        language=sub.language,
        is_active=sub.is_active,
        created_at=sub.created_at.isoformat()
    )

@router.get("", response_model=List[SubscriptionResponse])
def list_subscriptions(db: Session = Depends(get_db)):
    """List registered alert subscriptions."""
    subs = db.query(Subscription).filter(Subscription.is_active == True).all()
    return [
        SubscriptionResponse(
            id=s.id,
            subscriber_name=s.subscriber_name,
            contact_type=s.contact_type,
            contact_value=s.contact_value,
            district_ids=s.district_ids,
            hazards=s.hazards,
            min_threshold=s.min_threshold,
            language=s.language,
            is_active=s.is_active,
            created_at=s.created_at.isoformat()
        )
        for s in subs
    ]

@router.delete("/{subscription_id}")
def delete_subscription(subscription_id: str, db: Session = Depends(get_db)):
    """Cancel / deactivate an alert subscription."""
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub.is_active = False
    db.commit()
    return {"success": True, "message": f"Subscription {subscription_id} successfully cancelled."}

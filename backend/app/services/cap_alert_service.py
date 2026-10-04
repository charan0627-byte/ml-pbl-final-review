import datetime
import xml.etree.ElementTree as ET
from xml.dom import minidom
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import District, Alert, Subscription, AlertLog
from app.config import settings

SAFETY_ACTIONS_BY_HAZARD = {
    "flood": [
        "Move to higher ground immediately and avoid low-lying causeways.",
        "Keep emergency evacuation kits prepared with potable water, flashlight, and first-aid supplies.",
        "Do not walk or drive through flowing floodwaters (Turn Around Don't Drown).",
        "Monitor official NDMA/SDMA emergency channels and helpline 1078."
    ],
    "heatwave": [
        "Stay indoors between 11:00 AM and 4:00 PM during peak solar intensity.",
        "Drink ORS, nimbu pani, or buttermilk frequently to remain hydrated.",
        "Wear lightweight, loose-fitting, light-colored cotton garments.",
        "Ensure livestock and pets have adequate shade and clean water."
    ],
    "drought": [
        "Implement strict water conservation protocols and avoid non-essential usage.",
        "Utilize drip irrigation for agricultural crops to minimize evaporation.",
        "Store rain harvest yield in covered reservoirs to prevent vector breeding.",
        "Report groundwater depletion anomalies to local Krishi Vigyan Kendra."
    ]
}

def generate_cap_xml(
    alert_id: str,
    district_name: str,
    state_name: str,
    lat: float,
    lon: float,
    hazard_type: str,
    risk_level: str,
    headline: str,
    message_en: str,
    message_hi: str,
    safety_actions: List[str]
) -> str:
    """Generate standard OASIS CAP v1.2 XML Document."""
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S-00:00")
    expires_str = (datetime.datetime.utcnow() + datetime.timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%S-00:00")

    severity = "Extreme" if risk_level == "Severe" else "Severe" if risk_level == "High" else "Moderate"
    urgency = "Immediate" if risk_level in ["High", "Severe"] else "Expected"
    certainty = "Observed" if risk_level == "Severe" else "Likely"

    root = ET.Element("alert", xmlns="urn:oasis:names:tc:emergency:cap:1.2")

    ET.SubElement(root, "identifier").text = alert_id
    ET.SubElement(root, "sender").text = "alerts@dris.gov.in"
    ET.SubElement(root, "sent").text = now_str
    ET.SubElement(root, "status").text = "Actual"
    ET.SubElement(root, "msgType").text = "Alert"
    ET.SubElement(root, "scope").text = "Public"

    # Info Block 1: English
    info_en = ET.SubElement(root, "info")
    ET.SubElement(info_en, "language").text = "en-IN"
    ET.SubElement(info_en, "category").text = "Met" if hazard_type in ["flood", "heatwave"] else "Env"
    ET.SubElement(info_en, "event").text = f"{hazard_type.capitalize()} Warning - {risk_level} Risk"
    ET.SubElement(info_en, "urgency").text = urgency
    ET.SubElement(info_en, "severity").text = severity
    ET.SubElement(info_en, "certainty").text = certainty
    ET.SubElement(info_en, "eventCode").text = f"DRIS-{hazard_type.upper()}-01"
    ET.SubElement(info_en, "expires").text = expires_str
    ET.SubElement(info_en, "headline").text = headline
    ET.SubElement(info_en, "description").text = message_en
    ET.SubElement(info_en, "instruction").text = " ".join(safety_actions)

    area_en = ET.SubElement(info_en, "area")
    ET.SubElement(area_en, "areaDesc").text = f"{district_name} District, {state_name}, India"
    ET.SubElement(area_en, "circle").text = f"{lat},{lon},25.0"

    # Info Block 2: Hindi
    info_hi = ET.SubElement(root, "info")
    ET.SubElement(info_hi, "language").text = "hi-IN"
    ET.SubElement(info_hi, "category").text = "Met"
    ET.SubElement(info_hi, "event").text = f"{hazard_type.capitalize()} चेतावनी - {risk_level} जोखिम"
    ET.SubElement(info_hi, "urgency").text = urgency
    ET.SubElement(info_hi, "severity").text = severity
    ET.SubElement(info_hi, "certainty").text = certainty
    ET.SubElement(info_hi, "expires").text = expires_str
    ET.SubElement(info_hi, "headline").text = f"{district_name} जिला: {hazard_type.capitalize()} की चेतावनी जारी"
    ET.SubElement(info_hi, "description").text = message_hi

    area_hi = ET.SubElement(info_hi, "area")
    ET.SubElement(area_hi, "areaDesc").text = f"{district_name} जिला, {state_name}"
    ET.SubElement(area_hi, "circle").text = f"{lat},{lon},25.0"

    raw_xml = ET.tostring(root, encoding="utf-8")
    reparsed = minidom.parseString(raw_xml)
    return reparsed.toprettyxml(indent="  ")

def create_and_dispatch_alert(
    db: Session,
    district_id: str,
    hazard_type: str,
    risk_level: str,
    probability: float,
    headline_override: Optional[str] = None,
    is_demo: bool = False
) -> Alert:
    """Create alert, build CAP XML payload, and dispatch to active subscribers."""
    dist = db.query(District).filter(District.id == district_id).first()
    if not dist:
        raise ValueError(f"District {district_id} not found")

    alert_idx = db.query(Alert).count() + 1
    today_str = datetime.date.today().strftime("%Y%m%d")
    alert_id = f"ALT-{today_str}-{alert_idx:04d}"

    headline = headline_override or f"{risk_level} {hazard_type.capitalize()} Risk Alert issued for {dist.district_name}, {dist.state_name}"
    
    msg_en = (
        f"DRIS Emergency Warning: {dist.district_name} ({dist.state_name}) is at {risk_level} Risk "
        f"for {hazard_type.capitalize()} with estimated probability of {int(probability * 100)}%. "
        f"Citizens and local response teams are advised to take immediate precautions."
    )
    msg_hi = (
        f"डीआरआईएस आपातकालीन चेतावनी: {dist.district_name} ({dist.state_name}) में "
        f"{hazard_type.capitalize()} के लिए {risk_level} जोखिम की चेतावनी ({int(probability * 100)}% संभावना) जारी की गई है। "
        f"नागरिकों से सावधान रहने का अनुरोध किया जाता है।"
    )

    safety_actions = SAFETY_ACTIONS_BY_HAZARD.get(hazard_type, [
        "Follow local district magistrate directives.",
        "Stay tuned to official disaster management bulletins."
    ])

    cap_xml = generate_cap_xml(
        alert_id=alert_id,
        district_name=dist.district_name,
        state_name=dist.state_name,
        lat=dist.lat,
        lon=dist.lon,
        hazard_type=hazard_type,
        risk_level=risk_level,
        headline=headline,
        message_en=msg_en,
        message_hi=msg_hi,
        safety_actions=safety_actions
    )

    alert = Alert(
        id=alert_id,
        district_id=dist.id,
        hazard_type=hazard_type,
        risk_level=risk_level,
        probability=probability,
        headline=headline,
        message_en=msg_en,
        message_hi=msg_hi,
        cap_xml=cap_xml,
        safety_actions=safety_actions,
        source="DRIS Multi-Hazard Engine",
        is_demo=is_demo,
        created_at=datetime.datetime.utcnow()
    )
    db.add(alert)
    db.commit()

    # Dispatch to relevant subscriptions
    subs = db.query(Subscription).filter(Subscription.is_active == True).all()
    for sub in subs:
        # Match district and hazard filters
        district_match = "ALL" in sub.district_ids or dist.id in sub.district_ids
        hazard_match = "ALL" in sub.hazards or hazard_type in sub.hazards
        
        if district_match and hazard_match:
            # Audit log entry
            log = AlertLog(
                alert_id=alert.id,
                subscription_id=sub.id,
                channel=sub.contact_type,
                recipient=sub.contact_value,
                status="SENT" if settings.ALERT_MODE == "console" else "LOGGED",
                sent_at=datetime.datetime.utcnow()
            )
            db.add(log)

            print(
                f"[DRIS ALERT DISPATCH] Sent CAP Alert {alert.id} ({hazard_type.upper()} / {risk_level}) "
                f"to {sub.subscriber_name} via {sub.contact_type} ({sub.contact_value})"
            )

    db.commit()
    return alert

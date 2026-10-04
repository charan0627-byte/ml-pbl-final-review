import json
import os
from sqlalchemy.orm import Session
from app.config import settings
from app.db.models import District

def load_geojson_data() -> dict:
    """Load and parse the GeoJSON file containing Indian districts."""
    geojson_path = os.path.abspath(settings.GEOJSON_PATH)
    if not os.path.exists(geojson_path):
        # Fallback relative to project root
        geojson_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "geojson", "india_districts.json")
        geojson_path = os.path.abspath(geojson_path)

    if not os.path.exists(geojson_path):
        raise FileNotFoundError(f"GeoJSON file not found at {geojson_path}")

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

def seed_districts_from_geojson(db: Session) -> int:
    """Seed or update the District records in database from GeoJSON."""
    geojson_doc = load_geojson_data()
    features = geojson_doc.get("features", [])
    
    count = 0
    for feature in features:
        props = feature.get("properties", {})
        district_id = props.get("district_id") or feature.get("id")
        if not district_id:
            continue

        existing = db.query(District).filter(District.id == district_id).first()
        if not existing:
            district = District(
                id=district_id,
                district_name=props.get("district_name", "Unknown"),
                state_name=props.get("state_name", "Unknown"),
                lat=float(props.get("lat", 0.0)),
                lon=float(props.get("lon", 0.0)),
                geojson=feature
            )
            db.add(district)
            count += 1
        else:
            existing.district_name = props.get("district_name", existing.district_name)
            existing.state_name = props.get("state_name", existing.state_name)
            existing.lat = float(props.get("lat", existing.lat))
            existing.lon = float(props.get("lon", existing.lon))
            existing.geojson = feature
            count += 1

    db.commit()
    return count

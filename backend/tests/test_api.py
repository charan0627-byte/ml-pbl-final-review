import pytest
from fastapi.testclient import TestClient
from app.main import app, on_startup
from app.config import settings

@pytest.fixture(scope="module", autouse=True)
def init_test_db():
    on_startup()

def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == settings.APP_NAME
        assert data["districts_loaded"] > 0

def test_risk_predictions_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/risk?hazard=flood")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        first = data[0]
        assert "district_id" in first
        assert "risk_level" in first
        assert first["hazard_type"] == "flood"

def test_district_forecast_endpoint():
    with TestClient(app) as client:
        risk_resp = client.get("/api/risk?hazard=flood")
        district_id = risk_resp.json()[0]["district_id"]

        response = client.get(f"/api/risk/{district_id}/forecast?hazard=flood")
        assert response.status_code == 200
        data = response.json()
        assert data["district_id"] == district_id
        assert len(data["forecast_days"]) == 7
        assert len(data["top_factors"]) > 0

def test_subscription_flow():
    with TestClient(app) as client:
        payload = {
            "subscriber_name": "Test Inspector",
            "contact_type": "email",
            "contact_value": "inspector@test.gov.in",
            "district_ids": ["JK-SRI"],
            "hazards": ["flood"],
            "min_threshold": "High",
            "language": "en"
        }
        create_resp = client.post("/api/subscribe", json=payload)
        assert create_resp.status_code == 201
        sub_data = create_resp.json()
        assert sub_data["subscriber_name"] == "Test Inspector"
        sub_id = sub_data["id"]

        list_resp = client.get("/api/subscribe")
        assert list_resp.status_code == 200
        subs = list_resp.json()
        assert any(s["id"] == sub_id for s in subs)

        del_resp = client.delete(f"/api/subscribe/{sub_id}")
        assert del_resp.status_code == 200
        assert del_resp.json()["success"] is True

def test_model_metrics_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/models/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) == 3
        flood_model = data["models"][0]
        assert flood_model["hazard_type"] == "flood"
        assert "precision" in flood_model
        assert len(flood_model["top_features"]) > 0

def test_admin_demo_event_and_cap_xml():
    with TestClient(app) as client:
        headers = {"X-Admin-Token": settings.ADMIN_TOKEN}
        payload = {
            "district_id": "JK-SRI",
            "hazard_type": "flood",
            "risk_level": "Severe",
            "probability": 0.95
        }
        response = client.post("/api/admin/demo-event", json=payload, headers=headers)
        assert response.status_code == 200
        alert_data = response.json()
        assert alert_data["risk_level"] == "Severe"
        alert_id = alert_data["id"]

        cap_resp = client.get(f"/api/alerts/{alert_id}/cap.xml")
        assert cap_resp.status_code == 200
        assert "application/xml" in cap_resp.headers["content-type"]
        assert f"<identifier>{alert_id}</identifier>" in cap_resp.text

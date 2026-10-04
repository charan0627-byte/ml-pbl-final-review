import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class District(Base):
    __tablename__ = "districts"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "JK-SRI"
    district_name = Column(String(100), nullable=False, index=True)
    state_name = Column(String(100), nullable=False, index=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    geojson = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    predictions = relationship("RiskPrediction", back_populates="district", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="district", cascade="all, delete-orphan")


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, index=True)
    hazard_type = Column(String(20), nullable=False, index=True)  # flood, heatwave, drought
    risk_level = Column(String(20), nullable=False, index=True)   # Low, Moderate, High, Severe
    probability = Column(Float, nullable=False)
    prediction_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    forecast_days = Column(JSON, nullable=False)  # 7-day forecast array
    top_factors = Column(JSON, nullable=False)    # Top 3 explanations
    is_fallback = Column(Boolean, default=False)
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    district = relationship("District", back_populates="predictions")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(100), primary_key=True, index=True)
    subscriber_name = Column(String(100), nullable=False)
    contact_type = Column(String(20), nullable=False)  # email, sms
    contact_value = Column(String(150), nullable=False, index=True)
    district_ids = Column(JSON, nullable=False)  # ["ALL"] or ["JK-SRI", "DL-NDL"]
    hazards = Column(JSON, nullable=False)       # ["ALL"] or ["flood", "heatwave"]
    min_threshold = Column(String(20), default="High")  # High or Severe
    language = Column(String(10), default="en")  # en, hi, ta
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    alert_logs = relationship("AlertLog", back_populates="subscription", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(100), primary_key=True, index=True)  # e.g. "ALT-20261003-0001"
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, index=True)
    hazard_type = Column(String(20), nullable=False, index=True)
    risk_level = Column(String(20), nullable=False, index=True)
    probability = Column(Float, nullable=False)
    headline = Column(String(255), nullable=False)
    message_en = Column(Text, nullable=False)
    message_hi = Column(Text, nullable=False)
    cap_xml = Column(Text, nullable=False)
    safety_actions = Column(JSON, nullable=False)
    source = Column(String(100), default="DRIS Multi-Hazard Alert Engine")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    district = relationship("District", back_populates="alerts")
    logs = relationship("AlertLog", back_populates="alert", cascade="all, delete-orphan")


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(String(100), ForeignKey("alerts.id"), nullable=False, index=True)
    subscription_id = Column(String(100), ForeignKey("subscriptions.id"), nullable=False, index=True)
    channel = Column(String(20), nullable=False)  # console, sms, email
    recipient = Column(String(150), nullable=False)
    status = Column(String(20), nullable=False)  # SENT, FAILED, LOGGED
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

    alert = relationship("Alert", back_populates="logs")
    subscription = relationship("Subscription", back_populates="alert_logs")

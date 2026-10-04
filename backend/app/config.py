import json
import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "Disaster Risk Intelligence System (DRIS)"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    DATABASE_URL: str = "sqlite:///./dris.db"
    
    # Security & CORS
    ADMIN_TOKEN: str = "dris-super-secret-admin-token"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Operational Modes
    ALERT_MODE: str = "console"  # 'console' or 'live'
    DEMO_MODE: bool = False

    # Risk & Alert Thresholds
    ALERT_THRESHOLD_HIGH: float = 0.70
    ALERT_THRESHOLD_SEVERE: float = 0.85
    ALERT_COOLDOWN_HOURS: int = 12

    # Twilio (SMS)
    TWILIO_ACCOUNT_SID: str = "AC_YOUR_TWILIO_ACCOUNT_SID"
    TWILIO_AUTH_TOKEN: str = "YOUR_TWILIO_AUTH_TOKEN"
    TWILIO_FROM_NUMBER: str = "+15005550006"

    # SMTP (Email)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "alerts@dris.gov.in"
    SMTP_PASSWORD: str = "your-smtp-password"
    SMTP_FROM_EMAIL: str = "alerts@dris.gov.in"

    # Data & Storage Paths
    GEOJSON_PATH: str = "../data/geojson/india_districts.json"
    CACHE_DIR: str = "../data/cache"
    MODEL_DIR: str = "../ml/models"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("["):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("ALERT_MODE")
    @classmethod
    def validate_alert_mode(cls, v):
        mode = v.lower()
        if mode not in ["console", "live"]:
            raise ValueError("ALERT_MODE must be either 'console' or 'live'")
        return mode

    def validate_startup(self):
        """Validate required parameters on application startup."""
        if not self.ADMIN_TOKEN:
            raise ValueError("ADMIN_TOKEN must be configured in environment variables.")
        if self.ALERT_MODE == "live":
            if "YOUR_" in self.TWILIO_ACCOUNT_SID or not self.TWILIO_AUTH_TOKEN:
                print("[WARNING] Live alert mode configured but Twilio SID/AuthToken are placeholders.")
            if "your-" in self.SMTP_PASSWORD:
                print("[WARNING] Live alert mode configured but SMTP password is placeholder.")

settings = Settings()

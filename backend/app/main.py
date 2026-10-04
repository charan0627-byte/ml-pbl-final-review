import datetime
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import init_db, get_db, SessionLocal
from app.db.models import District
from app.services.geojson_service import seed_districts_from_geojson
from app.services.risk_service import generate_or_get_predictions
from app.schemas.models import HealthResponse

from app.routers import (
    risk_router,
    alert_router,
    subscribe_router,
    metrics_router,
    admin_router
)

# Validate settings on module import / startup
settings.validate_startup()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS setup
origins = settings.CORS_ORIGINS
if isinstance(origins, list) and "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register API Routers
app.include_router(risk_router.router)
app.include_router(alert_router.router)
app.include_router(subscribe_router.router)
app.include_router(metrics_router.router)
app.include_router(admin_router.router)

@app.on_event("startup")
def on_startup():
    """Startup event: initialize DB, seed GeoJSON districts, and generate baseline predictions."""
    init_db()
    db = SessionLocal()
    try:
        count = seed_districts_from_geojson(db)
        # Pre-seed baseline predictions for flood, heatwave, drought
        for hazard in ["flood", "heatwave", "drought"]:
            generate_or_get_predictions(db, hazard=hazard)
        print(f"[DRIS Startup] Database initialized, {count} districts verified/seeded, and baseline hazard predictions generated.")
    finally:
        db.close()

@app.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint returning system status and district count."""
    district_count = db.query(District).count()
    return HealthResponse(
        status="ok",
        service=settings.APP_NAME,
        timestamp=datetime.datetime.utcnow().isoformat(),
        version="1.0.0",
        alert_mode=settings.ALERT_MODE,
        demo_mode=settings.DEMO_MODE,
        districts_loaded=district_count
    )

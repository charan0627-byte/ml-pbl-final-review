from fastapi import APIRouter
from app.schemas.models import ModelMetricsResponse
from app.services.metrics_service import get_model_metrics

router = APIRouter(prefix="/api/models", tags=["Model Performance & Metrics"])

@router.get("/metrics", response_model=ModelMetricsResponse)
def get_metrics():
    """Retrieve performance metrics, confusion matrices, and feature importance for DRIS models."""
    return get_model_metrics()

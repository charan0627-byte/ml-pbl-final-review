# DRIS Backend Dockerfile
FROM python:3.10-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    DATABASE_URL=sqlite:////app/data/dris.db \
    GEOJSON_PATH=/app/data/geojson/india_districts.json \
    CACHE_DIR=/app/data/cache \
    MODEL_DIR=/app/ml/models

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies
COPY backend/requirements.txt /app/backend/requirements.txt

# Install Python packages
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend, data, and helper scripts
COPY backend /app/backend
COPY data /app/data
COPY scripts /app/scripts

# Ensure output data directories exist
RUN mkdir -p /app/data/cache /app/data/geojson /app/ml/models

# Set working directory to backend package root
WORKDIR /app/backend

# Expose FastAPI backend port
EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch Uvicorn server
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

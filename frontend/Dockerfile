# Multi-stage Dockerfile for DRIS React Frontend

# --- Stage 1: Build stage ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build-time environment variables (empty string uses relative path via Nginx reverse proxy)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build TypeScript + Vite static production bundle
RUN npm run build

# --- Stage 2: Production Nginx stage ---
FROM nginx:alpine

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx web server
CMD ["nginx", "-g", "daemon off;"]

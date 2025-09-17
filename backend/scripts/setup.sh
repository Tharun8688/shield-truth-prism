#!/bin/bash

# Pi Shield Backend Setup Script
# This script sets up the development environment

set -e

echo "🛡️  Pi Shield Backend Setup"
echo "=========================="

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is required but not installed."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing"
    echo "   Especially update GCS_BUCKET and add your GCP credentials"
fi

# Check for GCP credentials
if [ ! -f gcp-credentials.json ]; then
    echo "⚠️  GCP credentials file not found!"
    echo "   Please download your service account key and save as 'gcp-credentials.json'"
    echo "   You can continue setup and add credentials later"
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p logs

# Build Docker images
echo "Building Docker images..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Check if services are healthy
echo "Checking service health..."
if docker-compose exec postgres pg_isready -U pishield; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

if docker-compose exec redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
    exit 1
fi

# Start API and workers
echo "Starting API and workers..."
docker-compose up -d

# Wait a moment for services to start
sleep 5

# Test API health
echo "Testing API health..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    echo "Check logs with: docker-compose logs api"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Services running:"
echo "  - API: http://localhost:8080"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Add GCP credentials (gcp-credentials.json)"
echo "  3. Test the API with: curl http://localhost:8080/health"
echo "  4. Create a user account and start uploading files!"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart: docker-compose restart"
echo "  - Scale workers: docker-compose up -d --scale worker=5"
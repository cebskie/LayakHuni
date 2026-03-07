#!/bin/bash
# LayakHuni Backend - Local Development Startup Script

set -e

echo "🏠 LayakHuni Backend Setup"
echo "=========================="

# Check Python
python3 --version || { echo "❌ Python 3 not found"; exit 1; }

# Create venv if not exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate
echo "⚡ Activating venv..."
source venv/bin/activate

# Install deps
echo "📥 Installing dependencies..."
pip install -r requirements.txt -q

# Check .env
if [ ! -f ".env" ]; then
    echo "⚠️  .env not found, copying from .env.example..."
    cp .env.example .env
    echo "✏️  Edit .env with your DATABASE_URL before continuing"
    exit 1
fi

# Create uploads dir
mkdir -p uploads

echo ""
echo "✅ Ready! Choose an action:"
echo "  1) Start server:  uvicorn app.main:app --reload --port 8000"
echo "  2) Seed data:     python -m db.seeds.seed"
echo ""
echo "📖 API docs will be at: http://localhost:8000/docs"
echo ""

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

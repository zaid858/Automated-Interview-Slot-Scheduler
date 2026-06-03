#!/bin/bash
# Automated Interview Slot Scheduler — Setup Script
# Run this ONCE to install all dependencies

set -e
echo "🤖 Setting up Automated Interview Slot Scheduler..."

# ── AI Engine ────────────────────────────────────────────────────────────────
echo ""
echo "📦 Installing Python dependencies for AI Engine..."
cd "$(dirname "$0")/ai-engine"

# Try pip3 first, then python3 -m pip
if command -v pip3 &> /dev/null; then
    pip3 install flask flask-cors python-dotenv --user
elif python3 -m pip &> /dev/null 2>&1; then
    python3 -m pip install flask flask-cors python-dotenv --user
else
    echo "⚠️  pip not found. Installing pip first..."
    sudo apt-get install -y python3-pip
    pip3 install flask flask-cors python-dotenv --user
fi

echo "✅ AI Engine dependencies installed"

# ── Backend ──────────────────────────────────────────────────────────────────
echo ""
echo "📦 Installing Node.js backend dependencies..."
cd "$(dirname "$0")/backend"
npm install

echo "📦 Seeding database with demo data..."
node src/utils/seed.js

echo "✅ Backend ready"

# ── Frontend ─────────────────────────────────────────────────────────────────
echo ""
echo "📦 Installing React frontend dependencies..."
cd "$(dirname "$0")/frontend"
npm install

echo "✅ Frontend ready"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete! Start the application:"
echo ""
echo "  Terminal 1 (AI Engine):"
echo "    cd ai-engine && python3 app.py"
echo ""
echo "  Terminal 2 (Backend API):"
echo "    cd backend && npm run dev"
echo ""
echo "  Terminal 3 (Frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "  Open: http://localhost:5173"
echo ""
echo "  Demo Login:"
echo "    Admin:       admin@scheduler.com / admin123"
echo "    HR:          hr@scheduler.com / hr1234"
echo "    Interviewer: priya@scheduler.com / pass123"
echo "    Candidate:   alice@candidate.com / pass123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

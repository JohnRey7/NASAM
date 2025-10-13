#!/bin/bash

# NASAM Production Restart Script
# This script restarts both servers to apply authentication fixes

echo "🔄 Restarting NASAM Production Servers..."

# Stop existing servers
echo "🛑 Stopping existing servers..."
pkill -f "node.*backend" 2>/dev/null || true
pkill -f "node.*frontend" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true

# Wait for processes to stop
sleep 3

# Set production environment
export NODE_ENV=production

# Backend restart
echo "🚀 Starting Backend with authentication fixes..."
cd backend

# Ensure production environment is loaded
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ Production environment loaded"
else
    echo "❌ .env.production file not found!"
    exit 1
fi

# Start backend
npm start &
BACKEND_PID=$!
echo "✅ Backend restarted with PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Frontend restart
echo "🚀 Starting Frontend..."
cd ../frontend/nas-system

# Start frontend
npm start &
FRONTEND_PID=$!
echo "✅ Frontend restarted with PID: $FRONTEND_PID"

# Save PIDs
echo $BACKEND_PID > ../backend.pid
echo $FRONTEND_PID > ../frontend.pid

echo ""
echo "🎉 NASAM Production Servers Restarted!"
echo "🔧 Authentication fixes applied:"
echo "   - Cookie sameSite changed to 'lax'"
echo "   - Domain-specific cookie configuration"
echo "   - Enhanced CORS settings"
echo "   - Authentication debugging enabled"
echo ""
echo "📊 Backend: http://95.216.139.119:3000"
echo "🌐 Frontend: http://95.216.139.119:3001"
echo ""
echo "🧪 Test the login flow now - the 401 errors should be resolved!"
echo "💡 Check backend logs for authentication debug info if needed"

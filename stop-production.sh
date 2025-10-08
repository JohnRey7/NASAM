#!/bin/bash

# NASAM Production Stop Script
# This script stops both frontend and backend servers

echo "🛑 Stopping NASAM Production Servers..."

# Stop backend
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ Backend server stopped (PID: $BACKEND_PID)"
    else
        echo "⚠️ Backend server was not running"
    fi
    rm backend.pid
else
    echo "⚠️ Backend PID file not found"
fi

# Stop frontend
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ Frontend server stopped (PID: $FRONTEND_PID)"
    else
        echo "⚠️ Frontend server was not running"
    fi
    rm frontend.pid
else
    echo "⚠️ Frontend PID file not found"
fi

# Kill any remaining node processes (be careful with this)
echo "🧹 Cleaning up any remaining processes..."
pkill -f "node.*backend"
pkill -f "node.*frontend"
pkill -f "next"

echo "🎉 NASAM Production Servers Stopped!"

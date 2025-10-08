#!/bin/bash

# NASAM Production Deployment Script
# This script deploys both frontend and backend for production

echo "🚀 Starting NASAM Production Deployment..."

# Set production environment
export NODE_ENV=production

# Backend deployment
echo "📦 Deploying Backend..."
cd backend

# Copy production environment file
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ Production environment file copied"
else
    echo "❌ .env.production file not found!"
    exit 1
fi

# Install backend dependencies
npm install --production
echo "✅ Backend dependencies installed"

# Start backend in production mode
echo "🔧 Starting backend server..."
npm run start &
BACKEND_PID=$!
echo "✅ Backend started with PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Frontend deployment
echo "📦 Deploying Frontend..."
cd ../frontend/nas-system

# Build frontend for production
npm run build
echo "✅ Frontend built successfully"

# Start frontend in production mode
echo "🔧 Starting frontend server..."
npm run start &
FRONTEND_PID=$!
echo "✅ Frontend started with PID: $FRONTEND_PID"

echo "🎉 NASAM Production Deployment Complete!"
echo "📊 Backend running on: http://95.216.139.119:3000"
echo "🌐 Frontend running on: http://95.216.139.119:3001"
echo "📝 Backend PID: $BACKEND_PID"
echo "📝 Frontend PID: $FRONTEND_PID"

# Save PIDs for later use
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

echo "💡 To stop the servers, run: ./stop-production.sh"

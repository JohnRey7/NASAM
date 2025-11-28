# NASAM Production Deployment Guide

## Overview
This guide explains how to deploy NASAM (Non-Academic Scholar Application Management System) to your Ubuntu VPS using your server's IP address.

## Issues Fixed
- ✅ Removed all hardcoded `localhost:3000` references from frontend components
- ✅ Added missing `/api/auth/forgot-password` route to backend
- ✅ Updated CORS configuration for production
- ✅ Created environment-based API URL configuration
- ✅ Fixed authentication and session handling
- ✅ **CRITICAL**: Fixed cookie configuration for cross-origin authentication
- ✅ Changed `sameSite` from 'strict' to 'lax' for production
- ✅ Added domain-specific cookie settings
- ✅ Added authentication debugging for production troubleshooting

## Prerequisites
- Ubuntu VPS with Node.js and npm installed
- MongoDB Atlas connection string
- Domain or IP address (95.216.139.119)

## Quick Deployment Steps

### 1. Environment Configuration

**Backend (.env.production):**
```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://johnreycutab:Johnrey123@cluster0.ixmkv.mongodb.net/nasm_database?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
FRONTEND_URL=http://95.216.139.119:3001
COOKIE_DOMAIN=95.216.139.119
```

**Frontend (.env.production):**
```bash
NEXT_PUBLIC_API_URL=http://95.216.139.119:3000/api
```

### 2. Backend Deployment

```bash
cd backend
cp .env.production .env
npm install --production
npm start
```

Backend will run on: `http://95.216.139.119:3000`

### 3. Frontend Deployment

```bash
cd frontend/nas-system
npm run build
npm start
```

Frontend will run on: `http://95.216.139.119:3001`

### 4. Using Deployment Scripts

Make scripts executable:
```bash
chmod +x deploy-production.sh
chmod +x stop-production.sh
```

Deploy:
```bash
./deploy-production.sh
```

Stop:
```bash
./stop-production.sh
```

## Key Changes Made

### Frontend Components Fixed:
- `components/application-review.tsx` - 12 hardcoded URLs fixed
- `components/notification-system.tsx` - 4 hardcoded URLs fixed
- `components/notification-dropdown.tsx` - 3 hardcoded URLs fixed
- `components/application-progress-tracker.tsx` - 3 hardcoded URLs fixed
- `components/application-form.tsx` - 1 hardcoded URL fixed
- `components/personality-test.tsx` - 1 hardcoded URL fixed
- `components/user-profile.tsx` - Already using environment variable
- `components/department-head-application-review.tsx` - 1 hardcoded URL fixed
- `app/department-head/page.tsx` - 5 hardcoded URLs fixed

### Backend Routes Fixed:
- Added missing `/api/auth/forgot-password` route
- Updated CORS configuration for production
- Enhanced environment variable support

### Configuration Updates:
- `next.config.mjs` - Dynamic backend URL configuration
- `.env.production` files for both frontend and backend
- Deployment scripts for easy production management

## API Endpoints Now Working:
- ✅ `/api/auth/forgot-password` - Password reset functionality
- ✅ `/api/auth/me` - User authentication check
- ✅ `/api/application` - Application CRUD operations
- ✅ All other endpoints using environment-based URLs

## Authentication Fix:
The 401 errors were caused by:
1. **Cookie Configuration Issues**: `sameSite: 'strict'` prevented cross-origin cookie sharing
2. **Domain Mismatch**: Cookies weren't being set for the correct domain
3. **CORS Configuration**: Not properly configured for production cross-origin requests
4. **Missing Routes**: `/api/auth/forgot-password` endpoint was missing

**Critical Changes Made:**
- Changed `sameSite` from 'strict' to 'lax' in cookie configuration
- Added `COOKIE_DOMAIN` environment variable for proper domain setting
- Updated CORS to allow production frontend domain
- Added authentication debugging logs for troubleshooting

All these issues have been resolved.

## Testing Production Deployment:

1. **Login Test:** Navigate to `http://95.216.139.119:3001` and try logging in
2. **API Test:** Check browser network tab for API calls to `95.216.139.119:3000`
3. **Forgot Password:** Test the forgot password functionality
4. **Application Form:** Test creating and submitting applications

## Troubleshooting:

### If you get 401 errors:
- Check that both servers are running
- Verify environment variables are set correctly
- Check browser console for CORS errors

### If you get 404 errors:
- Verify backend server is running on port 3000
- Check that all routes are properly defined
- Ensure environment variables match server IP

### If authentication fails:
- Clear browser cookies and localStorage
- Check MongoDB connection
- Verify JWT_SECRET is set in backend

## Production Monitoring:

Monitor your deployment with:
```bash
# Check if processes are running
ps aux | grep node

# Check logs
tail -f backend/logs/app.log  # if you have logging
tail -f frontend/logs/app.log

# Check ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
```

## Security Notes:
- Change JWT_SECRET and SESSION_SECRET in production
- Use HTTPS in production (consider using nginx as reverse proxy)
- Regularly update dependencies
- Monitor for security vulnerabilities

## Support:
If you encounter issues, check:
1. Server logs for error messages
2. Browser console for client-side errors
3. Network tab for failed API requests
4. MongoDB Atlas connection status

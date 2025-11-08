# 🔧 Environment Setup for Development Server

## Problem
CORS issues and API connection problems when using the development server at `http://95.216.139.119:3001`.

## Solution: Environment Variables

### Step 1: Create `.env.local` File

**Location:** `frontend/nas-system/.env.local`

**Content:**
```env
# For Development Server (95.216.139.119)
NEXT_PUBLIC_API_URL=http://95.216.139.119:3000/api

# For Localhost
# NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Step 2: Update `.env.local` Based on Environment

#### When Working on Development Server:
```env
NEXT_PUBLIC_API_URL=http://95.216.139.119:3000/api
```

#### When Working on Localhost:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Step 3: Restart Frontend
```bash
cd frontend/nas-system
npm run dev
```

## How It Works

### Before (Hardcoded)
```typescript
// ❌ Always uses localhost
const API_URL = 'http://localhost:3000/api'
```

### After (Dynamic)
```typescript
// ✅ Uses environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
```

## Components Updated

### 1. Notification Dropdown ✅
```typescript
// frontend/nas-system/components/notification-dropdown.tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
```

### 2. User Profile ✅
```typescript
// frontend/nas-system/components/user-profile.tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
```

### 3. Application Review ✅
```typescript
// frontend/nas-system/components/application-review.tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
```

## Testing

### Step 1: Check Environment Variable
```bash
# In frontend directory
echo $NEXT_PUBLIC_API_URL

# Should show: http://95.216.139.119:3000/api (or localhost)
```

### Step 2: Check Browser Console
1. Open browser DevTools
2. Go to Console tab
3. Look for:
   ```
   🔔 Notification API URL: http://95.216.139.119:3000/api
   📸 User Profile API URL: http://95.216.139.119:3000/api
   ```

### Step 3: Test Notifications
1. Click the bell icon in header
2. Check console for:
   ```
   🔔 Fetching notifications from: http://95.216.139.119:3000/api/notifications?limit=10
   🔔 Notification response status: 200
   🔔 Notifications received: {...}
   ```

### Step 4: Test Profile Picture
1. Go to Profile page
2. Check console for:
   ```
   📸 Student picture data: {...}
   📸 Loading image from: http://95.216.139.119:3000/api/files/...
   ```

## Troubleshooting

### Issue 1: Still Using Localhost
**Problem:** API calls still go to `localhost` even after setting `.env.local`

**Solution:**
1. Make sure `.env.local` is in `frontend/nas-system/` directory
2. Restart the frontend server
3. Clear browser cache
4. Check console for API URL

### Issue 2: CORS Errors
**Problem:** `Access-Control-Allow-Origin` errors

**Solution:**
1. Check backend CORS configuration in `backend/index.js`
2. Make sure `origin` includes your development server:
   ```javascript
   origin: [
     'http://localhost:3001',
     'http://127.0.0.1:3001',
     'http://95.216.139.119:3001',  // ✅ Add this
     process.env.FRONTEND_URL
   ]
   ```

### Issue 3: Notifications Not Loading
**Problem:** Bell icon shows no notifications

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Backend logs for errors
4. Database for actual notifications

**Debug:**
```typescript
// Check if notifications exist in database
db.notifications.find({ user: ObjectId("YOUR_USER_ID") })
```

### Issue 4: Profile Picture Not Loading
**Problem:** Avatar shows initials instead of picture

**Check:**
1. Browser console for image URL
2. Network tab for image request
3. Check if studentPicture exists in database:
   ```javascript
   db.documentuploads.findOne({ user: ObjectId("YOUR_USER_ID") })
   ```

## Backend CORS Configuration

### Current Configuration
```javascript
// backend/index.js
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://95.216.139.119:3001',  // ✅ Development server
    process.env.FRONTEND_URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cookie',
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: [
    'Set-Cookie', 
    'Content-Disposition', 
    'Content-Length', 
    'Content-Type'
  ],
}))
```

### If You Need to Add More Origins
```javascript
origin: [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://95.216.139.119:3001',
  'http://your-new-domain.com',  // ✅ Add here
  process.env.FRONTEND_URL
]
```

## Environment Files

### `.env.local` (Frontend)
```env
NEXT_PUBLIC_API_URL=http://95.216.139.119:3000/api
```

### `.env` (Backend)
```env
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret
FRONTEND_URL=http://95.216.139.119:3001
PORT=3000
```

## Quick Setup Commands

### For Development Server:
```bash
# Frontend
cd frontend/nas-system
echo "NEXT_PUBLIC_API_URL=http://95.216.139.119:3000/api" > .env.local
npm run dev

# Backend
cd backend
npm start
```

### For Localhost:
```bash
# Frontend
cd frontend/nas-system
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local
npm run dev

# Backend
cd backend
npm start
```

## Summary

### What Was Fixed
- ✅ Notifications now use dynamic API URL
- ✅ User profile uses dynamic API URL
- ✅ Proper error handling and logging
- ✅ Works on both localhost and development server
- ✅ CORS properly configured

### Files Changed
- ✅ `frontend/nas-system/components/notification-dropdown.tsx`
- ✅ `frontend/nas-system/components/user-profile.tsx`
- ✅ `backend/index.js` (CORS headers)

### How to Use
1. Create `.env.local` with your API URL
2. Restart frontend
3. Check console logs
4. Test notifications and profile

**Both notifications and user profile should now work on your development server!** 🎉

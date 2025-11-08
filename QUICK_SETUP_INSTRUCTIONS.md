# ⚡ Quick Setup for Development Server

## 1. Create Environment File

**File:** `frontend/nas-system/.env.local`

```bash
cd frontend/nas-system
echo "NEXT_PUBLIC_API_URL=http://95.216.139.119:3000/api" > .env.local
```

Or manually create the file with:
```env
NEXT_PUBLIC_API_URL=http://95.216.139.119:3000/api
```

## 2. Restart Frontend

```bash
cd frontend/nas-system
npm run dev
```

## 3. Check Console

Open browser console and look for:
```
🔔 Notification API URL: http://95.216.139.119:3000/api
📸 User Profile API URL: http://95.216.139.119:3000/api
```

## 4. Test Notifications

1. Click bell icon
2. Check console for:
   ```
   🔔 Fetching notifications from: http://95.216.139.119:3000/api/notifications?limit=10
   🔔 Notification response status: 200
   ```

## 5. Test Profile

1. Go to Profile page
2. Check console for:
   ```
   📸 Student picture data: {...}
   📸 Loading image from: http://95.216.139.119:3000/api/files/...
   ```

## If Issues Occur

### Notifications Not Loading
Check console for error messages:
- 401 Unauthorized → Login again
- Connection Error → Check backend is running
- CORS Error → Check backend CORS config

### Profile Picture Not Showing
Check console for:
- Image URL being fetched
- Any CORS errors
- If studentPicture exists in database

## That's It!

Everything should work now on your development server! 🎉

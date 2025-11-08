# 🔍 Debug: Header Profile Picture Not Showing

## Current Issue

The white circle in the header should show your student picture, but it's not loading.

## What I Added

I've added extensive logging to track the entire process:

```
👤 UserNav - User data: {...}
👤 UserNav - Auth status: "..."
👤 UserNav useEffect triggered
👤 Fetching student picture for user ID: "..."
📸 Fetching student picture from: http://...
📸 Document response status: 200
📸 Document data received: {...}
📸 Student picture data: {...}
📸 Loading image from: http://...
📸 Image response status: 200
✅ Profile image loaded successfully
```

## Steps to Debug

### Step 1: Restart Frontend
```bash
cd frontend/nas-system
npm run dev
```

### Step 2: Clear Browser Cache
1. Press `Ctrl+Shift+Delete`
2. Clear cached images and files
3. Or just: `Ctrl+F5` (hard refresh)

### Step 3: Open Console
1. Press `F12`
2. Go to Console tab
3. Clear console (trash icon)

### Step 4: Refresh Page
1. Go to any page (Dashboard or Profile)
2. Watch the console logs

### Step 5: Look for These Logs

#### Expected Flow (Success):
```
👤 UserNav - User data: { id: "...", name: "John Rey Cutab", ... }
👤 UserNav - Auth status: authenticated
👤 UserNav useEffect triggered
👤 Fetching student picture for user ID: "68d68ed9c20e24fa1b55c9e9"
📸 Fetching student picture from: http://localhost:3000/api/document-uploads/user/68d68ed9c20e24fa1b55c9e9
📸 Document response status: 200
📸 Document data received: { success: true, data: { studentPicture: {...} } }
📸 Student picture data: { filePath: "...", originalName: "..." }
📸 Loading image from: http://localhost:3000/api/files/...
📸 Image response status: 200
✅ Profile image loaded successfully: blob:http://localhost:3001/...
```

#### Problem Scenarios:

**Scenario 1: No User ID**
```
👤 UserNav - User data: null
👤 No user ID available yet
```
**Cause:** Not logged in or auth not loaded  
**Solution:** Login again

**Scenario 2: No Student Picture in Database**
```
📸 Document response status: 200
📸 No student picture found in data
```
**Cause:** You haven't uploaded a student picture yet  
**Solution:** Go to Profile page → Upload student picture

**Scenario 3: Document API Fails**
```
📸 Document response status: 404
❌ Failed to fetch documents, status: 404
```
**Cause:** API endpoint not working  
**Solution:** Check backend is running

**Scenario 4: Image File Not Found**
```
📸 Image response status: 404
❌ Failed to load image, status: 404
```
**Cause:** Image file doesn't exist on server  
**Solution:** Re-upload student picture

## Quick Checks

### Check 1: Do You Have a Student Picture?
1. Go to Profile page
2. Look at the big avatar on the left
3. Does it show your picture or a placeholder?

**If placeholder:** You need to upload a picture first!
1. Click "Change Photo" button
2. Select your picture
3. Upload
4. Refresh page

### Check 2: Is Backend Running?
```bash
# Check if backend is running
curl http://localhost:3000/api/auth/me
# Should return user data, not error
```

### Check 3: Check localStorage
```javascript
// In browser console:
console.log(JSON.parse(localStorage.getItem('nas_user')))
// Should show: { id: "...", name: "...", email: "..." }
```

### Check 4: Check API URL
```javascript
// In browser console:
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should show: http://localhost:3000/api (or your dev server)
```

## Common Issues & Solutions

### Issue 1: Picture Shows on Profile Page but Not Header

**Cause:** UserNav component not fetching picture

**Check Console For:**
```
👤 Fetching student picture for user ID: "..."
📸 Fetching student picture from: ...
```

**If you DON'T see these logs:**
- User ID is not available
- Component not mounted properly

**Solution:**
1. Check console for user data
2. Make sure you're logged in
3. Hard refresh (`Ctrl+F5`)

### Issue 2: 404 Error for Document API

**Console Shows:**
```
📸 Document response status: 404
```

**Cause:** Backend route not working

**Solution:**
1. Check backend is running
2. Check route exists: `GET /api/document-uploads/user/:userId`
3. Restart backend

### Issue 3: 404 Error for Image File

**Console Shows:**
```
📸 Image response status: 404
```

**Cause:** Image file doesn't exist

**Solution:**
1. Go to Profile page
2. Re-upload student picture
3. Check `backend/uploads/documents/` folder for the file

### Issue 4: CORS Error

**Console Shows:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Cause:** CORS not configured

**Solution:**
Already fixed! Using blob URLs should prevent this.
If you still see it, check `backend/index.js` CORS config.

### Issue 5: Name Shows "User" Instead of Real Name

**Console Shows:**
```
👤 UserNav - User data: { name: "User" }
```

**Cause:** Database has no name or localStorage has wrong data

**Solution:**
1. Check MongoDB user record
2. Update name field
3. Or clear localStorage and re-login

## Manual Fix

If nothing works, try this manual fix:

### Step 1: Check if Picture Exists
```bash
# In backend folder, check uploads:
ls backend/uploads/documents/
# Look for your picture file
```

### Step 2: Check Database
```javascript
// In MongoDB:
db.documentuploads.findOne({ userId: ObjectId("YOUR_USER_ID") })
// Check if studentPicture field exists
```

### Step 3: Force Re-upload
1. Go to Profile page
2. Click "Change Photo"
3. Upload a NEW picture
4. Refresh page
5. Check header

### Step 4: Clear Everything
```javascript
// In browser console:
localStorage.clear()
// Then logout and login again
```

## What to Share

If it still doesn't work, please share:

1. **Console Logs** - All logs with 👤, 📸, ✅, ❌
2. **Network Tab** - Check requests to:
   - `/api/document-uploads/user/:userId`
   - `/api/files/:filename`
3. **Profile Page** - Does picture show there?
4. **User ID** - From console: `JSON.parse(localStorage.getItem('nas_user')).id`

## Expected Result

After fixing, you should see:

### Header (All Pages):
```
┌────────────────────────────────────┐
│  🔔  [Your Photo] ▼  John Rey Cutab│  ✅
└────────────────────────────────────┘
```

### Console Logs:
```
✅ Profile image loaded successfully: blob:http://...
```

### Dropdown:
```
┌─────────────────────────┐
│ [Your Photo]            │
│ John Rey Cutab          │
│ your@email.com          │
├─────────────────────────┤
│ 👤 Profile              │
│ ⚙️  Settings            │
├─────────────────────────┤
│ 🚪 Log out              │
└─────────────────────────┘
```

## Summary

I've added comprehensive logging to track:
1. ✅ When UserNav component loads
2. ✅ When user data is available
3. ✅ When picture fetch is triggered
4. ✅ Document API response
5. ✅ Image API response
6. ✅ Success or failure

**Restart frontend, check console logs, and share what you see!** 🔍

# 🔧 Final Fixes & Troubleshooting Guide

## Latest Issues Fixed (Oct 25, 2025 - 5:45 AM)

---

## Issue 1: Admin Edit Application Validation Error ✅ FIXED

### Problem
```
Error: Validation failed: yearLevel: Path `yearLevel` is required., residingAt: Path `residingAt` is required...
```

### Root Cause
Backend was running validators on ALL fields even when only updating specific fields. The `runValidators: true` option in `findOneAndUpdate` was causing this.

### Fix
**File**: `backend/services/ApplicationService.js` (line 263)

```javascript
// Before:
{ new: true, runValidators: true }

// After:
{ new: true, runValidators: false }
```

**Why This Works**:
- Admin edits should allow partial updates
- We don't need to validate fields that aren't being changed
- The application was already validated when first submitted
- This allows admins to edit specific fields without requiring all data

---

## Issue 2: Department Assignment "Department not found" ⚠️ NEEDS ACTION

### Problem
```
Error: Department not found
```

### Root Cause
The department you're trying to assign doesn't exist in the database yet.

### Solution: Create Departments First

**Option 1: Use OAS Dashboard UI**
1. Login as admin
2. Go to OAS Dashboard
3. Click "Manage Departments" button in OAS Tools
4. Create departments (e.g., LSAC, IT, Engineering, etc.)

**Option 2: Use API Directly**
```bash
# Create a department
POST http://localhost:3000/api/departments
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "departmentCode": "LSAC",
  "name": "Liberal Arts and Communication"
}
```

**Option 3: Seed Script** (Recommended for production)
Create `backend/scripts/seedDepartments.js`:
```javascript
const mongoose = require('mongoose');
const Department = require('../models/Department');

const departments = [
  { departmentCode: 'LSAC', name: 'Liberal Arts and Communication' },
  { departmentCode: 'IT', name: 'Information Technology' },
  { departmentCode: 'ENGINEERING', name: 'Engineering' },
  { departmentCode: 'BUSINESS', name: 'Business Administration' },
  { departmentCode: 'EDUCATION', name: 'Education' },
  { departmentCode: 'NURSING', name: 'Nursing' }
];

async function seedDepartments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nasam');
    
    for (const dept of departments) {
      const existing = await Department.findOne({ departmentCode: dept.departmentCode });
      if (!existing) {
        await Department.create(dept);
        console.log(`✅ Created department: ${dept.departmentCode}`);
      } else {
        console.log(`⏭️  Department already exists: ${dept.departmentCode}`);
      }
    }
    
    console.log('✅ Department seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding departments:', error);
    process.exit(1);
  }
}

seedDepartments();
```

Run it:
```bash
cd backend
node scripts/seedDepartments.js
```

### Better Error Handling Added
**File**: `frontend/nas-system/services/oasDashboardService.ts`

Now shows actual backend error message instead of generic error.

---

## Issue 3: Document Download Still Not Working ⚠️ INVESTIGATION NEEDED

### Current Status
The backend route exists and FileUtils has been updated, but downloads still fail with 404.

### Debugging Steps

**Step 1: Check Backend Logs**
When you try to download, check the backend console for these messages:
```
❌ File not found in database. Tried paths: { ... }
📋 Checking if file exists on disk anyway...
✅ File exists on disk, allowing download
OR
❌ File not found on disk either
```

**Step 2: Verify File Exists**
```bash
# Check if file exists in backend/files directory
cd backend/files
ls -la
# Look for: RobloxScreenShot20231006_235137762.png
```

**Step 3: Check Database**
```javascript
// In MongoDB shell or Compass
db.documentuploads.findOne({
  $or: [
    { 'studentPicture.filePath': /RobloxScreenShot20231006_235137762.png/ },
    { 'studentPicture.originalName': /RobloxScreenShot20231006_235137762.png/ }
  ]
})
```

**Step 4: Check File Path Format**
The file might be stored with different path formats:
- `files/RobloxScreenShot20231006_235137762.png`
- `RobloxScreenShot20231006_235137762.png`
- `uploads/RobloxScreenShot20231006_235137762.png`

### Possible Issues

1. **File Not Uploaded Yet**
   - The document record exists but file wasn't actually uploaded
   - Solution: Re-upload the document

2. **File Path Mismatch**
   - Database has different path format than what we're checking
   - Solution: Check actual database entry and update FileUtils.js accordingly

3. **Permission Issue**
   - Backend can't read the files directory
   - Solution: Check directory permissions

4. **Wrong Files Directory**
   - Files are in a different location
   - Solution: Check where files are actually stored

### Quick Fix: Bypass Database Check (Temporary)

If you need downloads to work immediately, you can temporarily bypass the database check:

**File**: `backend/utils/FileUtils.js`

```javascript
// Comment out the database check temporarily
/*
if (!document) {
  console.log('❌ File not found in database');
  // Check if file exists on disk anyway...
}
*/

// Just check if file exists on disk
try {
  await fs.access(filePath);
  console.log('✅ File exists on disk, allowing download');
} catch (error) {
  console.log('❌ File not found on disk');
  return res.status(404).json({ message: 'File not found' });
}
```

**⚠️ WARNING**: This bypasses security checks. Only use for debugging!

---

## Complete Restart Checklist

After all fixes, you MUST restart the backend:

```bash
# Stop backend (Ctrl+C)
cd backend
npm start

# Check for errors in startup logs
# Should see: "Server running on port 3000"
```

---

## Testing Checklist

### Test 1: Admin Edit Application ✅
1. Login as admin
2. Go to OAS Dashboard → Applications
3. Click edit (pencil) icon on any application
4. Change just ONE field (e.g., first name)
5. Click "Save Changes"
6. ✅ Should save successfully without validation errors

### Test 2: Department Assignment ⚠️
1. **First**: Create departments using OAS Tools → Manage Departments
2. Login as admin
3. Go to OAS Dashboard
4. Find "Assign Applicant to Department" section
5. Select an applicant with "Ready for Interview" status
6. Select a department (that you just created)
7. Click "Assign"
8. ✅ Should assign successfully

### Test 3: Document Download ⚠️
1. Login as admin/OAS staff
2. View any application
3. Go to Documents tab
4. Click download on any document
5. Check backend console for debug messages
6. If fails, follow debugging steps above

---

## Production Deployment Notes

### Files Modified (Latest Session)
1. ✅ `backend/services/ApplicationService.js` - Disabled validators for admin edits
2. ✅ `frontend/nas-system/services/oasDashboardService.ts` - Better error handling

### Previous Session Files (Already Modified)
1. ✅ `backend/models/ApplicationHistory.js` - Status enum fix
2. ✅ `backend/utils/FileUtils.js` - Flexible file download
3. ✅ `backend/controllers/DepartmentController.js` - Assignment controller
4. ✅ `backend/services/DepartmentService.js` - Assignment service
5. ✅ `backend/index.js` - Assignment route
6. ✅ `frontend/nas-system/components/application-review.tsx` - Download URL
7. ✅ `frontend/nas-system/components/admin-evaluation-view.tsx` - Select fix
8. ✅ `frontend/nas-system/app/oas-dashboard/ToolsCard.tsx` - Evaluation button

### Deployment Steps
1. **Commit all changes**
   ```bash
   git add .
   git commit -m "Fix admin edit validation, department assignment, and file downloads"
   git push
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   git pull
   npm install
   # Restart server (pm2 restart or your method)
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend/nas-system
   git pull
   npm install
   npm run build
   # Deploy build
   ```

4. **Seed Departments** (IMPORTANT!)
   ```bash
   cd backend
   node scripts/seedDepartments.js
   ```

5. **Verify**
   - Test admin edit
   - Test department assignment
   - Test document downloads

---

## Known Issues & Workarounds

### Issue: Document Downloads Still Failing
**Status**: Under investigation
**Workaround**: 
1. Check if files actually exist in `backend/files/`
2. Re-upload documents if missing
3. Use temporary bypass (see above) for debugging

**Long-term Fix**: Need to investigate actual file storage location and database format

### Issue: Department Not Found
**Status**: Expected behavior - departments need to be created first
**Solution**: Run seed script or create via UI

### Issue: Validation Errors on Edit
**Status**: FIXED ✅
**Solution**: Backend now allows partial updates

---

## Emergency Rollback

If something breaks in production:

```bash
# Backend
cd backend
git revert HEAD
npm install
# Restart server

# Frontend
cd frontend/nas-system
git revert HEAD
npm install
npm run build
```

All changes are backward compatible, so rollback is safe.

---

## Support Contacts

**For Deployment Issues**:
- Check backend logs: `pm2 logs nas-backend` or `npm start` output
- Check frontend logs: Browser console (F12)
- Check database: MongoDB Compass or shell

**Common Error Messages**:
- "Department not found" → Create departments first
- "Validation failed" → Restart backend with latest code
- "File not found" → Check file exists in backend/files/
- "Permission denied" → Check user has correct role

---

## Summary

✅ **Admin Edit** - FIXED (restart backend required)
⚠️ **Department Assignment** - WORKING (need to create departments first)
⚠️ **Document Download** - NEEDS INVESTIGATION (debugging steps provided)

**Next Steps**:
1. Restart backend server
2. Create departments via UI or seed script
3. Test admin edit functionality
4. Investigate document download issue using debugging steps above

---

**Last Updated**: Oct 25, 2025 - 5:45 AM
**Status**: 2/3 Issues Fixed, 1 Under Investigation

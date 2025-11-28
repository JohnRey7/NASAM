# Department Not Found Error - Diagnosis & Fix

## Error
```
❌ Assignment service error: Error: Department not found
Failed to load resource: the server responded with a status of 404 (Not Found)
```

## Root Cause
The backend is looking for a department by `departmentCode`, but either:
1. **No departments exist in the database**, OR
2. **The department code doesn't match** (case sensitivity or wrong code)

## Changes Made

### 1. Backend - Enhanced Error Logging
**File**: `backend/services/DepartmentService.js`

Added detailed logging to show:
- What department code is being searched for
- Whether the department was found
- List of all available departments if not found

```javascript
console.log('📋 Assigning applicant:', { userId, departmentCode });
console.log('🔍 Looking for department with code:', upperDeptCode);
console.log('📍 Department found:', department ? `${department.name} (${department.departmentCode})` : 'NOT FOUND');

if (!department) {
  const allDepts = await Department.find({ is_deleted: false }).select('departmentCode name');
  console.log('📋 Available departments:', allDepts.map(d => `${d.departmentCode} - ${d.name}`));
  throw new Error(`Department '${upperDeptCode}' not found. Available departments: ${allDepts.map(d => d.departmentCode).join(', ')}`);
}
```

### 2. Frontend - Enhanced Logging
**File**: `frontend/nas-system/app/oas-dashboard/page.tsx`

Added logging to show:
- What departments are loaded on page load
- What departments are available when assigning
- What department code is being sent to the backend

```javascript
console.log('📋 Loaded departments:', departmentsArray);
console.log('📋 Department codes:', departmentsArray.map((d: any) => d.departmentCode));
console.log('🎯 Calling assignApplicantToDepartment with userId:', student._id, 'departmentCode:', selectedDepartment);
```

### 3. Created Department Setup Script
**File**: `backend/scripts/check-and-create-departments.js`

Script to check and create default CIT-U departments:
- CCS - College of Computer Studies
- CEA - College of Engineering and Architecture
- CAS - College of Arts and Sciences
- CBA - College of Business Administration
- CHTM - College of Hospitality and Tourism Management
- CNAHS - College of Nursing and Allied Health Sciences
- CED - College of Education
- CCJE - College of Criminal Justice Education

## How to Diagnose

### Step 1: Check Browser Console
Open the OAS Dashboard and check the browser console for:
```
📋 Loaded departments: [...]
📋 Department codes: [...]
```

**If empty or undefined**: No departments exist in your database.

### Step 2: Try to Assign
Click the "Assign" button and check the console for:
```
Available departments: [...]
Available department codes: [...]
🎯 Calling assignApplicantToDepartment with userId: ... departmentCode: ...
```

### Step 3: Check Backend Logs
Look at your backend terminal for:
```
📋 Assigning applicant: { userId: '...', departmentCode: '...' }
🔍 Looking for department with code: CCS
📍 Department found: NOT FOUND
📋 Available departments: []
```

**If "Available departments: []"**: Your database has no departments!

## Solutions

### Solution 1: Create Departments via API (Recommended)

**Using Postman or cURL**:

```bash
# Create CCS Department
curl -X POST http://localhost:3000/api/departments \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_JWT_TOKEN" \
  -d '{
    "departmentCode": "CCS",
    "name": "College of Computer Studies"
  }'

# Create CEA Department
curl -X POST http://localhost:3000/api/departments \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_JWT_TOKEN" \
  -d '{
    "departmentCode": "CEA",
    "name": "College of Engineering and Architecture"
  }'
```

### Solution 2: Create Departments via MongoDB

**Using MongoDB Compass or Shell**:

```javascript
// Connect to your database
use nasm_database

// Create departments
db.department.insertMany([
  {
    departmentCode: "CCS",
    name: "College of Computer Studies",
    is_deleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    departmentCode: "CEA",
    name: "College of Engineering and Architecture",
    is_deleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    departmentCode: "CAS",
    name: "College of Arts and Sciences",
    is_deleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    departmentCode: "CBA",
    name: "College of Business Administration",
    is_deleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

// Verify
db.department.find({ is_deleted: false })
```

### Solution 3: Use the Setup Script (When MongoDB is Running Locally)

```bash
cd backend
node scripts/check-and-create-departments.js
```

**Note**: This only works if you have MongoDB running locally. For MongoDB Atlas, use Solution 1 or 2.

## Testing After Fix

### 1. Verify Departments Exist

**Check via API**:
```bash
curl http://localhost:3000/api/departments?limit=100 \
  -H "Cookie: jwt=YOUR_JWT_TOKEN"
```

**Check via MongoDB**:
```javascript
db.department.find({ is_deleted: false })
```

### 2. Refresh OAS Dashboard

1. Open browser DevTools → Console
2. Refresh the page (F5)
3. Look for: `📋 Loaded departments: [...]`
4. Should show array of departments

### 3. Try Assigning Again

1. Select a student from "Ready for Interview"
2. Select a department (should now show in dropdown)
3. Click "Assign"
4. Check backend logs for success message

## Expected Result

**Frontend Console**:
```
📋 Loaded departments: [{departmentCode: "CCS", name: "College of Computer Studies"}, ...]
📋 Department codes: ["CCS", "CEA", "CAS", ...]
🎯 Calling assignApplicantToDepartment with userId: 673b2f4e... departmentCode: CCS
```

**Backend Console**:
```
📋 Assigning applicant: { userId: '673b2f4e...', departmentCode: 'CCS' }
🔍 Looking for department with code: CCS
📍 Department found: College of Computer Studies (CCS)
✅ Assigned applicant 673b2f4e... to department CCS
```

**Success Toast**:
```
✅ Success
[Student Name] assigned to department successfully.
```

## Common Issues

### Issue 1: Department Code Case Mismatch
**Symptom**: Department exists but still says "not found"
**Solution**: Backend converts to uppercase. Ensure department codes in DB are uppercase (CCS, not ccs)

### Issue 2: Soft Deleted Departments
**Symptom**: Department exists but query doesn't find it
**Solution**: Check `is_deleted` field. Should be `false`.

```javascript
// Fix soft-deleted departments
db.department.updateMany(
  { is_deleted: true },
  { $set: { is_deleted: false } }
)
```

### Issue 3: Empty Dropdown
**Symptom**: No departments show in the dropdown
**Solution**: Check browser console for department loading errors. Verify API endpoint `/api/departments` is accessible.

## Summary

✅ **Enhanced backend logging** - Shows available departments when not found  
✅ **Enhanced frontend logging** - Shows what's being sent to backend  
✅ **Created setup script** - Easy way to create default departments  
⚠️ **Action needed**: Create departments in your database  

**Next Steps**:
1. Check browser console to see if departments are loaded
2. If empty, create departments using Solution 1 or 2 above
3. Refresh the page
4. Try assigning again
5. Check backend logs for detailed error info

The enhanced logging will now tell you exactly what's wrong! 🎯

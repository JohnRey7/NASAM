# Department Head Dashboard Setup Guide

## Issue
Department head dashboard shows "No applicants assigned to your department yet" and department name is not displaying.

## Root Causes

### 1. Missing Backend Endpoint ✅ FIXED
The `/api/department-head/applicants` endpoint didn't exist in the backend.

**Solution**: Created the endpoint and service method to fetch applicants assigned to the department head's department.

### 2. No Applicants Assigned Yet ⚠️ NEEDS ACTION
No applicants have been assigned to your department yet.

**Solution**: You need to assign applicants to departments through the admin dashboard.

## Changes Made

### Backend Files Modified

**1. `backend/controllers/DepartmentController.js`**
- Added `getApplicantsForDepartmentHead` controller method
- Fetches applicants based on department head's department

**2. `backend/services/DepartmentService.js`**
- Added `getApplicantsForDepartmentHead` service method
- Queries `ApplicationForm` collection for applications with matching `assignedDepartment`
- Returns formatted applicant data

**3. `backend/index.js`**
- Added route: `GET /api/department-head/applicants`
- Permission: `application.readAll`

## How to Assign Applicants to Departments

### Option 1: Using the Admin API (Recommended)

**Endpoint**: `POST /api/admin/assign-applicant-to-department`

**Request Body**:
```json
{
  "userId": "USER_ID_OF_APPLICANT",
  "departmentCode": "CCS"
}
```

**Example using cURL**:
```bash
curl -X POST http://localhost:3000/api/admin/assign-applicant-to-department \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_JWT_TOKEN" \
  -d '{
    "userId": "673b2f4e8a1c2d3e4f5g6h7i",
    "departmentCode": "CCS"
  }'
```

### Option 2: Direct Database Update

**Using MongoDB Compass or Shell**:

```javascript
// Find all applications
db.applicationform.find({})

// Assign an application to a department
db.applicationform.updateOne(
  { _id: ObjectId("APPLICATION_ID") },
  { $set: { assignedDepartment: "CCS" } }
)

// Assign multiple applications to a department
db.applicationform.updateMany(
  { status: "approved" },
  { $set: { assignedDepartment: "CCS" } }
)
```

### Option 3: Create Admin UI (Future Enhancement)

Add a feature in the OAS Dashboard to assign applicants to departments:
- View all approved applications
- Select department from dropdown
- Click "Assign to Department" button

## Testing the Setup

### Step 1: Verify Department Head Account

```javascript
// In MongoDB
db.user.findOne({ idNumber: "YOUR-DEPT-HEAD-ID" })

// Should return:
{
  _id: ObjectId("..."),
  idNumber: "22-6729-813",
  name: "John Doe",
  role: ObjectId("..."),
  department: ObjectId("..."),  // ← Should have a department
  ...
}
```

### Step 2: Verify Department Exists

```javascript
// In MongoDB
db.department.findOne({ departmentCode: "CCS" })

// Should return:
{
  _id: ObjectId("..."),
  departmentCode: "CCS",
  name: "College of Computer Studies",
  is_deleted: false
}
```

### Step 3: Assign Test Applicant

```javascript
// Find an application
db.applicationform.findOne({ status: "approved" })

// Assign it to CCS department
db.applicationform.updateOne(
  { _id: ObjectId("APPLICATION_ID_HERE") },
  { $set: { assignedDepartment: "CCS" } }
)
```

### Step 4: Refresh Department Head Dashboard

1. Log in as department head
2. Navigate to `/department-head`
3. You should now see:
   - Department name displayed: "👥 College of Computer Studies (CCS)"
   - Assigned applicant(s) in the table

## Expected Result

After assigning applicants, the dashboard should show:

```
Department Head Dashboard
┌────────────────────────────────────────┐
│ 👥 College of Computer Studies (CCS)  │
└────────────────────────────────────────┘
Review and evaluate applications assigned to your department.

┌─────────────────────────────────────────────────────────────┐
│ 0 scheduled interviews                                       │
│ 0 completed interviews                                       │
│ 0 pending recommendations                                    │
└─────────────────────────────────────────────────────────────┘

Assigned Applicants
┌──────────────┬─────────────────┬──────────────┬─────────────┬────────┬─────────┐
│ Interview ID │ Applicant Name  │ Course       │ Schedule    │ Status │ Actions │
├──────────────┼─────────────────┼──────────────┼─────────────┼────────┼─────────┤
│ INT-2025-001 │ Juan Dela Cruz  │ BSCS 3rd Yr  │ To be sched │ Not... │ 👁 📧   │
└──────────────┴─────────────────┴──────────────┴─────────────┴────────┴─────────┘
```

## Quick Test Script

Run this in MongoDB to assign a test applicant:

```javascript
// 1. Find your department head's department
const deptHead = db.user.findOne({ idNumber: "YOUR-DEPT-HEAD-ID" });
const dept = db.department.findOne({ _id: deptHead.department });
console.log("Department:", dept.departmentCode, "-", dept.name);

// 2. Find an application to assign
const app = db.applicationform.findOne({ is_deleted: false });
console.log("Found application:", app._id);

// 3. Assign it
db.applicationform.updateOne(
  { _id: app._id },
  { $set: { assignedDepartment: dept.departmentCode } }
);

console.log("✅ Assigned application to", dept.departmentCode);
```

## Troubleshooting

### Department Name Not Showing?

**Check 1**: Department head has department assigned?
```javascript
db.user.findOne({ idNumber: "YOUR-ID" }).department
// Should NOT be null
```

**Check 2**: Log out and log back in
- Department information is loaded during login
- Or just refresh the page (the useEffect will fetch it)

### No Applicants Showing?

**Check 1**: Are there applications in the database?
```javascript
db.applicationform.countDocuments({ is_deleted: false })
```

**Check 2**: Are any assigned to your department?
```javascript
db.applicationform.find({ assignedDepartment: "CCS" })
```

**Check 3**: Check backend logs
- Look for: `🔍 Finding applicants for department: CCS`
- Look for: `📋 Found X applicants for department CCS`

### API Endpoint Not Found (404)?

**Solution**: Restart your backend server
```bash
# Stop the server (Ctrl+C)
# Start it again
cd backend
npm start
```

## Summary

✅ **Backend endpoint created**: `/api/department-head/applicants`  
✅ **Service method implemented**: `getApplicantsForDepartmentHead`  
✅ **Department display fixed**: Shows department name from `/auth/me`  
⚠️ **Action needed**: Assign applicants to departments  

**Next Steps**:
1. Restart backend server
2. Assign at least one applicant to your department (use MongoDB or API)
3. Refresh department head dashboard
4. You should see the applicant(s) listed!

🎉 **The system is ready - you just need to assign applicants!**

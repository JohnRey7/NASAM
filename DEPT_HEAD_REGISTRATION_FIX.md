# Department Head Registration 500 Error - Diagnosis & Fix

## Error Description
When attempting to register a new Department Head through the OAS Dashboard, the system returns a **500 Internal Server Error**.

**Error Location:**
- Frontend: `POST http://localhost:3000/api/auth/register/dept-head 500 (Internal Server Error)`
- Backend Endpoint: `/api/auth/register/dept-head`
- Controller: `AuthController.registerDepartmentHead`
- Service: `AuthService.registerDepartmentHead`

## Root Cause Analysis

The 500 error is most likely caused by one of the following issues:

### 1. **Missing `department_head` Role in Database** (Most Likely)
The backend code expects a role named `"department_head"` to exist in the `role` collection:

```javascript
const role = await Role.findOne({ name: "department_head" });
if (!role) {
  throw new Error('Department head role not found in database.');
}
```

If this role doesn't exist, the registration will fail with a 500 error.

### 2. **Department Not Found**
The selected department code must exist in the `department` collection.

### 3. **Email Verification Service Issues**
If email is provided, the system attempts to send a verification email which could fail.

## Solution Steps

### Step 1: Check Backend Logs
After adding enhanced logging, try registering again and check your backend terminal for detailed error messages. You should see:
- `Registering department head with data: { name, idNumber, email, departmentCode }`
- `Department lookup result: [department object or null]`
- `Role lookup result: [role object or null]`
- `Error in registerDepartmentHead service: [error details]`

### Step 2: Verify/Create the `department_head` Role

Run this MongoDB script to check if the role exists and create it if needed:

```javascript
// Connect to your MongoDB database
use nasm_database

// Check if department_head role exists
db.role.findOne({ name: "department_head" })

// If it doesn't exist, create it
db.role.insertOne({
  name: "department_head",
  description: "Department Head role with permissions to manage department applicants",
  permissions: [
    "application.readAll",
    "application.update",
    "interview.create",
    "interview.update",
    "evaluation.create",
    "evaluation.read",
    "notification.create"
  ],
  createdAt: new Date(),
  updatedAt: new Date()
})

// Verify it was created
db.role.findOne({ name: "department_head" })
```

### Step 3: Verify Departments Exist

Check that departments are properly loaded:

```javascript
// List all departments
db.department.find({})

// If empty, you need to seed departments first
```

### Step 4: Test Registration Again

After ensuring the role exists:
1. Navigate to OAS Dashboard
2. Scroll to "Register Department Head" section
3. Fill in the form:
   - **Name**: Full name (letters, spaces, hyphens, apostrophes only)
   - **Email**: Valid email address
   - **ID Number**: Format `DD-DDDD-DDD` (e.g., `22-6729-813`)
   - **Password**: Min 8 chars with at least 3 of: uppercase, lowercase, number, special char
   - **Department**: Select from dropdown
4. Click "Register Department Head"

## Validation Rules

The backend enforces these validation rules:

### Name
- Pattern: `/^[a-zA-Z\s'-]+$/`
- Only letters, spaces, hyphens, and apostrophes allowed

### ID Number
- Pattern: `/^\d{2}-\d{4}-\d{3}$/`
- Example: `22-6729-813`

### Password
- Minimum 8 characters
- Must include at least 3 of:
  - Uppercase letter (A-Z)
  - Lowercase letter (a-z)
  - Number (0-9)
  - Special character (!@#$%^&*(),.?":{}|<>)

### Department Code
- Must exist in the `department` collection
- Must match exactly (case-sensitive)

## Files Modified

### Backend
- **File**: `backend/services/AuthService.js`
- **Changes**: Added comprehensive console logging to diagnose the exact failure point
- **Lines**: 202-302

### What Was Added
```javascript
console.log('Registering department head with data:', { name, idNumber, email, departmentCode });
console.log('Department lookup result:', department);
console.log('Role lookup result:', role);
console.log('Department head user created successfully:', user._id);
console.error('Error in registerDepartmentHead service:', error);
```

## Expected Behavior After Fix

### Success Case
1. Form validation passes
2. Department exists in database
3. `department_head` role exists
4. User is created successfully
5. Verification email sent (if email provided)
6. Response: `{ message: "Department head registered successfully", user: {...} }`
7. Form clears and shows success message

### Error Cases
- **400 Bad Request**: Validation errors (invalid format, duplicate ID/email)
- **500 Internal Server Error**: Database/server issues (missing role, email service failure)

## Testing Checklist

- [ ] Backend logs show detailed error information
- [ ] `department_head` role exists in database
- [ ] Selected department exists in database
- [ ] ID number follows format `DD-DDDD-DDD`
- [ ] Password meets complexity requirements
- [ ] Email service is configured (if using email)
- [ ] User can successfully register
- [ ] Verification email is sent (if email provided)
- [ ] New user appears in `user` collection with correct role and department

## Quick MongoDB Commands

```javascript
// Check if role exists
db.role.findOne({ name: "department_head" })

// List all roles
db.role.find({})

// List all departments
db.department.find({})

// Find newly created department head user
db.user.findOne({ idNumber: "YOUR-ID-NUMBER" }).populate('role').populate('department')
```

## Next Steps

1. **Restart your backend server** to apply the logging changes
2. **Check MongoDB** for the `department_head` role
3. **Create the role** if it doesn't exist (use script above)
4. **Try registration again** and monitor backend console logs
5. **Share the console output** if the error persists

## Contact & Support

If the error persists after following these steps, please provide:
1. Complete backend console logs from the registration attempt
2. Screenshot of the frontend error
3. MongoDB query results for role and department checks

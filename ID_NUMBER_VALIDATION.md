# CIT ID Number Format Validation

## Overview
Implemented strict ID Number format validation to enforce CIT University's ID format: **DD-DDDD-DDD** (e.g., 22-6729-813)

## Implementation Details

### Frontend Validation (`register-form.tsx`)

**Features:**
1. **Auto-formatting**: Automatically inserts hyphens as user types
2. **Input masking**: Limits input to 11 characters (DD-DDDD-DDD)
3. **Real-time validation**: Shows error message if format is incorrect
4. **Visual feedback**: Red border on invalid input

**Format Rules:**
- First 2 digits: Year of enrollment
- Next 4 digits: Sequence number
- Last 3 digits: Student identifier
- Total: 9 digits with 2 hyphens (11 characters)

**Example Valid IDs:**
- `22-6729-813`
- `09-0969-969`
- `21-1234-567`

**Example Invalid IDs:**
- `69` (too short)
- `ABC-1234-567` (contains letters)
- `22-67-813` (wrong format)
- `22-6729-8133` (too long)

### Backend Validation (`AuthService.js`)

**Validation Pattern:** `/^\d{2}-\d{4}-\d{3}$/`

**Applied to:**
1. `register()` - Student registration
2. `registerDepartmentHead()` - Department head registration

**Error Message:**
```
Invalid ID number format. Please use the format: DD-DDDD-DDD (e.g., 22-6729-813)
```

## Acceptance Criteria ✅

### ✅ Format Enforcement
- System uses input masking with format DD-DDDD-DDD
- Automatically inserts hyphens at correct positions
- Limits input to exactly 11 characters

### ✅ Valid Input
- System successfully registers ID numbers matching CIT format
- Example: `22-6729-813` is accepted

### ✅ Invalid Input Prevention
- System rejects IDs that are too short (e.g., `69`)
- System rejects IDs that are too long (e.g., `22-6729-8133`)
- System rejects IDs with non-numeric characters (e.g., `ABC-1234-567`)
- System rejects IDs with wrong format (e.g., `22-67-813`)

### ✅ Error Feedback
- Frontend displays: "Please enter a valid CIT ID in the format: DD-DDDD-DDD (e.g., 22-6729-813)"
- Backend returns: "Invalid ID number format. Please use the format: DD-DDDD-DDD (e.g., 22-6729-813)"
- Input field shows red border when invalid
- Error message appears below the input field

## Testing Guide

### Test Case 1: Valid ID Number
1. Go to registration page
2. Enter ID: Type `226729813` (without hyphens)
3. **Expected**: Auto-formats to `22-6729-813`
4. Click Register
5. **Expected**: Registration succeeds

### Test Case 2: Too Short
1. Go to registration page
2. Enter ID: `69`
3. Click Register
4. **Expected**: Error message appears
5. **Expected**: Red border on input field

### Test Case 3: Too Long
1. Go to registration page
2. Enter ID: `2267298133` (10 digits)
3. **Expected**: Only accepts first 9 digits, formats as `22-6729-813`

### Test Case 4: Non-numeric Characters
1. Go to registration page
2. Try typing: `ABC-1234-567`
3. **Expected**: Only numbers are accepted, letters are ignored

### Test Case 5: Wrong Format (Backend)
1. Use API testing tool (Postman)
2. Send POST to `/api/auth/register` with ID: `22-67-813`
3. **Expected**: 400 error with format message

## Deployment

```bash
# Commit changes
git add .
git commit -m "Add CIT ID Number format validation (DD-DDDD-DDD)"
git push origin main

# Deploy Backend
cd ~/NASAM/backend
git pull origin main
screen -X -S backend quit
screen -S backend
npm start
# Ctrl+A, D

# Deploy Frontend
cd ~/NASAM/frontend/nas-system
git pull origin main
npm run build
screen -X -S frontend quit
screen -S frontend
npm start
# Ctrl+A, D
```

## Files Modified

### Frontend
- `frontend/nas-system/components/register-form.tsx`
  - Added `formatIdNumber()` function
  - Added `validateIdNumber()` function
  - Added `handleIdNumberChange()` handler
  - Updated input field with controlled state
  - Added error display

### Backend
- `backend/services/AuthService.js`
  - Added ID format validation in `register()`
  - Added ID format validation in `registerDepartmentHead()`
  - Pattern: `/^\d{2}-\d{4}-\d{3}$/`

## Business Rules Enforced

1. **Format Consistency**: All ID numbers must follow DD-DDDD-DDD format
2. **Data Integrity**: Invalid formats cannot be stored in database
3. **User Experience**: Auto-formatting reduces user errors
4. **Clear Feedback**: Specific error messages guide users to correct format
5. **Security**: Backend validation prevents API bypass attempts

## Status: ✅ COMPLETE & READY FOR TESTING

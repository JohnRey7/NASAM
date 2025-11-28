# 🔧 Document Route Fix Summary

## Issue Identified
Your backend groupmate discovered that the document routes were being called incorrectly. The system uses:
- **MongoDB User ID** (`_id` from database) - NOT `idNumber`
- **File UUID** (generated filename like `8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png`) - NOT original filename

## Routes Fixed

### ✅ Fixed Route
**File:** `frontend/nas-system/components/department-head-application-review.tsx`
- **Line 96** - Changed from:
  ```typescript
  `/documents/download/${filename}` ❌
  ```
  To:
  ```typescript
  `/files/${filename}` ✅
  ```

### ✅ Already Correct Routes
These routes were already using the correct format:

1. **application-review.tsx (Line 105)**
   ```typescript
   `/files/${filename}` ✅
   ```

2. **application-review.tsx (Line 63)**
   ```typescript
   `/document-uploads/user/${userId}` ✅
   ```

3. **department-head-application-review.tsx (Line 62)**
   ```typescript
   `/document-uploads/user/${userId}` ✅
   ```

## Correct Usage Pattern

### 1. Get Documents by MongoDB User ID
```typescript
GET /api/document-uploads/user/:userId
```
**Example:**
```
http://95.216.139.119:3000/api/document-uploads/user/68e6498c55eee842c9017fba
```

### 2. Download File by UUID
```typescript
GET /api/files/:fileName
```
**Example:**
```
http://95.216.139.119:3000/api/files/8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png
```

## How It Works

### Step 1: Get User's MongoDB ID
If you only have `idNumber`, first get the MongoDB `_id`:
```typescript
const userResponse = await axios.get(`/api/users/idnumber/21-1234-567`);
const userId = userResponse.data._id; // "68e6498c55eee842c9017fba"
```

### Step 2: Get Documents
Use the MongoDB `_id` to fetch documents:
```typescript
const docs = await axios.get(`/api/document-uploads/user/${userId}`);
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "_id": "68e6498c55eee842c9017fba",
    "user": "68e6498c55eee842c9017fba",
    "studentPicture": {
      "filePath": "8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png",  // ← UUID (use for download)
      "originalName": "my-photo.png",                          // ← Display name
      "uploadedAt": "2024-11-01T16:28:00.000Z"
    },
    "nbiClearance": [...],
    "gradeReport": [...],
    ...
  }
}
```

### Step 3: Download File
Use the `filePath` (UUID) to download:
```typescript
const filePath = docs.data.studentPicture.filePath;
const fileResponse = await axios.get(`/api/files/${filePath}`, {
  responseType: 'blob'
});

// Display with original name
const originalName = docs.data.studentPicture.originalName;
```

## Why This Pattern?

### Security & Organization
- **UUID filenames** prevent file overwrites and conflicts
- **Original names** preserved for user display
- **MongoDB IDs** ensure correct user-document association

### Example Flow
```
User uploads: "my-photo.png"
    ↓
System generates: "8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png"
    ↓
Stored on server: /uploads/8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png
    ↓
Database stores:
  - filePath: "8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png" (for download)
  - originalName: "my-photo.png" (for display)
```

## Testing

### Test Document Retrieval
```bash
# Get user by ID number
curl -X GET "http://95.216.139.119:3000/api/users/idnumber/21-1234-567" \
  --cookie "token=YOUR_JWT_TOKEN"

# Get documents by MongoDB User ID
curl -X GET "http://95.216.139.119:3000/api/document-uploads/user/68e6498c55eee842c9017fba" \
  --cookie "token=YOUR_JWT_TOKEN"

# Download file by UUID
curl -X GET "http://95.216.139.119:3000/api/files/8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png" \
  --cookie "token=YOUR_JWT_TOKEN" \
  --output downloaded-file.png
```

## Status
✅ **All routes fixed and verified**
- Department Head document download route corrected
- All other routes already using correct pattern
- Ready for testing

## Credits
Thanks to your backend groupmate for discovering and testing the correct route patterns! 🎯

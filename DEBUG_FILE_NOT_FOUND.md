# 🔍 Debug: File Not Found Error

## Error Message
```
⏭️  Trying files directory
❌ File not found in database. Tried paths: {
  relativeFilePath: 'files/RobloxScreenShot20240101_014951103.png',
  sanitizedFileName: 'RobloxScreenShot20240101_014951103.png'
}
```

## Problem Analysis

### What's Happening
1. Frontend is requesting: `RobloxScreenShot20240101_014951103.png` (original filename)
2. Backend is looking for: `RobloxScreenShot20240101_014951103.png` in the files directory
3. Actual file on server: `8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png` (UUID)
4. Result: **404 File Not Found** ❌

### Root Cause
The backend is returning `originalName` in the `filePath` field instead of the UUID.

## Debugging Steps

### Step 1: Restart Backend with Logging
```bash
cd backend
npm start
```

Watch for these logs when you view documents:
```
📄 Raw documents from DB: {
  studentPicture: { filePath: '...', originalName: '...' },
  nbiClearance: [{ filePath: '...', originalName: '...' }],
  gradeReport: [{ filePath: '...', originalName: '...' }]
}

📤 Sending to frontend: {
  studentPicture: { 
    uploaded: true, 
    filePath: '...', 
    originalName: '...' 
  },
  nbiClearance: { 
    uploaded: true, 
    filePath: '...', 
    originalName: '...' 
  }
}
```

### Step 2: Check What's in the Database

**Expected Structure:**
```javascript
{
  studentPicture: {
    filePath: "8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png",  // ✅ UUID
    originalName: "RobloxScreenShot20240101_014951103.png",  // ✅ Original
    uploadedAt: "2024-10-25T..."
  }
}
```

**Problem Structure (if you see this):**
```javascript
{
  studentPicture: {
    filePath: "RobloxScreenShot20240101_014951103.png",  // ❌ Wrong! This is originalName
    originalName: "RobloxScreenShot20240101_014951103.png",
    uploadedAt: "2024-10-25T..."
  }
}
```

### Step 3: Check Frontend Console

Open browser console and look for:
```javascript
📄 Document response: {...}
📄 Sample document: {
  uploaded: true,
  filePath: "RobloxScreenShot20240101_014951103.png",  // ❌ If you see original name here, it's wrong!
  originalName: "RobloxScreenShot20240101_014951103.png"
}
```

**Should be:**
```javascript
📄 Sample document: {
  uploaded: true,
  filePath: "8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png",  // ✅ UUID
  originalName: "RobloxScreenShot20240101_014951103.png"  // ✅ Original
}
```

### Step 4: Check Actual Files on Server

```bash
# On your server, check what files actually exist
cd backend/uploads
ls -la

# You should see files like:
8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png  ✅
f9e8d7c6-b5a4-3210-9876-543210fedcba.pdf  ✅

# NOT like:
RobloxScreenShot20240101_014951103.png  ❌
```

## Possible Causes & Solutions

### Cause 1: Database Has Wrong Data

**Check Database:**
```javascript
// In MongoDB, check the DocumentUpload collection
db.documentuploads.findOne({ user: ObjectId("...") })

// Look at studentPicture field:
{
  studentPicture: {
    filePath: "RobloxScreenShot20240101_014951103.png",  // ❌ Wrong!
    originalName: "RobloxScreenShot20240101_014951103.png"
  }
}
```

**Solution:** The file was uploaded incorrectly. The upload process didn't generate a UUID. Check your document upload service.

### Cause 2: Backend Code Not Extracting filePath Correctly

**Check Backend Logs:**
```
📄 Raw documents from DB: {
  studentPicture: { 
    filePath: "8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png",  // ✅ Correct in DB
    originalName: "RobloxScreenShot20240101_014951103.png" 
  }
}

📤 Sending to frontend: {
  studentPicture: { 
    filePath: "RobloxScreenShot20240101_014951103.png",  // ❌ Wrong! Code error
    originalName: "RobloxScreenShot20240101_014951103.png" 
  }
}
```

**Solution:** The backend code is incorrectly mapping the fields. Check `ApplicationService.js` lines 654-656.

### Cause 3: Old Data in Database

**Problem:** Files uploaded before the UUID system was implemented.

**Check:**
```javascript
// Old format (before UUID):
{
  studentPicture: "RobloxScreenShot20240101_014951103.png"  // ❌ String instead of object
}

// New format (with UUID):
{
  studentPicture: {
    filePath: "8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png",
    originalName: "RobloxScreenShot20240101_014951103.png"
  }
}
```

**Solution:** Re-upload the documents or migrate old data.

## Quick Fix: Check Backend Code

The backend code in `ApplicationService.js` should handle both old and new formats:

```javascript
studentPicture: {
  uploaded: !!(documents?.studentPicture),
  filePath: documents?.studentPicture && typeof documents.studentPicture === 'string' 
    ? documents.studentPicture  // ❌ Old format: string is the filename, not UUID
    : documents?.studentPicture?.filePath || null,  // ✅ New format: extract UUID
  originalName: documents?.studentPicture && typeof documents.studentPicture === 'string' 
    ? documents.studentPicture  // ❌ Old format: use string as originalName
    : documents?.studentPicture?.originalName || null,  // ✅ New format: extract originalName
  filename: documents?.studentPicture && typeof documents.studentPicture === 'string' 
    ? documents.studentPicture 
    : documents?.studentPicture?.originalName || null,
  uploadedAt: documents?.createdAt
}
```

**Issue:** If `documents.studentPicture` is a string (old format), it's using the original filename as `filePath`, which is wrong!

## Solution Options

### Option 1: Re-upload Documents (Recommended)
1. Delete the old document
2. Upload again
3. New upload will generate UUID properly

### Option 2: Fix Backend Code for Old Data

Update `ApplicationService.js` to handle old string format:

```javascript
studentPicture: {
  uploaded: !!(documents?.studentPicture),
  filePath: (() => {
    if (!documents?.studentPicture) return null;
    if (typeof documents.studentPicture === 'string') {
      // Old format: string is the filename
      // Check if it's already a UUID or original name
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(documents.studentPicture);
      return isUUID ? documents.studentPicture : null;  // Only return if it's a UUID
    }
    // New format: extract filePath
    return documents.studentPicture.filePath || null;
  })(),
  originalName: documents?.studentPicture && typeof documents.studentPicture === 'string' 
    ? documents.studentPicture 
    : documents?.studentPicture?.originalName || null,
  filename: documents?.studentPicture && typeof documents.studentPicture === 'string' 
    ? documents.studentPicture 
    : documents?.studentPicture?.originalName || null,
  uploadedAt: documents?.createdAt
}
```

### Option 3: Database Migration Script

Create a script to migrate old data:

```javascript
// migrate-documents.js
const DocumentUpload = require('./models/DocumentUpload');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function migrateDocuments() {
  const docs = await DocumentUpload.find({});
  
  for (const doc of docs) {
    let updated = false;
    
    // Migrate studentPicture if it's a string
    if (doc.studentPicture && typeof doc.studentPicture === 'string') {
      const oldPath = path.join(__dirname, 'uploads', doc.studentPicture);
      const ext = path.extname(doc.studentPicture);
      const newFileName = `${uuidv4()}${ext}`;
      const newPath = path.join(__dirname, 'uploads', newFileName);
      
      // Rename file
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        
        // Update database
        doc.studentPicture = {
          filePath: newFileName,
          originalName: doc.studentPicture,
          uploadedAt: doc.createdAt || new Date()
        };
        updated = true;
      }
    }
    
    if (updated) {
      await doc.save();
      console.log(`✅ Migrated document for user: ${doc.user}`);
    }
  }
  
  console.log('✅ Migration complete!');
}

migrateDocuments().catch(console.error);
```

## Testing After Fix

### 1. Check Backend Logs
```
📄 Raw documents from DB: {
  studentPicture: { 
    filePath: "8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png",  // ✅ UUID
    originalName: "RobloxScreenShot20240101_014951103.png" 
  }
}

📤 Sending to frontend: {
  studentPicture: { 
    filePath: "8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png",  // ✅ UUID
    originalName: "RobloxScreenShot20240101_014951103.png" 
  }
}
```

### 2. Check Frontend Console
```javascript
📄 Sample document: {
  uploaded: true,
  filePath: "8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png",  // ✅ UUID
  originalName: "RobloxScreenShot20240101_014951103.png"
}
```

### 3. Test Download
Click "Download" button:
```
✅ Fetching: /api/files/8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png
✅ File found and downloaded!
✅ Saved as: RobloxScreenShot20240101_014951103.png
```

## Summary

### Current Error
```
❌ Looking for: RobloxScreenShot20240101_014951103.png
❌ File not found!
```

### After Fix
```
✅ Looking for: 8a35bea0-3cc0-4292-a6ae-2a2ded65b39a.png
✅ File found!
✅ Downloaded as: RobloxScreenShot20240101_014951103.png
```

## Next Steps

1. **Restart backend** to see debug logs
2. **Check backend console** for what's in the database
3. **Check frontend console** for what's being received
4. **Choose solution:**
   - Re-upload documents (easiest)
   - Fix backend code for old data
   - Run migration script

**The logs will tell you exactly where the problem is!** 🎯

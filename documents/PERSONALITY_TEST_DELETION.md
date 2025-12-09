# Personality Test Answer Deletion Feature

## Overview
Added functionality to delete a user's personality test results from the Admin panel. This allows administrators to reset a student's test if needed.

## Changes

### Backend
- **File**: `backend/services/PersonalityTestService.js`
- **Change**: Updated `getAllUserPersonalityTest` to populate `applicationId` with `user` details (firstName, lastName, email). This ensures the frontend has access to the User ID required for deletion.

### Frontend Service
- **File**: `frontend/nas-system/services/personalityTestService.ts`
- **Change**: Added `deletePersonalityTestByUserId` function which calls `DELETE /api/personality-test/user/:userId`.

### Frontend Component
- **File**: `frontend/nas-system/components/admin/PersonalityTestAnswers.tsx`
- **Change**:
    - Added "Actions" column to the table.
    - Added a Delete button (Trash icon) for each row.
    - Implemented `handleDelete` function with confirmation dialog.
    - Updated user name display logic to use the newly populated `applicationId.user` data.
    - Added error handling and success toasts.

## Usage
1.  Navigate to the Personality Test Answers section in the Admin panel.
2.  Locate the student whose results you want to delete.
3.  Click the Trash icon in the "Actions" column.
4.  Confirm the deletion in the browser dialog.
5.  The table will refresh, and the user's test results will be removed.

# NASAM Development Setup Guide

## Environment Configuration

### Backend Development Mode

To enable development-friendly features, add these environment variables to your backend `.env` file:

```env
# Enable development mode
NODE_ENV=development

# Enable notification dev mode (logs notifications instead of saving to DB)
NOTIFICATION_DEV_MODE=true
```

### Frontend Development Mode

The frontend automatically uses `localhost:3000` for API calls when `NEXT_PUBLIC_API_URL` is not set.

Default configuration in services:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
```

## Recent Fixes Applied

### 1. Document Loading 500 Error - FIXED ✅
**Issue**: Duplicate `SoftDeleteUtils` require causing internal server error
**Location**: `backend/services/ApplicationService.js`
**Fix**: Removed duplicate require statement in `getApplicationDocumentsByAppId` method

### 2. Duplicate Application Error - FIXED ✅
**Issue**: "User already has an application" error when submitting
**Location**: `backend/services/ApplicationService.js`
**Fix**: Modified `createApplication` to update existing applications instead of throwing error
- Now automatically updates existing application if one exists
- Creates new application only if none exists
- Logs activity and sends notifications for both cases

### 3. Personality Test 404 Error - FIXED ✅
**Issue**: 404 errors when personality test doesn't exist yet
**Location**: `frontend/services/departmentHeadService.ts`
**Fix**: Added graceful 404 handling
- Returns `null` when no test exists (normal for new applicants)
- Only throws error for actual server issues
- Logs informational message for missing tests

### 4. Notification Development Mode - ADDED ✅
**Issue**: Notification creation errors during development
**Location**: `backend/services/NotificationService.js`
**Feature**: Added development mode that logs notifications instead of saving to DB
- Controlled by `NODE_ENV=development` or `NOTIFICATION_DEV_MODE=true`
- Logs notification details to console with 📧 emoji
- Returns mock notification object for testing
- Prevents DB errors during development

## API Endpoints Reference

### Application Endpoints
- `POST /api/application` - Create or update application (now handles duplicates)
- `GET /api/application/me` - Get current user's application
- `GET /api/oas/application/:applicationId/documents` - Get application documents

### Personality Test Endpoints
- `GET /api/personality-test/user/:userId` - Get personality test by user ID
  - Returns 404 if no test exists (normal behavior)
  - Frontend handles this gracefully

### Document Endpoints
- `GET /api/oas/application/:applicationId/documents` - Get documents with status
- `PATCH /api/oas/application/:applicationId/verify-documents` - Verify all documents
- `DELETE /api/oas/application/:applicationId/documents-only` - Delete documents only

## Development Workflow

### Starting the Application

1. **Backend** (Port 3000):
```bash
cd backend
npm install
# Set NODE_ENV=development in .env
npm start
```

2. **Frontend** (Port 3001):
```bash
cd frontend/nas-system
npm install
npm run dev
```

### Testing Application Submission

1. User can now submit multiple times - subsequent submissions update existing application
2. No need to delete application between tests
3. Check console for update logs: `📝 Updating existing application for user: [userId]`

### Testing Notifications

With `NOTIFICATION_DEV_MODE=true`:
- Notifications are logged to console with 📧 emoji
- No database writes occur
- Mock notification object returned for testing
- Perfect for development without MongoDB setup

### Testing Document Upload

1. Documents endpoint now works correctly (500 error fixed)
2. Check document status at `/api/oas/application/:applicationId/documents`
3. All 7 required documents tracked with completion percentage

### Testing Personality Tests

1. 404 errors are normal when test doesn't exist yet
2. Frontend gracefully handles missing tests
3. Check console for: `No personality test found for user: [userId]`

## Troubleshooting

### Issue: Still getting "User already has an application"
**Solution**: Restart backend server to load updated code

### Issue: Notifications not appearing
**Solution**: Check if `NOTIFICATION_DEV_MODE=true` - notifications are logged, not saved in dev mode

### Issue: Document loading still fails
**Solution**: Clear browser cache and restart backend

### Issue: Personality test 404 persists
**Solution**: This is normal - test only exists after applicant takes it. Check if error is handled gracefully in UI.

## Code Changes Summary

### Backend Changes
1. `backend/services/ApplicationService.js` - Line 608-619
   - Removed duplicate SoftDeleteUtils require
   
2. `backend/services/ApplicationService.js` - Line 37-95
   - Modified createApplication to handle updates
   
3. `backend/services/NotificationService.js` - Line 1-47
   - Added DEV_MODE flag and conditional logic

### Frontend Changes
1. `frontend/services/departmentHeadService.ts` - Line 118-133
   - Added 404 error handling for personality tests

## Next Steps for Production

Before deploying to production:

1. Set `NODE_ENV=production` in backend
2. Remove or set `NOTIFICATION_DEV_MODE=false`
3. Ensure `NEXT_PUBLIC_API_URL` points to production API
4. Test all endpoints with production database
5. Verify notifications are being saved to DB

## Support

For issues or questions:
- Check console logs for detailed error messages
- Review this document for common solutions
- Verify environment variables are set correctly

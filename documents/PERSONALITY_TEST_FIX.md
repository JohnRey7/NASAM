# Personality Test Template Creation Fix

## Issue
Users were unable to create Personality Test Templates. The error message "Error: type and question are required" was displayed.

## Root Cause
There was a mismatch between the Frontend form data and the Backend model schema.
- **Frontend**: Was sending `{ name, description }` (treating it as a "Template" container).
- **Backend**: Was expecting `{ type, question }` (treating it as a single "Question" item).

The backend `PersonalityTestService.createTemplate` explicitly checks for `type` and `question`.

## Fix Implemented
Updated `frontend/nas-system/components/admin/PersonalityTestTemplates.tsx` to align with the backend schema.

1.  **Renamed UI Elements**: Changed "Template" to "Question" in the UI (Dialog titles, Buttons) to accurately reflect that the user is adding a question to the bank, not creating a form template.
2.  **Updated Form State**: Changed `formData` to use `type` and `question`.
3.  **Updated Inputs**:
    - "Template Name" -> "Category / Type" (binds to `type`)
    - "Description" -> "Question" (binds to `question`)
4.  **Updated Table**: Now displays "Category" and "Question" columns.

## Verification
- The frontend now sends the correct payload to `POST /api/personality-test/template`.
- The backend validation in `PersonalityTestService.js` will now pass.

# Fix: Invalid Evaluation ID on Update

## Issue
When attempting to update an evaluation in the admin dashboard, the server returned an "Invalid evaluation ID" error.

## Root Cause
The `convertDecimal128ToNumber` helper function in `backend/services/EvaluationService.js` was recursively iterating over all objects to convert `Decimal128` fields to numbers. However, it treated Mongoose `ObjectId`s as plain objects, iterating over their internal properties and returning a malformed object instead of the original `ObjectId`.

This caused the `_id` field sent to the frontend to be invalid. When the frontend sent this invalid ID back to the backend for an update, the backend validation failed.

## Fix
Updated `convertDecimal128ToNumber` to explicitly check for `ObjectId` and `Date` instances and return them as is, preventing corruption.

```javascript
  // If it's an ObjectId, return as is
  if (obj instanceof mongoose.Types.ObjectId || obj._bsontype === 'ObjectID') {
    return obj;
  }
  
  // ...
  
  // If it's an object, recursively convert each property
  if (typeof obj === 'object') {
    // Handle Date objects
    if (obj instanceof Date) return obj;
    // ...
```

## Verification
Verified with a test script that `ObjectId`s are now preserved correctly after passing through the conversion function.

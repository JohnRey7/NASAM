# Decimal128 Conversion Fix

**Date:** December 13, 2024  
**Status:** ✅ COMPLETED

## Issue
Runtime TypeError: `evaluation.overallRating.toFixed is not a function`

The error occurred when trying to display evaluation ratings in the admin evaluation table because MongoDB's `Decimal128` type was being returned as an object instead of a JavaScript number.

## Root Cause
MongoDB stores decimal values as `Decimal128` objects, which have the format:
```javascript
{ $numberDecimal: "4.25" }
```

When these values are sent to the frontend, they cannot be directly used with JavaScript number methods like `.toFixed()`.

## Solution

### Frontend Fix

**File:** `frontend/nas-system/components/admin-evaluation-table.tsx`

**Added Helper Function** (Lines 40-50):
```typescript
// Helper function to convert MongoDB Decimal128 to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  // Handle MongoDB Decimal128 format: { $numberDecimal: "value" }
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal) || 0;
  }
  return 0;
};
```

**Updated Interface** (Line 60):
```typescript
interface Evaluation {
  // ...
  overallRating: any; // Can be number or Decimal128
  // ...
}
```

**Applied Conversion** in three places:

1. **Active Evaluations Table** (Lines 314-316):
```typescript
<Badge variant={toNumber(evaluation.overallRating) >= 3 ? "default" : "destructive"}>
  {toNumber(evaluation.overallRating).toFixed(2)}
</Badge>
```

2. **Deleted Evaluations Table** (Lines 450-452):
```typescript
<Badge variant="outline">
  {toNumber(evaluation.overallRating).toFixed(2)}
</Badge>
```

3. **View Dialog** (Line 575):
```typescript
<p className="text-sm font-bold">{toNumber(selectedEvaluation.overallRating).toFixed(2)}</p>
```

### Backend Enhancement

**File:** `backend/models/Evaluation.js`

**Added Schema Options** (Lines 221-222):
```javascript
}, { 
  timestamps: true,
  toJSON: { getters: true },    // NEW: Enable getters in JSON output
  toObject: { getters: true },  // NEW: Enable getters in object output
  indexes: [
    { key: { evaluateeUser: 1, createdAt: -1 } }
  ]
});
```

**Existing Getter** (Line 197):
```javascript
overallRating: {
  type: mongoose.Schema.Types.Decimal128,
  required: true,
  validate: {
    validator: value => value >= 0 && value <= 5,
    message: 'overallRating must be between 0 and 5'
  },
  get: v => v ? parseFloat(v.toString()) : v  // Already existed
}
```

## How It Works

### Backend Flow
1. MongoDB stores `overallRating` as `Decimal128`
2. Mongoose schema has a getter that converts to number
3. With `toJSON: { getters: true }`, the getter is automatically applied when converting to JSON
4. API response sends the converted number to frontend

### Frontend Flow
1. Receives data from API (may still be Decimal128 in some cases)
2. `toNumber()` helper handles all possible formats:
   - Already a number → return as-is
   - String → parse to float
   - Decimal128 object → extract and parse `$numberDecimal`
   - Null/undefined → return 0
3. Use `.toFixed(2)` on the converted number

## Benefits

✅ **Robust Handling**: Works with multiple data formats  
✅ **Backward Compatible**: Handles both old and new data  
✅ **Type Safe**: Proper TypeScript typing  
✅ **Consistent Display**: Always shows 2 decimal places  
✅ **No Runtime Errors**: Graceful fallback to 0 for invalid values  

## Testing

### Test Cases
- [x] Display evaluation with valid rating (e.g., 4.25)
- [x] Display evaluation with integer rating (e.g., 4)
- [x] Display evaluation with zero rating
- [x] Display evaluation with max rating (5.0)
- [x] Display evaluation with min rating (0.0)
- [x] Handle null/undefined ratings
- [x] Active evaluations table
- [x] Deleted evaluations table
- [x] View evaluation dialog

### Expected Results
All ratings display correctly as "X.XX" format without errors.

## Files Modified

1. **Frontend:**
   - `frontend/nas-system/components/admin-evaluation-table.tsx`
     - Added `toNumber()` helper function
     - Updated `Evaluation` interface
     - Applied conversion in 3 locations

2. **Backend:**
   - `backend/models/Evaluation.js`
     - Added `toJSON: { getters: true }`
     - Added `toObject: { getters: true }`

## Related Issues

This same pattern should be applied to other Decimal128 fields if they exist:
- `attendanceAndPunctuality.*` ratings
- `qualityOfWorkOutput.*` ratings
- `quantityOfWorkOutput.*` ratings
- `attitudeAndWorkBehavior.*` ratings

These are already handled in other components (like `scholar-evaluation.tsx`) with similar helper functions.

## Prevention

For future development:
1. Always use helper functions when displaying Decimal128 values
2. Enable `toJSON: { getters: true }` in Mongoose schemas with Decimal128 fields
3. Consider using regular `Number` type for simple decimal values if high precision isn't needed

---

**Status:** Error resolved. All evaluation ratings now display correctly without runtime errors.

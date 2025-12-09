# Fix: Automatic Application Rejection on Failed Evaluation

## Issue
When an evaluation resulted in a failing grade (below 3.0), the application status remained unchanged instead of being automatically set to "rejected".

## Fix
Updated `backend/services/EvaluationService.js` in two places:

1.  **`createEvaluation`**: Modified the logic to explicitly set the application status to 'rejected' if the evaluation fails.
    ```javascript
    } else {
      await ApplicationForm.findByIdAndUpdate(
        application._id,
        { status: 'rejected' },
        { new: true }
      );
      console.log('⚠️ Evaluation failed (rating < 3.0), application status updated to rejected for user:', evaluateeUser);
    }
    ```

2.  **`updateEvaluation`**: Added logic to sync the application status whenever the `overallRating` is updated. This ensures that if a grade is corrected (e.g., from passing to failing or vice versa), the application status is updated accordingly.
    ```javascript
    // Sync application status if overallRating changed
    if (overallRating !== undefined) {
      const application = await ApplicationForm.findOne({ user: evaluation.evaluateeUser });
      if (application) {
        const evaluationPassed = parseFloat(evaluation.overallRating) >= 3.0;
        const newStatus = evaluationPassed ? 'approved' : 'rejected';
        if (application.status !== newStatus) {
            await ApplicationForm.findByIdAndUpdate(application._id, { status: newStatus });
        }
      }
    }
    ```

## Verification
- Creating a new evaluation with a failing grade will now set the application status to "rejected".
- Updating an existing evaluation's grade will update the application status to match the new grade (Approved >= 3.0, Rejected < 3.0).

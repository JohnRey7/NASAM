const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/ApplicationController');
const AnalyticsExportController = require('../controllers/AnalyticsExportController');
const EvaluationController = require('../controllers/EvaluationController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// OAS Staff Dashboard Routes
router.get('/applications', authenticate, checkPermission('applicationForm.read'), ApplicationController.getAllApplicationsForStaff);
router.get('/application/:applicationId/documents', authenticate, ApplicationController.getApplicationDocumentsByAppId);
router.patch('/application/:applicationId/status', authenticate, checkPermission('applicationForm.update'), ApplicationController.updateApplicationStatus);
router.get('/application-by-id/:applicationId/pdf', authenticate, ApplicationController.exportApplicationFormAsPDFByApplicationId);

// Delete application route for OAS staff (SOFT DELETE - marks as deleted, allows restore)
router.delete('/application/:applicationId', authenticate, checkPermission('applicationForm.delete'), ApplicationController.softDeleteApplication);
// Delete only application form (keep documents) - SOFT DELETE
router.delete('/application/:applicationId/form-only', authenticate, checkPermission('applicationForm.delete'), ApplicationController.softDeleteApplicationFormOnly);

// Delete only documents (keep application form) - SOFT DELETE
router.delete('/application/:applicationId/documents-only', authenticate, checkPermission('applicationForm.delete'), ApplicationController.softDeleteDocumentsOnly);

// OAS Soft delete routes for applications
router.delete('/application/:applicationId/soft', authenticate, checkPermission('applicationForm.delete'), ApplicationController.softDeleteApplication);
router.put('/application/:applicationId/restore', authenticate, checkPermission('applicationForm.delete'), ApplicationController.restoreApplication);
router.delete('/application/:applicationId/permanent', authenticate, checkPermission('applicationForm.delete'), ApplicationController.permanentDeleteApplication);
router.get('/applications/deleted', authenticate, checkPermission('applicationForm.read'), ApplicationController.getSoftDeletedApplications);

// Export all applications to CSV
router.get('/application/export/all', authenticate, checkPermission('application.export.csv'), ApplicationController.exportAllApplicationsToCSV);

// Application verification routes
router.patch('/application/:applicationId/verify', authenticate, ApplicationController.verifyApplicationForm);
router.patch('/application/:applicationId/verify-documents', authenticate, ApplicationController.verifyApplicationDocuments);
router.patch('/application/:applicationId/revert-form-verification', authenticate, ApplicationController.revertFormVerification);
router.patch('/application/:applicationId/revert-document-verification', authenticate, ApplicationController.revertDocumentVerification);

// Dashboard stats route
router.get('/dashboard-stats', authenticate, checkPermission('applicationForm.read'), ApplicationController.getDashboardStats);
// Application counts route for OAS staff
router.get('/application-counts', authenticate, checkPermission('applicationForm.read'), ApplicationController.getApplicationCounts);
// Analytics endpoint for OAS staff (applications overview & charts)
router.get('/analytics', authenticate, checkPermission('applicationForm.read'), ApplicationController.getAnalytics);
// Analytics export endpoint (CSV or PDF)
router.get('/analytics/export', authenticate, checkPermission('applicationForm.read'), AnalyticsExportController.exportAnalytics);

// Update application status by user ID (for evaluation decisions - Pass/Fail/Awaiting)
router.patch('/application/user/:userId/status', authenticate, checkPermission('applicationForm.update'), ApplicationController.updateApplicationStatusByUserId);

// OAS Evaluation Management Routes
// GET all evaluations with pagination (limit 50 per page)
router.get('/evaluations', authenticate, checkPermission('evaluation.read'), EvaluationController.getAllEvaluationsForAdmin);

// GET evaluation for specific user
router.get('/evaluation/:userId/user', authenticate, checkPermission('evaluation.read'), EvaluationController.getEvaluationForUser);

// POST create evaluation for specific user
router.post('/evaluation/:userId/user', authenticate, checkPermission('evaluation.create'), EvaluationController.createEvaluationForUser);

// PUT update evaluation for specific user
router.put('/evaluation/:userId/user', authenticate, checkPermission('evaluation.update'), EvaluationController.updateEvaluationForUser);

module.exports = router;

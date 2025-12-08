const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/ApplicationController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

router.post('/', authenticate, checkPermission('applicationForm.create'), ApplicationController.createApplicationForm);
router.get('/:idNumber/pdf', authenticate, checkPermission('application.export'), ApplicationController.exportApplicationFormAsPDFByIdNumber);
router.get('/pdf', authenticate, ApplicationController.exportMyApplicationFormAsPDF);
router.get('/', authenticate, checkPermission('applicationForm.readOwn'), ApplicationController.readMyApplicationForm);
router.get('/all', authenticate, checkPermission('applicationForm.read'), ApplicationController.getAllApplicationForms);
router.get('/deleted', authenticate, checkPermission('applicationForm.read'), ApplicationController.getSoftDeletedApplications);
router.get('/:id', authenticate, checkPermission('applicationForm.read'), ApplicationController.readApplicationFormById);
router.get('/user/:userId', authenticate, checkPermission('applicationForm.read'), ApplicationController.readApplicationFormByUserId);
router.patch('/:id', authenticate, checkPermission('applicationForm.update'), ApplicationController.updateApplicationFormById);
router.patch('/user/:userId', authenticate, checkPermission('applicationForm.update'), ApplicationController.updateApplicationFormByUserId);
router.patch('/', authenticate, checkPermission('applicationForm.updateOwn'), ApplicationController.updateMyApplicationForm);
router.delete('/:id', authenticate, checkPermission('applicationForm.delete'), ApplicationController.deleteApplicationFormById);
router.delete('/user/:userId', authenticate, checkPermission('applicationForm.delete'), ApplicationController.deleteApplicationFormByUserId);

router.put('/status', authenticate, checkPermission('applicationForm.status.set'), ApplicationController.setStatus);
router.put('/approvals', authenticate, checkPermission('applicationForm.approvals.set'), ApplicationController.setApprovalSummary);

// Application Draft routes (for form persistence)
router.post('/draft', authenticate, ApplicationController.saveDraft);
router.get('/draft', authenticate, ApplicationController.getDraft);
router.delete('/draft', authenticate, ApplicationController.deleteDraft);

// Application soft delete routes
router.delete('/:id/soft', authenticate, checkPermission('applicationForm.delete'), ApplicationController.softDeleteApplication);
router.put('/:id/restore', authenticate, checkPermission('applicationForm.delete'), ApplicationController.restoreApplication);
router.delete('/:id/permanent', authenticate, checkPermission('applicationForm.delete'), ApplicationController.permanentDeleteApplication);

// Application History routes
router.get('/history', authenticate, checkPermission('applicationHistory.readOwn'), ApplicationController.getMyApplicationHistory);
router.get('/history/user/:userId', authenticate, checkPermission('applicationHistory.read'), ApplicationController.getApplicationHistoryByUserId);
router.get('/history/:id', authenticate, checkPermission('applicationHistory.read'), ApplicationController.getApplicationHistoryById);

module.exports = router;

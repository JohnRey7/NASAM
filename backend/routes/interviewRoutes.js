const express = require('express');
const router = express.Router();
const InterviewController = require('../controllers/InterviewController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

router.post('/', authenticate, checkPermission('interview.create'), InterviewController.createInterview);
router.get('/all', authenticate, checkPermission('interview.readAll'), InterviewController.getAllInterviews);
router.get('/deleted', authenticate, checkPermission('interview.read'), InterviewController.getSoftDeletedInterviews);
router.get('/application/:applicationId', authenticate, checkPermission('interview.read'), InterviewController.getInterviewByApplicationId);
router.get('/application/:applicationId/all', authenticate, checkPermission('interview.read'), InterviewController.getInterviewsByApplicationId);
router.get('/:id', authenticate, checkPermission('interview.read'), InterviewController.getInterviewById);
router.get('/user/:userId', authenticate, checkPermission('interview.read'), InterviewController.getInterviewByUserId);
router.get('/', authenticate, checkPermission('interview.readOwn'), InterviewController.getMyInterview);
router.patch('/:id', authenticate, checkPermission('interview.update'), InterviewController.updateInterviewById);
router.patch('/user/:userId', authenticate, checkPermission('interview.update'), InterviewController.updateInterviewByUserId);
router.patch('/', authenticate, checkPermission('interview.updateOwn'), InterviewController.updateMyInterview);
router.delete('/:id', authenticate, checkPermission('interview.delete'), InterviewController.deleteInterviewById);
router.delete('/user/:userId', authenticate, checkPermission('interview.delete'), InterviewController.deleteInterviewByUserId);
router.delete('/', authenticate, checkPermission('interview.deleteOwn'), InterviewController.deleteMyInterview);

// Soft delete routes for interviews
router.delete('/:id/soft', authenticate, checkPermission('interview.delete'), InterviewController.softDeleteInterview);
router.put('/:id/restore', authenticate, checkPermission('interview.delete'), InterviewController.restoreInterview);
router.delete('/:id/permanent', authenticate, checkPermission('interview.delete'), InterviewController.permanentDeleteInterview);

// Finish/Revert interview routes
router.patch('/:id/finish', authenticate, checkPermission('interview.update'), InterviewController.finishInterview);
router.patch('/:id/revert-finish', authenticate, checkPermission('interview.update'), InterviewController.revertFinishInterview);

// Send reminder route
router.post('/:id/send-reminder', authenticate, checkPermission('interview.update'), InterviewController.sendInterviewReminder);

module.exports = router;

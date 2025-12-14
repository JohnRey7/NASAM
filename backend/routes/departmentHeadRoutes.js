const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/DepartmentController');
const InterviewController = require('../controllers/InterviewController');
const ApplicationController = require('../controllers/ApplicationController');
const PersonalityTestController = require('../controllers/PersonalityTestController');
const DocumentUploadController = require('../controllers/DocumentUploadController');
const EvaluationController = require('../controllers/EvaluationController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// Get applicants for department head
router.get('/applicants', authenticate, checkPermission('application.readAll'), DepartmentController.getApplicantsForDepartmentHead);

// Get scheduled interviews for department head (with pagination)
router.get('/interviews', authenticate, checkPermission('application.readAll'), InterviewController.getInterviewsForDepartmentHead);

// Get application details for department head (allows viewing applications in their department)
router.get('/application/:id', authenticate, checkPermission('application.readAll'), ApplicationController.readApplicationFormById);

// Get personality test for department head (allows viewing personality tests in their department)
router.get('/personality-test/user/:userId', authenticate, checkPermission('application.readAll'), PersonalityTestController.getPersonalityTestByUserId);

// Get documents for department head (allows viewing documents in their department)
router.get('/documents/:idNumber', authenticate, checkPermission('application.readAll'), DocumentUploadController.getDocumentsByIdNumber);

// Department Head: Schedule interview with notification
// Department head interview scheduling - they can only assign themselves as interviewer
router.post('/interview/schedule', authenticate, checkPermission('application.readAll'), InterviewController.scheduleInterviewForDepartmentHead);
router.patch('/interview/:interviewId/reschedule', authenticate, checkPermission('application.readAll'), InterviewController.rescheduleInterviewForDepartmentHead);

// Department Head: Evaluation routes
// Create evaluation for a scholar (department heads can only CREATE, not update or delete)
router.post('/evaluation/:idNumber', authenticate, checkPermission('evaluation.create'), EvaluationController.createEvaluation);
// Create evaluation by userId (alternative endpoint for department heads)
router.post('/evaluation/:userId/user', authenticate, checkPermission('evaluation.create'), EvaluationController.createEvaluationForUser);
// Get evaluations for a scholar (read-only)
router.get('/evaluation/user/:idNumber', authenticate, checkPermission('evaluation.read'), EvaluationController.getEvaluationsByIdNumber);

module.exports = router;
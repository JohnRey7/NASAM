const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/DepartmentController');
const InterviewController = require('../controllers/InterviewController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// Get applicants for department head
router.get('/applicants', authenticate, checkPermission('application.readAll'), DepartmentController.getApplicantsForDepartmentHead);

// Department Head: Schedule interview with notification
// Department head interview scheduling - they can only assign themselves as interviewer
router.post('/interview/schedule', authenticate, checkPermission('application.readAll'), InterviewController.scheduleInterviewForDepartmentHead);
router.patch('/interview/:interviewId/reschedule', authenticate, checkPermission('application.readAll'), InterviewController.rescheduleInterviewForDepartmentHead);

module.exports = router;
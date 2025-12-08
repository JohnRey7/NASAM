const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/DepartmentController');
const InterviewController = require('../controllers/InterviewController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// Assign applicant to department
router.post('/assign-applicant-to-department', authenticate, checkPermission('department.update'), DepartmentController.assignApplicantToDepartment);

// Admin: Schedule interview with notification
router.post('/interview/schedule', authenticate, checkPermission('interview.create'), InterviewController.createInterviewForApplicant);

module.exports = router;

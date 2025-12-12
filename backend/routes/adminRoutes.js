const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/DepartmentController');
const InterviewController = require('../controllers/InterviewController');
const EvaluationController = require('../controllers/EvaluationController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// Assign applicant to department
router.post('/assign-applicant-to-department', authenticate, checkPermission('department.update'), DepartmentController.assignApplicantToDepartment);

// Admin: Schedule interview with notification
router.post('/interview/schedule', authenticate, checkPermission('interview.create'), InterviewController.createInterviewForApplicant);

// Admin Evaluation Management Routes
// GET all evaluations with pagination (limit 50 per page)
router.get('/evaluation', authenticate, checkPermission('evaluation.read'), EvaluationController.getAllEvaluationsForAdmin);

// GET evaluation for specific user
router.get('/evaluation/:userId/user', authenticate, checkPermission('evaluation.read'), EvaluationController.getEvaluationForUser);

// POST create evaluation for specific user
router.post('/evaluation/:userId/user', authenticate, checkPermission('evaluation.create'), EvaluationController.createEvaluationForUser);

// PUT update evaluation for specific user
router.put('/evaluation/:userId/user', authenticate, checkPermission('evaluation.update'), EvaluationController.updateEvaluationForUser);

// DELETE soft delete evaluation for specific user
router.delete('/evaluation/:userId/user/soft', authenticate, checkPermission('evaluation.delete'), EvaluationController.softDeleteEvaluationForUser);

// DELETE permanent delete evaluation for specific user
router.delete('/evaluation/:userId/permanent', authenticate, checkPermission('evaluation.delete'), EvaluationController.permanentDeleteEvaluationForUser);

// POST restore evaluation for specific user
router.post('/evaluation/:userId/delete/restore', authenticate, checkPermission('evaluation.delete'), EvaluationController.restoreEvaluationForUser);

module.exports = router;

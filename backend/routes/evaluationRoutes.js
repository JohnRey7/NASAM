const express = require('express');
const router = express.Router();
const EvaluationController = require('../controllers/EvaluationController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// User's own evaluations
router.get('/status/me', authenticate, EvaluationController.getMyEvaluationStatus);
router.get('/me', authenticate, EvaluationController.getMyLastEvaluation);
router.get('/my-evaluations', authenticate, EvaluationController.getMyEvaluations); // Changed from /me to /my-evaluations to avoid conflict

// CRUD by idNumber (for creating and listing user's evaluations)
router.post('/:idNumber', authenticate, checkPermission('evaluation.create'), EvaluationController.createEvaluation);
router.get('/user/:idNumber', authenticate, checkPermission('evaluation.read'), EvaluationController.getEvaluationsByIdNumber);
router.get('/available-semesters/:idNumber', authenticate, checkPermission('evaluation.read'), EvaluationController.getAvailableSemesters);

// All evaluations
router.get('/', authenticate, checkPermission('evaluation.read'), EvaluationController.getAllEvaluations);
router.get('/deleted', authenticate, checkPermission('evaluation.read'), EvaluationController.getSoftDeletedEvaluations);

// CRUD by evaluationId
router.get('/:evaluationId/id', authenticate, checkPermission('evaluation.read'), EvaluationController.getEvaluationById);
router.patch('/:evaluationId/id', authenticate, checkPermission('evaluation.update'), EvaluationController.updateEvaluation);
router.delete('/:evaluationId/id', authenticate, checkPermission('evaluation.delete'), EvaluationController.deleteEvaluation);

// Soft delete routes for evaluations (by evaluationId)
router.delete('/:evaluationId/soft', authenticate, checkPermission('evaluation.delete'), EvaluationController.softDeleteEvaluation);
router.put('/:evaluationId/restore', authenticate, checkPermission('evaluation.delete'), EvaluationController.restoreEvaluation);
router.delete('/:evaluationId/permanent', authenticate, checkPermission('evaluation.delete'), EvaluationController.permanentDeleteEvaluation);

// Soft delete/restore evaluations by period (schoolYear/semester)
router.delete('/period/:schoolYear/:semester/soft', authenticate, checkPermission('evaluation.delete'), EvaluationController.softDeleteEvaluationsByPeriod);
router.put('/period/:schoolYear/:semester/restore', authenticate, checkPermission('evaluation.delete'), EvaluationController.restoreEvaluationsByPeriod);

// Timekeeping routes (by evaluationId)
router.patch('/:evaluationId/timekeeping', authenticate, checkPermission('evaluation.update_timekeeping'), EvaluationController.updateTimeKeepingRecord);
router.get('/:evaluationId/timekeeping', authenticate, checkPermission('evaluation.read_timekeeping'), EvaluationController.getTimeKeepingRecord);

module.exports = router;

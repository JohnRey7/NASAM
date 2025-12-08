const express = require('express');
const router = express.Router();
const ScholarEvaluationController = require('../controllers/ScholarEvaluationController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// Evaluation Period Management (Admin only)
router.get('/evaluation-period/current', authenticate, ScholarEvaluationController.getCurrentPeriod);
router.get('/evaluation-period/all', authenticate, checkPermission('evaluation.read.all'), ScholarEvaluationController.getAllPeriods);
router.post('/evaluation-period/open', authenticate, checkPermission('evaluation.manage'), ScholarEvaluationController.openEvaluationPeriod);
router.post('/evaluation-period/close', authenticate, checkPermission('evaluation.manage'), ScholarEvaluationController.closeEvaluationPeriod);

// Scholar Evaluations (Department Head)
router.post('/scholar-evaluation', authenticate, checkPermission('evaluation.create'), ScholarEvaluationController.createEvaluation);
router.get('/scholar-evaluation/my', authenticate, checkPermission('evaluation.create'), ScholarEvaluationController.getMyEvaluations);
router.get('/scholar-evaluation/scholar/:scholarId', authenticate, ScholarEvaluationController.getEvaluationsForScholar);
router.get('/scholar-evaluation/:id', authenticate, ScholarEvaluationController.getEvaluationById);
router.patch('/scholar-evaluation/:id', authenticate, checkPermission('evaluation.create'), ScholarEvaluationController.updateEvaluation);
router.delete('/scholar-evaluation/:id', authenticate, checkPermission('evaluation.delete'), ScholarEvaluationController.deleteEvaluation);

// Admin Views
router.get('/scholar-evaluation/all/list', authenticate, checkPermission('evaluation.read'), ScholarEvaluationController.getAllEvaluations);
router.get('/scholar-evaluation/statistics/summary', authenticate, checkPermission('evaluation.read'), ScholarEvaluationController.getEvaluationStatistics);

module.exports = router;

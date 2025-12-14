const express = require('express');
const router = express.Router();
const ApplicationStatusController = require('../controllers/ApplicationStatusController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// ============================================
// Comprehensive Status Endpoints
// ============================================

// GET /api/status/me - Comprehensive status for authenticated user
router.get('/me', authenticate, ApplicationStatusController.getMyComprehensiveStatus);

// GET /api/status/:userId/user - Comprehensive status by user ID (for admins/staff)
router.get('/:userId/user', authenticate, checkPermission('applicationForm.read'), ApplicationStatusController.getComprehensiveStatusByUserId);

// GET /api/status/:idNumber/id - Comprehensive status by ID number (for admins/staff)
router.get('/:idNumber/id', authenticate, checkPermission('applicationForm.read'), ApplicationStatusController.getComprehensiveStatusByIdNumber);

module.exports = router;

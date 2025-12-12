const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/ApplicationController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// GET /api/status/me - For applicants to get their own status
router.get('/me', authenticate, ApplicationController.getMyApplicationStatus);

// GET /api/status/:idNumber - For OAS staff, department head, admin to get status by ID number
router.get('/:idNumber', authenticate, checkPermission('applicationForm.read'), ApplicationController.getApplicationStatusByIdNumber);

module.exports = router;

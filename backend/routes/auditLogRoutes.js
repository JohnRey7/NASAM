const express = require('express');
const router = express.Router();
const AuditLogController = require('../controllers/AuditLogController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

router.get('/', authenticate, checkPermission('audit.read'), AuditLogController.getLogs);
router.get('/export/pdf', authenticate, checkPermission('audit.read'), AuditLogController.exportLogsPDF);
router.get('/export/excel', authenticate, checkPermission('audit.read'), AuditLogController.exportLogsExcel);
router.patch('/:id/archive', authenticate, checkPermission('audit.manage'), AuditLogController.archiveLog);

module.exports = router;

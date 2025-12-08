const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/DocumentController');
const DocumentUploadController = require('../controllers/DocumentUploadController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');
const { uploadDocuments } = require('../middleware/documentMiddleware');
const { uploadDocumentsMiddleware } = require('../middleware/documentUploadMiddleware');

// Legacy Document routes
router.put('/', authenticate, checkPermission('document.set'), uploadDocuments, DocumentController.uploadDocuments);
router.get('/', authenticate, checkPermission('document.get'), DocumentController.getDocuments);
router.delete('/', authenticate, checkPermission('document.delete'), DocumentController.deleteDocuments);

// Document soft delete routes
router.delete('/:id/soft', authenticate, checkPermission('document.delete'), DocumentController.softDeleteDocument);
router.put('/:id/restore', authenticate, checkPermission('document.delete'), DocumentController.restoreDocument);
router.delete('/:id/permanent', authenticate, checkPermission('document.delete'), DocumentController.permanentDeleteDocument);
router.get('/deleted', authenticate, checkPermission('document.read'), DocumentController.getSoftDeletedDocuments);

module.exports = router;

const express = require('express');
const router = express.Router();
const DocumentUploadController = require('../controllers/DocumentUploadController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');
const { uploadDocumentsMiddleware } = require('../middleware/documentUploadMiddleware');

// New Document CRUD routes by idNumber
router.post('/:idNumber', authenticate, checkPermission('document.create'), uploadDocumentsMiddleware, DocumentUploadController.createDocumentByIdNumber);
router.get('/me', authenticate, DocumentUploadController.getMyDocuments);
router.get('/:idNumber', authenticate, checkPermission('document.get'), DocumentUploadController.getDocumentsByIdNumber);
router.put('/:idNumber', authenticate, checkPermission('document.update'), uploadDocumentsMiddleware, DocumentUploadController.updateDocumentByIdNumber);

module.exports = router;

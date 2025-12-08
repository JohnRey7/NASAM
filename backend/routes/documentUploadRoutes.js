const express = require('express');
const router = express.Router();
const DocumentUploadController = require('../controllers/DocumentUploadController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');
const { uploadDocumentsMiddleware } = require('../middleware/documentUploadMiddleware');

// DocumentUpload routes (enhanced document management)
router.post('/', authenticate, uploadDocumentsMiddleware, DocumentUploadController.uploadDocuments);
router.get('/', authenticate, DocumentUploadController.getDocuments);
router.get('/all', authenticate, checkPermission('document.read'), DocumentUploadController.getAllDocuments);
router.get('/deleted', authenticate, checkPermission('document.read'), DocumentUploadController.getSoftDeletedDocuments);
router.get('/user/:userId', authenticate, checkPermission('document.read'), DocumentUploadController.getDocumentsByUserId);
router.patch('/:userId', authenticate, uploadDocumentsMiddleware, DocumentUploadController.updateDocument);
router.delete('/:userId', authenticate, DocumentUploadController.deleteDocument);

// End term semester grade specific routes
router.post('/end-term-grade', authenticate, uploadDocumentsMiddleware, checkPermission('document.upload.endTermGrade'), DocumentUploadController.addEndTermSemesterGrade);
router.patch('/:userId/end-term-grade/:gradeId', authenticate, uploadDocumentsMiddleware, checkPermission('document.upload.endTermGrade'), DocumentUploadController.updateEndTermSemesterGrade);

// DocumentUpload soft delete routes
router.delete('/:userId/soft', authenticate, checkPermission('document.delete'), DocumentUploadController.softDeleteDocument);
router.put('/:userId/restore', authenticate, checkPermission('document.delete'), DocumentUploadController.restoreDocument);
router.delete('/:userId/permanent', authenticate, checkPermission('document.delete'), DocumentUploadController.permanentDeleteDocument);

module.exports = router;

const DocumentService = require('../services/DocumentService');
const AuditLogService = require('../services/AuditLogService');

const DocumentController = {
  // Upload or update documents for the authenticated user
  async uploadDocuments(req, res) {
    try {
      console.log('📥 Backend: Upload request received');
      console.log('📥 Backend: User ID:', req.user.id);
      console.log('📥 Backend: Files received:', req.files ? req.files.length : 0);
      console.log('📥 Backend: File details:', req.files ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size })) : 'No files');
      console.log('📥 Backend: Body keys:', Object.keys(req.body));
      console.log('📥 Backend: Body content:', req.body);
      
      // Parse grade averages and income tax info from request body
      let gradeAverages = null;
      let incomeTaxInfo = null;
      
      if (req.body.gradeAverages) {
        try {
          gradeAverages = JSON.parse(req.body.gradeAverages);
        } catch (e) {
          console.log('Failed to parse gradeAverages:', e);
        }
      }
      
      if (req.body.incomeTaxInfo) {
        try {
          incomeTaxInfo = JSON.parse(req.body.incomeTaxInfo);
        } catch (e) {
          console.log('Failed to parse incomeTaxInfo:', e);
        }
      }
      
      const result = await DocumentService.uploadDocuments(req.user.id, req.files, {
        gradeAverages,
        incomeTaxInfo
      });
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Upload Documents',
        module: 'Document'
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error('❌ Error in uploadDocuments:', error);
      // Clean up uploaded files on error
      await DocumentService.cleanupUploadedFiles(req.files);
      
      if (error.message.includes('At least one document')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload documents',
        error: error.message
      });
    }
  },

    // Get documents for the authenticated user
  async getDocuments(req, res) {
    try {
      console.log('🎯 DocumentController.getDocuments called for user:', req.user.id);
      console.log('🎯 User object:', { id: req.user.id, idNumber: req.user.idNumber, role: req.user.role });
      
      const result = await DocumentService.getDocuments(req.user.id);
      
      console.log('🎯 Successfully retrieved documents');
      res.json(result);
    } catch (error) {
      console.error('❌ Error in getDocuments:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

    // Delete documents for the authenticated user
  async deleteDocuments(req, res) {
    try {
      const result = await DocumentService.deleteDocuments(req.user.id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in deleteDocuments:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // Soft delete a document
  async softDeleteDocument(req, res) {
    try {
      const { id } = req.params;
      const result = await DocumentService.softDeleteDocument(id);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Delete Document',
        module: 'Document'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in softDeleteDocument:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Restore a soft-deleted document
  async restoreDocument(req, res) {
    try {
      const { id } = req.params;
      const result = await DocumentService.restoreDocument(id);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Restore Document',
        module: 'Document'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in restoreDocument:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Permanently delete a document
  async permanentDeleteDocument(req, res) {
    try {
      const { id } = req.params;
      const result = await DocumentService.permanentDeleteDocument(id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in permanentDeleteDocument:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get soft-deleted documents
  async getSoftDeletedDocuments(req, res) {
    try {
      const result = await DocumentService.getSoftDeletedDocuments(req.query);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getSoftDeletedDocuments:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = DocumentController;
const DocumentUploadService = require('../services/DocumentUploadService');

const DocumentUploadController = {
  // Create or update document upload
  async uploadDocuments(req, res) {
    try {
      const userId = req.user.id;
      const result = await DocumentUploadService.uploadDocuments(userId, req.files, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Documents uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in uploadDocuments:', error);
      if (error.message.includes('File size') || error.message.includes('Invalid file')) {
        return res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload documents' 
      });
    }
  },

  // Get user's documents
  async getDocuments(req, res) {
    try {
      const userId = req.user.id;
      const result = await DocumentUploadService.getDocuments(userId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getDocuments:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get documents' 
      });
    }
  },

  // Get documents by user ID (admin)
  async getDocumentsByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await DocumentUploadService.getDocuments(userId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getDocumentsByUserId:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get documents' 
      });
    }
  },

  // Get all documents (admin)
  async getAllDocuments(req, res) {
    try {
      const result = await DocumentUploadService.getAllDocuments(req.query);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error in getAllDocuments:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get all documents' 
      });
    }
  },

  // Update specific document field
  async updateDocument(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;
      const result = await DocumentUploadService.updateDocument(userId, currentUserId, req.files, req.body);
      
      res.json({
        success: true,
        message: 'Document updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in updateDocument:', error);
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      if (error.message.includes('File size') || error.message.includes('Invalid file')) {
        return res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update document' 
      });
    }
  },

  // Add end term semester grade
  async addEndTermSemesterGrade(req, res) {
    try {
      const userId = req.user.id;
      const result = await DocumentUploadService.addEndTermSemesterGrade(userId, req.files, req.body);
      
      res.status(201).json({
        success: true,
        message: 'End term semester grade added successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in addEndTermSemesterGrade:', error);
      if (error.message.includes('File size') || error.message.includes('Invalid file')) {
        return res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Failed to add end term semester grade' 
      });
    }
  },

  // Update end term semester grade
  async updateEndTermSemesterGrade(req, res) {
    try {
      const { userId, gradeId } = req.params;
      const currentUserId = req.user.id;
      const result = await DocumentUploadService.updateEndTermSemesterGrade(userId, gradeId, currentUserId, req.files, req.body);
      
      res.json({
        success: true,
        message: 'End term semester grade updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in updateEndTermSemesterGrade:', error);
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      if (error.message.includes('File size') || error.message.includes('Invalid file')) {
        return res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update end term semester grade' 
      });
    }
  },

  // Delete specific document
  async deleteDocument(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;
      const result = await DocumentUploadService.deleteDocument(userId, currentUserId);
      
      res.json({
        success: true,
        message: 'Document deleted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete document' 
      });
    }
  },

  // Soft delete document
  async softDeleteDocument(req, res) {
    try {
      const { userId } = req.params;
      const result = await DocumentUploadService.softDeleteDocument(userId);
      
      res.json({
        success: true,
        message: 'Document soft deleted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in softDeleteDocument:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Failed to soft delete document' 
      });
    }
  },

  // Restore soft deleted document
  async restoreDocument(req, res) {
    try {
      const { userId } = req.params;
      const result = await DocumentUploadService.restoreDocument(userId);
      
      res.json({
        success: true,
        message: 'Document restored successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in restoreDocument:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Failed to restore document' 
      });
    }
  },

  // Permanently delete document
  async permanentDeleteDocument(req, res) {
    try {
      const { userId } = req.params;
      const result = await DocumentUploadService.permanentDeleteDocument(userId);
      
      res.json({
        success: true,
        message: 'Document permanently deleted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in permanentDeleteDocument:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Failed to permanently delete document' 
      });
    }
  },

  // Get soft deleted documents
  async getSoftDeletedDocuments(req, res) {
    try {
      const result = await DocumentUploadService.getSoftDeletedDocuments(req.query);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error in getSoftDeletedDocuments:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get soft deleted documents' 
      });
    }
  }
};

module.exports = DocumentUploadController;
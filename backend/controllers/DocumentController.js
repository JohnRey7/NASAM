const DocumentService = require('../services/DocumentService');

const DocumentController = {
  // Upload or update documents for the authenticated user
  async uploadDocuments(req, res) {
    try {
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
      const result = await DocumentService.getDocuments(req.user.id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getDocuments:', error);
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
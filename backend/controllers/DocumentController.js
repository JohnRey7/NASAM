const DocumentService = require('../services/DocumentService');

const DocumentController = {
  // Upload or update documents for the authenticated user
  async uploadDocuments(req, res) {
    try {
      const result = await DocumentService.uploadDocuments(req.user.id, req.files);
      
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
  }
};

module.exports = DocumentController;
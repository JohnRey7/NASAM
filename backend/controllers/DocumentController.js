const DocumentService = require('../services/DocumentService');

const DocumentController = {
  // Upload or update documents for the authenticated user
  async uploadDocuments(req, res) {
    try {
      const userId = req.user.id;
      const files = req.files;

      const result = await DocumentService.uploadDocuments(userId, files);

      res.status(201).json({
        message: result.message,
        document: result.document,
        uploadedTypes: result.uploadedTypes,
        success: true
      });
    } catch (error) {
      console.error('❌ Error in uploadDocuments:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get documents for the authenticated user
  async getDocuments(req, res) {
    try {
      const userId = req.user.id;
      
      const documents = await DocumentService.getDocuments(userId);

      res.json({
        success: true,
        document: documents
      });
    } catch (error) {
      console.error('Error in getDocuments:', error);
      res.status(404).json({ 
        success: false,
        message: error.message 
      });
    }
  },

  // Delete documents for the authenticated user
  async deleteDocuments(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await DocumentService.deleteDocuments(userId);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error in deleteDocuments:', error);
      res.status(404).json({ 
        success: false,
        message: error.message 
      });
    }
  },

  // Get document status for the authenticated user
  async getDocumentStatus(req, res) {
    try {
      const userId = req.user.id;
      
      const status = await DocumentService.getDocumentStatus(userId);

      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error fetching document status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch document status' 
      });
    }
  },

  // Delete specific document type
  async deleteDocumentType(req, res) {
    try {
      const userId = req.user.id;
      const { documentType } = req.params;
      
      const result = await DocumentService.deleteDocumentType(userId, documentType);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting document type:', error);
      res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  // Get documents summary (admin only)
  async getDocumentsSummary(req, res) {
    try {
      const summary = await DocumentService.getDocumentsSummary();

      res.json({
        success: true,
        summary
      });
    } catch (error) {
      console.error('Error fetching documents summary:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch documents summary' 
      });
    }
  }
};

module.exports = DocumentController;
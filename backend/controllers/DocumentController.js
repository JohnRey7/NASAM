const DocumentService = require('../services/DocumentService');

const DocumentController = {
  // Upload or update documents for the authenticated user
  async uploadDocuments(req, res) {
    try {
      const result = await DocumentService.uploadDocuments(req.user.id, req.files);
      res.json(result);
    } catch (error) {
      console.error('Error in uploadDocuments:', error);
      const statusCode = error.message.includes('must be uploaded') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // Get documents by user ID (admin)
  async getDocumentsByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await DocumentService.getDocumentsByUserId(userId);
      res.json(result);
    } catch (error) {
      console.error('Error in getDocumentsByUserId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // Get documents for the authenticated user
  async getMyDocuments(req, res) {
    try {
      const result = await DocumentService.getMyDocuments(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Error in getMyDocuments:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // Delete a specific document file
  async deleteDocument(req, res) {
    try {
      const { field, fileIndex } = req.params;
      const result = await DocumentService.deleteDocument(req.user.id, field, parseInt(fileIndex));
      res.json(result);
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // Delete all documents for a user by user ID (admin)
  async deleteDocumentsByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await DocumentService.deleteDocumentsByUserId(userId);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteDocumentsByUserId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // Delete all documents for the authenticated user
  async deleteMyDocuments(req, res) {
    try {
      const result = await DocumentService.deleteMyDocuments(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteMyDocuments:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // Get all documents (admin only)
  async getAllDocuments(req, res) {
    try {
      const result = await DocumentService.getAllDocuments(req.query);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllDocuments:', error);
      const statusCode = error.message.includes('Invalid') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // Download a specific document file
  async downloadDocument(req, res) {
    try {
      const { userId, field, fileIndex } = req.params;
      const result = await DocumentService.downloadDocument(userId, field, parseInt(fileIndex));
      
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Type', result.mimetype);
      res.sendFile(result.filePath);
    } catch (error) {
      console.error('Error in downloadDocument:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  }
};

module.exports = DocumentController;

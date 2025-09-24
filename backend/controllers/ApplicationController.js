const ApplicationService = require('../services/ApplicationService');

const ApplicationController = {
  // POST: Create a new application for the authenticated user
  async createApplicationForm(req, res) {
    try {
      const result = await ApplicationService.createApplicationForm(req.user.id, req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createApplicationForm:', error);
      res.status(400).json({ message: `Failed to create application: ${error.message}` });
    }
  },

  // GET: Read application by ID (admin)
  async readApplicationFormById(req, res) {
    try {
      const { id } = req.params;
      const result = await ApplicationService.readApplicationFormById(id);
      res.json(result);
    } catch (error) {
      console.error('Error in readApplicationFormById:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Read application by user ID (admin)
  async readApplicationFormByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await ApplicationService.readApplicationFormByUserId(userId);
      res.json(result);
    } catch (error) {
      console.error('Error in readApplicationFormByUserId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Read the authenticated user's application
  async readMyApplicationForm(req, res) {
    try {
      const result = await ApplicationService.readMyApplicationForm(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Error in readMyApplicationForm:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Retrieve all applications with pagination and filtering
  async getAllApplicationForms(req, res) {
    try {
      const result = await ApplicationService.getAllApplicationForms(req.query);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllApplicationForms:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Enhanced endpoint for staff with additional filters and statistics
  async getAllApplicationsForStaff(req, res) {
    try {
      const result = await ApplicationService.getAllApplicationsForStaff(req.query);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllApplicationsForStaff:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // PUT: Update application by ID (admin)
  async updateApplicationFormById(req, res) {
    try {
      const { id } = req.params;
      const result = await ApplicationService.updateApplicationFormById(id, req.body);
      res.json(result);
    } catch (error) {
      console.error('Error in updateApplicationFormById:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // PUT: Update application by user ID (admin)
  async updateApplicationFormByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await ApplicationService.updateApplicationFormByUserId(userId, req.body);
      res.json(result);
    } catch (error) {
      console.error('Error in updateApplicationFormByUserId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // PUT: Update the authenticated user's application
  async updateMyApplicationForm(req, res) {
    try {
      const result = await ApplicationService.updateMyApplicationForm(req.user.id, req.body);
      res.json(result);
    } catch (error) {
      console.error('Error in updateMyApplicationForm:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // DELETE: Delete application by ID (admin)
  async deleteApplicationFormById(req, res) {
    try {
      const { id } = req.params;
      const result = await ApplicationService.deleteApplicationFormById(id);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteApplicationFormById:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // DELETE: Delete application by user ID (admin)
  async deleteApplicationFormByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await ApplicationService.deleteApplicationFormByUserId(userId);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteApplicationFormByUserId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // DELETE: Delete only the application form but keep documents
  async deleteApplicationFormOnly(req, res) {
    try {
      const result = await ApplicationService.deleteApplicationFormOnly(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteApplicationFormOnly:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // DELETE: Delete only documents but keep application form
  async deleteDocumentsOnly(req, res) {
    try {
      const result = await ApplicationService.deleteDocumentsOnly(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteDocumentsOnly:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // PUT: Set approval summary for an application
  async setApprovalSummary(req, res) {
    try {
      const { id } = req.params;
      const result = await ApplicationService.setApprovalSummary(id, req.body);
      res.json(result);
    } catch (error) {
      console.error('Error in setApprovalSummary:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // PUT: Set application status
  async setStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      const result = await ApplicationService.setStatus(id, status, req.user.id, remarks);
      res.json(result);
    } catch (error) {
      console.error('Error in setStatus:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Get application history by user ID
  async getApplicationHistoryByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await ApplicationService.getApplicationHistoryByUserId(userId);
      res.json(result);
    } catch (error) {
      console.error('Error in getApplicationHistoryByUserId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Get application history by application ID
  async getApplicationHistoryById(req, res) {
    try {
      const { id } = req.params;
      const result = await ApplicationService.getApplicationHistoryById(id);
      res.json(result);
    } catch (error) {
      console.error('Error in getApplicationHistoryById:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Get current user's application history
  async getMyApplicationHistory(req, res) {
    try {
      const result = await ApplicationService.getMyApplicationHistory(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Error in getMyApplicationHistory:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Export application as PDF by user ID
  async exportApplicationFormAsPDFByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await ApplicationService.exportApplicationFormAsPDFByUserId(userId);
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error) {
      console.error('Error in exportApplicationFormAsPDFByUserId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Export current user's application as PDF
  async exportMyApplicationFormAsPDF(req, res) {
    try {
      const result = await ApplicationService.exportMyApplicationFormAsPDF(req.user.id);
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error) {
      console.error('Error in exportMyApplicationFormAsPDF:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // PATCH: Auto-complete application (placeholder implementation)
  async autoCompleteApplication(req, res) {
    try {
      // This is a placeholder - implement the actual auto-complete logic as needed
      res.status(501).json({ message: 'Auto-complete functionality not yet implemented' });
    } catch (error) {
      console.error('Error in autoCompleteApplication:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // GET: Get current user's activity history
  async getMyActivityHistory(req, res) {
    try {
      // This is a placeholder - implement the actual activity history logic as needed
      res.status(501).json({ message: 'Activity history functionality not yet implemented' });
    } catch (error) {
      console.error('Error in getMyActivityHistory:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // GET: Get user activity history by user ID
  async getUserActivityHistory(req, res) {
    try {
      const { userId } = req.params;
      // This is a placeholder - implement the actual activity history logic as needed
      res.status(501).json({ message: 'User activity history functionality not yet implemented' });
    } catch (error) {
      console.error('Error in getUserActivityHistory:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // GET: Get application documents by application ID
  async getApplicationDocumentsByAppId(req, res) {
    try {
      const { applicationId } = req.params;
      // This is a placeholder - implement the actual logic as needed
      res.status(501).json({ message: 'Get application documents by app ID functionality not yet implemented' });
    } catch (error) {
      console.error('Error in getApplicationDocumentsByAppId:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // PATCH: Update application status
  async updateApplicationStatus(req, res) {
    try {
      const { applicationId } = req.params;
      // This is a placeholder - implement the actual logic as needed
      res.status(501).json({ message: 'Update application status functionality not yet implemented' });
    } catch (error) {
      console.error('Error in updateApplicationStatus:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // GET: Export application form as PDF by application ID
  async exportApplicationFormAsPDFByApplicationId(req, res) {
    try {
      const { applicationId } = req.params;
      // This is a placeholder - implement the actual logic as needed
      res.status(501).json({ message: 'Export application form as PDF by application ID functionality not yet implemented' });
    } catch (error) {
      console.error('Error in exportApplicationFormAsPDFByApplicationId:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // DELETE: Delete application by ID
  async deleteApplicationById(req, res) {
    try {
      const { applicationId } = req.params;
      // This is a placeholder - implement the actual logic as needed
      res.status(501).json({ message: 'Delete application by ID functionality not yet implemented' });
    } catch (error) {
      console.error('Error in deleteApplicationById:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // PATCH: Verify application form
  async verifyApplicationForm(req, res) {
    try {
      const { applicationId } = req.params;
      // This is a placeholder - implement the actual logic as needed
      res.status(501).json({ message: 'Verify application form functionality not yet implemented' });
    } catch (error) {
      console.error('Error in verifyApplicationForm:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // PATCH: Verify application documents
  async verifyApplicationDocuments(req, res) {
    try {
      const { applicationId } = req.params;
      // This is a placeholder - implement the actual logic as needed
      res.status(501).json({ message: 'Verify application documents functionality not yet implemented' });
    } catch (error) {
      console.error('Error in verifyApplicationDocuments:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = ApplicationController;

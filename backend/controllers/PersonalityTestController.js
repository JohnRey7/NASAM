const PersonalityTestService = require('../services/PersonalityTestService');
const mongoose = require('mongoose');

const PersonalityTestController = {
  // POST /startPersonalityTest
  async startPersonalityTest(req, res) {
    try {
      const result = await PersonalityTestService.startPersonalityTest(req.user.id);
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in startPersonalityTest:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('already taken')) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // POST /answerPersonalityTest
  async answerPersonalityTest(req, res) {
    try {
      const result = await PersonalityTestService.answerPersonalityTest(req.user.id, req.body);
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in answerPersonalityTest:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('required') || error.message.includes('array') || error.message.includes('not part of')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // GET /stopPersonalityTest
  async stopPersonalityTest(req, res) {
    try {
      const result = await PersonalityTestService.stopPersonalityTest(req.user.id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in stopPersonalityTest:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // GET /getMyPersonalityTest
  async getMyPersonalityTest(req, res) {
    try {
      const test = await PersonalityTestService.getMyPersonalityTest(req.user.id);
      
      res.json(test);
    } catch (error) {
      console.error('Error in getMyPersonalityTest:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // GET /getAllUserPersonalityTest
  async getAllUserPersonalityTest(req, res) {
    try {
      const result = await PersonalityTestService.getAllUserPersonalityTest(req.query);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getAllUserPersonalityTest:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // GET /getPersonalityTestByUserId
  async getPersonalityTestByUserId(req, res) {
    try {
      const { userId } = req.params;
      const test = await PersonalityTestService.getPersonalityTestByUserId(userId);
      
      res.json(test);
    } catch (error) {
      console.error('Error in getPersonalityTestByUserId:', error);
      if (error.message.includes('not found') || error.status === 404) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },
  
  // PATCH /updatePersonalityTest/:testId
  async updatePersonalityTest(req, res) {
    try {
      // Validate user authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      }

      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: 'Request body is required' });
      }

      const { testId } = req.params;
      const updatedTest = await PersonalityTestService.updatePersonalityTest(testId, req.user.id, req.body);

      res.status(200).json(updatedTest);
    } catch (error) {
      console.error('Error in updatePersonalityTest:', error);
      if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('array') || error.message.includes('not part of')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },  
  // DELETE /deletePersonalityTestByUserId
  async deletePersonalityTestByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await PersonalityTestService.deletePersonalityTestByUserId(userId);
      
      res.json(result);
    } catch (error) {
      console.error('Error in deletePersonalityTestByUserId:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // CRUD for PersonalityAssessmentTemplate

  // POST /template
  async createTemplate(req, res) {
    try {
      const template = await PersonalityTestService.createTemplate(req.body, req.user.id);
      
      res.status(201).json(template);
    } catch (error) {
      console.error('Error in createTemplate:', error);
      if (error.message.includes('required')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // GET /template
  async getAllTemplates(req, res) {
    try {
      const templates = await PersonalityTestService.getAllTemplates();
      
      res.json(templates);
    } catch (error) {
      console.error('Error in getAllTemplates:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // GET /template/:id
  async getTemplateById(req, res) {
    try {
      const template = await PersonalityTestService.getTemplateById(req.params.id);
      
      res.json(template);
    } catch (error) {
      console.error('Error in getTemplateById:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // PATCH /template/:id
  async updateTemplate(req, res) {
    try {
      const template = await PersonalityTestService.updateTemplate(req.params.id, req.body, req.user.id);
      
      res.json(template);
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Not authorized')) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // DELETE /template/:id
  async deleteTemplate(req, res) {
    try {
      const result = await PersonalityTestService.deleteTemplate(req.params.id, req.user.id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Not authorized')) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // GET /personality-test/status - Check if user has completed personality test
  async getPersonalityTestStatus(req, res) {
    try {
      const result = await PersonalityTestService.checkPersonalityTestStatus(req.user.id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getPersonalityTestStatus:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // Soft delete a personality test
  async softDeletePersonalityTest(req, res) {
    try {
      const { id } = req.params;
      const result = await PersonalityTestService.softDeletePersonalityTest(id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in softDeletePersonalityTest:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Restore a soft-deleted personality test
  async restorePersonalityTest(req, res) {
    try {
      const { id } = req.params;
      const result = await PersonalityTestService.restorePersonalityTest(id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in restorePersonalityTest:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Permanently delete a personality test
  async permanentDeletePersonalityTest(req, res) {
    try {
      const { id } = req.params;
      const result = await PersonalityTestService.permanentDeletePersonalityTest(id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in permanentDeletePersonalityTest:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get soft-deleted personality tests
  async getSoftDeletedPersonalityTests(req, res) {
    try {
      const result = await PersonalityTestService.getSoftDeletedPersonalityTests(req.query);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getSoftDeletedPersonalityTests:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = PersonalityTestController;
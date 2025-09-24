const PersonalityTestService = require('../services/PersonalityTestService');

const PersonalityTestController = {
  // POST /startPersonalityTest
  async startPersonalityTest(req, res) {
    try {
      const result = await PersonalityTestService.startPersonalityTest(req.user.id);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in startPersonalityTest:', error);
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('already taken') ? 403 :
                        error.message.includes('No questions') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // PUT /answerQuestion/:testId/:questionId
  async answerQuestion(req, res) {
    try {
      const { testId, questionId } = req.params;
      const result = await PersonalityTestService.answerQuestion(testId, questionId, req.body, req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Error in answerQuestion:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 :
                        error.message.includes('not authorized') ? 403 :
                        error.message.includes('already completed') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET /getTestResult/:testId
  async getTestResult(req, res) {
    try {
      const { testId } = req.params;
      const result = await PersonalityTestService.getTestResult(testId, req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Error in getTestResult:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 :
                        error.message.includes('not authorized') ? 403 :
                        error.message.includes('not completed') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET /getMyTest
  async getMyTest(req, res) {
    try {
      const result = await PersonalityTestService.getMyTest(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Error in getMyTest:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET /getAllTests (admin)
  async getAllTests(req, res) {
    try {
      const result = await PersonalityTestService.getAllTests(req.query);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllTests:', error);
      const statusCode = error.message.includes('Invalid') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET /getTestByUserId/:userId (admin)
  async getTestByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await PersonalityTestService.getTestByUserId(userId);
      res.json(result);
    } catch (error) {
      console.error('Error in getTestByUserId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // POST /stopTest/:testId (admin)
  async stopTest(req, res) {
    try {
      const { testId } = req.params;
      const result = await PersonalityTestService.stopTest(testId);
      res.json(result);
    } catch (error) {
      console.error('Error in stopTest:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 :
                        error.message.includes('already completed') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // DELETE /deleteTest/:testId (admin)
  async deleteTest(req, res) {
    try {
      const { testId } = req.params;
      const result = await PersonalityTestService.deleteTest(testId);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteTest:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // Template Management

  // GET /template
  async getAllTemplates(req, res) {
    try {
      const result = await PersonalityTestService.getAllTemplates(req.query);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllTemplates:', error);
      const statusCode = error.message.includes('Invalid') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // POST /template
  async createTemplate(req, res) {
    try {
      const result = await PersonalityTestService.createTemplate(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createTemplate:', error);
      const statusCode = error.message.includes('required') ? 400 :
                        error.message.includes('Invalid') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // PUT /template/:id
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const result = await PersonalityTestService.updateTemplate(id, req.body);
      res.json(result);
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // DELETE /template/:id
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const result = await PersonalityTestService.deleteTemplate(id);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  }
};

module.exports = PersonalityTestController;

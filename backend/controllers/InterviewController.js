const InterviewService = require('../services/InterviewService');

const InterviewController = {
  // POST: Create an interview for the authenticated user's application
  async createInterview(req, res) {
    try {
      const result = await InterviewService.createInterview(req.user.id, req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createInterview:', error);
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('already exists') ? 400 :
                        error.message.includes('required') ? 400 :
                        error.message.includes('Invalid') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // POST: Create an interview for any applicant (admin/staff)
  async createInterviewForApplicant(req, res) {
    try {
      const result = await InterviewService.createInterviewForApplicant(req.user.id, req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createInterviewForApplicant:', error);
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('already exists') ? 400 :
                        error.message.includes('required') ? 400 :
                        error.message.includes('Invalid') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Get interview by application ID
  async getInterviewByApplicationId(req, res) {
    try {
      const { applicationId } = req.params;
      const result = await InterviewService.getInterviewByApplicationId(applicationId);
      res.json(result);
    } catch (error) {
      console.error('Error in getInterviewByApplicationId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Get interview by user ID
  async getInterviewByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await InterviewService.getInterviewByUserId(userId);
      res.json(result);
    } catch (error) {
      console.error('Error in getInterviewByUserId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Get interview for authenticated user
  async getMyInterview(req, res) {
    try {
      const result = await InterviewService.getMyInterview(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Error in getMyInterview:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // GET: Get all interviews with pagination
  async getAllInterviews(req, res) {
    try {
      const result = await InterviewService.getAllInterviews(req.query);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllInterviews:', error);
      const statusCode = error.message.includes('Invalid') ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // PUT: Update interview by ID
  async updateInterviewById(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewService.updateInterviewById(id, req.body);
      res.json(result);
    } catch (error) {
      console.error('Error in updateInterviewById:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // PUT: Update interview by application ID
  async updateInterviewByApplicationId(req, res) {
    try {
      const { applicationId } = req.params;
      const result = await InterviewService.updateInterviewByApplicationId(applicationId, req.body);
      res.json(result);
    } catch (error) {
      console.error('Error in updateInterviewByApplicationId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // DELETE: Delete interview by ID
  async deleteInterviewById(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewService.deleteInterviewById(id);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteInterviewById:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // DELETE: Delete interview by application ID
  async deleteInterviewByApplicationId(req, res) {
    try {
      const { applicationId } = req.params;
      const result = await InterviewService.deleteInterviewByApplicationId(applicationId);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteInterviewByApplicationId:', error);
      const statusCode = error.message.includes('Invalid') ? 400 :
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  },

  // PATCH: Reschedule interview for department head
  async rescheduleInterviewForDepartmentHead(req, res) {
    try {
      const { interviewId } = req.params;
      // This is a placeholder - implement the actual logic as needed
      res.status(501).json({ message: 'Reschedule interview for department head functionality not yet implemented' });
    } catch (error) {
      console.error('Error in rescheduleInterviewForDepartmentHead:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = InterviewController;

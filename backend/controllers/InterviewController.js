const InterviewService = require('../services/InterviewService');
const AuditLogService = require('../services/AuditLogService');

const InterviewController = {
  // POST: Create an interview for the authenticated user's application
  async createInterview(req, res) {
    try {
      const result = await InterviewService.createInterview(req.user.id, req.body);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Create Interview',
        module: 'Interview'
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createInterview:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('already exists') || error.message.includes('required') || error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to create interview: ${error.message}` });
    }
  },

  // POST: Create an interview for any applicant (admin/staff)
  async createInterviewForApplicant(req, res) {
    try {
      const result = await InterviewService.createInterviewForApplicant(req.user.id, req.body);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: result.isExisting ? 'Send Interview Reminder' : 'Schedule Interview',
        module: 'Interview'
      });
      
      const statusCode = result.isExisting ? 200 : 201;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Error in createInterviewForApplicant:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('own academic department')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: `Failed to schedule interview: ${error.message}` });
    }
  },

  // PATCH: Reschedule interview for department head
  async rescheduleInterviewForDepartmentHead(req, res) {
    try {
      const { interviewId } = req.params;
      const result = await InterviewService.rescheduleInterviewForDepartmentHead(req.user.id, interviewId, req.body);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Reschedule Interview',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in rescheduleInterviewForDepartmentHead:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('required') || error.message.includes('own academic department')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: `Failed to reschedule interview: ${error.message}` });
    }
  },

  // POST: Create/Schedule interview for department head (they are always the interviewer)
  async scheduleInterviewForDepartmentHead(req, res) {
    try {
      // Force the interviewer to be the department head themselves
      const departmentHeadId = req.user.id;
      const result = await InterviewService.scheduleInterviewForDepartmentHead(departmentHeadId, req.body);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: result.isExisting ? 'Send Interview Reminder' : 'Schedule Interview',
        module: 'Interview'
      });
      
      const statusCode = result.isExisting ? 200 : 201;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Error in scheduleInterviewForDepartmentHead:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('own academic department')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: `Failed to schedule interview: ${error.message}` });
    }
  },

  // GET: Retrieve all interviews with pagination and filtering (admin)
  async getAllInterviews(req, res) {
    try {
      const result = await InterviewService.getAllInterviews(req.query);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getAllInterviews:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve interview by ID (admin)
  async getInterviewById(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewService.getInterviewById(id);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getInterviewById:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve interview by application ID (admin/staff)
  async getInterviewByApplicationId(req, res) {
    try {
      const { applicationId } = req.params;
      // Use the new method that returns all interviews but formatted for backward compatibility if needed
      // Or expose a new endpoint for multiple interviews.
      // For now, let's keep this endpoint returning a single "primary" interview (OAS) via the service wrapper
      const result = await InterviewService.getInterviewByApplicationId(applicationId);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getInterviewByApplicationId:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve ALL interviews by application ID
  async getInterviewsByApplicationId(req, res) {
    try {
      const { applicationId } = req.params;
      const result = await InterviewService.getInterviewsByApplicationId(applicationId);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getInterviewsByApplicationId:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve interview by user ID (admin)
  async getInterviewByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await InterviewService.getInterviewByUserId(userId);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getInterviewByUserId:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve the authenticated user's interview
  async getMyInterview(req, res) {
    try {
      const result = await InterviewService.getMyInterview(req.user.id);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getMyInterview:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // PATCH: Update interview by ID (admin)
  async updateInterviewById(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewService.updateInterviewById(id, req.body);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Update Interview',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in updateInterviewById:', error);
      if (error.message.includes('Invalid') || error.message.includes('End time must')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to update interview: ${error.message}` });
    }
  },

  // PATCH: Update interview by user ID (admin)
  async updateInterviewByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await InterviewService.updateInterviewByUserId(userId, req.body);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Update Interview',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in updateInterviewByUserId:', error);
      if (error.message.includes('Invalid') || error.message.includes('End time must')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to update interview: ${error.message}` });
    }
  },

  // PATCH: Update the authenticated user's interview
  async updateMyInterview(req, res) {
    try {
      const result = await InterviewService.updateMyInterview(req.user.id, req.body);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Update Interview',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in updateMyInterview:', error);
      if (error.message.includes('Invalid') || error.message.includes('End time must')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to update interview: ${error.message}` });
    }
  },
  
  async updateStartAndEndTime(req, res) {
    try {
      const result = await InterviewService.updateStartAndEndTime(req.user.id, req.body);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Update Interview Time',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in updateStartAndEndTime:', error);
      if (error.message.includes('Invalid') || error.message.includes('End time must')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: `Failed to update interview times: ${error.message}` });
    }
  },

  // DELETE: Delete interview by ID (admin)
  async deleteInterviewById(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewService.deleteInterviewById(id);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Delete Interview',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in deleteInterviewById:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE: Delete interview by user ID (admin)
  async deleteInterviewByUserId(req, res) {
    try {
      const { userId } = req.params;
      const result = await InterviewService.deleteInterviewByUserId(userId);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Delete Interview',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in deleteInterviewByUserId:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE: Delete the authenticated user's interview
  async deleteMyInterview(req, res) {
    try {
      const result = await InterviewService.deleteMyInterview(req.user.id);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Delete Interview',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in deleteMyInterview:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Get interview review by specific interview ID for logged-in interviewer
  async getReviewByInterviewId(req, res) {
    try {
      const { interviewId } = req.params;
      const result = await InterviewService.getReviewByInterviewId(req.user.id, interviewId);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getReviewByInterviewId:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Get paginated list of interviews for logged-in interviewer with application and document data
  async getReviewList(req, res) {
    try {
      const result = await InterviewService.getReviewList(req.user.id, req.query);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getReviewList:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Soft delete an interview
  async softDeleteInterview(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewService.softDeleteInterview(id);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Soft Delete Interview',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in softDeleteInterview:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Restore a soft-deleted interview
  async restoreInterview(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewService.restoreInterview(id);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Restore Interview',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in restoreInterview:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Permanently delete an interview
  async permanentDeleteInterview(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewService.permanentDeleteInterview(id);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Permanent Delete Interview',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in permanentDeleteInterview:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get soft-deleted interviews
  async getSoftDeletedInterviews(req, res) {
    try {
      const result = await InterviewService.getSoftDeletedInterviews(req.query);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getSoftDeletedInterviews:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Mark interview as finished
  async finishInterview(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewService.finishInterview(id);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Mark Interview as Complete',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in finishInterview:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Revert interview finished status
  async revertFinishInterview(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewService.revertFinishInterview(id);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Revert Interview Completion',
        module: 'Interview'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error in revertFinishInterview:', error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // GET: Get scheduled interviews for department head (with pagination)
  async getInterviewsForDepartmentHead(req, res) {
    try {
      const { page = 1, limit = 50, search = '' } = req.query;
      
      const result = await InterviewService.getInterviewsForDepartmentHead(
        req.user.id,
        {
          page: parseInt(page),
          limit: Math.min(parseInt(limit), 50), // Max 50 per page
          search
        }
      );
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getInterviewsForDepartmentHead:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  // POST: Send interview reminder to applicant
  async sendInterviewReminder(req, res) {
    try {
      const { interviewId } = req.params;
      
      const result = await InterviewService.sendInterviewReminder(interviewId);
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Send Interview Reminder',
        module: 'Interview',
        details: `Sent reminder for interview ${interviewId}`
      });
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in sendInterviewReminder:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: `Failed to send reminder: ${error.message}` });
    }
  }
};

module.exports = InterviewController;
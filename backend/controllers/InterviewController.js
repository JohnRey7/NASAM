const Interview = require('../models/Interview');
const ApplicationForm = require('../models/ApplicationForm');
const mongoose = require('mongoose');
const DocumentUpload = require('../models/DocumentUpload');
const NotificationService = require('../services/NotificationService');

const InterviewController = {
  // POST: Create an interview for the authenticated user's application
  async createInterview(req, res) {
    try {
      const userId = req.user.id;
      const { interviewer, startTime, endTime } = req.body;

      // Find user's application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) return res.status(404).json({ message: 'No application found for this user' });

      // Check for existing interview
      const existingInterview = await Interview.findOne({ applicationId: application._id });
      if (existingInterview) return res.status(400).json({ message: 'Interview already exists for this application' });

      // Validate input
      if (!interviewer || !startTime || !endTime) return res.status(400).json({ message: 'Interviewer, start time, and end time are required' });
      if (!mongoose.Types.ObjectId.isValid(interviewer)) return res.status(400).json({ message: 'Invalid interviewer ID' });
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ message: 'Invalid date format' });
      if (end <= start) return res.status(400).json({ message: 'End time must be after start time' });

      // Create interview
      const interview = new Interview({ applicationId: application._id, interviewer, startTime: start, endTime: end });
      await interview.save();

      const populatedInterview = await Interview.findById(interview._id).populate('interviewer', 'name _id');
      res.status(201).json({ message: 'Interview created successfully', interview: populatedInterview });
    } catch (error) {
      console.error('Error in createInterview:', error);
      res.status(400).json({ message: `Failed to create interview: ${error.message}` });
    }
  },

  // POST: Create an interview for any applicant (admin/staff)
  async createInterviewForApplicant(req, res) {
    try {
      const { applicationId, interviewDate, notes } = req.body;
      const staffUserId = req.user.id;

      console.log('🔍 Creating interview for application:', { applicationId, interviewDate, staffUserId });

      // Validate input
      if (!applicationId || !interviewDate) {
        return res.status(400).json({ message: 'Application ID and interview date are required' });
      }

      // Find the application
      const application = await ApplicationForm.findById(applicationId);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Check for existing interview
      const existingInterview = await Interview.findOne({ applicationId: applicationId })
        .populate('interviewer', 'name email');
      
      if (existingInterview) {
        // Generate interview ID for existing interview
        const existingInterviewId = `INT-${new Date().getFullYear()}-${String(existingInterview._id).slice(-6).toUpperCase()}`;
        
        console.log('📅 Interview already exists, sending notification to applicant');
        
        // Send notification to the applicant about their existing interview
        try {
          await NotificationService.createInterviewReminderNotification(
            application.user, // userId from the application
            applicationId,
            existingInterview.startTime,
            'OAS Staff' // remindedBy
          );
          console.log('✅ Interview reminder notification sent to applicant:', application.user);
        } catch (notificationError) {
          console.error('⚠️ Failed to send interview reminder notification:', notificationError);
        }
        
        return res.status(200).json({ 
          message: 'Interview already scheduled for this application. Notification sent to applicant.',
          interview: existingInterview,
          interviewId: existingInterviewId,
          isExisting: true,
          interviewDate: existingInterview.startTime
        });
      }

      // Parse the interview date and create start/end times
      const interviewStart = new Date(interviewDate);
      if (isNaN(interviewStart.getTime())) {
        return res.status(400).json({ message: 'Invalid interview date format' });
      }

      // Set default interview duration (1 hour)
      const interviewEnd = new Date(interviewStart.getTime() + 60 * 60 * 1000);

      // Create interview with the staff member as interviewer
      const interview = new Interview({
        applicationId: applicationId,
        interviewer: staffUserId,
        startTime: interviewStart,
        endTime: interviewEnd
      });

      await interview.save();

      // Generate unique interview ID
      const interviewId = `INT-${new Date().getFullYear()}-${String(interview._id).slice(-6).toUpperCase()}`;

      // Populate the interview with application and user data
      const populatedInterview = await Interview.findById(interview._id)
        .populate('applicationId')
        .populate('interviewer', 'name email');

      console.log('✅ Interview created successfully:', {
        interviewId: interviewId,
        applicationId: applicationId,
        interviewDate: interviewStart
      });

      // Send notification to the applicant
      try {
        await NotificationService.createInterviewScheduledNotification(
          application.user, // userId from the application
          applicationId,
          interviewStart,
          'OAS Staff' // scheduledBy
        );
        console.log('✅ Interview notification sent to applicant:', application.user);
      } catch (notificationError) {
        console.error('⚠️ Failed to send interview notification:', notificationError);
        // Don't fail the interview creation if notification fails
      }

      res.status(201).json({
        message: 'Interview scheduled successfully',
        interview: populatedInterview,
        interviewId: interviewId
      });
    } catch (error) {
      console.error('Error in createInterviewForApplicant:', error);
      res.status(500).json({ message: `Failed to schedule interview: ${error.message}` });
    }
  },

  // GET: Retrieve all interviews with pagination and filtering (admin)
  async getAllInterviews(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const query = {};
      if (status) query['applicationId.status'] = status;
      const interviews = await Interview.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      const totalDocs = await Interview.countDocuments(query);
      res.json({
        message: 'Interviews retrieved successfully',
        interviews,
        pagination: {
          totalDocs,
          limit: parseInt(limit),
          page: parseInt(page),
          totalPages: Math.ceil(totalDocs / parseInt(limit)),
          hasNextPage: skip + interviews.length < totalDocs,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error in getAllInterviews:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve interview by ID (admin)
  async getInterviewById(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid interview ID' });
      const interview = await Interview.findById(id)
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      if (!interview) return res.status(404).json({ message: 'Interview not found' });
      res.json({ message: 'Interview retrieved successfully', interview });
    } catch (error) {
      console.error('Error in getInterviewById:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve interview by user ID (admin)
  async getInterviewByUserId(req, res) {
    try {
      const { userId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user ID' });
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) return res.status(404).json({ message: 'No application found for this user' });
      const interview = await Interview.findOne({ applicationId: application._id })
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      if (!interview) return res.status(404).json({ message: 'No interview found for this application' });
      res.json({ message: 'Interview retrieved successfully', interview });
    } catch (error) {
      console.error('Error in getInterviewByUserId:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Retrieve the authenticated user's interview
  async getMyInterview(req, res) {
    try {
      const userId = req.user.id;
      
      // Find user's application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        return res.status(404).json({ message: 'No application found for this user' });
      }
      
      // Find the interview for this application
      const interview = await Interview.findOne({ applicationId: application._id })
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      
      // If no interview found, return null (not an error for applicants)
      if (!interview) {
        return res.status(200).json({ 
          message: 'No interview scheduled yet',
          interview: null 
        });
      }
      
      // Generate interview ID for display
      const interviewId = `INT-${new Date().getFullYear()}-${String(interview._id).slice(-6).toUpperCase()}`;
      
      res.status(200).json({
        message: 'Interview retrieved successfully',
        interview: {
          ...interview.toObject(),
          interviewId: interviewId
        }
      });
    } catch (error) {
      console.error('Error in getMyInterview:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // PATCH: Update interview by ID (admin)
  async updateInterviewById(req, res) {
    try {
      const { id } = req.params;
      const data = { ...req.body };
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid interview ID' });
      if (data.interviewer && !mongoose.Types.ObjectId.isValid(data.interviewer)) return res.status(400).json({ message: 'Invalid interviewer ID' });
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ message: 'Invalid date format' });
        if (end <= start) return res.status(400).json({ message: 'End time must be after start time' });
      }
      const interview = await Interview.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      if (!interview) return res.status(404).json({ message: 'Interview not found' });
      res.json({ message: 'Interview updated successfully', interview });
    } catch (error) {
      console.error('Error in updateInterviewById:', error);
      res.status(400).json({ message: `Failed to update interview: ${error.message}` });
    }
  },

  // PATCH: Update interview by user ID (admin)
  async updateInterviewByUserId(req, res) {
    try {
      const { userId } = req.params;
      const data = { ...req.body };
      if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user ID' });
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) return res.status(404).json({ message: 'No application found for this user' });
      if (data.interviewer && !mongoose.Types.ObjectId.isValid(data.interviewer)) return res.status(400).json({ message: 'Invalid interviewer ID' });
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ message: 'Invalid date format' });
        if (end <= start) return res.status(400).json({ message: 'End time must be after start time' });
      }
      const interview = await Interview.findOneAndUpdate(
        { applicationId: application._id },
        { $set: data },
        { new: true, runValidators: true }
      )
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      if (!interview) return res.status(404).json({ message: 'No interview found for this application' });
      res.json({ message: 'Interview updated successfully', interview });
    } catch (error) {
      console.error('Error in updateInterviewByUserId:', error);
      res.status(400).json({ message: `Failed to update interview: ${error.message}` });
    }
  },

  // PATCH: Update the authenticated user's interview
  async updateMyInterview(req, res) {
    try {
      const userId = req.user.id;
      const data = { ...req.body };
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) return res.status(404).json({ message: 'No application found for this user' });
      if (data.interviewer && !mongoose.Types.ObjectId.isValid(data.interviewer)) return res.status(400).json({ message: 'Invalid interviewer ID' });
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ message: 'Invalid date format' });
        if (end <= start) return res.status(400).json({ message: 'End time must be after start time' });
      }
      const interview = await Interview.findOneAndUpdate(
        { applicationId: application._id },
        { $set: data },
        { new: true, runValidators: true }
      )
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      if (!interview) return res.status(404).json({ message: 'No interview found for this application' });
      res.json({ message: 'Interview updated successfully', interview });
    } catch (error) {
      console.error('Error in updateMyInterview:', error);
      res.status(400).json({ message: `Failed to update interview: ${error.message}` });
    }
  },
  
  async updateStartAndEndTime(req, res) {
    try {
      const userId = req.user.id;
      const { startTime, endTime } = req.body;
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) return res.status(404).json({ message: 'No application found for this user' });
      const updateData = {};
      if (startTime) {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) return res.status(400).json({ message: 'Invalid start time format' });
        updateData.startTime = start;
      }
      if (endTime) {
        const end = new Date(endTime);
        if (isNaN(end.getTime())) return res.status(400).json({ message: 'Invalid end time format' });
        updateData.endTime = end;
      }
      if (startTime && endTime && updateData.endTime <= updateData.startTime) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }
      const interview = await Interview.findOneAndUpdate(
        { applicationId: application._id },
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      if (!interview) return res.status(404).json({ message: 'No interview found for this application' });
      res.json({ message: 'Interview times updated successfully', interview });
    } catch (error) {
      console.error('Error in updateStartAndEndTime:', error);
      res.status(400).json({ message: `Failed to update interview times: ${error.message}` });
    }
  },

  // DELETE: Delete interview by ID (admin)
  async deleteInterviewById(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid interview ID' });
      const interview = await Interview.findByIdAndDelete(id);
      if (!interview) return res.status(404).json({ message: 'Interview not found' });
      res.json({ message: 'Interview deleted successfully' });
    } catch (error) {
      console.error('Error in deleteInterviewById:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE: Delete interview by user ID (admin)
  async deleteInterviewByUserId(req, res) {
    try {
      const { userId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user ID' });
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) return res.status(404).json({ message: 'No application found for this user' });
      const interview = await Interview.findOneAndDelete({ applicationId: application._id });
      if (!interview) return res.status(404).json({ message: 'No interview found for this application' });
      res.json({ message: 'Interview deleted successfully' });
    } catch (error) {
      console.error('Error in deleteInterviewByUserId:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE: Delete the authenticated user's interview
  async deleteMyInterview(req, res) {
    try {
      const userId = req.user.id;
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) return res.status(404).json({ message: 'No application found for this user' });
      const interview = await Interview.findOneAndDelete({ applicationId: application._id });
      if (!interview) return res.status(404).json({ message: 'No interview found for this application' });
      res.json({ message: 'Interview deleted successfully' });
    } catch (error) {
      console.error('Error in deleteMyInterview:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Get interview review by specific interview ID for logged-in interviewer
  async getReviewByInterviewId(req, res) {
    try {
      const { interviewId } = req.params;
      const userId = req.user.id; // logged-in user's ID

      // Validate interview ID
      if (!mongoose.Types.ObjectId.isValid(interviewId)) {
        return res.status(400).json({ message: 'Invalid interview ID' });
      }

      // Find the interview and verify the user is the interviewer
      const interview = await Interview.findOne({ 
        _id: interviewId, 
        interviewer: userId 
      }).populate('applicationId');

      if (!interview) {
        return res.status(404).json({ 
          message: 'Interview not found or you are not authorized to view this interview' 
        });
      }

      // Get the application form
      const applicationForm = await ApplicationForm.findById(interview.applicationId._id);
      if (!applicationForm) {
        return res.status(404).json({ message: 'Application form not found' });
      }

      // Get the document uploads for the applicant
      const documentUpload = await DocumentUpload.findOne({ user: applicationForm.user });

      res.json({
        message: 'Review retrieved successfully',
        data: {
          interview,
          applicationForm,
          documentUpload: documentUpload || null
        }
      });
    } catch (error) {
      console.error('Error in getReviewByInterviewId:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET: Get paginated list of interviews for logged-in interviewer with application and document data
  async getReviewList(req, res) {
    try {
      const userId = req.user.id; // logged-in user's ID
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Find all interviews where the logged-in user is the interviewer
      const interviews = await Interview.find({ interviewer: userId })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate('applicationId');

      // Get total count for pagination
      const totalDocs = await Interview.countDocuments({ interviewer: userId });

      // For each interview, get the application form and document upload
      const reviewData = await Promise.all(
        interviews.map(async (interview) => {
          const applicationForm = await ApplicationForm.findById(interview.applicationId._id);
          const documentUpload = await DocumentUpload.findOne({ user: applicationForm.user });

          return {
            interview,
            applicationForm,
            documentUpload: documentUpload || null
          };
        })
      );

      res.json({
        message: 'Review list retrieved successfully',
        data: reviewData,
        pagination: {
          totalDocs,
          limit: parseInt(limit),
          page: parseInt(page),
          totalPages: Math.ceil(totalDocs / parseInt(limit)),
          hasNextPage: skip + interviews.length < totalDocs,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error in getReviewList:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = InterviewController;
const Interview = require('../models/Interview');
const ApplicationForm = require('../models/ApplicationForm');
const DocumentUpload = require('../models/DocumentUpload');
const NotificationService = require('./NotificationService');
const mongoose = require('mongoose');

class InterviewService {
  // Create an interview for a user's application
  static async createInterview(userId, interviewData) {
    const { interviewer, startTime, endTime } = interviewData;

    // Find user's application
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    // Check for existing interview
    const existingInterview = await Interview.findOne({ applicationId: application._id });
    if (existingInterview) {
      throw new Error('Interview already exists for this application');
    }

    // Validate input
    if (!interviewer || !startTime || !endTime) {
      throw new Error('Interviewer, start time, and end time are required');
    }
    if (!mongoose.Types.ObjectId.isValid(interviewer)) {
      throw new Error('Invalid interviewer ID');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }
    if (end <= start) {
      throw new Error('End time must be after start time');
    }

    // Create interview
    const interview = new Interview({ 
      applicationId: application._id, 
      interviewer, 
      startTime: start, 
      endTime: end 
    });
    await interview.save();

    const populatedInterview = await Interview.findById(interview._id)
      .populate('interviewer', 'name _id');

    return {
      message: 'Interview created successfully',
      interview: populatedInterview
    };
  }

  // Create an interview for any applicant (admin/staff)
  static async createInterviewForApplicant(applicationId, interviewDate, staffUserId, notes = '') {
    console.log('🔍 Creating interview for application:', { applicationId, interviewDate, staffUserId });

    // Validate input
    if (!applicationId || !interviewDate) {
      throw new Error('Application ID and interview date are required');
    }

    // Find the application
    const application = await ApplicationForm.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
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
      
      return { 
        message: 'Interview already scheduled for this application. Notification sent to applicant.',
        interview: existingInterview,
        interviewId: existingInterviewId,
        isExisting: true,
        interviewDate: existingInterview.startTime
      };
    }

    // Parse the interview date and create start/end times
    const interviewStart = new Date(interviewDate);
    if (isNaN(interviewStart.getTime())) {
      throw new Error('Invalid interview date format');
    }

    // Set default interview duration (1 hour)
    const interviewEnd = new Date(interviewStart.getTime() + 60 * 60 * 1000);

    // Create new interview
    const interview = new Interview({
      applicationId: applicationId,
      interviewer: staffUserId,
      startTime: interviewStart,
      endTime: interviewEnd,
      notes: notes || ''
    });

    await interview.save();

    // Generate interview ID
    const interviewId = `INT-${new Date().getFullYear()}-${String(interview._id).slice(-6).toUpperCase()}`;

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
    }

    const populatedInterview = await Interview.findById(interview._id)
      .populate('interviewer', 'name email');

    return {
      message: 'Interview scheduled successfully',
      interview: populatedInterview,
      interviewId: interviewId,
      interviewDate: interviewStart
    };
  }

  // Reschedule interview for department head
  static async rescheduleInterviewForDepartmentHead(applicationId, newInterviewDate, departmentHeadId, notes = '') {
    console.log('🔄 Rescheduling interview for application:', { applicationId, newInterviewDate, departmentHeadId });

    // Validate input
    if (!applicationId || !newInterviewDate) {
      throw new Error('Application ID and new interview date are required');
    }

    // Find the application
    const application = await ApplicationForm.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Find existing interview
    const existingInterview = await Interview.findOne({ applicationId: applicationId });
    if (!existingInterview) {
      throw new Error('No existing interview found for this application');
    }

    // Parse the new interview date
    const newInterviewStart = new Date(newInterviewDate);
    if (isNaN(newInterviewStart.getTime())) {
      throw new Error('Invalid interview date format');
    }

    // Set default interview duration (1 hour)
    const newInterviewEnd = new Date(newInterviewStart.getTime() + 60 * 60 * 1000);

    // Update interview
    existingInterview.startTime = newInterviewStart;
    existingInterview.endTime = newInterviewEnd;
    existingInterview.interviewer = departmentHeadId;
    if (notes) existingInterview.notes = notes;

    await existingInterview.save();

    // Send notification to the applicant
    try {
      await NotificationService.createInterviewRescheduledNotification(
        application.user,
        applicationId,
        newInterviewStart,
        'Department Head'
      );
      console.log('✅ Interview reschedule notification sent to applicant:', application.user);
    } catch (notificationError) {
      console.error('⚠️ Failed to send interview reschedule notification:', notificationError);
    }

    const populatedInterview = await Interview.findById(existingInterview._id)
      .populate('interviewer', 'name email');

    return {
      message: 'Interview rescheduled successfully',
      interview: populatedInterview,
      newInterviewDate: newInterviewStart
    };
  }

  // Get all interviews with pagination
  static async getAllInterviews(options = {}) {
    const { page = 1, limit = 10 } = options;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Invalid page number');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new Error('Invalid limit');
    }

    const interviews = await Interview.find()
      .populate('interviewer', 'name email')
      .populate({
        path: 'applicationId',
        populate: { path: 'user', select: 'name email idNumber' }
      })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ startTime: -1 });

    const total = await Interview.countDocuments();

    return {
      interviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  // Get interview by ID
  static async getInterviewById(interviewId) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new Error('Invalid interview ID');
    }

    const interview = await Interview.findById(interviewId)
      .populate('interviewer', 'name email')
      .populate({
        path: 'applicationId',
        populate: { path: 'user', select: 'name email idNumber' }
      });

    if (!interview) {
      throw new Error('Interview not found');
    }

    return { interview };
  }

  // Get interview by user ID
  static async getInterviewByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    const interview = await Interview.findOne({ applicationId: application._id })
      .populate('interviewer', 'name email');

    if (!interview) {
      throw new Error('Interview not found for this user');
    }

    return { interview };
  }

  // Get current user's interview
  static async getMyInterview(userId) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    const interview = await Interview.findOne({ applicationId: application._id })
      .populate('interviewer', 'name email');

    if (!interview) {
      throw new Error('No interview scheduled for your application');
    }

    return { interview };
  }

  // Update interview by ID
  static async updateInterviewById(interviewId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new Error('Invalid interview ID');
    }

    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      updateData,
      { new: true, runValidators: true }
    ).populate('interviewer', 'name email');

    if (!interview) {
      throw new Error('Interview not found');
    }

    return {
      message: 'Interview updated successfully',
      interview
    };
  }

  // Update interview by user ID
  static async updateInterviewByUserId(userId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    const interview = await Interview.findOneAndUpdate(
      { applicationId: application._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('interviewer', 'name email');

    if (!interview) {
      throw new Error('Interview not found for this user');
    }

    return {
      message: 'Interview updated successfully',
      interview
    };
  }

  // Update current user's interview
  static async updateMyInterview(userId, updateData) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    const interview = await Interview.findOneAndUpdate(
      { applicationId: application._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('interviewer', 'name email');

    if (!interview) {
      throw new Error('No interview scheduled for your application');
    }

    return {
      message: 'Interview updated successfully',
      interview
    };
  }

  // Delete interview by ID
  static async deleteInterviewById(interviewId) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new Error('Invalid interview ID');
    }

    const interview = await Interview.findByIdAndDelete(interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }

    return { message: 'Interview deleted successfully' };
  }

  // Delete interview by user ID
  static async deleteInterviewByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    const interview = await Interview.findOneAndDelete({ applicationId: application._id });
    if (!interview) {
      throw new Error('Interview not found for this user');
    }

    return { message: 'Interview deleted successfully' };
  }

  // Delete current user's interview
  static async deleteMyInterview(userId) {
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      throw new Error('No application found for this user');
    }

    const interview = await Interview.findOneAndDelete({ applicationId: application._id });
    if (!interview) {
      throw new Error('No interview scheduled for your application');
    }

    return { message: 'Interview deleted successfully' };
  }

  // Get review by interview ID
  static async getReviewByInterviewId(interviewId) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new Error('Invalid interview ID');
    }

    const interview = await Interview.findById(interviewId)
      .populate('interviewer', 'name email')
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'user', select: 'name email idNumber' }
        ]
      });

    if (!interview) {
      throw new Error('Interview not found');
    }

    // Get documents for the user
    const documents = await DocumentUpload.findOne({ 
      user: interview.applicationId.user._id 
    });

    return {
      interview,
      documents: documents || null,
      application: interview.applicationId
    };
  }

  // Get review list with pagination
  static async getReviewList(options = {}) {
    const { page = 1, limit = 10 } = options;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Invalid page number');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new Error('Invalid limit');
    }

    const interviews = await Interview.find()
      .populate('interviewer', 'name email')
      .populate({
        path: 'applicationId',
        populate: { path: 'user', select: 'name email idNumber' }
      })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ startTime: -1 });

    const total = await Interview.countDocuments();

    // Get documents for each interview
    const interviewsWithDocuments = await Promise.all(
      interviews.map(async (interview) => {
        const documents = await DocumentUpload.findOne({ 
          user: interview.applicationId.user._id 
        });
        
        return {
          ...interview.toObject(),
          documents: documents || null
        };
      })
    );

    return {
      interviews: interviewsWithDocuments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }
}

module.exports = InterviewService;
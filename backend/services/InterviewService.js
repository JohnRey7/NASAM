const Interview = require('../models/Interview');
const ApplicationForm = require('../models/ApplicationForm');
const DocumentUpload = require('../models/DocumentUpload');
const NotificationService = require('../services/NotificationService');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');
const mongoose = require('mongoose');

class InterviewService {
  static async createInterview(userId, interviewData) {
    try {
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
    } catch (error) {
      console.error('Error creating interview:', error);
      throw error;
    }
  }

  static async createInterviewForApplicant(staffUserId, interviewData) {
    try {
      const { applicationId, interviewDate, startTime, endTime, notes, interviewerId } = interviewData;

      console.log('🔍 Creating interview for application:', { applicationId, interviewDate, startTime, endTime, interviewerId, staffUserId });

      // Validate input - support both old format (interviewDate) and new format (startTime/endTime)
      if (!applicationId || (!interviewDate && !startTime)) {
        throw new Error('Application ID and interview date/time are required');
      }

      // Use provided interviewerId or fall back to staffUserId
      const actualInterviewerId = interviewerId || staffUserId;

      // Find the application
      const application = await ApplicationForm.findById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Check for existing non-deleted interview
      const existingInterview = await Interview.findOne({ 
        applicationId: applicationId,
        is_deleted: { $ne: true }  // Exclude soft-deleted interviews
      }).populate('interviewer', 'name email');
      
      if (existingInterview) {
        // Generate interview ID for existing interview
        const existingInterviewId = `INT-${new Date().getFullYear()}-${String(existingInterview._id).slice(-6).toUpperCase()}`;
        
        // Parse the new interview dates - support both formats
        let newInterviewStart, newInterviewEnd;
        
        if (startTime) {
          newInterviewStart = new Date(startTime);
          newInterviewEnd = endTime ? new Date(endTime) : new Date(newInterviewStart.getTime() + 60 * 60 * 1000);
        } else {
          newInterviewStart = new Date(interviewDate);
          newInterviewEnd = new Date(newInterviewStart.getTime() + 60 * 60 * 1000);
        }
        
        if (isNaN(newInterviewStart.getTime())) {
          throw new Error('Invalid interview date format');
        }
        
        // Check if the date/time is different (rescheduling)
        const existingStart = new Date(existingInterview.startTime).getTime();
        const newStart = newInterviewStart.getTime();
        const interviewerChanged = interviewerId && existingInterview.interviewer?._id?.toString() !== interviewerId;
        
        if (existingStart !== newStart || interviewerChanged) {
          console.log('📅 Rescheduling interview from', new Date(existingStart), 'to', newInterviewStart);
          if (interviewerChanged) {
            console.log('👤 Interviewer changed to:', interviewerId);
          }
          
          // Update the interview
          existingInterview.startTime = newInterviewStart;
          existingInterview.endTime = newInterviewEnd;
          if (interviewerId) {
            existingInterview.interviewer = interviewerId;
          }
          await existingInterview.save();
          
          // Re-populate after save
          const updatedInterview = await Interview.findById(existingInterview._id)
            .populate('interviewer', 'name email');
          
          // Send reschedule notification
          try {
            await NotificationService.createInterviewRescheduledNotification(
              application.user,
              applicationId,
              newInterviewStart,
              'OAS Staff'
            );
            console.log('✅ Interview rescheduled notification sent to applicant:', application.user);
          } catch (notificationError) {
            console.error('⚠️ Failed to send reschedule notification:', notificationError);
          }
          
          return { 
            message: 'Interview rescheduled successfully. Notification sent to applicant.',
            interview: updatedInterview,
            interviewId: existingInterviewId,
            isExisting: true,
            isRescheduled: true,
            interviewDate: updatedInterview.startTime
          };
        } else {
          console.log('📅 Interview already exists with same date, sending reminder');
          
          // Send notification to the applicant about their existing interview
          try {
            await NotificationService.createInterviewReminderNotification(
              application.user,
              applicationId,
              existingInterview.startTime,
              'OAS Staff'
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
      }

      // Parse the interview date and create start/end times
      // Support both old format (interviewDate) and new format (startTime/endTime)
      let interviewStart, interviewEnd;
      
      if (startTime) {
        // New format with explicit start and end times
        interviewStart = new Date(startTime);
        if (isNaN(interviewStart.getTime())) {
          throw new Error('Invalid start time format');
        }
        
        if (endTime) {
          interviewEnd = new Date(endTime);
          if (isNaN(interviewEnd.getTime())) {
            throw new Error('Invalid end time format');
          }
        } else {
          // Default to 1 hour after start if no end time provided
          interviewEnd = new Date(interviewStart.getTime() + 60 * 60 * 1000);
        }
      } else {
        // Old format - use interviewDate for backward compatibility
        interviewStart = new Date(interviewDate);
        if (isNaN(interviewStart.getTime())) {
          throw new Error('Invalid interview date format');
        }
        // Set default interview duration (1 hour)
        interviewEnd = new Date(interviewStart.getTime() + 60 * 60 * 1000);
      }

      // Create interview with the selected interviewer (or staff member as fallback)
      const interview = new Interview({
        applicationId: applicationId,
        interviewer: actualInterviewerId,
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

      return {
        message: 'Interview scheduled successfully',
        interview: populatedInterview,
        interviewId: interviewId
      };
    } catch (error) {
      console.error('Error creating interview for applicant:', error);
      throw error;
    }
  }

  // Schedule interview for department head - they are always the interviewer themselves
  static async scheduleInterviewForDepartmentHead(departmentHeadId, interviewData) {
    try {
      const { applicationId, startTime, endTime, notes } = interviewData;

      console.log('🔍 Department head scheduling interview:', { applicationId, startTime, endTime, departmentHeadId });

      // Validate input
      if (!applicationId || !startTime) {
        throw new Error('Application ID and interview start time are required');
      }

      // Department head is always the interviewer - force it
      const interviewerId = departmentHeadId;

      // Find the application
      const application = await ApplicationForm.findById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Check for existing non-deleted interview
      const existingInterview = await Interview.findOne({ 
        applicationId: applicationId,
        is_deleted: { $ne: true }
      }).populate('interviewer', 'name email');
      
      if (existingInterview) {
        // Generate interview ID for existing interview
        const existingInterviewId = `INT-${new Date().getFullYear()}-${String(existingInterview._id).slice(-6).toUpperCase()}`;
        
        // Parse the new interview dates
        const newInterviewStart = new Date(startTime);
        const newInterviewEnd = endTime ? new Date(endTime) : new Date(newInterviewStart.getTime() + 60 * 60 * 1000);
        
        if (isNaN(newInterviewStart.getTime())) {
          throw new Error('Invalid interview date format');
        }
        
        // Check if the date/time is different (rescheduling)
        const existingStart = new Date(existingInterview.startTime).getTime();
        const newStart = newInterviewStart.getTime();
        
        if (existingStart !== newStart) {
          console.log('📅 Rescheduling interview from', new Date(existingStart), 'to', newInterviewStart);
          
          // Update the interview - always set interviewer to department head
          existingInterview.startTime = newInterviewStart;
          existingInterview.endTime = newInterviewEnd;
          existingInterview.interviewer = departmentHeadId; // Force department head as interviewer
          await existingInterview.save();
          
          // Re-populate after save
          const updatedInterview = await Interview.findById(existingInterview._id)
            .populate('interviewer', 'name email');
          
          // Send reschedule notification
          try {
            await NotificationService.createInterviewRescheduledNotification(
              application.user,
              applicationId,
              newInterviewStart,
              'Department Head'
            );
            console.log('✅ Interview rescheduled notification sent to applicant:', application.user);
          } catch (notificationError) {
            console.error('⚠️ Failed to send reschedule notification:', notificationError);
          }
          
          return { 
            message: 'Interview rescheduled successfully. Notification sent to applicant.',
            interview: updatedInterview,
            interviewId: existingInterviewId,
            isExisting: true,
            isRescheduled: true,
            interviewDate: updatedInterview.startTime
          };
        } else {
          console.log('📅 Interview already exists with same date, sending reminder');
          
          // Send notification to the applicant about their existing interview
          try {
            await NotificationService.createInterviewReminderNotification(
              application.user,
              applicationId,
              existingInterview.startTime,
              'Department Head'
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
      }

      // Parse the interview date and create start/end times
      const interviewStart = new Date(startTime);
      if (isNaN(interviewStart.getTime())) {
        throw new Error('Invalid start time format');
      }
      
      let interviewEnd;
      if (endTime) {
        interviewEnd = new Date(endTime);
        if (isNaN(interviewEnd.getTime())) {
          throw new Error('Invalid end time format');
        }
      } else {
        // Default to 1 hour after start if no end time provided
        interviewEnd = new Date(interviewStart.getTime() + 60 * 60 * 1000);
      }

      // Create the interview with department head as interviewer
      const interview = new Interview({
        applicationId: applicationId,
        interviewer: departmentHeadId, // Force department head as interviewer
        startTime: interviewStart,
        endTime: interviewEnd,
        notes: notes || 'Scheduled by Department Head'
      });

      await interview.save();

      // Generate interview ID
      const interviewId = `INT-${new Date().getFullYear()}-${String(interview._id).slice(-6).toUpperCase()}`;

      const populatedInterview = await Interview.findById(interview._id)
        .populate('interviewer', 'name email');

      // Send notification to the applicant
      try {
        await NotificationService.createInterviewScheduledNotification(
          application.user,
          applicationId,
          interviewStart,
          'Department Head'
        );
        console.log('✅ Interview scheduled notification sent to applicant:', application.user);
      } catch (notificationError) {
        console.error('⚠️ Failed to send notification:', notificationError);
        // Don't fail the scheduling if notification fails
      }

      console.log('✅ Interview created successfully by Department Head:', {
        interviewId,
        applicationId,
        startTime: interviewStart,
        interviewer: departmentHeadId
      });

      return { 
        message: 'Interview scheduled successfully. Notification sent to applicant.',
        interview: populatedInterview,
        interviewId,
        isExisting: false,
        interviewDate: interviewStart
      };
    } catch (error) {
      console.error('Error scheduling interview for department head:', error);
      throw error;
    }
  }

  static async rescheduleInterviewForDepartmentHead(departmentHeadId, interviewId, rescheduleData) {
    try {
      const { date, time, notes } = rescheduleData;

      console.log('🔄 Department head rescheduling interview:', { interviewId, date, time, departmentHeadId });

      // Validate input
      if (!mongoose.Types.ObjectId.isValid(interviewId)) {
        throw new Error('Invalid interview ID');
      }

      if (!date || !time) {
        throw new Error('Date and time are required');
      }

      // Find the interview
      const interview = await Interview.findById(interviewId)
        .populate('applicationId');
      
      if (!interview) {
        throw new Error('Interview not found');
      }

      // Combine date and time into a proper datetime
      const newDateTime = new Date(`${date}T${time}`);
      if (isNaN(newDateTime.getTime())) {
        throw new Error('Invalid date or time format');
      }

      // Set end time to 1 hour after start time
      const newEndTime = new Date(newDateTime.getTime() + 60 * 60 * 1000);

      // Update the interview - always force department head as interviewer
      const updatedInterview = await Interview.findByIdAndUpdate(
        interviewId,
        {
          startTime: newDateTime,
          endTime: newEndTime,
          interviewer: departmentHeadId, // Force department head as interviewer
          notes: notes || interview.notes,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('applicationId').populate('interviewer', 'name email');

      console.log('✅ Interview rescheduled successfully:', {
        interviewId,
        newDateTime,
        applicationId: interview.applicationId._id
      });

      // Send notification to the applicant about the reschedule
      try {
        await NotificationService.createInterviewRescheduledNotification(
          interview.applicationId.user,
          interview.applicationId._id,
          newDateTime,
          'Department Head'
        );
        console.log('✅ Reschedule notification sent to applicant');
      } catch (notificationError) {
        console.error('⚠️ Failed to send reschedule notification:', notificationError);
        // Don't fail the reschedule if notification fails
      }

      return {
        message: 'Interview rescheduled successfully',
        interview: updatedInterview
      };
    } catch (error) {
      console.error('Error rescheduling interview for department head:', error);
      throw error;
    }
  }

  static async getAllInterviews(queryParams) {
    try {
      const { page = 1, limit = 10, status } = queryParams;
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
      
      return {
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
      };
    } catch (error) {
      console.error('Error getting all interviews:', error);
      throw error;
    }
  }

  static async getInterviewById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid interview ID');
      }
      
      const interview = await Interview.findById(id)
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      
      if (!interview) {
        throw new Error('Interview not found');
      }
      
      return { message: 'Interview retrieved successfully', interview };
    } catch (error) {
      console.error('Error getting interview by ID:', error);
      throw error;
    }
  }

  static async getInterviewByApplicationId(applicationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        throw new Error('Invalid application ID');
      }
      
      const interview = await Interview.findOne({ applicationId: applicationId, is_deleted: { $ne: true } })
        .populate('applicationId', 'firstName lastName status _id user')
        .populate('interviewer', 'name email _id');
      
      if (!interview) {
        return { 
          message: 'No interview scheduled for this application',
          interview: null,
          isScheduled: false
        };
      }

      // Generate interview ID for display
      const interviewId = `INT-${new Date(interview.createdAt).getFullYear()}-${String(interview._id).slice(-6).toUpperCase()}`;
      
      return { 
        message: 'Interview retrieved successfully', 
        interview: {
          ...interview.toObject(),
          interviewId: interviewId
        },
        isScheduled: true
      };
    } catch (error) {
      console.error('Error getting interview by application ID:', error);
      throw error;
    }
  }

  static async getInterviewByUserId(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for this user');
      }
      
      const interview = await Interview.findOne({ applicationId: application._id })
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      
      if (!interview) {
        throw new Error('No interview found for this application');
      }
      
      return { message: 'Interview retrieved successfully', interview };
    } catch (error) {
      console.error('Error getting interview by user ID:', error);
      throw error;
    }
  }

  static async getMyInterview(userId) {
    try {
      // Find user's application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for this user');
      }
      
      // Find the interview for this application
      const interview = await Interview.findOne({ applicationId: application._id })
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      
      // If no interview found, return null (not an error for applicants)
      if (!interview) {
        return { 
          message: 'No interview scheduled yet',
          interview: null 
        };
      }
      
      // Generate interview ID for display
      const interviewId = `INT-${new Date().getFullYear()}-${String(interview._id).slice(-6).toUpperCase()}`;
      
      return {
        message: 'Interview retrieved successfully',
        interview: {
          ...interview.toObject(),
          interviewId: interviewId
        }
      };
    } catch (error) {
      console.error('Error getting my interview:', error);
      throw error;
    }
  }

  static async updateInterviewById(id, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid interview ID');
      }
      
      if (updateData.interviewer && !mongoose.Types.ObjectId.isValid(updateData.interviewer)) {
        throw new Error('Invalid interviewer ID');
      }
      
      if (updateData.startTime && updateData.endTime) {
        const start = new Date(updateData.startTime);
        const end = new Date(updateData.endTime);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid date format');
        }
        
        if (end <= start) {
          throw new Error('End time must be after start time');
        }
      }
      
      const interview = await Interview.findByIdAndUpdate(
        id, 
        { $set: updateData }, 
        { new: true, runValidators: true }
      )
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      
      if (!interview) {
        throw new Error('Interview not found');
      }
      
      return { message: 'Interview updated successfully', interview };
    } catch (error) {
      console.error('Error updating interview by ID:', error);
      throw error;
    }
  }

  static async updateInterviewByUserId(userId, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for this user');
      }
      
      if (updateData.interviewer && !mongoose.Types.ObjectId.isValid(updateData.interviewer)) {
        throw new Error('Invalid interviewer ID');
      }
      
      if (updateData.startTime && updateData.endTime) {
        const start = new Date(updateData.startTime);
        const end = new Date(updateData.endTime);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid date format');
        }
        
        if (end <= start) {
          throw new Error('End time must be after start time');
        }
      }
      
      const interview = await Interview.findOneAndUpdate(
        { applicationId: application._id },
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      
      if (!interview) {
        throw new Error('No interview found for this application');
      }
      
      return { message: 'Interview updated successfully', interview };
    } catch (error) {
      console.error('Error updating interview by user ID:', error);
      throw error;
    }
  }

  static async updateMyInterview(userId, updateData) {
    try {
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for this user');
      }
      
      if (updateData.interviewer && !mongoose.Types.ObjectId.isValid(updateData.interviewer)) {
        throw new Error('Invalid interviewer ID');
      }
      
      if (updateData.startTime && updateData.endTime) {
        const start = new Date(updateData.startTime);
        const end = new Date(updateData.endTime);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid date format');
        }
        
        if (end <= start) {
          throw new Error('End time must be after start time');
        }
      }
      
      const interview = await Interview.findOneAndUpdate(
        { applicationId: application._id },
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      
      if (!interview) {
        throw new Error('No interview found for this application');
      }
      
      return { message: 'Interview updated successfully', interview };
    } catch (error) {
      console.error('Error updating my interview:', error);
      throw error;
    }
  }

  static async updateStartAndEndTime(userId, timeData) {
    try {
      const { startTime, endTime } = timeData;
      
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for this user');
      }
      
      const updateData = {};
      
      if (startTime) {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
          throw new Error('Invalid start time format');
        }
        updateData.startTime = start;
      }
      
      if (endTime) {
        const end = new Date(endTime);
        if (isNaN(end.getTime())) {
          throw new Error('Invalid end time format');
        }
        updateData.endTime = end;
      }
      
      if (startTime && endTime && updateData.endTime <= updateData.startTime) {
        throw new Error('End time must be after start time');
      }
      
      const interview = await Interview.findOneAndUpdate(
        { applicationId: application._id },
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('applicationId', 'firstName lastName status _id')
        .populate('interviewer', 'name _id');
      
      if (!interview) {
        throw new Error('No interview found for this application');
      }
      
      return { message: 'Interview times updated successfully', interview };
    } catch (error) {
      console.error('Error updating start and end time:', error);
      throw error;
    }
  }

  static async deleteInterviewById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid interview ID');
      }
      
      const interview = await Interview.findByIdAndDelete(id);
      if (!interview) {
        throw new Error('Interview not found');
      }
      
      return { message: 'Interview deleted successfully' };
    } catch (error) {
      console.error('Error deleting interview by ID:', error);
      throw error;
    }
  }

  static async deleteInterviewByUserId(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for this user');
      }
      
      const interview = await Interview.findOneAndDelete({ applicationId: application._id });
      if (!interview) {
        throw new Error('No interview found for this application');
      }
      
      return { message: 'Interview deleted successfully' };
    } catch (error) {
      console.error('Error deleting interview by user ID:', error);
      throw error;
    }
  }

  static async deleteMyInterview(userId) {
    try {
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for this user');
      }
      
      const interview = await Interview.findOneAndDelete({ applicationId: application._id });
      if (!interview) {
        throw new Error('No interview found for this application');
      }
      
      return { message: 'Interview deleted successfully' };
    } catch (error) {
      console.error('Error deleting my interview:', error);
      throw error;
    }
  }

  static async getReviewByInterviewId(userId, interviewId) {
    try {
      // Validate interview ID
      if (!mongoose.Types.ObjectId.isValid(interviewId)) {
        throw new Error('Invalid interview ID');
      }

      // Find the interview and verify the user is the interviewer
      const interview = await Interview.findOne({ 
        _id: interviewId, 
        interviewer: userId 
      }).populate('applicationId');

      if (!interview) {
        throw new Error('Interview not found or you are not authorized to view this interview');
      }

      // Get the application form
      const applicationForm = await ApplicationForm.findById(interview.applicationId._id);
      if (!applicationForm) {
        throw new Error('Application form not found');
      }

      // Get the document uploads for the applicant
      const documentUpload = await DocumentUpload.findOne({ user: applicationForm.user });

      return {
        message: 'Review retrieved successfully',
        data: {
          interview,
          applicationForm,
          documentUpload: documentUpload || null
        }
      };
    } catch (error) {
      console.error('Error getting review by interview ID:', error);
      throw error;
    }
  }

  static async getReviewList(userId, queryParams) {
    try {
      const { page = 1, limit = 10 } = queryParams;
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

      return {
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
      };
    } catch (error) {
      console.error('Error getting review list:', error);
      throw error;
    }
  }

  // Soft Delete Methods
  static async softDeleteInterview(interviewId) {
    try {
      const result = await SoftDeleteUtils.softDeleteById(Interview, interviewId);
      return { message: 'Interview soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting interview:', error);
      throw error;
    }
  }

  static async restoreInterview(interviewId) {
    try {
      const result = await SoftDeleteUtils.restoreById(Interview, interviewId);
      return { message: 'Interview restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring interview:', error);
      throw error;
    }
  }

  static async permanentDeleteInterview(interviewId) {
    try {
      const result = await SoftDeleteUtils.permanentDeleteById(Interview, interviewId);
      return { message: 'Interview permanently deleted', data: result };
    } catch (error) {
      console.error('Error permanently deleting interview:', error);
      throw error;
    }
  }

  static async getSoftDeletedInterviews(query = {}) {
    try {
      const deletedInterviews = await Interview.find({ ...query, is_deleted: true })
        .populate('applicationId', 'firstName lastName status _id user')
        .populate('interviewer', 'name email _id')
        .sort({ updatedAt: -1 });
      
      return {
        message: 'Soft-deleted interviews retrieved successfully',
        data: deletedInterviews,
        count: deletedInterviews.length
      };
    } catch (error) {
      console.error('Error getting soft deleted interviews:', error);
      throw error;
    }
  }

  // Mark interview as finished
  static async finishInterview(interviewId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interviewId)) {
        throw new Error('Invalid interview ID');
      }

      const interview = await Interview.findOneAndUpdate(
        { _id: interviewId, is_deleted: { $ne: true } },
        { is_finished: true },
        { new: true }
      )
        .populate('applicationId', 'firstName lastName status _id user')
        .populate('interviewer', 'name email _id');

      if (!interview) {
        throw new Error('Interview not found');
      }

      return {
        success: true,
        message: 'Interview marked as finished',
        data: interview
      };
    } catch (error) {
      console.error('Error finishing interview:', error);
      throw error;
    }
  }

  // Revert interview finished status
  static async revertFinishInterview(interviewId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interviewId)) {
        throw new Error('Invalid interview ID');
      }

      const interview = await Interview.findOneAndUpdate(
        { _id: interviewId, is_deleted: { $ne: true } },
        { is_finished: false },
        { new: true }
      )
        .populate('applicationId', 'firstName lastName status _id user')
        .populate('interviewer', 'name email _id');

      if (!interview) {
        throw new Error('Interview not found');
      }

      return {
        success: true,
        message: 'Interview finish status reverted',
        data: interview
      };
    } catch (error) {
      console.error('Error reverting interview finish status:', error);
      throw error;
    }
  }
}

module.exports = InterviewService;
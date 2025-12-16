const Interview = require('../models/Interview');
const ApplicationForm = require('../models/ApplicationForm');
const DocumentUpload = require('../models/DocumentUpload');
const NotificationService = require('../services/NotificationService');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Role = require('../models/Role');
const Course = require('../models/Course');
const Evaluation = require('../models/Evaluation');
const sendInterviewReminderEmail = require('../utils/sendInterviewReminderEmail');

class InterviewService {
  static async createInterview(userId, interviewData) {
    try {
      const { interviewer, startTime, endTime } = interviewData;

      // Find user's application
      const application = await ApplicationForm.findOne({ user: userId });
      if (!application) {
        throw new Error('No application found for this user');
      }

      // Check for existing interview (exclude soft-deleted)
      const existingInterview = await Interview.findOne({ 
        applicationId: application._id,
        is_deleted: { $ne: true }
      });
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
      const application = await ApplicationForm.findById(applicationId).populate('user');
      if (!application) {
        throw new Error('Application not found');
      }

      // Determine Interview Type and Validate Department Head Logic
      let interviewType = 'OAS';
      const interviewer = await User.findById(actualInterviewerId).populate('role');
      
      if (interviewer && interviewer.role && interviewer.role.name === 'department_head') {
        interviewType = 'DepartmentHead';
        
        // Find Dept Head's Department
        // Check both department_head field in Department AND department field in User
        let deptHeadDepartment = await Department.findOne({ department_head: actualInterviewerId });
        
        if (!deptHeadDepartment) {
          // Fallback: Check if the user has a department assigned to them
          const userWithDept = await User.findById(actualInterviewerId).populate('department');
          if (userWithDept && userWithDept.department) {
            deptHeadDepartment = userWithDept.department;
            // Auto-fix: Update the department to point to this head if it's not set
            if (!deptHeadDepartment.department_head) {
              await Department.findByIdAndUpdate(deptHeadDepartment._id, { department_head: actualInterviewerId });
              console.log(`🔧 Auto-fixed department ${deptHeadDepartment.name}: set department_head to ${actualInterviewerId}`);
            }
          }
        }

        if (!deptHeadDepartment) {
           throw new Error(`Selected interviewer (${interviewer.name}) is a Department Head but is not assigned to lead any department.`);
        }

        // Check Applicant's Course Department
        const applicantUser = await User.findById(application.user._id).populate({
            path: 'course',
            populate: { path: 'departmentId' }
        });

        if (applicantUser.course && applicantUser.course.departmentId) {
            const courseDeptId = applicantUser.course.departmentId._id || applicantUser.course.departmentId;
            if (courseDeptId.toString() === deptHeadDepartment._id.toString()) {
                throw new Error('Applicant cannot be interviewed by the head of their own academic department.');
            }
        }

        // Assign Applicant to this Department - MOVED TO finishInterview
        // applicantUser.assigned_department = deptHeadDepartment._id;
        // await applicantUser.save();
        // console.log(`✅ Assigned applicant ${applicantUser.name} to department ${deptHeadDepartment.name}`);
      }

      // Check for existing non-deleted interview OF THE SAME TYPE
      const existingInterview = await Interview.findOne({ 
        applicationId: applicationId,
        type: interviewType,
        is_deleted: { $ne: true }
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

        // Check for conflicts with other interviews (Rescheduling)
        const targetInterviewerId = interviewerId || existingInterview.interviewer?._id || existingInterview.interviewer;
        const conflictQuery = {
          interviewer: targetInterviewerId,
          is_deleted: { $ne: true },
          _id: { $ne: existingInterview._id },
          $or: [
            { startTime: { $lt: newInterviewEnd }, endTime: { $gt: newInterviewStart } }
          ]
        };
        
        const conflictingInterview = await Interview.findOne(conflictQuery);
        if (conflictingInterview) {
          throw new Error('The selected interviewer is already booked for another interview at this time.');
        }

        // Check for conflicts for the APPLICANT (Rescheduling)
        const applicantConflictQuery = {
          applicationId: applicationId,
          is_deleted: { $ne: true },
          _id: { $ne: existingInterview._id },
          $or: [
            { startTime: { $lt: newInterviewEnd }, endTime: { $gt: newInterviewStart } }
          ]
        };
        
        const conflictingApplicantInterview = await Interview.findOne(applicantConflictQuery);
        if (conflictingApplicantInterview) {
          throw new Error('The applicant already has another interview scheduled at this time.');
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
              interviewType === 'DepartmentHead' ? 'Department Head' : 'OAS Staff'
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
              interviewType === 'DepartmentHead' ? 'Department Head' : 'OAS Staff'
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

      // Check for conflicts with other interviews (New Interview)
      const conflictQuery = {
        interviewer: actualInterviewerId,
        is_deleted: { $ne: true },
        $or: [
          { startTime: { $lt: interviewEnd }, endTime: { $gt: interviewStart } }
        ]
      };
      
      const conflictingInterview = await Interview.findOne(conflictQuery);
      if (conflictingInterview) {
        throw new Error('The selected interviewer is already booked for another interview at this time.');
      }

      // Check for conflicts for the APPLICANT (New Interview)
      const applicantConflictQuery = {
        applicationId: applicationId,
        is_deleted: { $ne: true },
        $or: [
          { startTime: { $lt: interviewEnd }, endTime: { $gt: interviewStart } }
        ]
      };
      
      const conflictingApplicantInterview = await Interview.findOne(applicantConflictQuery);
      if (conflictingApplicantInterview) {
        throw new Error('The applicant already has another interview scheduled at this time.');
      }

      // Create interview with the selected interviewer (or staff member as fallback)
      const interview = new Interview({
        applicationId: applicationId,
        interviewer: actualInterviewerId,
        startTime: interviewStart,
        endTime: interviewEnd,
        type: interviewType,
        is_finished: false
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
          interviewType === 'DepartmentHead' ? 'Department Head' : 'OAS Staff' // scheduledBy
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
        type: 'DepartmentHead',
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
        notes: notes || 'Scheduled by Department Head',
        type: 'DepartmentHead'
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
      // Ensure time has seconds (e.g., "11:00" -> "11:00:00")
      const timeWithSeconds = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
      const newDateTime = new Date(`${date}T${timeWithSeconds}`);
      if (isNaN(newDateTime.getTime())) {
        throw new Error('Invalid date or time format');
      }

      // Set end time to 1 hour after start time
      const newEndTime = new Date(newDateTime.getTime() + 60 * 60 * 1000);
      
      console.log('📅 Reschedule times:', { 
        input: { date, time }, 
        parsed: { startTime: newDateTime.toISOString(), endTime: newEndTime.toISOString() }
      });

      // Validate end time is after start time (do this before update since model validator has issues with findByIdAndUpdate)
      if (newEndTime <= newDateTime) {
        throw new Error('End time must be after start time');
      }

      // Update the interview - always force department head as interviewer
      // Note: runValidators is disabled because the endTime validator uses this.startTime which 
      // refers to the OLD startTime during findByIdAndUpdate, causing false validation failures
      const updatedInterview = await Interview.findByIdAndUpdate(
        interviewId,
        {
          startTime: newDateTime,
          endTime: newEndTime,
          interviewer: departmentHeadId, // Force department head as interviewer
          notes: notes || interview.notes,
          updatedAt: new Date()
        },
        { new: true, runValidators: false }
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
      const query = { is_deleted: { $ne: true } };
      
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
      
      const interview = await Interview.findOne({
        _id: id,
        is_deleted: { $ne: true }
      })
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

  static async getInterviewsByApplicationId(applicationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        throw new Error('Invalid application ID');
      }
      
      const interviews = await Interview.find({ applicationId: applicationId, is_deleted: { $ne: true } })
        .populate('applicationId', 'firstName lastName status _id user')
        .populate('interviewer', 'name email _id');
      
      if (!interviews || interviews.length === 0) {
        return { 
          message: 'No interviews scheduled for this application',
          interviews: [],
          isScheduled: false
        };
      }

      // Format interviews for display
      const formattedInterviews = interviews.map(interview => ({
        ...interview.toObject(),
        interviewId: `INT-${new Date(interview.createdAt).getFullYear()}-${String(interview._id).slice(-6).toUpperCase()}`
      }));

      return { 
        message: 'Interviews retrieved successfully',
        interviews: formattedInterviews,
        isScheduled: true
      };
    } catch (error) {
      console.error('Error getting interviews by application ID:', error);
      throw error;
    }
  }

  static async getInterviewByApplicationId(applicationId) {
    // Legacy support - returns the first interview found (prefer OAS)
    try {
        const result = await this.getInterviewsByApplicationId(applicationId);
        if (result.interviews && result.interviews.length > 0) {
            // Prefer OAS interview if multiple exist
            const oasInterview = result.interviews.find(i => i.type === 'OAS');
            return {
                message: 'Interview retrieved successfully',
                interview: oasInterview || result.interviews[0],
                isScheduled: true
            };
        }
        return { 
            message: 'No interview scheduled for this application',
            interview: null,
            isScheduled: false
        };
    } catch (error) {
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
      
      const interview = await Interview.findOne({ 
        applicationId: application._id,
        is_deleted: { $ne: true }
      })
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
      
      // Find the interview for this application (exclude soft-deleted)
      const interview = await Interview.findOne({ 
        applicationId: application._id,
        is_deleted: { $ne: true }
      })
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

      // Find the interview and verify the user is the interviewer (exclude soft-deleted)
      const interview = await Interview.findOne({ 
        _id: interviewId, 
        interviewer: userId,
        is_deleted: { $ne: true }
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

      // Find all interviews where the logged-in user is the interviewer (exclude soft-deleted)
      const interviews = await Interview.find({ 
        interviewer: userId,
        is_deleted: { $ne: true }
      })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate('applicationId');

      // Get total count for pagination
      const totalDocs = await Interview.countDocuments({ 
        interviewer: userId,
        is_deleted: { $ne: true }
      });

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

      // First find the interview to check the interviewer (exclude soft-deleted)
      const interviewToCheck = await Interview.findOne({
        _id: interviewId,
        is_deleted: { $ne: true }
      }).populate({
        path: 'interviewer',
        populate: { path: 'role' }
      });

      if (!interviewToCheck) {
        throw new Error('Interview not found');
      }

      // Check if interviewer is a Department Head
      if (interviewToCheck.interviewer && interviewToCheck.interviewer.role && interviewToCheck.interviewer.role.name === 'department_head') {
        // Find the department
        const department = await Department.findOne({ department_head: interviewToCheck.interviewer._id });
        
        if (department) {
          // Find the application to get the user
          const application = await ApplicationForm.findById(interviewToCheck.applicationId);
          if (application && application.user) {
            // Update the user's assigned_department
            await User.findByIdAndUpdate(application.user, {
              assigned_department: department._id
            });
            console.log(`✅ Assigned applicant to department ${department.name} after interview finish`);
          }
        }
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

      // Update application status to pending_evaluation and store previous status
      if (interview.applicationId && interview.applicationId._id) {
        const application = await ApplicationForm.findById(interview.applicationId._id);
        if (application && application.status !== 'pending_evaluation') {
          // Store the current status before changing
          application.previousStatus = application.status;
          application.status = 'pending_evaluation';
          await application.save();
          console.log(`✅ Application status changed from '${application.previousStatus}' to 'pending_evaluation'`);
        }
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

      // Revert application status to previous status
      if (interview.applicationId && interview.applicationId._id) {
        const application = await ApplicationForm.findById(interview.applicationId._id);
        if (application && application.status === 'pending_evaluation') {
          // Restore the previous status, default to 'interview_scheduled' if no previous status
          const previousStatus = application.previousStatus || 'interview_scheduled';
          application.status = previousStatus;
          application.previousStatus = null; // Clear the previous status
          await application.save();
          console.log(`✅ Application status reverted from 'pending_evaluation' to '${previousStatus}'`);
        }
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

  /**
   * Get scheduled interviews for department head with pagination
   * @param {string} userId - Department head user ID
   * @param {object} options - Pagination options (page, limit, search)
   * @returns {Promise<object>} Paginated interviews
   */
  static async getInterviewsForDepartmentHead(userId, options = {}) {
    try {
      const { page = 1, limit = 50, search = '' } = options;

      // Find the department head user and get their department
      const user = await User.findById(userId).populate('department');
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.department) {
        throw new Error('Department head has no assigned department');
      }

      const departmentCode = user.department.departmentCode;

      // Build query to find interviews assigned to this department head
      const query = {
        interviewer: userId,
        is_deleted: { $ne: true }
      };

      // If search is provided, find matching applications first
      let applicationIds = [];
      if (search) {
        const users = await User.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { idNumber: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        const userIds = users.map(u => u._id);
        
        const applications = await ApplicationForm.find({
          user: { $in: userIds }
        }).select('_id');
        
        applicationIds = applications.map(app => app._id);
        query.applicationId = { $in: applicationIds };
      }

      // Get total count
      const total = await Interview.countDocuments(query);

      // Get paginated interviews
      const interviews = await Interview.find(query)
        .populate({
          path: 'applicationId',
          select: 'firstName lastName programOfStudyAndYear user status',
          populate: {
            path: 'user',
            select: 'name email idNumber course department',
            populate: [
              {
                path: 'course',
                select: 'courseId name departmentId',
                populate: {
                  path: 'departmentId',
                  select: 'departmentCode name'
                }
              },
              {
                path: 'department',
                select: 'departmentCode name'
              }
            ]
          }
        })
        .populate('interviewer', 'name email')
        .sort({ startTime: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Transform interviews to include applicant name and course
      // Use Promise.all to check for evaluations asynchronously
      const transformedInterviews = await Promise.all(interviews.map(async (interview) => {
        const application = interview.applicationId;
        const user = application?.user;
        
        // Get applicant's department/college from their course
        let applicantDepartment = user?.course?.departmentId?.name || 
                                  user?.department?.name ||
                                  user?.course?.departmentId?.departmentCode ||
                                  user?.department?.departmentCode ||
                                  'N/A';
        
        // If still N/A, try to infer from course name
        if (applicantDepartment === 'N/A') {
          const courseName = user?.course?.name || application?.programOfStudyAndYear || '';
          if (courseName.includes('Tourism') || courseName.includes('Hospitality')) {
            applicantDepartment = 'College of Tourism and Hospitality Management';
          } else if (courseName.includes('Information Technology') || courseName.includes('Computer')) {
            applicantDepartment = 'College of Computer Studies';
          } else if (courseName.includes('Business') || courseName.includes('Accountancy') || courseName.includes('Management')) {
            applicantDepartment = 'College of Business and Accountancy';
          } else if (courseName.includes('Engineering')) {
            applicantDepartment = 'College of Engineering';
          } else if (courseName.includes('Education') || courseName.includes('Teacher')) {
            applicantDepartment = 'College of Education';
          } else if (courseName.includes('Arts') || courseName.includes('Sciences') || courseName.includes('Psychology')) {
            applicantDepartment = 'College of Arts and Sciences';
          } else if (courseName.includes('Nursing') || courseName.includes('Health')) {
            applicantDepartment = 'College of Nursing and Health Sciences';
          } else if (courseName.includes('Architecture')) {
            applicantDepartment = 'College of Architecture and Fine Arts';
          }
        }
        
        // Check if evaluation exists for this applicant (by evaluator - the department head)
        let hasEvaluation = false;
        if (user?._id) {
          const evaluation = await Evaluation.findOne({
            evaluateeUser: user._id,
            evaluator: userId,
            is_deleted: { $ne: true }
          });
          hasEvaluation = !!evaluation;
        }
        
        return {
          _id: interview._id,
          interviewId: `INT-${new Date(interview.createdAt).getFullYear()}-${String(interview._id).slice(-6).toUpperCase()}`,
          applicationId: interview.applicationId,
          interviewer: interview.interviewer,
          type: interview.type,
          startTime: interview.startTime,
          endTime: interview.endTime,
          is_finished: interview.is_finished,
          is_deleted: interview.is_deleted,
          createdAt: interview.createdAt,
          updatedAt: interview.updatedAt,
          applicantName: application ? `${application.firstName} ${application.lastName}` : 'Unknown',
          applicantEmail: user?.email || 'N/A',
          applicantIdNumber: user?.idNumber || 'N/A',
          course: user?.course ? `${user.course.courseId} - ${user.course.name}` : application?.programOfStudyAndYear || 'N/A',
          programOfStudyAndYear: application?.programOfStudyAndYear || 'N/A',
          applicantDepartment: applicantDepartment,
          hasEvaluation: hasEvaluation
        };
      }));

      return {
        interviews: transformedInterviews,
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      };
    } catch (error) {
      console.error('Error getting interviews for department head:', error);
      throw error;
    }
  }

  /**
   * Send interview reminder to applicant (email + in-app notification)
   * @param {string} interviewId - The interview ID
   * @returns {Object} Result with success status
   */
  static async sendInterviewReminder(interviewId) {
    try {
      // Find the interview with all related data
      const interview = await Interview.findById(interviewId)
        .populate('user', 'name email idNumber')
        .populate('interviewer', 'name email')
        .populate('application');

      if (!interview) {
        throw new Error('Interview not found');
      }

      const applicant = interview.user;
      const interviewer = interview.interviewer;
      const application = interview.application;

      if (!applicant || !applicant.email) {
        throw new Error('Applicant email not found');
      }

      // Determine interview type based on interviewer's role
      let interviewType = 'Interview';
      if (interviewer) {
        const interviewerUser = await User.findById(interviewer._id).populate('role');
        if (interviewerUser?.role?.name === 'department_head') {
          interviewType = 'Department Head Interview';
        } else if (interviewerUser?.role?.name === 'oas_staff' || interviewerUser?.role?.name === 'admin') {
          interviewType = 'OAS Staff Interview';
        }
      }

      // Get applicant name from application or user
      const applicantName = application 
        ? `${application.firstName} ${application.lastName}`
        : applicant.name || 'Applicant';

      // Format date for notification message
      const interviewDate = new Date(interview.startTime);
      const formattedDate = interviewDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = interviewDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Send email notification
      let emailSent = false;
      try {
        await sendInterviewReminderEmail(applicant.email, {
          applicantName,
          interviewType,
          interviewerName: interviewer?.name || 'To be confirmed',
          scheduledDate: interview.startTime,
          interviewId: interview.interviewId || interview._id.toString()
        });
        emailSent = true;
        console.log(`📧 Interview reminder email sent to ${applicant.email}`);
      } catch (emailError) {
        console.error('Failed to send email reminder:', emailError);
        // Continue even if email fails - we'll still send in-app notification
      }

      // Send in-app notification
      let notificationSent = false;
      try {
        await NotificationService.createNotification({
          userId: applicant._id,
          type: 'interview_reminder',
          title: `${interviewType} Reminder`,
          message: `This is a reminder for your upcoming ${interviewType.toLowerCase()} scheduled on ${formattedDate} at ${formattedTime}. Please make sure to be available on time.`,
          priority: 'high',
          metadata: {
            interviewId: interview._id,
            applicationId: interview.application?._id,
            scheduledDate: interview.startTime,
            interviewType
          }
        });
        notificationSent = true;
        console.log(`🔔 In-app notification sent to user ${applicant._id}`);
      } catch (notifError) {
        console.error('Failed to send in-app notification:', notifError);
      }

      if (!emailSent && !notificationSent) {
        throw new Error('Failed to send both email and in-app notification');
      }

      return {
        success: true,
        message: `Interview reminder sent successfully${emailSent ? ' (email sent)' : ''}${notificationSent ? ' (notification sent)' : ''}`,
        emailSent,
        notificationSent,
        sentTo: applicant.email,
        interviewType,
        scheduledDate: interview.startTime
      };
    } catch (error) {
      console.error('Error sending interview reminder:', error);
      throw error;
    }
  }
}

module.exports = InterviewService;
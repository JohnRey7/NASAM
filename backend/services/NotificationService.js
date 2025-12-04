const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

// Development mode flag - disabled to always save notifications to database
const DEV_MODE = false;

class NotificationService {
  // Create notification
  static async createNotification(notificationData) {
    try {
      const { userId, type, title, message, priority, metadata } = notificationData;
      
      // In development mode, just log the notification
      if (DEV_MODE) {
        console.log('📧 [DEV MODE] Notification would be created:', {
          userId,
          type,
          title,
          message,
          priority,
          metadata
        });
        return { 
          _id: 'dev-notification-' + Date.now(),
          user: userId,
          type,
          title,
          message,
          priority,
          metadata,
          isRead: false,
          createdAt: new Date()
        };
      }
      
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        priority,
        metadata
      });

      return await notification.save();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  static async getUserNotifications(userId, limit = 20) {
    try {
      return await Notification.find(SoftDeleteUtils.addSoftDeleteFilter({ user: userId }))
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark as read
  static async markAsRead(notificationId, userId) {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    try {
      return await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true }
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Delete notification (soft delete)
  static async deleteNotification(notificationId, userId) {
    try {
      return await SoftDeleteUtils.softDeleteById(Notification, notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete all notifications for a user (soft delete)
  static async deleteAllNotifications(userId) {
    try {
      return await SoftDeleteUtils.softDeleteByQuery(Notification, { user: userId });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  // Create application submitted notification
  static async createApplicationSubmittedNotification(userId, applicationId) {
    try {
      return await NotificationService.createNotification({
        userId: userId,
        type: 'application_submitted',
        title: 'Application Submitted Successfully',
        message: 'Your scholarship application has been submitted successfully and is now under review.',
        priority: 'medium',
        metadata: {
          applicationId: applicationId,
          action: 'application_submitted'
        }
      });
    } catch (error) {
      console.error('Error creating application submitted notification:', error);
      throw error;
    }
  }

  // Create status change notification
  static async createStatusChangeNotification(userId, applicationId, status) {
    try {
      return await NotificationService.createNotification({
        userId: userId,
        type: 'status_change',
        title: 'Application Status Updated',
        message: `Your application status has been updated to: ${status}`,
        priority: 'high',
        metadata: {
          applicationId: applicationId,
          newStatus: status,
          action: 'status_change'
        }
      });
    } catch (error) {
      console.error('Error creating status change notification:', error);
      throw error;
    }
  }

  // Create application deletion notification
  static async createApplicationDeletionNotification(userId, applicationId, message) {
    try {
      return await NotificationService.createNotification({
        userId: userId,
        type: 'application_deleted',
        title: 'Application Removed',
        message: message || 'Your application has been removed by staff.',
        priority: 'high',
        metadata: {
          applicationId: applicationId,
          action: 'application_deleted'
        }
      });
    } catch (error) {
      console.error('Error creating application deletion notification:', error);
      throw error;
    }
  }

  // Create application form verified notification
  static async createApplicationFormVerifiedNotification(userId, applicationId) {
    try {
      return await NotificationService.createNotification({
        userId: userId,
        type: 'form_verified',
        title: 'Application Form Verified',
        message: 'Your application form has been verified. Please proceed to upload required documents.',
        priority: 'medium',
        metadata: {
          applicationId: applicationId,
          action: 'form_verified'
        }
      });
    } catch (error) {
      console.error('Error creating form verified notification:', error);
      throw error;
    }
  }

  // Create all documents verified notification
  static async createAllDocumentsVerifiedNotification(userId, applicationId) {
    try {
      return await NotificationService.createNotification({
        userId: userId,
        type: 'documents_verified',
        title: 'Documents Verified',
        message: 'All your documents have been verified successfully.',
        priority: 'medium',
        metadata: {
          applicationId: applicationId,
          action: 'documents_verified'
        }
      });
    } catch (error) {
      console.error('Error creating documents verified notification:', error);
      throw error;
    }
  }

  // Create personality test available notification
  static async createPersonalityTestAvailableNotification(userId, applicationId) {
    try {
      return await NotificationService.createNotification({
        userId: userId,
        type: 'personality_test_available',
        title: 'Personality Test Available',
        message: 'Your personality test is now available. Please complete it to proceed with your application.',
        priority: 'high',
        metadata: {
          applicationId: applicationId,
          action: 'personality_test_available'
        }
      });
    } catch (error) {
      console.error('Error creating personality test notification:', error);
      throw error;
    }
  }

  // Create message notification
  static async createMessageNotification(receiverId, senderId, messageText, conversationId) {
    try {
      // Get sender info
      const sender = await User.findById(senderId).select('name email idNumber');
      const senderName = sender?.name || sender?.email || sender?.idNumber || 'Someone';
      
      // Truncate message preview
      const messagePreview = messageText.length > 50 
        ? messageText.substring(0, 50) + '...' 
        : messageText;

      return await NotificationService.createNotification({
        userId: receiverId,
        type: 'new_message',
        title: `New message from ${senderName}`,
        message: messagePreview,
        priority: 'medium',
        metadata: {
          senderId: senderId,
          conversationId: conversationId,
          action: 'new_message'
        }
      });
    } catch (error) {
      console.error('Error creating message notification:', error);
      throw error;
    }
  }

  // Create interview reminder notification
  static async createInterviewReminderNotification(userId, applicationId, interviewDate, scheduledBy = 'Staff') {
    try {
      const formattedDate = new Date(interviewDate).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short'
      });

      return await NotificationService.createNotification({
        userId: userId,
        type: 'interview_reminder',
        title: 'Interview Reminder',
        message: `You have an interview scheduled on ${formattedDate}. Please be prepared.`,
        priority: 'high',
        metadata: {
          applicationId: applicationId,
          interviewDate: interviewDate,
          scheduledBy: scheduledBy,
          action: 'interview_reminder'
        }
      });
    } catch (error) {
      console.error('Error creating interview reminder notification:', error);
      throw error;
    }
  }

  // Create interview scheduled notification
  static async createInterviewScheduledNotification(userId, applicationId, interviewDate, scheduledBy = 'Staff') {
    try {
      const formattedDate = new Date(interviewDate).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short'
      });

      return await NotificationService.createNotification({
        userId: userId,
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: `Your interview has been scheduled for ${formattedDate}. Please be prepared and arrive on time.`,
        priority: 'high',
        metadata: {
          applicationId: applicationId,
          interviewDate: interviewDate,
          scheduledBy: scheduledBy,
          action: 'interview_scheduled'
        }
      });
    } catch (error) {
      console.error('Error creating interview scheduled notification:', error);
      throw error;
    }
  }

  // Create interview rescheduled notification
  static async createInterviewRescheduledNotification(userId, applicationId, newInterviewDate, scheduledBy = 'Staff') {
    try {
      const formattedDate = new Date(newInterviewDate).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short'
      });

      return await NotificationService.createNotification({
        userId: userId,
        type: 'interview_rescheduled',
        title: 'Interview Rescheduled',
        message: `Your interview has been rescheduled to ${formattedDate}. Please mark your calendar.`,
        priority: 'high',
        metadata: {
          applicationId: applicationId,
          interviewDate: newInterviewDate,
          scheduledBy: scheduledBy,
          action: 'interview_rescheduled'
        }
      });
    } catch (error) {
      console.error('Error creating interview rescheduled notification:', error);
      throw error;
    }
  }

  // Create scholarship approved notification
  static async createScholarshipApprovedNotification(userId, applicationId, scholarName) {
    try {
      return await NotificationService.createNotification({
        userId: userId,
        type: 'scholarship_approved',
        title: 'Congratulations! Scholarship Approved',
        message: `Congratulations ${scholarName || ''}! Your scholarship application has been approved. Welcome to the NAS program.`,
        priority: 'urgent',
        metadata: {
          applicationId: applicationId,
          action: 'scholarship_approved'
        }
      });
    } catch (error) {
      console.error('Error creating scholarship approved notification:', error);
      throw error;
    }
  }

  // Create scholarship rejected notification
  static async createScholarshipRejectedNotification(userId, applicationId, reason) {
    try {
      return await NotificationService.createNotification({
        userId: userId,
        type: 'scholarship_rejected',
        title: 'Scholarship Application Update',
        message: reason || 'We regret to inform you that your scholarship application was not approved at this time. Thank you for your interest.',
        priority: 'high',
        metadata: {
          applicationId: applicationId,
          action: 'scholarship_rejected'
        }
      });
    } catch (error) {
      console.error('Error creating scholarship rejected notification:', error);
      throw error;
    }
  }

  // Create evaluation submitted notification (for scholar after department head evaluates)
  static async createEvaluationSubmittedNotification(userId, applicationId, evaluatorName, ratingPeriod) {
    try {
      return await NotificationService.createNotification({
        userId: userId,
        type: 'evaluation_submitted',
        title: 'Evaluation Submitted',
        message: `Your evaluation for ${ratingPeriod} has been submitted by ${evaluatorName || 'your department head'}.`,
        priority: 'medium',
        metadata: {
          applicationId: applicationId,
          ratingPeriod: ratingPeriod,
          action: 'evaluation_submitted'
        }
      });
    } catch (error) {
      console.error('Error creating evaluation submitted notification:', error);
      throw error;
    }
  }

  // Soft Delete Methods
  static async softDeleteNotification(notificationId) {
    try {
      const result = await SoftDeleteUtils.softDeleteById(Notification, notificationId);
      return { message: 'Notification soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting notification:', error);
      throw error;
    }
  }

  static async restoreNotification(notificationId) {
    try {
      const result = await SoftDeleteUtils.restoreById(Notification, notificationId);
      return { message: 'Notification restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring notification:', error);
      throw error;
    }
  }

  static async permanentDeleteNotification(notificationId) {
    try {
      const result = await SoftDeleteUtils.permanentDeleteById(Notification, notificationId);
      return { message: 'Notification permanently deleted', data: result };
    } catch (error) {
      console.error('Error permanently deleting notification:', error);
      throw error;
    }
  }

  static async getSoftDeletedNotifications(query = {}) {
    try {
      return await SoftDeleteUtils.getSoftDeleted(Notification, query);
    } catch (error) {
      console.error('Error getting soft deleted notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;

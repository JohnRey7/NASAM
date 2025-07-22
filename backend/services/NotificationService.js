const Notification = require('../models/Notification');

class NotificationService {
  // Create notification when application is submitted
  static async createApplicationSubmittedNotification(userId, applicationId) {
    try {
      const notification = new Notification({
        user: userId,  // ✅ Changed from userId to user
        type: 'application_submitted',
        title: 'Application Submitted Successfully',
        message: 'Your scholarship application has been submitted and is being reviewed.',
        metadata: { applicationId }
      });

      return await notification.save();
    } catch (error) {
      console.error('Error creating application submitted notification:', error);
      throw error;
    }
  }

  // Create notification for status changes
  static async createStatusChangeNotification(userId, applicationId, newStatus) {
    const statusMessages = {
      'Under Review': 'Your application is now under review by our team.',
      'Document Verification': 'Your documents are being verified.',
      'Interview Scheduled': 'An interview has been scheduled for your application.',
      'Approved': 'Congratulations! Your scholarship application has been approved.',
      'Rejected': 'Your application has been reviewed. Please check your dashboard for details.'
    };

    const notification = new Notification({
      userId,
      applicationId,
      type: 'status_change',
      title: `Application Status: ${newStatus}`,
      message: statusMessages[newStatus] || `Your application status has been updated to ${newStatus}.`,
      priority: newStatus === 'Approved' ? 'high' : newStatus === 'Rejected' ? 'urgent' : 'medium'
    });

    return await notification.save();
  }

  // Document upload notification
  static async createDocumentUploadedNotification(userId, applicationId, documentTypes) {
    console.log('NotificationService: Creating document notification');
    console.log('UserID:', userId);
    console.log('ApplicationID:', applicationId);
    console.log('Document types:', documentTypes);
    
    const documentList = Array.isArray(documentTypes) ? documentTypes.join(', ') : documentTypes;
    
    const notification = new Notification({
      userId,
      applicationId,
      type: 'document_uploaded',
      title: 'Documents Uploaded Successfully',
      message: `Your documents (${documentList}) have been uploaded and are being reviewed.`,
      priority: 'medium'
    });

    const saved = await notification.save();
    console.log('Notification saved:', saved._id);
    return saved;
  }

  // New method for single document upload notification
  static async createDocumentUploadedNotification(userId, applicationId) {
    try {
      const notification = new Notification({
        user: userId,  // ✅ Make sure user field is set
        type: 'document_uploaded',
        title: 'Document Uploaded Successfully',
        message: 'Your document has been uploaded and is awaiting verification.',
        metadata: { applicationId }
      });

      return await notification.save();
    } catch (error) {
      console.error('Error creating document uploaded notification:', error);
      throw error;
    }
  }

  // Personality test notifications
  static async createPersonalityTestNotification(userId, applicationId, action) {
    const messages = {
      'started': 'You have started the personality assessment.',
      'completed': 'Your personality assessment has been completed successfully.',
      'results_ready': 'Your personality assessment results are now available.'
    };

    const titles = {
      'started': 'Personality Assessment Started',
      'completed': 'Personality Assessment Completed',
      'results_ready': 'Assessment Results Ready'
    };

    const notification = new Notification({
      userId,
      applicationId,
      type: 'personality_test',
      title: titles[action] || 'Personality Assessment Update',
      message: messages[action] || `Personality assessment update: ${action}`,
      priority: action === 'completed' ? 'medium' : 'low'
    });

    return await notification.save();
  }

  // Document verification notification (for admin use)
  static async createDocumentVerifiedNotification(userId, applicationId, documentType, status) {
    const messages = {
      'verified': `Your ${documentType} has been verified and approved.`,
      'rejected': `Your ${documentType} needs to be re-uploaded. Please check the requirements.`,
      'pending': `Your ${documentType} is currently under review.`
    };

    const notification = new Notification({
      userId,
      applicationId,
      type: 'document_verification',
      title: `Document ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: messages[status] || `Document update for ${documentType}`,
      priority: status === 'rejected' ? 'high' : 'medium'
    });

    return await notification.save();
  }

  // Get user notifications
  static async getUserNotifications(userId, limit = 20) {
    try {
      return await Notification.find({ user: userId })  // ✅ Changed from userId to user
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },  // ✅ Changed from userId to user
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({ 
        user: userId,  // ✅ Changed from userId to user
        isRead: false 
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // ✅ 1. APPLICATION FORM NOTIFICATIONS
  static async createApplicationFormSubmittedNotification(userId, applicationId) {
    const notification = new Notification({
      userId,
      applicationId,
      type: 'application_form_submitted',
      title: '🎉 Application Form Submitted Successfully',
      message: 'Your scholarship application form has been successfully submitted and is now awaiting review by OAS staff. You will be notified once it has been reviewed.',
      priority: 'medium'
    });

    console.log('✅ Creating application form submitted notification for user:', userId);
    return await notification.save();
  }

  static async createApplicationFormVerifiedNotification(userId, applicationId) {
    try {
      const notification = new Notification({
        user: userId,  // ✅ Changed from userId to user
        type: 'application_form_verified',
        title: 'Application Form Verified',
        message: 'Your application form has been verified. Please upload your required documents.',
        metadata: { applicationId }
      });

      return await notification.save();
    } catch (error) {
      console.error('Error creating form verified notification:', error);
      throw error;
    }
  }

  // ✅ 2. ENHANCED DOCUMENT NOTIFICATIONS
  static async createDocumentsSubmittedNotification(userId, applicationId, documentCount = 0) {
    const notification = new Notification({
      userId,
      applicationId,
      type: 'documents_submitted',
      title: '📎 Documents Uploaded Successfully',
      message: `Your required documents (${documentCount} files) have been successfully uploaded and are now pending review by OAS staff. We'll notify you once they're verified.`,
      priority: 'medium'
    });

    console.log('✅ Creating documents submitted notification for user:', userId);
    return await notification.save();
  }

  static async createAllDocumentsVerifiedNotification(userId, applicationId) {
    try {
      const notification = new Notification({
        user: userId,  // ✅ Changed from userId to user
        type: 'documents_verified',
        title: 'Documents Verified',
        message: 'All your documents have been verified successfully.',
        metadata: { applicationId }
      });

      return await notification.save();
    } catch (error) {
      console.error('Error creating documents verified notification:', error);
      throw error;
    }
  }

  // ✅ 3. ENHANCED PERSONALITY TEST NOTIFICATIONS
  static async createPersonalityTestAvailableNotification(userId, applicationId) {
    try {
      const notification = new Notification({
        user: userId,  // ✅ Changed from userId to user
        type: 'personality_test_available',
        title: 'Personality Test Available',
        message: 'Your personality test is now available. Please complete it within 7 days.',
        metadata: { applicationId }
      });

      return await notification.save();
    } catch (error) {
      console.error('Error creating personality test notification:', error);
      throw error;
    }
  }

  static async createPersonalityTestCompletedNotification(userId, applicationId) {
    const notification = new Notification({
      userId,
      applicationId,
      type: 'personality_test_completed',
      title: '🎯 Personality Assessment Completed',
      message: 'Your personality assessment has been completed successfully! Your results are being processed and will be reviewed by our team.',
      priority: 'medium'
    });

    console.log('✅ Creating personality test completed notification for user:', userId);
    return await notification.save();
  }

  // ✅ 4. PROGRESS UPDATE NOTIFICATIONS
  static async createProgressUpdateNotification(userId, applicationId, stage, status) {
    const stageMessages = {
      'application_form': {
        'pending': 'Your application form is waiting for OAS staff review.',
        'completed': 'Your application form has been approved! Next step: Upload documents.'
      },
      'documents': {
        'pending': 'Your documents are being reviewed by OAS staff.',
        'completed': 'Your documents have been approved! Next step: Personality assessment.'
      },
      'personality_test': {
        'pending': 'Your personality assessment is ready to be taken.',
        'completed': 'Your personality assessment is complete! Awaiting final review.'
      }
    };

    const stageIcons = {
      'application_form': status === 'completed' ? '✅' : '⏳',
      'documents': status === 'completed' ? '📄' : '📎',
      'personality_test': status === 'completed' ? '🎯' : '🧠'
    };

    const notification = new Notification({
      userId,
      applicationId,
      type: 'progress_update',
      title: `${stageIcons[stage]} ${stage.replace('_', ' ').toUpperCase()} - ${status.toUpperCase()}`,
      message: stageMessages[stage][status] || `Your ${stage} status has been updated to ${status}.`,
      priority: status === 'completed' ? 'medium' : 'low'
    });

    return await notification.save();
  }

  // ✅ 5. GENERIC CREATE NOTIFICATION METHOD
  static async createNotification({
    userId,
    applicationId = null,
    type,
    title,
    message,
    priority = 'medium',
    metadata = {}
  }) {
    try {
      const notification = new Notification({
        userId,
        applicationId,
        type,
        title,
        message,
        priority,
        metadata,
        isRead: false
      });

      const saved = await notification.save();
      console.log('✅ Generic notification created:', { userId, type, title });
      return saved;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      return await Notification.updateMany(
        { user: userId, isRead: false },  // ✅ Changed from userId to user
        { isRead: true }
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Delete single notification
  static async deleteNotification(notificationId, userId) {
    try {
      return await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId  // ✅ Changed from userId to user
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete all notifications for user
  static async deleteAllNotifications(userId) {
    try {
      const result = await Notification.deleteMany({
        userId: userId
      });
      
      console.log(`✅ Deleted ${result.deletedCount} notifications for user:`, userId);
      return result;
    } catch (error) {
      console.error('❌ Error deleting all notifications:', error);
      throw error;
    }
  }

  // Delete old notifications (cleanup utility)
  static async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      console.log(`✅ Deleted ${result.deletedCount} old notifications older than ${daysOld} days`);
      return result;
    } catch (error) {
      console.error('❌ Error deleting old notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
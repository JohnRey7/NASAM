const Notification = require('../models/Notification');

class NotificationService {
  
  // Create notification when application is submitted
  static async createApplicationSubmittedNotification(userId, applicationId) {
    const notification = new Notification({
      userId,
      applicationId,
      type: 'application_submitted',
      title: 'Application Submitted Successfully',
      message: 'Your scholarship application has been submitted and is being reviewed.',
      priority: 'medium'
    });

    return await notification.save();
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
    return await Notification.find({ userId })
      .populate('applicationId', 'firstName lastName applicationNumber')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  static async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  static async getUnreadCount(userId) {
    return await Notification.countDocuments({ userId, isRead: false });
  }
}

module.exports = NotificationService;
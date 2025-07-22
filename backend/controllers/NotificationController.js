const NotificationService = require('../services/NotificationService');

const NotificationController = {
  // Create notification (for admin/system use)
  async createNotification(req, res) {
    try {
      const { userId, type, title, message, priority, metadata } = req.body;
      
      const notification = await NotificationService.createNotification({
        userId,
        type,
        title,
        message,
        priority,
        metadata
      });

      res.json({
        success: true,
        notification
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: error.message
      });
    }
  },

  // Get user notifications
  async getUserNotifications(req, res) {
    try {
      const notifications = await NotificationService.getUserNotifications(req.user.id);
      res.json({
        success: true,
        notifications: notifications
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  },

  // Mark single notification as read
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      await NotificationService.markAsRead(notificationId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      await NotificationService.markAllAsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all as read:', error);
      res.status(500).json({ success: false });
    }
  },

  // Delete single notification
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      await NotificationService.deleteNotification(notificationId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ success: false });
    }
  },

  // Delete all notifications (newly added method)
  async deleteAllNotifications(req, res) {
    try {
      const Notification = require('../models/Notification');
      await Notification.deleteMany({ user: req.user.id });
      res.json({ 
        success: true, 
        message: 'All notifications deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete notifications' 
      });
    }
  }
};

module.exports = NotificationController;
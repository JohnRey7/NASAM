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
      await NotificationService.deleteAllNotifications(req.user.id);
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
  },

  // Soft delete a notification
  async softDeleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const result = await NotificationService.softDeleteNotification(notificationId);
      
      res.json(result);
    } catch (error) {
      console.error('Error in softDeleteNotification:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Restore a soft-deleted notification
  async restoreNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const result = await NotificationService.restoreNotification(notificationId);
      
      res.json(result);
    } catch (error) {
      console.error('Error in restoreNotification:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Permanently delete a notification
  async permanentDeleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const result = await NotificationService.permanentDeleteNotification(notificationId);
      
      res.json(result);
    } catch (error) {
      console.error('Error in permanentDeleteNotification:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get soft-deleted notifications
  async getSoftDeletedNotifications(req, res) {
    try {
      const result = await NotificationService.getSoftDeletedNotifications(req.query);
      
      res.json(result);
    } catch (error) {
      console.error('Error in getSoftDeletedNotifications:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = NotificationController;
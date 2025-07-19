const NotificationService = require('../services/NotificationService');

const NotificationController = {
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;
      
      const notifications = await NotificationService.getUserNotifications(userId, limit);
      const unreadCount = await NotificationService.getUnreadCount(userId);
      
      res.json({
        notifications,
        unreadCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      // For now, just return success
      res.json({ message: 'Notification marked as read', id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      
      // Import Notification model
      const Notification = require('../models/Notification');
      
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
      
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all as read:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = NotificationController;
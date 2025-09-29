const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

class NotificationService {
  // Create notification
  static async createNotification(notificationData) {
    try {
      const { userId, type, title, message, priority, metadata } = notificationData;
      
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

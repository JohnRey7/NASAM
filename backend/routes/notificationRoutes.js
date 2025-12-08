const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const authenticate = require('../middleware/authenticate');

router.post('/', authenticate, NotificationController.createNotification);
router.get('/', authenticate, NotificationController.getUserNotifications);
router.patch('/:notificationId/read', authenticate, NotificationController.markAsRead);
router.patch('/mark-all-read', authenticate, NotificationController.markAllAsRead);
router.delete('/:notificationId', authenticate, NotificationController.deleteNotification);
router.delete('/', authenticate, NotificationController.deleteAllNotifications);

// Soft delete routes for notifications
router.delete('/:notificationId/soft', authenticate, NotificationController.softDeleteNotification);
router.put('/:notificationId/restore', authenticate, NotificationController.restoreNotification);
router.delete('/:notificationId/permanent', authenticate, NotificationController.permanentDeleteNotification);
router.get('/deleted', authenticate, NotificationController.getSoftDeletedNotifications);

module.exports = router;

const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');
const authenticate = require('../middleware/authenticate');

router.post('/conversation/start', authenticate, MessageController.startConversation);
router.post('/send', authenticate, MessageController.sendMessage);
router.get('/conversations', authenticate, MessageController.getUserConversations);
router.get('/conversation/:conversationId', authenticate, MessageController.getConversationMessages);
router.get('/conversation/application/:applicationId', authenticate, MessageController.getConversationByApplication);
router.patch('/conversation/:conversationId/read', authenticate, MessageController.markAsRead);
router.patch('/conversation/:conversationId/archive', authenticate, MessageController.toggleArchive);
router.get('/unread-count', authenticate, MessageController.getUnreadCount);
router.get('/search', authenticate, MessageController.searchConversations);
router.delete('/:messageId', authenticate, MessageController.deleteMessage);

module.exports = router;

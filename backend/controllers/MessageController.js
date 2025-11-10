// controllers/MessageController.js
const MessageService = require('../services/MessageService');
const AuditLogService = require('../services/AuditLogService');

class MessageController {
  /**
   * Start or get existing conversation
   * POST /api/messages/conversation/start
   */
  static async startConversation(req, res) {
    try {
      console.log('📥 Start conversation request received');
      console.log('📥 Request body:', req.body);
      console.log('📥 User:', req.user);
      
      const { receiverId, applicationId, conversationType } = req.body;
      
      if (!req.user) {
        console.error('❌ No user in request - authentication failed');
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const senderId = req.user.id; // authenticate middleware sets req.user.id, not _id
      console.log('📥 Sender ID:', senderId);
      console.log('📥 Receiver ID:', receiverId);

      if (!receiverId) {
        return res.status(400).json({ error: 'Receiver ID is required' });
      }

      console.log('🔄 Creating/getting conversation...');
      const conversation = await MessageService.getOrCreateConversation(
        senderId,
        receiverId,
        applicationId || null,
        conversationType || 'general'
      );
      console.log('✅ Conversation created/retrieved:', conversation._id);

      // Log audit
      await AuditLogService.createLog({
        userId: senderId,
        action: 'conversation.start',
        module: 'Messaging'
      });

      res.status(200).json(conversation);
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Send a message
   * POST /api/messages/send
   */
  static async sendMessage(req, res) {
    try {
      const { conversationId, receiverId, message, attachments } = req.body;
      const senderId = req.user.id;

      if (!conversationId || !receiverId || !message) {
        return res.status(400).json({ 
          error: 'Conversation ID, receiver ID, and message are required' 
        });
      }

      const newMessage = await MessageService.sendMessage(
        senderId,
        receiverId,
        conversationId,
        message,
        attachments || []
      );

      // Log audit
      await AuditLogService.createLog({
        userId: senderId,
        action: 'message.send',
        module: 'Messaging'
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get conversation messages
   * GET /api/messages/conversation/:conversationId
   */
  static async getConversationMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const { limit = 50, skip = 0 } = req.query;

      const messages = await MessageService.getConversationMessages(
        conversationId,
        userId,
        parseInt(limit),
        parseInt(skip)
      );

      res.status(200).json(messages);
    } catch (error) {
      console.error('❌ Error getting conversation messages:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all conversations for current user
   * GET /api/messages/conversations
   */
  static async getUserConversations(req, res) {
    try {
      const userId = req.user.id;
      const { includeArchived } = req.query;

      const conversations = await MessageService.getUserConversations(
        userId,
        includeArchived === 'true'
      );

      res.status(200).json(conversations);
    } catch (error) {
      console.error('❌ Error getting user conversations:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mark messages as read
   * PATCH /api/messages/conversation/:conversationId/read
   */
  static async markAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      await MessageService.markMessagesAsRead(conversationId, userId);

      res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get unread message count
   * GET /api/messages/unread-count
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await MessageService.getUnreadCount(userId);

      res.status(200).json({ count });
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Search conversations
   * GET /api/messages/search?q=searchTerm
   */
  static async searchConversations(req, res) {
    try {
      const userId = req.user.id;
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Search term is required' });
      }

      const conversations = await MessageService.searchConversations(userId, q);

      res.status(200).json(conversations);
    } catch (error) {
      console.error('❌ Error searching conversations:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Archive/Unarchive conversation
   * PATCH /api/messages/conversation/:conversationId/archive
   */
  static async toggleArchive(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const conversation = await MessageService.toggleArchiveConversation(
        conversationId,
        userId
      );

      // Log audit
      await AuditLogService.createLog({
        userId: userId,
        action: conversation.archived ? 'conversation.archive' : 'conversation.unarchive',
        module: 'Messaging'
      });

      res.status(200).json(conversation);
    } catch (error) {
      console.error('❌ Error toggling archive:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete message for user
   * DELETE /api/messages/:messageId
   */
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      await MessageService.deleteMessageForUser(messageId, userId);

      // Log audit
      await AuditLogService.createLog({
        userId: userId,
        action: 'message.delete',
        module: 'Messaging'
      });

      res.status(200).json({ success: true, message: 'Message deleted' });
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get conversation by application ID
   * GET /api/messages/conversation/application/:applicationId
   */
  static async getConversationByApplication(req, res) {
    try {
      const { applicationId } = req.params;
      const userId = req.user.id;

      const conversation = await MessageService.getConversationByApplication(
        applicationId,
        userId
      );

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.status(200).json(conversation);
    } catch (error) {
      console.error('❌ Error getting conversation by application:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MessageController;

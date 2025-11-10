// services/MessageService.js
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const NotificationService = require('./NotificationService');

class MessageService {
  /**
   * Create or get existing conversation between two users
   */
  static async getOrCreateConversation(user1Id, user2Id, applicationId = null, conversationType = 'general') {
    try {
      console.log('🔍 getOrCreateConversation called with:', { user1Id, user2Id, applicationId, conversationType });
      
      // Validate inputs
      if (!user1Id) {
        throw new Error('user1Id (senderId) is required');
      }
      if (!user2Id) {
        throw new Error('user2Id (receiverId) is required');
      }
      
      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        participants: { $all: [user1Id, user2Id] },
        applicationId: applicationId
      }).populate('participants', 'name email idNumber role');

      if (!conversation) {
        console.log('📝 Creating new conversation...');
        // Create new conversation
        const user1IdStr = user1Id.toString();
        const user2IdStr = user2Id.toString();
        console.log('🔑 User IDs as strings:', { user1IdStr, user2IdStr });
        
        conversation = new Conversation({
          participants: [user1Id, user2Id],
          applicationId,
          conversationType,
          unreadCount: new Map([
            [user1IdStr, 0],
            [user2IdStr, 0]
          ])
        });
        await conversation.save();
        await conversation.populate('participants', 'name email idNumber role');
        console.log('✅ New conversation created:', conversation._id);
      } else {
        console.log('✅ Existing conversation found:', conversation._id);
      }

      return conversation;
    } catch (error) {
      console.error('❌ Error in getOrCreateConversation:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(senderId, receiverId, conversationId, messageText, attachments = []) {
    try {
      // Create message
      const message = new Message({
        conversationId,
        senderId,
        receiverId,
        message: messageText,
        attachments,
        timestamp: new Date()
      });

      await message.save();

      // Update conversation
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.lastMessage = messageText.substring(0, 100); // First 100 chars
        conversation.lastMessageTime = new Date();
        
        // Increment unread count for receiver
        await conversation.incrementUnread(receiverId);
      }

      // Populate sender and receiver info
      await message.populate([
        { path: 'senderId', select: 'name email idNumber role' },
        { path: 'receiverId', select: 'name email idNumber role' }
      ]);

      // Send notification to receiver
      await NotificationService.createMessageNotification(
        receiverId,
        senderId,
        messageText,
        conversationId
      );

      return message;
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      throw error;
    }
  }

  /**
   * Get all messages in a conversation
   */
  static async getConversationMessages(conversationId, userId, limit = 50, skip = 0) {
    try {
      const messages = await Message.find({
        conversationId,
        deleted: false,
        deletedBy: { $ne: userId }
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .populate('senderId', 'name email idNumber role')
        .populate('receiverId', 'name email idNumber role');

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('❌ Error in getConversationMessages:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId, includeArchived = false) {
    try {
      const filter = {
        participants: userId
      };

      if (!includeArchived) {
        filter.archived = false;
      }

      const conversations = await Conversation.find(filter)
        .sort({ lastMessageTime: -1 })
        .populate('participants', 'name email idNumber role')
        .populate('applicationId', 'personalInfo.firstName personalInfo.lastName idNumber');

      // Format conversations with unread count for current user
      const formattedConversations = conversations.map(conv => {
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== userId.toString()
        );

        return {
          _id: conv._id,
          conversationType: conv.conversationType,
          otherParticipant,
          applicationId: conv.applicationId,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount.get(userId.toString()) || 0,
          archived: conv.archived,
          createdAt: conv.createdAt
        };
      });

      return formattedConversations;
    } catch (error) {
      console.error('❌ Error in getUserConversations:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId, userId) {
    try {
      // Mark all unread messages in conversation as read
      await Message.updateMany(
        {
          conversationId,
          receiverId: userId,
          read: false
        },
        {
          read: true,
          readAt: new Date()
        }
      );

      // Reset unread count in conversation
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        await conversation.resetUnread(userId);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error in markMessagesAsRead:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for user
   */
  static async getUnreadCount(userId) {
    try {
      const count = await Message.countDocuments({
        receiverId: userId,
        read: false,
        deleted: false,
        deletedBy: { $ne: userId }
      });

      return count;
    } catch (error) {
      console.error('❌ Error in getUnreadCount:', error);
      throw error;
    }
  }

  /**
   * Search conversations
   */
  static async searchConversations(userId, searchTerm) {
    try {
      // Search in messages
      const messages = await Message.find({
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ],
        message: { $regex: searchTerm, $options: 'i' },
        deleted: false,
        deletedBy: { $ne: userId }
      })
        .select('conversationId')
        .distinct('conversationId');

      // Get conversations
      const conversations = await Conversation.find({
        _id: { $in: messages },
        participants: userId
      })
        .sort({ lastMessageTime: -1 })
        .populate('participants', 'name email idNumber role')
        .populate('applicationId', 'personalInfo.firstName personalInfo.lastName idNumber');

      return conversations;
    } catch (error) {
      console.error('❌ Error in searchConversations:', error);
      throw error;
    }
  }

  /**
   * Archive/Unarchive conversation
   */
  static async toggleArchiveConversation(conversationId, userId) {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.archived = !conversation.archived;
      await conversation.save();

      return conversation;
    } catch (error) {
      console.error('❌ Error in toggleArchiveConversation:', error);
      throw error;
    }
  }

  /**
   * Delete message for user
   */
  static async deleteMessageForUser(messageId, userId) {
    try {
      const message = await Message.findById(messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }

      await message.deleteForUser(userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in deleteMessageForUser:', error);
      throw error;
    }
  }

  /**
   * Get conversation by application ID
   */
  static async getConversationByApplication(applicationId, userId) {
    try {
      const conversation = await Conversation.findOne({
        applicationId,
        participants: userId
      })
        .populate('participants', 'name email idNumber role')
        .populate('applicationId', 'personalInfo.firstName personalInfo.lastName idNumber');

      return conversation;
    } catch (error) {
      console.error('❌ Error in getConversationByApplication:', error);
      throw error;
    }
  }
}

module.exports = MessageService;

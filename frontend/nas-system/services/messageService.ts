// services/messageService.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface User {
  _id: string;
  name?: string;
  email?: string;
  idNumber?: string;
  role?: {
    _id: string;
    name: string;
  };
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  receiverId: User;
  message: string;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    uploadedAt: Date;
  }>;
  read: boolean;
  readAt?: Date;
  deleted: boolean;
  deletedBy: string[];
  edited: boolean;
  editedAt?: Date;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  _id: string;
  conversationType: 'admin-applicant' | 'admin-department-head' | 'general';
  otherParticipant: User;
  applicationId?: {
    _id: string;
    personalInfo?: {
      firstName: string;
      lastName: string;
    };
    idNumber?: string;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  archived: boolean;
  createdAt: Date;
}

export interface StartConversationRequest {
  receiverId: string;
  applicationId?: string;
  conversationType?: 'admin-applicant' | 'admin-department-head' | 'general';
}

export interface SendMessageRequest {
  conversationId: string;
  receiverId: string;
  message: string;
  attachments?: Array<any>;
}

class MessageService {
  /**
   * Start or get existing conversation
   */
  static async startConversation(data: StartConversationRequest): Promise<Conversation> {
    try {
      console.log('📤 Sending request to:', `${API_URL}/messages/conversation/start`);
      console.log('📤 Request data:', JSON.stringify(data, null, 2));
      
      const response = await fetch(`${API_URL}/messages/conversation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Failed to start conversation';
        try {
          const error = await response.json();
          console.log('📥 Error response:', JSON.stringify(error, null, 2));
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          // Response is not JSON, use status text
          console.log('📥 Response is not JSON, using status text');
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        const finalError = new Error();
        finalError.message = String(errorMessage || 'Unknown error');
        throw finalError;
      }

      const result = await response.json();
      console.log('✅ Conversation result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error starting conversation:', error);
      console.error('❌ Error type:', typeof error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        throw error;
      } else {
        const newError = new Error();
        newError.message = 'Failed to start conversation';
        throw newError;
      }
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(data: SendMessageRequest): Promise<Message> {
    try {
      const response = await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for current user
   */
  static async getConversations(includeArchived: boolean = false): Promise<Conversation[]> {
    try {
      const response = await fetch(
        `${API_URL}/messages/conversations?includeArchived=${includeArchived}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to get conversations';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      throw error;
    }
  }

  /**
   * Get messages in a conversation with pagination
   */
  static async getConversationMessages(
    conversationId: string,
    limit: number = 30,
    skip: number = 0
  ): Promise<{ messages: Message[]; pagination: { total: number; limit: number; skip: number; hasMore: boolean } }> {
    try {
      const response = await fetch(
        `${API_URL}/messages/conversation/${conversationId}?limit=${limit}&skip=${skip}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get messages');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Get conversation by application ID
   */
  static async getConversationByApplication(applicationId: string): Promise<Conversation | null> {
    try {
      const response = await fetch(
        `${API_URL}/messages/conversation/application/${applicationId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get conversation');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting conversation by application:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(conversationId: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_URL}/messages/conversation/${conversationId}/read`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/messages/unread-count`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get unread count');
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Search conversations
   */
  static async searchConversations(searchTerm: string): Promise<Conversation[]> {
    try {
      const response = await fetch(
        `${API_URL}/messages/search?q=${encodeURIComponent(searchTerm)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error searching conversations:', error);
      throw error;
    }
  }

  /**
   * Archive/Unarchive conversation
   */
  static async toggleArchive(conversationId: string): Promise<Conversation> {
    try {
      const response = await fetch(
        `${API_URL}/messages/conversation/${conversationId}/archive`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle archive');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error toggling archive:', error);
      throw error;
    }
  }

  /**
   * Delete message for user
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw error;
    }
  }
}

export default MessageService;

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2, X, User as UserIcon, ChevronUp } from "lucide-react"
import MessageService, { Message, Conversation } from "@/services/messageService"
import { formatDistanceToNow } from "date-fns"

interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiverId: string
  receiverName: string
  applicationId?: string
  conversationType?: 'admin-applicant' | 'admin-department-head' | 'general'
  conversationId?: string  // Optional: if provided, load this conversation directly
}

const MESSAGES_PER_PAGE = 30

export function MessageDialog({
  open,
  onOpenChange,
  receiverId,
  receiverName,
  applicationId,
  conversationType = 'general',
  conversationId: existingConversationId
}: MessageDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalMessages, setTotalMessages] = useState(0)
  const { toast } = useToast()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesTopRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousScrollHeightRef = useRef<number>(0)

  // Auto-scroll to bottom when new messages arrive (only for new messages, not when loading older)
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Maintain scroll position when loading older messages
  const maintainScrollPosition = () => {
    if (scrollContainerRef.current) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight
      const scrollDiff = newScrollHeight - previousScrollHeightRef.current
      scrollContainerRef.current.scrollTop = scrollDiff
    }
  }

  // Load conversation and initial messages
  useEffect(() => {
    if (open && receiverId) {
      setMessages([])
      setHasMore(false)
      setTotalMessages(0)
      loadConversation()
    }
    
    // Cleanup on close
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [open, receiverId, existingConversationId])

  // Set up polling for new messages when conversation is loaded
  useEffect(() => {
    if (open && conversation?._id) {
      // Start polling every 3 seconds for new messages
      pollingIntervalRef.current = setInterval(async () => {
        try {
          // Only fetch the latest messages to check for new ones
          const result = await MessageService.getConversationMessages(conversation._id, MESSAGES_PER_PAGE, 0)
          
          // Check if there are new messages by comparing the latest message
          if (result.messages.length > 0 && messages.length > 0) {
            const latestFetched = result.messages[result.messages.length - 1]
            const latestExisting = messages[messages.length - 1]
            
            if (latestFetched._id !== latestExisting._id) {
              // There are new messages - merge them
              const existingIds = new Set(messages.map(m => m._id))
              const newMessages = result.messages.filter(m => !existingIds.has(m._id))
              
              if (newMessages.length > 0) {
                console.log('📨 New messages received:', newMessages.length)
                setMessages(prev => [...prev, ...newMessages])
                setTotalMessages(result.pagination.total)
                // Mark new messages as read
                await MessageService.markAsRead(conversation._id)
              }
            }
          } else if (result.messages.length > 0 && messages.length === 0) {
            // Initial load case
            setMessages(result.messages)
            setTotalMessages(result.pagination.total)
            setHasMore(result.pagination.hasMore)
          }
        } catch (error) {
          console.error('Error polling messages:', error)
        }
      }, 3000)
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    }
  }, [open, conversation?._id, messages])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0 && !loadingMore) {
      scrollToBottom("auto")
    }
  }, [loading])

  const loadConversation = async () => {
    setLoading(true)
    try {
      console.log('🔵 Loading conversation:', { existingConversationId, receiverId, applicationId, conversationType })
      
      let conv: Conversation
      
      // If we have an existing conversation ID, just use it
      if (existingConversationId) {
        console.log('✅ Using existing conversation ID:', existingConversationId)
        conv = {
          _id: existingConversationId,
          conversationType: conversationType,
          otherParticipant: { _id: receiverId, name: receiverName } as any,
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadCount: 0,
          archived: false,
          createdAt: new Date()
        }
      } else {
        // Start or get conversation (for new conversations)
        conv = await MessageService.startConversation({
          receiverId,
          applicationId,
          conversationType
        })
        console.log('✅ Conversation loaded:', conv)
      }
      
      setConversation(conv)

      // Load initial messages (most recent)
      const result = await MessageService.getConversationMessages(conv._id, MESSAGES_PER_PAGE, 0)
      console.log('✅ Messages loaded:', result.messages.length, 'of', result.pagination.total)
      setMessages(result.messages)
      setHasMore(result.pagination.hasMore)
      setTotalMessages(result.pagination.total)

      // Mark as read
      await MessageService.markAsRead(conv._id)
    } catch (error: any) {
      console.error('❌ Error loading conversation:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load conversation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!conversation || loadingMore || !hasMore) return
    
    setLoadingMore(true)
    
    // Store current scroll height before loading
    if (scrollContainerRef.current) {
      previousScrollHeightRef.current = scrollContainerRef.current.scrollHeight
    }
    
    try {
      const skip = messages.length
      console.log('📜 Loading older messages, skip:', skip)
      
      const result = await MessageService.getConversationMessages(
        conversation._id,
        MESSAGES_PER_PAGE,
        skip
      )
      
      console.log('📜 Loaded', result.messages.length, 'older messages')
      
      // Prepend older messages to the beginning
      setMessages(prev => [...result.messages, ...prev])
      setHasMore(result.pagination.hasMore)
      
      // Maintain scroll position after DOM update
      requestAnimationFrame(() => {
        maintainScrollPosition()
      })
    } catch (error) {
      console.error('Error loading older messages:', error)
      toast({
        title: "Error",
        description: "Failed to load older messages",
        variant: "destructive"
      })
    } finally {
      setLoadingMore(false)
    }
  }, [conversation, loadingMore, hasMore, messages.length])

  // Handle scroll to detect when user scrolls to top
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    
    // Load more when scrolled near the top (within 100px)
    if (target.scrollTop < 100 && hasMore && !loadingMore) {
      loadOlderMessages()
    }
  }, [hasMore, loadingMore, loadOlderMessages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return

    setSending(true)
    try {
      const message = await MessageService.sendMessage({
        conversationId: conversation._id,
        receiverId,
        message: newMessage.trim()
      })

      setMessages(prev => [...prev, message])
      setTotalMessages(prev => prev + 1)
      setNewMessage("")
      
      // Scroll to bottom to show the new message
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const formatMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0" hideCloseButton>
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-[#800000]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-[#800000] text-white">
                <AvatarFallback className="bg-[#800000] text-white">
                  {getInitials(receiverName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-[#800000]">{receiverName}</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  {conversationType === 'admin-applicant' && 'Applicant'}
                  {conversationType === 'admin-department-head' && 'Department Head'}
                  {conversationType === 'general' && 'User'}
                  {totalMessages > 0 && ` • ${totalMessages} messages`}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages Area with scroll detection */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-[#800000]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <UserIcon className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Load more indicator at top */}
              <div ref={messagesTopRef} />
              
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#800000] mr-2" />
                  <span className="text-sm text-gray-500">Loading older messages...</span>
                </div>
              )}
              
              {hasMore && !loadingMore && (
                <div className="flex justify-center py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadOlderMessages}
                    className="text-gray-500 hover:text-[#800000]"
                  >
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Load older messages
                  </Button>
                </div>
              )}
              
              {messages.map((message) => {
                // Check if the message sender is the current user (not the receiver)
                const isOwn = message.senderId?._id ? message.senderId._id !== receiverId : true
                
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Avatar className={`h-8 w-8 ${isOwn ? 'bg-[#800000]' : 'bg-gray-400'} text-white flex-shrink-0`}>
                        <AvatarFallback className={`${isOwn ? 'bg-[#800000]' : 'bg-gray-400'} text-white text-xs`}>
                          {getInitials(isOwn ? 'You' : receiverName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwn
                              ? 'bg-[#800000] text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 mt-1 px-1">
                          {formatMessageTime(message.timestamp)}
                          {isOwn && message.read && ' • Read'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending || loading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || loading}
              className="bg-[#800000] hover:bg-[#600000]"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

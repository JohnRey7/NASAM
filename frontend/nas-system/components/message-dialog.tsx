"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2, Archive, X, User as UserIcon } from "lucide-react"
import MessageService, { Message, Conversation } from "@/services/messageService"
import { formatDistanceToNow } from "date-fns"

interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiverId: string
  receiverName: string
  applicationId?: string
  conversationType?: 'admin-applicant' | 'admin-department-head' | 'general'
}

export function MessageDialog({
  open,
  onOpenChange,
  receiverId,
  receiverName,
  applicationId,
  conversationType = 'general'
}: MessageDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load conversation and messages
  useEffect(() => {
    if (open && receiverId) {
      loadConversation()
    }
  }, [open, receiverId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversation = async () => {
    setLoading(true)
    try {
      console.log('🔵 Starting conversation with:', { receiverId, applicationId, conversationType })
      
      // Start or get conversation
      const conv = await MessageService.startConversation({
        receiverId,
        applicationId,
        conversationType
      })
      console.log('✅ Conversation loaded:', conv)
      setConversation(conv)

      // Load messages
      const msgs = await MessageService.getConversationMessages(conv._id)
      console.log('✅ Messages loaded:', msgs.length)
      setMessages(msgs)

      // Mark as read
      await MessageService.markAsRead(conv._id)
    } catch (error: any) {
      console.error('❌ Error loading conversation:', error)
      console.error('❌ Error details:', error.message, error.stack)
      toast({
        title: "Error",
        description: error.message || "Failed to load conversation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

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
      setNewMessage("")
      
      toast({
        title: "Message Sent",
        description: "Your message has been delivered",
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
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
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
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-6 py-4">
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
        </ScrollArea>

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

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Search, MessageSquare, Archive, Loader2, X } from "lucide-react"
import MessageService, { Conversation } from "@/services/messageService"
import { MessageDialog } from "./message-dialog"
import { formatDistanceToNow } from "date-fns"

interface ConversationsListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConversationsList({ open, onOpenChange }: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadConversations()
    }
  }, [open, showArchived])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = conversations.filter(conv => {
        const name = conv.otherParticipant?.name || conv.otherParticipant?.email || ''
        const lastMsg = conv.lastMessage || ''
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lastMsg.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
      setFilteredConversations(filtered)
    } else {
      setFilteredConversations(conversations)
    }
  }, [searchTerm, conversations])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const convs = await MessageService.getConversations(showArchived)
      setConversations(convs)
      setFilteredConversations(convs)
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConversationClick = (conv: Conversation) => {
    setSelectedConversation(conv)
    setShowMessageDialog(true)
  }

  const handleArchiveConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await MessageService.toggleArchive(convId)
      await loadConversations()
      toast({
        title: "Success",
        description: "Conversation archived",
      })
    } catch (error) {
      console.error('Error archiving conversation:', error)
      toast({
        title: "Error",
        description: "Failed to archive conversation",
        variant: "destructive"
      })
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

  const formatTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  const getTotalUnread = () => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl h-[700px] flex flex-col p-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b bg-[#800000]/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-[#800000]" />
                <div>
                  <DialogTitle className="text-[#800000]">Messages</DialogTitle>
                  <p className="text-xs text-gray-500">
                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    {getTotalUnread() > 0 && ` • ${getTotalUnread()} unread`}
                  </p>
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

          {/* Search and Filters */}
          <div className="px-6 py-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className={showArchived ? "bg-[#800000] hover:bg-[#600000]" : ""}
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? "Hide Archived" : "Show Archived"}
            </Button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-[#800000]" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6">
                <MessageSquare className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium">
                  {searchTerm ? 'No conversations found' : 'No messages yet'}
                </p>
                <p className="text-sm text-center">
                  {searchTerm
                    ? 'Try a different search term'
                    : 'Start a conversation by clicking the message button'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => {
                  const participantName = conv.otherParticipant?.name || 
                                         conv.otherParticipant?.email || 
                                         'Unknown User'
                  
                  return (
                    <div
                      key={conv._id}
                      onClick={() => handleConversationClick(conv)}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 bg-[#800000] text-white flex-shrink-0">
                          <AvatarFallback className="bg-[#800000] text-white">
                            {getInitials(participantName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {participantName}
                            </h3>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {formatTime(conv.lastMessageTime)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                conv.conversationType === 'admin-applicant'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : conv.conversationType === 'admin-department-head'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              {conv.conversationType === 'admin-applicant' && 'Applicant'}
                              {conv.conversationType === 'admin-department-head' && 'Dept. Head'}
                              {conv.conversationType === 'general' && 'General'}
                            </Badge>
                            {conv.applicationId && (
                              <span className="text-xs text-gray-500">
                                App: {conv.applicationId.idNumber || 'N/A'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${
                              conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'
                            }`}>
                              {conv.lastMessage || 'No messages yet'}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {conv.unreadCount > 0 && (
                                <Badge className="bg-[#800000] hover:bg-[#600000] text-white">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleArchiveConversation(conv._id, e)}
                                className="h-8 w-8"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      {selectedConversation && (
        <MessageDialog
          open={showMessageDialog}
          onOpenChange={(open) => {
            setShowMessageDialog(open)
            if (!open) {
              loadConversations() // Refresh conversations when closing message dialog
            }
          }}
          receiverId={selectedConversation.otherParticipant._id}
          receiverName={
            selectedConversation.otherParticipant?.name ||
            selectedConversation.otherParticipant?.email ||
            'Unknown User'
          }
          applicationId={selectedConversation.applicationId?._id}
          conversationType={selectedConversation.conversationType}
        />
      )}
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import { ConversationsList } from "./conversations-list"
import MessageService from "@/services/messageService"

export function MessageNotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showConversations, setShowConversations] = useState(false)

  console.log('💬 MessageNotificationBadge rendering, unreadCount:', unreadCount)

  useEffect(() => {
    console.log('💬 MessageNotificationBadge mounted')
    loadUnreadCount()
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadUnreadCount = async () => {
    try {
      const result = await MessageService.getUnreadCount()
      console.log('📬 Unread count loaded:', result)
      setUnreadCount(result)
    } catch (error) {
      console.error('❌ Error loading unread count:', error)
      // Don't set error state, just keep showing 0
      setUnreadCount(0)
    }
  }

  const handleOpenConversations = () => {
    setShowConversations(true)
    // Refresh unread count when opening
    loadUnreadCount()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpenConversations}
        className="relative hover:bg-[#600000] text-white"
        title="Messages"
      >
        <MessageSquare className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <ConversationsList
        open={showConversations}
        onOpenChange={(open) => {
          setShowConversations(open)
          if (!open) {
            // Refresh unread count when closing
            loadUnreadCount()
          }
        }}
      />
    </>
  )
}

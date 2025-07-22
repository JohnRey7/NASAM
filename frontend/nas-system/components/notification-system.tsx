"use client"

import { useState, useEffect } from "react"
import { Bell, X, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  priority?: string
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // ✅ FETCH REAL NOTIFICATIONS
  const fetchNotifications = async () => {
    try {
      console.log('🔍 Fetching notifications from API...')
      const response = await fetch('http://localhost:3000/api/notifications', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Notifications received:', data)
        
        if (data.success && data.notifications) {
          setNotifications(data.notifications)
        } else {
          console.warn('⚠️ Unexpected response format:', data)
          setNotifications([])
        }
      } else {
        console.error('❌ Failed to fetch notifications:', response.status)
        setNotifications([])
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === id ? { ...notification, isRead: true } : notification
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/notifications/mark-all-read', {
        method: 'PATCH',
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(notification => notification._id !== id))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "application_submitted":
      case "application_form_verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "documents_verified":
      case "document_uploaded":
        return <Info className="h-5 w-5 text-blue-500" />
      case "personality_test_available":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "Just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} ${days === 1 ? "day" : "days"} ago`
    }
  }

  return (
    <div className="relative" data-notification-dropdown>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 z-50 shadow-lg">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-medium">Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                  Mark all as read
                </Button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={cn(
                        "p-3 flex gap-3 hover:bg-muted/50 transition-colors",
                        !notification.isRead && "bg-muted/30",
                      )}
                    >
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mr-1 -mt-1 text-muted-foreground"
                            onClick={() => deleteNotification(notification._id)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Dismiss</span>
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => markAsRead(notification._id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

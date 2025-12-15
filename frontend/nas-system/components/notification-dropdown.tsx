// frontend/components/notification-dropdown.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, CheckCircle, AlertCircle, Clock, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useConfirmation } from "@/components/ui/confirmation-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  createdAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [allNotifications, setAllNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [allLoading, setAllLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirmation()

  console.log('🔔 Notification API URL:', API_URL)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async (silent = false) => {
    // Only show loading spinner on manual fetch, not during heartbeat
    if (!silent) {
      setLoading(true)
    }
    try {
      console.log('🔔 Fetching notifications from:', `${API_URL}/notifications?limit=10`)
      const response = await fetch(`${API_URL}/notifications?limit=10`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('🔔 Notification response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔔 Notifications received:', data)
        setNotifications(data.notifications || [])
        const newUnreadCount = data.notifications.filter((n: Notification) => !n.isRead).length
        setUnreadCount(newUnreadCount)
        
        // Log heartbeat updates
        if (silent) {
          console.log(`🔔 Heartbeat update: ${newUnreadCount} unread notification(s)`)
        }
      } else {
        const errorData = await response.json().catch(() => null)
        console.error('🔔 Failed to fetch notifications:', response.status, errorData)
        // Only show error toast on manual fetch, not during silent heartbeat
        if (!silent) {
          toast({
            title: "Error",
            description: `Failed to load notifications: ${errorData?.message || response.statusText}`,
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('🔔 Error fetching notifications:', error)
      // Only show error toast on manual fetch, not during silent heartbeat
      if (!silent) {
        toast({
          title: "Connection Error",
          description: "Could not connect to notification service. Please check your connection.",
          variant: "destructive"
        })
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications()
    }
  }, [isOpen])

  // Heartbeat polling: Auto-refresh notifications every 8 seconds
  useEffect(() => {
    // Initial fetch
    fetchNotifications()
    
    // Set up polling interval
    const intervalId = setInterval(() => {
      console.log('🔔 Heartbeat: Auto-refreshing notifications...')
      fetchNotifications(true)
    }, 8000) // 8 seconds
    
    // Cleanup interval on unmount
    return () => {
      console.log('🔔 Heartbeat: Cleaning up notification polling')
      clearInterval(intervalId)
    }
  }, [])

  const fetchAllNotifications = async () => {
    setAllLoading(true)
    try {
      const response = await fetch(`${API_URL}/notifications?limit=100`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAllNotifications(data.notifications || [])
      } else {
        console.error('🔔 Failed to fetch all notifications:', response.status)
      }
    } catch (error) {
      console.error('🔔 Error fetching all notifications:', error)
    } finally {
      setAllLoading(false)
    }
  }

  // Fetch all notifications when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      fetchAllNotifications()
    }
  }, [isDialogOpen])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } else {
        console.error('🔔 Failed to mark as read:', response.status)
      }
    } catch (error) {
      console.error('🔔 Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      } else {
        console.error('🔔 Failed to mark all as read:', response.status)
      }
    } catch (error) {
      console.error('🔔 Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId))
        setUnreadCount(prev => {
          const deletedNotification = notifications.find(n => n._id === notificationId)
          return deletedNotification && !deletedNotification.isRead ? Math.max(0, prev - 1) : prev
        })
      } else {
        console.error('🔔 Failed to delete notification:', response.status)
      }
    } catch (error) {
      console.error('🔔 Error deleting notification:', error)
    }
  }

  const deleteAllNotifications = async () => {
    const confirmed = await confirm({
      title: "Delete All Notifications",
      description: "Are you sure you want to delete all notifications?",
      confirmText: "Delete All",
      cancelText: "Cancel",
      type: "danger"
    })
    if (!confirmed) return

    try {
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
        toast({
          title: "All notifications deleted",
          description: "All notifications have been removed successfully."
        })
      } else {
        console.error('🔔 Failed to delete all notifications:', response.status)
        toast({
          title: "Error",
          description: "Failed to delete notifications",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('🔔 Error deleting all notifications:', error)
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive"
      })
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'medium': return <Clock className="h-4 w-4 text-blue-500" />
      default: return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-white hover:bg-[#600000] h-10 w-10"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <Card className="border-0 shadow-none">
            <CardHeader className="bg-gray-50 border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deleteAllNotifications}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete all
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${
                        notification.isRead 
                          ? 'border-gray-300 bg-gray-50' 
                          : 'border-[#800000] bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => markAsRead(notification._id)}>
                          <div className="flex items-center gap-2 mb-1">
                            {getPriorityIcon(notification.priority)}
                            <h4 className="font-medium text-sm text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-[#800000] rounded-full"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {notifications.length > 0 && (
                <div className="border-t bg-gray-50 p-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#800000] hover:text-[#600000] text-xs"
                    onClick={() => {
                      setIsOpen(false)
                      setIsDialogOpen(true)
                    }}
                  >
                    View all notifications
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* View All Notifications Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              All Notifications
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            {allLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      notification.isRead 
                        ? 'border-gray-200 bg-gray-50' 
                        : 'border-[#800000] bg-white shadow-sm'
                    }`}
                    onClick={() => {
                      markAsRead(notification._id)
                      setAllNotifications(prev => 
                        prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
                      )
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getPriorityIcon(notification.priority)}
                          <h4 className="font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <Badge variant="destructive" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                          setAllNotifications(prev => prev.filter(n => n._id !== notification._id));
                        }}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {ConfirmDialog}
    </div>
  )
}
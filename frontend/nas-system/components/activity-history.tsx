// CREATE FILE: frontend/nas-system/components/activity-history.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Activity, 
  FileText, 
  Upload, 
  Brain, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  RefreshCw
} from "lucide-react"

interface ActivityEntry {
  id: string
  type: string
  title: string
  description: string
  status: string
  date: string
  metadata: any
  adminNotes?: string
}

export function ActivityHistory() {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchActivities = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      
      const response = await fetch('/api/activity/history', {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setActivities(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application_submitted':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'document_uploaded':
        return <Upload className="h-4 w-4 text-green-500" />
      case 'personality_test_started':
      case 'personality_test_completed':
        return <Brain className="h-4 w-4 text-purple-500" />
      case 'status_changed':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'pdf_exported':
        return <Download className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
            <span className="ml-2 text-gray-600">Loading activity history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[#800000]">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Activity History
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchActivities(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-500">
          Complete log of all your application activities
        </p>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96">
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </h4>
                      <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleString()}
                      </span>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <span className="text-xs text-gray-400">
                          {activity.metadata.fileName || activity.metadata.scholarshipType || ''}
                        </span>
                      )}
                    </div>
                    {activity.adminNotes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                        <strong>Admin Note:</strong> {activity.adminNotes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Activities Yet</h3>
              <p className="text-sm text-gray-500">
                Your application activities will appear here as you use the system.
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
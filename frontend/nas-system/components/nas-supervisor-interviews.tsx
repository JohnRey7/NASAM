"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

interface Interview {
  _id: string
  applicationId: {
    _id: string
    applicationNumber: string
  }
  applicantId: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  scheduledDate: string
  scheduledTime: string
  location: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  attendanceStatus: 'pending' | 'present' | 'absent'
  notes?: string
  createdAt: string
}

interface NASSupervisorInterviewsProps {
  onStatsUpdate?: () => void
}

export function NASSupervisorInterviews({ onStatsUpdate }: NASSupervisorInterviewsProps) {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [attendanceStatus, setAttendanceStatus] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchInterviews()
  }, [])

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  }

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      const token = getCookie('jwt')
      
      const response = await fetch(`${API_URL}/interviews/nas-supervisor`, {
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setInterviews(data.data || [])
      } else {
        throw new Error('Failed to fetch interviews')
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateInterviewStatus = async (interviewId: string, status: string, attendanceStatus?: string, notes?: string) => {
    try {
      setUpdating(true)
      const token = getCookie('jwt')
      
      const response = await fetch(`${API_URL}/interviews/${interviewId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
                                      attendanceStatus, 
                                      notes
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setInterviews(prev => prev.map(interview => 
          interview._id === interviewId ? { ...interview, ...data.data } : interview
        ))
        
        toast({
          title: "Success",
          description: "Interview status updated successfully",
        })
        
        if (onStatsUpdate) {
          onStatsUpdate()
        }
        
        setSelectedInterview(null)
        setAttendanceStatus("")
        setNotes("")
      } else {
        throw new Error('Failed to update interview status')
      }
    } catch (error) {
      console.error('Error updating interview:', error)
      toast({
        title: "Error",
        description: "Failed to update interview status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: "bg-blue-100 text-blue-800", icon: Clock },
      'in-progress': { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
      'no-show': { color: "bg-gray-100 text-gray-800", icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
  )
}

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const filteredInterviews = interviews.filter(interview => {
    const matchesStatus = statusFilter === "all" || interview.status === statusFilter
    const matchesSearch = searchTerm === "" || 
      interview.applicantId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.applicantId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.applicationId.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading interviews...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          My Assigned Interviews
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by applicant name or application number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-show">No Show</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredInterviews.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
            <p className="text-gray-600">
              {statusFilter === "all" 
                ? "You don't have any assigned interviews yet." 
                : `No interviews with status "${statusFilter}" found.`}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Application #</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterviews.map((interview) => (
                <TableRow key={interview._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#800000] text-white flex items-center justify-center text-sm font-medium">
                        {interview.applicantId.firstName[0]}{interview.applicantId.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium">
                          {interview.applicantId.firstName} {interview.applicantId.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{interview.applicantId.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {interview.applicationId.applicationNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatDate(interview.scheduledDate)}
                      </span>
                      <span className="text-sm text-gray-600">{interview.scheduledTime}</span>
                    </div>
                  </TableCell>
                  <TableCell>{interview.location}</TableCell>
                  <TableCell>{getStatusBadge(interview.status)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedInterview(interview)
                            setAttendanceStatus(interview.attendanceStatus)
                            setNotes(interview.notes || "")
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Interview Management</DialogTitle>
                        </DialogHeader>
                        
                        {selectedInterview && (
                          <div className="space-y-6">
                            {/* Interview Details */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Applicant</Label>
                                <p className="text-sm">
                                  {selectedInterview.applicantId.firstName} {selectedInterview.applicantId.lastName}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Application #</Label>
                                <p className="text-sm font-mono">{selectedInterview.applicationId.applicationNumber}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Scheduled Date</Label>
                                <p className="text-sm">
                                  {formatDate(selectedInterview.scheduledDate)} at {selectedInterview.scheduledTime}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Location</Label>
                                <p className="text-sm">{selectedInterview.location}</p>
                              </div>
                            </div>

                            {/* Status Management */}
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="attendance" className="text-sm font-medium">
                                  Attendance Status
                                </Label>
                                <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select attendance status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="notes" className="text-sm font-medium">
                                  Interview Notes
                                </Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Add any notes about the interview..."
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  rows={3}
                                />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-4">
                              {selectedInterview.status === 'scheduled' && (
                                <>
                                  <Button
                                    onClick={() => updateInterviewStatus(
                                      selectedInterview._id, 
                                      'in-progress', 
                                      attendanceStatus, 
                                      notes
                                    )}
                                    disabled={updating}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    Start Interview
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => updateInterviewStatus(
                                      selectedInterview._id, 
                                      'no-show', 
                                      'absent', 
                                      notes
                                    )}
                                    disabled={updating}
                                  >
                                    Mark No Show
                                  </Button>
                                </>
                              )}
                              
                              {selectedInterview.status === 'in-progress' && (
                                <Button
                                  onClick={() => updateInterviewStatus(
                                    selectedInterview._id, 
                                    'completed', 
                                    attendanceStatus, 
                                    notes
                                  )}
                                  disabled={updating}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Complete Interview
                                </Button>
                              )}
                              
                              <Button
                                variant="outline"
                                onClick={() => updateInterviewStatus(
                                  selectedInterview._id, 
                                  selectedInterview.status, 
                                  attendanceStatus, 
                                  notes
                                )}
                                disabled={updating}
                              >
                                Update Notes
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
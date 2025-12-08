"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Pencil, Trash2, Calendar, Clock, CheckCircle, Loader2 } from "lucide-react"
import { interviewService, Interview } from "@/services/interviewService"
import userService from "@/services/userService"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export function InterviewManagement() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [users, setUsers] = useState<any[]>([]) // For interviewer selection
  const [applications, setApplications] = useState<any[]>([]) // For application selection
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    applicationId: "",
    interviewerId: "",
    date: "",
    startTime: "",
    endTime: ""
  })

  useEffect(() => {
    fetchInterviews()
    fetchUsers()
    // Ideally fetch applications too, but for now we'll rely on manual entry or separate fetch
  }, [])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      const response = await interviewService.getAllInterviews()
      // The backend returns { interviews: [], pagination: {}, message: "" }
      // We need to extract the interviews array
      if (response && response.interviews && Array.isArray(response.interviews)) {
        setInterviews(response.interviews)
      } else if (Array.isArray(response)) {
        // Fallback in case the API changes to return just an array
        setInterviews(response)
      } else {
        setInterviews([])
      }
    } catch (error) {
      console.error("Error fetching interviews:", error)
      setInterviews([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Fetch users who can be interviewers (e.g., admins, staff)
      const response = await userService.getAllUsers({ limit: 100 })
      setUsers(response.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Combine date and time
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`)

    const payload = {
      applicationId: formData.applicationId,
      interviewerId: formData.interviewerId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString()
    }

    try {
      if (editingInterview) {
        await interviewService.updateInterview(editingInterview._id, payload)
        toast({ title: "Success", description: "Interview updated successfully" })
      } else {
        await interviewService.createInterview(payload)
        toast({ title: "Success", description: "Interview scheduled successfully" })
      }
      setIsDialogOpen(false)
      fetchInterviews()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Operation failed",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview)
    
    const startDate = new Date(interview.startTime)
    const endDate = new Date(interview.endTime)
    
    setFormData({
      applicationId: interview.applicationId?._id || interview.applicationId,
      interviewerId: interview.interviewer?._id || interview.interviewer,
      date: format(startDate, "yyyy-MM-dd"),
      startTime: format(startDate, "HH:mm"),
      endTime: format(endDate, "HH:mm")
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this interview?")) return
    try {
      await interviewService.deleteInterview(id)
      toast({ title: "Success", description: "Interview cancelled successfully" })
      fetchInterviews()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel interview",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setEditingInterview(null)
    setFormData({
      applicationId: "",
      interviewerId: "",
      date: "",
      startTime: "",
      endTime: ""
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Interview Schedule</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#800000] hover:bg-[#600000]">
              <Plus className="mr-2 h-4 w-4" /> Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingInterview ? "Reschedule Interview" : "Schedule New Interview"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="applicationId">Application ID</Label>
                <Input
                  id="applicationId"
                  value={formData.applicationId}
                  onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                  placeholder="Enter Application ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interviewer">Interviewer</Label>
                <Select
                  value={formData.interviewerId}
                  onValueChange={(value) => setFormData({ ...formData, interviewerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-[#800000] hover:bg-[#600000]">
                  {editingInterview ? "Update Schedule" : "Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Interviewer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : interviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No interviews scheduled
                  </TableCell>
                </TableRow>
              ) : (
                interviews.map((interview) => (
                  <TableRow key={interview._id}>
                    <TableCell className="font-medium">
                      {interview.applicationId?.user?.name || "Unknown Applicant"}
                    </TableCell>
                    <TableCell>
                      {interview.interviewer?.name || "Unknown Interviewer"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(interview.startTime), "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(interview.startTime), "h:mm a")} - {format(new Date(interview.endTime), "h:mm a")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {interview.is_finished ? (
                        <Badge className="bg-green-600">Finished</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(interview)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(interview._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

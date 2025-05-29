"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Filter,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  MessageSquare,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import axios from "axios"

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Application = {
  _id: string
  user: {
    name: string
    idNumber: string
  }
  firstName: string
  lastName: string
  emailAddress: string
  programOfStudyAndYear: string
  status: string
  createdAt: string
}

export function ApplicationReview() {
  const [applications, setApplications] = useState<Application[]>([])
  const [currentStatus, setCurrentStatus] = useState("Pending")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [interviewDate, setInterviewDate] = useState("")
  const [remarks, setRemarks] = useState("")
  const { toast } = useToast()

  const fetchApplications = async (status: string, page: number) => {
    try {
      console.log('Fetching applications with status:', status);
      const response = await axios.get(`/api/users/applications?status=${status}&page=${page}&limit=10`)
      console.log('Response data:', response.data);
      setApplications(response.data.applications)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast({
        title: "Error",
        description: "Failed to fetch applications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('Current status:', currentStatus);
    setLoading(true)
    fetchApplications(currentStatus, currentPage)
  }, [currentStatus, currentPage])

  const handleStatusChange = async (newStatus: string, applicationId: string) => {
    try {
      console.log('Updating status:', { newStatus, applicationId });
      await axios.patch(`/api/applications/${applicationId}/status`, {
        status: newStatus
      })
      toast({
        title: "Success",
        description: "Application status updated successfully.",
      })
      fetchApplications(currentStatus, currentPage)
    } catch (error: any) {
      console.error('Error updating application status:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast({
        title: "Error",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (filter !== "all" && app.status !== filter) return false

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        app.user.name.toLowerCase().includes(searchLower) ||
        app.user.idNumber.toLowerCase().includes(searchLower) ||
        app.programOfStudyAndYear.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-500">
            Pending
          </Badge>
        )
      case "Document Verification":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Document Verification
          </Badge>
        )
      case "Interview Scheduled":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700">
            Interview Scheduled
          </Badge>
        )
      case "Approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Approved
          </Badge>
        )
      case "Rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleScheduleInterview = () => {
    if (!interviewDate) {
      toast({
        title: "Error",
        description: "Please select an interview date",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Interview Scheduled",
      description: `Interview scheduled for ${selectedApplication.user.name} on ${interviewDate}`,
    })

    // Close dialog
    setSelectedApplication(null)
    setInterviewDate("")
  }

  const handleUpdateStatus = (newStatus: string) => {
    toast({
      title: "Status Updated",
      description: `Application status updated to ${newStatus}`,
    })

    // Close dialog
    setSelectedApplication(null)
    setRemarks("")
  }

  const statuses = ["Pending", "Document Verification", "Interview Scheduled", "Approved", "Rejected"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <CardTitle className="text-[#800000]">Application Management</CardTitle>
          <CardDescription>Review and process scholarship applications</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, ID, or program"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Document Verification">Document Verification</SelectItem>
                  <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={currentStatus} onValueChange={setCurrentStatus}>
            <TabsList className="grid w-full grid-cols-5 mb-8">
              {statuses.map((status) => (
                <TabsTrigger key={status} value={status}>
                  {status}
                </TabsTrigger>
              ))}
            </TabsList>

            {statuses.map((status) => (
              <TabsContent key={status} value={status}>
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Number</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Program & Year</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Date Applied</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No applications found for this status
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredApplications.map((application) => (
                            <TableRow key={application._id}>
                              <TableCell>{application.user.idNumber}</TableCell>
                              <TableCell>{`${application.firstName} ${application.lastName}`}</TableCell>
                              <TableCell>{application.programOfStudyAndYear}</TableCell>
                              <TableCell>{application.emailAddress}</TableCell>
                              <TableCell>{new Date(application.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {/* TODO: View details */}}
                                  >
                                    View
                                  </Button>
                                  {status === "Pending" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStatusChange("Document Verification", application._id)}
                                      >
                                        Start Verification
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleStatusChange("Rejected", application._id)}
                                      >
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {status === "Document Verification" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleStatusChange("Interview Scheduled", application._id)}
                                    >
                                      Schedule Interview
                                    </Button>
                                  )}
                                  {status === "Interview Scheduled" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStatusChange("Approved", application._id)}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleStatusChange("Rejected", application._id)}
                                      >
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

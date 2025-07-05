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
import { applicationService } from "@/services/applicationService"

export function ApplicationReview() {
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [interviewDate, setInterviewDate] = useState("")
  const [remarks, setRemarks] = useState("")
  const { toast } = useToast()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    applicationService.getAllApplications()
      .then((apps) => {
        // Sort FIFO: oldest first by submissionDate or createdAt
        const sorted = [...apps].sort((a, b) => new Date(a.submissionDate || a.createdAt).getTime() - new Date(b.submissionDate || b.createdAt).getTime())
        setApplications(sorted)
      })
      .catch((err) => setError(err.message || "Failed to load applications"))
      .finally(() => setLoading(false))
  }, [])

  const filteredApplications = applications.filter((app) => {
    if (app.user?.idNumber === "ADMIN001") return false; // Exclude admin applications
    if (filter !== "all" && app.status !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (app.firstName + ' ' + app.lastName).toLowerCase().includes(searchLower) ||
        app.user?.idNumber?.toLowerCase().includes(searchLower) ||
        app._id?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase?.() || "";
    switch (normalized) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-500">
            Pending
          </Badge>
        );
      case "document_verification":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Document Verification
          </Badge>
        );
      case "interview_scheduled":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700">
            Interview Scheduled
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
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
      description: `Interview scheduled for ${selectedApplication.studentName} on ${interviewDate}`,
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
                placeholder="Search by name, ID, or application number"
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="document_verification">Document Verification</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-2 text-left font-medium text-sm">Application ID</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Student Name</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Student ID</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Course</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Submission Date</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Status</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application: any) => (
                  <tr key={application._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm">{application._id}</td>
                    <td className="py-3 px-2 text-sm">{application.firstName} {application.lastName}</td>
                    <td className="py-3 px-2 text-sm">{application.user?.idNumber}</td>
                    <td className="py-3 px-2 text-sm">{application.programOfStudyAndYear}</td>
                    <td className="py-3 px-2 text-sm">{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}</td>
                    <td className="py-3 px-2 text-sm">{getStatusBadge(application.status)}</td>
                    <td className="py-3 px-2 text-sm">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                              <DialogDescription>
                                Review application {application._id} submitted by {application.firstName} {application.lastName}
                              </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="personality">Personality Test</TabsTrigger>
                                <TabsTrigger value="interview">Interview</TabsTrigger>
                              </TabsList>

                              <TabsContent value="details" className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                                    <p>{application.firstName} {application.middleName} {application.lastName} {application.suffix}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Student ID</p>
                                    <p>{application.user?.idNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                                    <p>{application.emailAddress}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Program/Year</p>
                                    <p>{application.programOfStudyAndYear}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Existing Scholarship</p>
                                    <p>{application.existingScholarship}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Remaining Units</p>
                                    <p>{application.remainingUnitsIncludingThisTerm}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Remaining Terms</p>
                                    <p>{application.remainingTermsToGraduate}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Citizenship</p>
                                    <p>{application.citizenship}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Civil Status</p>
                                    <p>{application.civilStatus}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Annual Family Income</p>
                                    <p>{application.annualFamilyIncome}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Current Residence Address</p>
                                    <p>{application.currentResidenceAddress}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Permanent Address</p>
                                    <p>{application.permanentResidentialAddress}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Contact Number</p>
                                    <p>{application.contactNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <p>{getStatusBadge(application.status)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Submission Date</p>
                                    <p>{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}</p>
                                  </div>
                                </div>
                                <div className="pt-4">
                                  <Button
                                    variant="outline"
                                    className="mr-2"
                                    onClick={() => {
                                      toast({
                                        title: "Application Downloaded",
                                        description: "The application has been downloaded as PDF.",
                                      })
                                    }}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Application
                                  </Button>
                                </div>
                              </TabsContent>

                              <TabsContent value="documents" className="space-y-4 py-4">
                                <div className="space-y-4">
                                  {Array.isArray(application.documents) && application.documents.includes("grades") && (
                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-[#800000]" />
                                        <div>
                                          <p className="font-medium">Grade Report</p>
                                          <p className="text-sm text-gray-500">
                                            Submitted on {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}
                                          </p>
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                      </Button>
                                    </div>
                                  )}

                                  {Array.isArray(application.documents) && application.documents.includes("itr") && (
                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-[#800000]" />
                                        <div>
                                          <p className="font-medium">Income Tax Return</p>
                                          <p className="text-sm text-gray-500">
                                            Submitted on {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}
                                          </p>
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                      </Button>
                                    </div>
                                  )}

                                  {Array.isArray(application.documents) && application.documents.includes("certificate") && (
                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-[#800000]" />
                                        <div>
                                          <p className="font-medium">Certificates</p>
                                          <p className="text-sm text-gray-500">
                                            Submitted on {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}
                                          </p>
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-4">
                                  <Button
                                    className="bg-[#800000] hover:bg-[#600000]"
                                    onClick={() => handleUpdateStatus("document_verification")}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Verify Documents
                                  </Button>
                                </div>
                              </TabsContent>

                              <TabsContent value="personality" className="space-y-4 py-4">
                                {application.personalityTest ? (
                                  <div className="space-y-4">
                                    <div className="bg-green-50 border-l-4 border-green-400 p-4">
                                      <div className="flex">
                                        <div className="flex-shrink-0">
                                          <CheckCircle className="h-5 w-5 text-green-400" />
                                        </div>
                                        <div className="ml-3">
                                          <p className="text-sm text-green-700">
                                            <strong>Completed:</strong> Personality test has been completed by the
                                            applicant.
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-lg font-medium mb-4">Personality Profile:</h3>

                                      <div className="space-y-4">
                                        <div className="mb-4">
                                          <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">Extraversion</span>
                                            <span className="text-sm font-medium">3.8/5</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-[#800000] h-2 rounded-full"
                                              style={{ width: "76%" }}
                                            ></div>
                                          </div>
                                        </div>

                                        <div className="mb-4">
                                          <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">Agreeableness</span>
                                            <span className="text-sm font-medium">4.2/5</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-[#800000] h-2 rounded-full"
                                              style={{ width: "84%" }}
                                            ></div>
                                          </div>
                                        </div>

                                        <div className="mb-4">
                                          <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">Conscientiousness</span>
                                            <span className="text-sm font-medium">4.5/5</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-[#800000] h-2 rounded-full"
                                              style={{ width: "90%" }}
                                            ></div>
                                          </div>
                                        </div>

                                        <div className="mb-4">
                                          <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">Neuroticism</span>
                                            <span className="text-sm font-medium">2.1/5</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-[#800000] h-2 rounded-full"
                                              style={{ width: "42%" }}
                                            ></div>
                                          </div>
                                        </div>

                                        <div className="mb-4">
                                          <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">Openness</span>
                                            <span className="text-sm font-medium">3.9/5</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-[#800000] h-2 rounded-full"
                                              style={{ width: "78%" }}
                                            ></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="pt-4">
                                      <Button variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Full Report
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                    <div className="flex">
                                      <div className="flex-shrink-0">
                                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                      </div>
                                      <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                          <strong>Pending:</strong> Applicant has not completed the personality test
                                          yet.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="interview" className="space-y-4 py-4">
                                {application.interviewScheduled ? (
                                  <div className="space-y-4">
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                      <div className="flex">
                                        <div className="flex-shrink-0">
                                          <Calendar className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div className="ml-3">
                                          <p className="text-sm text-blue-700">
                                            <strong>Interview Scheduled:</strong> {application.interviewDate}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {application.interviewCompleted ? (
                                      <div>
                                        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                                          <div className="flex">
                                            <div className="flex-shrink-0">
                                              <CheckCircle className="h-5 w-5 text-green-400" />
                                            </div>
                                            <div className="ml-3">
                                              <p className="text-sm text-green-700">
                                                <strong>Interview Completed</strong>
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          <div>
                                            <h3 className="text-sm font-medium text-gray-500">Interviewer Remarks</h3>
                                            <p className="mt-1 p-3 bg-gray-50 rounded-md">
                                              The applicant demonstrated excellent communication skills and a clear
                                              understanding of their academic goals. Their responses aligned well with
                                              the scholarship's objectives.
                                            </p>
                                          </div>

                                          <div>
                                            <h3 className="text-sm font-medium text-gray-500">Final Recommendation</h3>
                                            <div className="mt-1">
                                              {application.status === "approved" ? (
                                                <Badge className="bg-green-500">Recommended for Approval</Badge>
                                              ) : (
                                                <Badge className="bg-red-500">Not Recommended</Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="pt-4 flex gap-2">
                                          <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleUpdateStatus("approved")}
                                          >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve Application
                                          </Button>

                                          <Button
                                            className="bg-red-600 hover:bg-red-700"
                                            onClick={() => handleUpdateStatus("rejected")}
                                          >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject Application
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="pt-4">
                                        <p className="text-sm text-gray-500 mb-4">
                                          The interview has been scheduled but not yet completed.
                                        </p>

                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            toast({
                                              title: "Reminder Sent",
                                              description:
                                                "Interview reminder has been sent to the applicant and panelists.",
                                            })
                                          }}
                                        >
                                          <MessageSquare className="mr-2 h-4 w-4" />
                                          Send Reminder
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                      <div className="flex">
                                        <div className="flex-shrink-0">
                                          <Clock className="h-5 w-5 text-yellow-400" />
                                        </div>
                                        <div className="ml-3">
                                          <p className="text-sm text-yellow-700">
                                            <strong>Pending:</strong> No interview has been scheduled yet.
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="interview-date">Schedule Interview Date</Label>
                                        <Input
                                          id="interview-date"
                                          type="date"
                                          value={interviewDate}
                                          onChange={(e) => setInterviewDate(e.target.value)}
                                        />
                                      </div>

                                      <Button
                                        className="bg-[#800000] hover:bg-[#600000]"
                                        onClick={handleScheduleInterview}
                                      >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Schedule Interview
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>

                            <DialogFooter className="pt-4">
                              <div className="space-y-2 w-full">
                                <Label htmlFor="remarks">Staff Remarks</Label>
                                <Textarea
                                  id="remarks"
                                  placeholder="Add your remarks about this application"
                                  value={remarks}
                                  onChange={(e) => setRemarks(e.target.value)}
                                />
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            toast({
                              title: "Application Downloaded",
                              description: "The application has been downloaded as PDF.",
                            })
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            toast({
                              title: "Message Sent",
                              description: "A message has been sent to the applicant.",
                            })
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      No applications found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

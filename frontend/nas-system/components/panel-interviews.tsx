"use client"

import { useState } from "react"
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
  CheckCircle,
  XCircle,
  Clock,
  Download,
  MessageSquare,
  FileText,
  Star,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Sample interview data
const INTERVIEWS = [
  {
    id: "INT-2023-001",
    applicantName: "Juan Dela Cruz",
    applicantId: "2020-00001",
    course: "BS Information Technology",
    scheduleDate: "2023-06-20",
    scheduleTime: "10:00 AM",
    status: "scheduled",
  },
  {
    id: "INT-2023-002",
    applicantName: "Maria Santos",
    applicantId: "2020-00002",
    course: "BS Computer Science",
    scheduleDate: "2023-06-21",
    scheduleTime: "2:00 PM",
    status: "scheduled",
  },
  {
    id: "INT-2023-003",
    applicantName: "Pedro Reyes",
    applicantId: "2020-00003",
    course: "BS Civil Engineering",
    scheduleDate: "2023-06-15",
    scheduleTime: "11:00 AM",
    status: "completed",
    rating: 4,
    recommendation: "approve",
    remarks: "Excellent candidate with strong academic background and leadership potential.",
  },
  {
    id: "INT-2023-004",
    applicantName: "Ana Gonzales",
    applicantId: "2020-00004",
    course: "BS Accountancy",
    scheduleDate: "2023-06-16",
    scheduleTime: "9:00 AM",
    status: "completed",
    rating: 3,
    recommendation: "reject",
    remarks: "Candidate shows potential but lacks the required academic performance for the scholarship.",
  },
  {
    id: "INT-2023-005",
    applicantName: "Carlos Tan",
    applicantId: "2020-00005",
    course: "BS Architecture",
    scheduleDate: "2023-06-17",
    scheduleTime: "1:00 PM",
    status: "completed",
    rating: 5,
    recommendation: "approve",
    remarks: "Outstanding candidate with exceptional portfolio and academic achievements.",
  },
]

export function PanelInterviews() {
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInterview, setSelectedInterview] = useState<any>(null)
  const [rating, setRating] = useState<string>("")
  const [recommendation, setRecommendation] = useState<"approve" | "reject" | "">("")
  const [remarks, setRemarks] = useState("")
  const { toast } = useToast()

  const filteredInterviews = INTERVIEWS.filter((interview) => {
    if (filter !== "all" && interview.status !== filter) return false

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        interview.applicantName.toLowerCase().includes(searchLower) ||
        interview.applicantId.toLowerCase().includes(searchLower) ||
        interview.id.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Scheduled
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleSubmitEvaluation = () => {
    if (!rating || !recommendation || !remarks) {
      toast({
        title: "Error",
        description: "Please complete all fields before submitting",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Evaluation Submitted",
      description: `Evaluation for ${selectedInterview.applicantName} has been submitted successfully.`,
    })

    // Close dialog
    setSelectedInterview(null)
    setRating("")
    setRecommendation("")
    setRemarks("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <CardTitle className="text-[#800000]">Interview Management</CardTitle>
          <CardDescription>Manage and evaluate scholarship interviews</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, ID, or interview number"
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
                  <SelectItem value="all">All Interviews</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-2 text-left font-medium text-sm">Interview ID</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Applicant Name</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Course</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Schedule</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Status</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((interview) => (
                  <tr key={interview.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm">{interview.id}</td>
                    <td className="py-3 px-2 text-sm">{interview.applicantName}</td>
                    <td className="py-3 px-2 text-sm">{interview.course}</td>
                    <td className="py-3 px-2 text-sm">
                      {interview.scheduleDate} at {interview.scheduleTime}
                    </td>
                    <td className="py-3 px-2 text-sm">{getStatusBadge(interview.status)}</td>
                    <td className="py-3 px-2 text-sm">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedInterview(interview)}
                            >
                              {interview.status === "scheduled" ? (
                                <Calendar className="h-4 w-4" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Interview Details</DialogTitle>
                              <DialogDescription>
                                {interview.status === "scheduled"
                                  ? `Upcoming interview with ${interview.applicantName}`
                                  : `Evaluate interview with ${interview.applicantName}`}
                              </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                              </TabsList>

                              <TabsContent value="details" className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Applicant Name</p>
                                    <p>{interview.applicantName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Applicant ID</p>
                                    <p>{interview.applicantId}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Course</p>
                                    <p>{interview.course}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <p>{getStatusBadge(interview.status)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Schedule Date</p>
                                    <p>{interview.scheduleDate}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Schedule Time</p>
                                    <p>{interview.scheduleTime}</p>
                                  </div>
                                </div>

                                {interview.status === "scheduled" && (
                                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                                    <div className="flex">
                                      <div className="flex-shrink-0">
                                        <Clock className="h-5 w-5 text-blue-400" />
                                      </div>
                                      <div className="ml-3">
                                        <p className="text-sm text-blue-700">
                                          <strong>Upcoming Interview:</strong> Please prepare your evaluation form and
                                          review the applicant's documents before the interview.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {interview.status === "completed" && (
                                  <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
                                    <div className="flex">
                                      <div className="flex-shrink-0">
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                      </div>
                                      <div className="ml-3">
                                        <p className="text-sm text-green-700">
                                          <strong>Interview Completed:</strong> Your evaluation has been recorded.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="documents" className="space-y-4 py-4">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-5 w-5 text-[#800000]" />
                                      <div>
                                        <p className="font-medium">Application Form</p>
                                        <p className="text-sm text-gray-500">Submitted application details</p>
                                      </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                      <Download className="mr-2 h-4 w-4" />
                                      View
                                    </Button>
                                  </div>

                                  <div className="flex justify-between items-center p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-5 w-5 text-[#800000]" />
                                      <div>
                                        <p className="font-medium">Academic Records</p>
                                        <p className="text-sm text-gray-500">Grades and academic achievements</p>
                                      </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                      <Download className="mr-2 h-4 w-4" />
                                      View
                                    </Button>
                                  </div>

                                  <div className="flex justify-between items-center p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-5 w-5 text-[#800000]" />
                                      <div>
                                        <p className="font-medium">Personality Test Results</p>
                                        <p className="text-sm text-gray-500">Personality assessment profile</p>
                                      </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                      <Download className="mr-2 h-4 w-4" />
                                      View
                                    </Button>
                                  </div>

                                  <div className="flex justify-between items-center p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-5 w-5 text-[#800000]" />
                                      <div>
                                        <p className="font-medium">Interview Guide</p>
                                        <p className="text-sm text-gray-500">
                                          Suggested questions and evaluation criteria
                                        </p>
                                      </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                      <Download className="mr-2 h-4 w-4" />
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="evaluation" className="space-y-4 py-4">
                                {interview.status === "completed" && interview.recommendation ? (
                                  <div className="space-y-4">
                                    <div
                                      className={`p-4 border-l-4 ${
                                        interview.recommendation === "approve"
                                          ? "bg-green-50 border-green-400"
                                          : "bg-red-50 border-red-400"
                                      }`}
                                    >
                                      <div className="flex">
                                        <div className="flex-shrink-0">
                                          {interview.recommendation === "approve" ? (
                                            <CheckCircle
                                              className={`h-5 w-5 ${
                                                interview.recommendation === "approve"
                                                  ? "text-green-400"
                                                  : "text-red-400"
                                              }`}
                                            />
                                          ) : (
                                            <XCircle
                                              className={`h-5 w-5 ${
                                                interview.recommendation === "approve"
                                                  ? "text-green-400"
                                                  : "text-red-400"
                                              }`}
                                            />
                                          )}
                                        </div>
                                        <div className="ml-3">
                                          <p
                                            className={`text-sm ${
                                              interview.recommendation === "approve" ? "text-green-700" : "text-red-700"
                                            }`}
                                          >
                                            <strong>
                                              {interview.recommendation === "approve"
                                                ? "Recommended for Approval"
                                                : "Not Recommended"}
                                            </strong>
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-gray-500">Rating</Label>
                                      <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-5 w-5 ${
                                              star <= interview.rating
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        ))}
                                        <span className="ml-2 text-sm font-medium">{interview.rating}/5</span>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-gray-500">Remarks</Label>
                                      <div className="p-3 bg-gray-50 rounded-md">
                                        <p className="text-sm">{interview.remarks}</p>
                                      </div>
                                    </div>

                                    <div className="pt-4">
                                      <Button variant="outline" className="mr-2">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Evaluation
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {interview.status === "completed" ? (
                                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                        <div className="flex">
                                          <div className="flex-shrink-0">
                                            <Clock className="h-5 w-5 text-yellow-400" />
                                          </div>
                                          <div className="ml-3">
                                            <p className="text-sm text-yellow-700">
                                              <strong>Evaluation Pending:</strong> Please complete your evaluation for
                                              this interview.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                        <div className="flex">
                                          <div className="flex-shrink-0">
                                            <Calendar className="h-5 w-5 text-blue-400" />
                                          </div>
                                          <div className="ml-3">
                                            <p className="text-sm text-blue-700">
                                              <strong>Interview Scheduled:</strong> You can submit your evaluation after
                                              the interview is completed.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {interview.status === "completed" && (
                                      <>
                                        <div className="space-y-2">
                                          <Label htmlFor="rating">Overall Rating</Label>
                                          <RadioGroup
                                            value={rating}
                                            onValueChange={setRating}
                                            className="flex space-x-1"
                                          >
                                            {[1, 2, 3, 4, 5].map((value) => (
                                              <div key={value} className="flex flex-col items-center">
                                                <RadioGroupItem
                                                  value={value.toString()}
                                                  id={`rating-${value}`}
                                                  className="sr-only"
                                                />
                                                <Label
                                                  htmlFor={`rating-${value}`}
                                                  className={`cursor-pointer p-2 hover:text-yellow-400 ${
                                                    Number.parseInt(rating) >= value
                                                      ? "text-yellow-400"
                                                      : "text-gray-400"
                                                  }`}
                                                >
                                                  <Star
                                                    className={`h-8 w-8 ${
                                                      Number.parseInt(rating) >= value ? "fill-yellow-400" : ""
                                                    }`}
                                                  />
                                                </Label>
                                                <span className="text-xs">{value}</span>
                                              </div>
                                            ))}
                                          </RadioGroup>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="recommendation">Recommendation</Label>
                                          <RadioGroup
                                            value={recommendation}
                                            onValueChange={(value) => setRecommendation(value as "approve" | "reject")}
                                            className="space-y-3"
                                          >
                                            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                                              <RadioGroupItem value="approve" id="approve" />
                                              <Label htmlFor="approve" className="flex-1 cursor-pointer">
                                                Recommend for Approval
                                              </Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                                              <RadioGroupItem value="reject" id="reject" />
                                              <Label htmlFor="reject" className="flex-1 cursor-pointer">
                                                Do Not Recommend
                                              </Label>
                                            </div>
                                          </RadioGroup>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="remarks">Remarks and Justification</Label>
                                          <Textarea
                                            id="remarks"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Provide detailed remarks and justification for your recommendation"
                                            rows={5}
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>

                            <DialogFooter className="pt-4">
                              {interview.status === "scheduled" && (
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    toast({
                                      title: "Reminder Sent",
                                      description: "Calendar invitation has been sent to your email.",
                                    })
                                  }}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Add to Calendar
                                </Button>
                              )}

                              {interview.status === "completed" && !interview.recommendation && (
                                <Button
                                  className="bg-[#800000] hover:bg-[#600000]"
                                  onClick={handleSubmitEvaluation}
                                  disabled={!rating || !recommendation || !remarks}
                                >
                                  Submit Evaluation
                                </Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

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

                {filteredInterviews.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No interviews found matching your criteria
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

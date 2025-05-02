"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Calendar, FileText, User, CheckCircle, XCircle, AlertCircle, Download, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Applicant {
  id: string
  name: string
  course: string
  year: string
  applicationId: string
  status: "pending" | "scheduled" | "completed" | "recommended" | "rejected"
  scheduleDate?: string
  scheduleTime?: string
  personalityResults?: {
    extraversion: number
    conscientiousness: number
    agreeableness: number
    neuroticism: number
    openness: number
  }
}

// Sample applicants data
const applicants: Applicant[] = [
  {
    id: "1",
    name: "Juan Dela Cruz",
    course: "BS Information Technology",
    year: "2nd Year",
    applicationId: "NAS-2023-0001",
    status: "pending",
    personalityResults: {
      extraversion: 75,
      conscientiousness: 82,
      agreeableness: 90,
      neuroticism: 45,
      openness: 88,
    },
  },
  {
    id: "2",
    name: "Maria Santos",
    course: "BS Computer Science",
    year: "3rd Year",
    applicationId: "NAS-2023-0002",
    status: "scheduled",
    scheduleDate: "2023-06-15",
    scheduleTime: "10:00 AM",
    personalityResults: {
      extraversion: 65,
      conscientiousness: 92,
      agreeableness: 78,
      neuroticism: 35,
      openness: 80,
    },
  },
  {
    id: "3",
    name: "Pedro Reyes",
    course: "BS Civil Engineering",
    year: "2nd Year",
    applicationId: "NAS-2023-0003",
    status: "completed",
    scheduleDate: "2023-06-10",
    scheduleTime: "2:00 PM",
    personalityResults: {
      extraversion: 55,
      conscientiousness: 88,
      agreeableness: 72,
      neuroticism: 60,
      openness: 75,
    },
  },
]

export function PanelEvaluation() {
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [evaluationTab, setEvaluationTab] = useState("profile")
  const [recommendation, setRecommendation] = useState<"recommended" | "rejected" | "">("")
  const [remarks, setRemarks] = useState("")
  const { toast } = useToast()

  const handleSelectApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant)
    setEvaluationTab("profile")
    setRecommendation("")
    setRemarks("")
  }

  const handleScheduleInterview = () => {
    if (!selectedApplicant) return

    toast({
      title: "Interview Scheduled",
      description: `Interview for ${selectedApplicant.name} has been scheduled successfully.`,
    })

    // In a real app, this would update the database
    setSelectedApplicant({
      ...selectedApplicant,
      status: "scheduled",
      scheduleDate: "2023-06-20",
      scheduleTime: "1:00 PM",
    })
  }

  const handleSubmitEvaluation = () => {
    if (!selectedApplicant || !recommendation) return

    toast({
      title: "Evaluation Submitted",
      description: `Your evaluation for ${selectedApplicant.name} has been submitted successfully.`,
    })

    // In a real app, this would update the database
    setSelectedApplicant({
      ...selectedApplicant,
      status: recommendation,
    })
  }

  const getStatusBadge = (status: Applicant["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      case "scheduled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Calendar className="w-3 h-3 mr-1" />
            Scheduled
          </span>
        )
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <FileText className="w-3 h-3 mr-1" />
            Completed
          </span>
        )
      case "recommended":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Recommended
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        )
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Applicant List */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
            <CardTitle className="text-[#800000]">Assigned Applicants</CardTitle>
            <CardDescription>Select an applicant to view details or schedule an interview</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {applicants.map((applicant) => (
                <li
                  key={applicant.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedApplicant?.id === applicant.id ? "bg-gray-50" : ""
                  }`}
                  onClick={() => handleSelectApplicant(applicant)}
                >
                  <div className="flex items-start">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt={applicant.name} />
                      <AvatarFallback>
                        {applicant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{applicant.name}</p>
                      <p className="text-sm text-gray-500 truncate">{applicant.course}</p>
                      <div className="mt-1">{getStatusBadge(applicant.status)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Applicant Details and Evaluation */}
      <div className="md:col-span-2">
        {selectedApplicant ? (
          <Card>
            <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-[#800000]">{selectedApplicant.name}</CardTitle>
                  <CardDescription>
                    {selectedApplicant.course} - {selectedApplicant.year}
                  </CardDescription>
                </div>
                <div>{getStatusBadge(selectedApplicant.status)}</div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={evaluationTab} onValueChange={setEvaluationTab}>
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="personality">Personality Results</TabsTrigger>
                  <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Application ID</Label>
                      <p>{selectedApplicant.applicationId}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Status</Label>
                      <p className="capitalize">{selectedApplicant.status}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Course</Label>
                      <p>{selectedApplicant.course}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Year Level</Label>
                      <p>{selectedApplicant.year}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">Application Documents</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-[#800000]" />
                          <span>Application Form</span>
                        </div>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-[#800000]" />
                          <span>Grade Report</span>
                        </div>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-[#800000]" />
                          <span>Income Tax Return</span>
                        </div>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>

                  {selectedApplicant.status === "pending" && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            This applicant is waiting for an interview schedule. Please set a date and time for the
                            interview.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedApplicant.status === "scheduled" && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            <strong>Interview Scheduled:</strong> {selectedApplicant.scheduleDate} at{" "}
                            {selectedApplicant.scheduleTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedApplicant.status === "pending" && (
                    <div className="space-y-4 border p-4 rounded-lg">
                      <h3 className="font-medium">Schedule Interview</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="interview-date">Date</Label>
                          <Input id="interview-date" type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="interview-time">Time</Label>
                          <Input id="interview-time" type="time" />
                        </div>
                      </div>
                      <Button onClick={handleScheduleInterview} className="w-full bg-[#800000] hover:bg-[#600000]">
                        Schedule Interview
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="personality" className="space-y-6">
                  {selectedApplicant.personalityResults ? (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-4">Personality Trait Scores</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Extraversion</span>
                              <span className="text-sm text-gray-500">
                                {selectedApplicant.personalityResults.extraversion}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${selectedApplicant.personalityResults.extraversion}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Conscientiousness</span>
                              <span className="text-sm text-gray-500">
                                {selectedApplicant.personalityResults.conscientiousness}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-green-600 h-2.5 rounded-full"
                                style={{ width: `${selectedApplicant.personalityResults.conscientiousness}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Agreeableness</span>
                              <span className="text-sm text-gray-500">
                                {selectedApplicant.personalityResults.agreeableness}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-purple-600 h-2.5 rounded-full"
                                style={{ width: `${selectedApplicant.personalityResults.agreeableness}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Emotional Stability</span>
                              <span className="text-sm text-gray-500">
                                {100 - selectedApplicant.personalityResults.neuroticism}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-yellow-600 h-2.5 rounded-full"
                                style={{ width: `${100 - selectedApplicant.personalityResults.neuroticism}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Openness</span>
                              <span className="text-sm text-gray-500">
                                {selectedApplicant.personalityResults.openness}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-red-600 h-2.5 rounded-full"
                                style={{ width: `${selectedApplicant.personalityResults.openness}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-medium">Personality Analysis</h3>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">
                            Extraversion ({selectedApplicant.personalityResults.extraversion}%)
                          </h4>
                          <p className="text-sm text-gray-600">
                            {selectedApplicant.personalityResults.extraversion > 70
                              ? "The applicant is highly sociable, outgoing, and energetic. They likely thrive in group settings and enjoy interacting with others."
                              : selectedApplicant.personalityResults.extraversion > 50
                                ? "The applicant has a balanced approach to social interactions, being neither too reserved nor overly outgoing."
                                : "The applicant tends to be more reserved and may prefer working independently or in smaller groups."}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">
                            Conscientiousness ({selectedApplicant.personalityResults.conscientiousness}%)
                          </h4>
                          <p className="text-sm text-gray-600">
                            {selectedApplicant.personalityResults.conscientiousness > 70
                              ? "The applicant is highly organized, responsible, and detail-oriented. They likely have strong work ethics and are reliable."
                              : selectedApplicant.personalityResults.conscientiousness > 50
                                ? "The applicant shows a reasonable level of organization and responsibility in their approach to tasks."
                                : "The applicant may be more flexible and spontaneous in their approach to tasks and responsibilities."}
                          </p>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <Download className="h-4 w-4" />
                        Download Full Personality Report
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No personality test results available for this applicant.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="evaluation" className="space-y-6">
                  {selectedApplicant.status === "completed" || selectedApplicant.status === "scheduled" ? (
                    <>
                      <div className="space-y-4">
                        <h3 className="font-medium">Interview Evaluation</h3>
                        <div className="space-y-2">
                          <Label htmlFor="recommendation">Recommendation</Label>
                          <RadioGroup
                            value={recommendation}
                            onValueChange={(value) => setRecommendation(value as "recommended" | "rejected")}
                            className="space-y-3"
                          >
                            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                              <RadioGroupItem value="recommended" id="recommended" />
                              <Label htmlFor="recommended" className="flex-1 cursor-pointer">
                                Recommend for Scholarship
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                              <RadioGroupItem value="rejected" id="rejected" />
                              <Label htmlFor="rejected" className="flex-1 cursor-pointer">
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

                        <div className="space-y-2">
                          <Label htmlFor="evaluation-file">Upload Evaluation Form (Optional)</Label>
                          <div className="flex items-center justify-center w-full">
                            <label
                              htmlFor="evaluation-file"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">PDF, DOC, or DOCX (MAX. 2MB)</p>
                              </div>
                              <input id="evaluation-file" type="file" className="hidden" />
                            </label>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleSubmitEvaluation}
                        className="w-full bg-[#800000] hover:bg-[#600000]"
                        disabled={!recommendation || !remarks}
                      >
                        Submit Evaluation
                      </Button>
                    </>
                  ) : selectedApplicant.status === "recommended" || selectedApplicant.status === "rejected" ? (
                    <div className="text-center py-8">
                      <div
                        className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                          selectedApplicant.status === "recommended" ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {selectedApplicant.status === "recommended" ? (
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        ) : (
                          <XCircle className="h-8 w-8 text-red-600" />
                        )}
                      </div>
                      <h3 className="text-xl font-medium mb-2">
                        {selectedApplicant.status === "recommended" ? "Recommended for Scholarship" : "Not Recommended"}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your evaluation for this applicant has been submitted and recorded.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Interview Not Yet Conducted</h3>
                      <p className="text-gray-600">
                        Please schedule and complete the interview before submitting an evaluation.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Applicant Selected</h3>
              <p className="text-gray-500 text-center max-w-md">
                Please select an applicant from the list to view their details, schedule an interview, or submit an
                evaluation.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

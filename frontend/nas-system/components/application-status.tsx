"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertTriangle, HelpCircle, FileText, Download } from "lucide-react"

type StatusType = "pending" | "reviewing" | "approved" | "rejected" | "incomplete"

interface StatusStep {
  id: number
  title: string
  description: string
  date: string | null
  status: StatusType
}

export function ApplicationStatus() {
  // This would come from an API in a real application
  const applicationStatus: StatusType = "reviewing"
  const applicationId = "NAS-2023-12345"
  const submissionDate = "2023-05-15"

  const statusSteps: StatusStep[] = [
    {
      id: 1,
      title: "Application Submitted",
      description: "Your application has been received by our system.",
      date: submissionDate,
      status: "approved",
    },
    {
      id: 2,
      title: "Document Verification",
      description: "We are verifying the documents you submitted.",
      date: "2023-05-18",
      status: "approved",
    },
    {
      id: 3,
      title: "Application Review",
      description: "Your application is being reviewed by the scholarship committee.",
      date: null,
      status: "reviewing",
    },
    {
      id: 4,
      title: "Interview",
      description: "You may be called for an interview if shortlisted.",
      date: null,
      status: "pending",
    },
    {
      id: 5,
      title: "Final Decision",
      description: "The final decision on your scholarship application.",
      date: null,
      status: "pending",
    },
  ]

  const getStatusBadge = (status: StatusType) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-500">
            Pending
          </Badge>
        )
      case "reviewing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            In Progress
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Completed
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700">
            Rejected
          </Badge>
        )
      case "incomplete":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
            Incomplete
          </Badge>
        )
    }
  }

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-gray-400" />
      case "reviewing":
        return <HelpCircle className="h-6 w-6 text-blue-500" />
      case "approved":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "rejected":
        return <AlertTriangle className="h-6 w-6 text-red-500" />
      case "incomplete":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
    }
  }

  const getOverallStatusBadge = () => {
    switch (applicationStatus) {
      case "pending":
        return <Badge className="bg-gray-500">Pending</Badge>
      case "reviewing":
        return <Badge className="bg-blue-500">Under Review</Badge>
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      case "incomplete":
        return <Badge className="bg-yellow-500">Incomplete</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-[#800000]">Application Status</CardTitle>
              <CardDescription>Track the progress of your scholarship application</CardDescription>
            </div>
            <div className="flex flex-col items-end">
              {getOverallStatusBadge()}
              <span className="text-sm text-gray-500 mt-1">Application ID: {applicationId}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-8">
            {statusSteps.map((step, index) => (
              <div key={step.id} className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white">
                    {getStatusIcon(step.status)}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`w-0.5 h-full mt-2 ${step.status === "approved" ? "bg-green-500" : "bg-gray-200"}`}
                    />
                  )}
                </div>
                <div className="pb-8 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{step.title}</h3>
                      <p className="text-gray-600 mt-1">{step.description}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      {getStatusBadge(step.status)}
                      {step.date && <span className="text-sm text-gray-500 mt-1">{step.date}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <CardTitle className="text-[#800000]">Application Documents</CardTitle>
          <CardDescription>View and download your submitted documents</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#800000]" />
                <div>
                  <p className="font-medium">Application Form</p>
                  <p className="text-sm text-gray-500">Submitted on {submissionDate}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#800000]" />
                <div>
                  <p className="font-medium">Grade Report</p>
                  <p className="text-sm text-gray-500">Submitted on {submissionDate}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#800000]" />
                <div>
                  <p className="font-medium">Income Tax Return</p>
                  <p className="text-sm text-gray-500">Submitted on {submissionDate}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <CardTitle className="text-[#800000]">Notifications</CardTitle>
          <CardDescription>Recent updates about your application</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
              <p className="font-medium text-blue-700">Document Verification Complete</p>
              <p className="text-sm text-gray-600">Your documents have been verified successfully.</p>
              <p className="text-xs text-gray-500 mt-1">May 18, 2023 - 10:23 AM</p>
            </div>

            <div className="p-3 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
              <p className="font-medium text-green-700">Application Received</p>
              <p className="text-sm text-gray-600">Your application has been received and is being processed.</p>
              <p className="text-xs text-gray-500 mt-1">May 15, 2023 - 2:45 PM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

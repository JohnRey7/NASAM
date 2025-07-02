"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, HelpCircle, CheckCircle, AlertTriangle } from "lucide-react"

// Define the status type
type StatusType = "pending" | "reviewing" | "approved" | "rejected" | "incomplete"

export function ApplicationStatus() {
  // Fix: Explicitly type the variable as StatusType, not the literal "reviewing"
  const [currentStatus] = useState<StatusType>("reviewing")
  
  // OR if getting from props, type it properly:
  // const currentStatus: StatusType = props.status || "pending"

  const getStatusBadge = (status: StatusType) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
            Pending
          </Badge>
        )
      case "reviewing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Under Review
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Approved
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
          <Badge variant="outline" className="bg-orange-100 text-orange-700">
            Incomplete
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            Unknown
          </Badge>
        )
    }
  }

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-400" />
      case "reviewing":
        return <HelpCircle className="h-6 w-6 text-blue-500" />
      case "approved":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "rejected":
        return <AlertTriangle className="h-6 w-6 text-red-500" />
      case "incomplete":
        return <AlertTriangle className="h-6 w-6 text-orange-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-400" />
    }
  }

  const getOverallStatusBadge = () => {
    // This will now work because currentStatus is properly typed as StatusType
    switch (currentStatus) {
      case "pending":
        return getStatusBadge("pending")
      case "reviewing":
        return getStatusBadge("reviewing")
      case "approved":
        return getStatusBadge("approved")
      case "rejected":
        return getStatusBadge("rejected")
      case "incomplete":
        return getStatusBadge("incomplete")
      default:
        return getStatusBadge("pending")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-[#800000]">
          {getStatusIcon(currentStatus)}
          <span className="ml-2">Application Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Current Status:</span>
            {getOverallStatusBadge()}
          </div>

          {/* Status descriptions - these will now work */}
          <div className="text-sm text-gray-600">
            {currentStatus === "pending" && "Your application is waiting for review."}
            {currentStatus === "reviewing" && "Your application is currently being reviewed by our staff."}
            {currentStatus === "approved" && "Congratulations! Your application has been approved."}
            {currentStatus === "rejected" && "Unfortunately, your application was not approved."}
            {currentStatus === "incomplete" && "Additional information or documents are required."}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

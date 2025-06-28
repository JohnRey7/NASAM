// components/application-progress-tracker.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle, HelpCircle, FileText } from "lucide-react"

// Using your existing StatusType
type StatusType = "pending" | "reviewing" | "approved" | "rejected" | "incomplete"

type ApplicationStage = {
  id: string
  name: string
  status: StatusType | "current" | "completed"
  date?: string
  description: string
}

const getApplicationStages = (currentStatus: StatusType): ApplicationStage[] => [
  {
    id: "submitted",
    name: "Application Submitted",
    status: "completed",
    description: "Application form and documents received"
  },
  {
    id: "reviewing", 
    name: "Under Review",
    status: currentStatus === "reviewing" ? "current" : 
           currentStatus === "pending" ? "pending" : "completed",
    description: "Document verification and initial screening"
  },
  {
    id: "evaluation",
    name: "Evaluation Phase", 
    status: currentStatus === "approved" || currentStatus === "rejected" ? "completed" :
           currentStatus === "reviewing" ? "current" : "pending",
    description: "Assessment and interview process"
  },
  {
    id: "decision",
    name: "Final Decision",
    status: currentStatus === "approved" ? "completed" :
           currentStatus === "rejected" ? "completed" : "pending", 
    description: "Application approval or rejection"
  }
]

interface Props {
  applicationStatus: StatusType
  lastUpdated?: string
}

export function ApplicationProgressTracker({ applicationStatus, lastUpdated }: Props) {
  const stages = getApplicationStages(applicationStatus)
  
  // Reusing your existing getStatusIcon logic
  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "current":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "reviewing":
        return <HelpCircle className="h-5 w-5 text-blue-500" />
      case "pending":
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  // Reusing your existing getStatusBadge logic
  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 border-green-300"
      case "current":
      case "reviewing":
        return "bg-blue-100 border-blue-300"
      case "pending":
        return "bg-gray-50 border-gray-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-[#800000]">
          <FileText className="h-5 w-5 mr-2" />
          Application Progress
        </CardTitle>
        {lastUpdated && (
          <p className="text-sm text-gray-500">
            Last updated: {new Date(lastUpdated).toLocaleDateString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                {getStageIcon(stage.status)}
                {index < stages.length - 1 && (
                  <div className={`w-px h-12 mt-2 ${
                    stage.status === "completed" ? "bg-green-300" : "bg-gray-200"
                  }`} />
                )}
              </div>
              
              <div className={`flex-1 p-4 rounded-lg border-2 ${getStageColor(stage.status)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm">{stage.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{stage.description}</p>
                  </div>
                  <Badge variant={stage.status === "completed" ? "default" : "outline"}>
                    {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
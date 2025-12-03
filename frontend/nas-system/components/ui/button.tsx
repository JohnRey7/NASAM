"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle, Users, FileText, MessageSquare } from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        outline: "border border-gray-300 bg-white hover:bg-gray-50",
        ghost: "hover:bg-gray-100",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        link: "text-blue-600 underline-offset-4 hover:underline",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { buttonVariants }

type ApplicationStage = {
  id: string
  name: string
  status: "completed" | "current" | "pending" | "skipped"
  date?: string
  description: string
}

const applicationStages: ApplicationStage[] = [
  {
    id: "submitted",
    name: "Application Submitted",
    status: "completed",
    date: "2024-01-15",
    description: "Application form and documents received"
  },
  {
    id: "paper-screening",
    name: "Paper Screening",
    status: "completed", 
    date: "2024-01-18",
    description: "Document verification and initial review"
  },
  {
    id: "personality-test",
    name: "Personality Test",
    status: "current",
    description: "Psychological assessment phase"
  },
  {
    id: "interview",
    name: "Interview",
    status: "pending",
    description: "Panel interview with evaluators"
  },
  {
    id: "final-decision",
    name: "Final Decision",
    status: "pending",
    description: "Application approval or rejection"
  }
]

export function ApplicationProgressTracker() {
  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "current":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "pending":
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 border-green-300"
      case "current":
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applicationStages.map((stage, index) => (
            <div key={stage.id} className="flex items-start space-x-4">
              {/* Progress Line */}
              <div className="flex flex-col items-center">
                {getStageIcon(stage.status)}
                {index < applicationStages.length - 1 && (
                  <div className={`w-px h-12 mt-2 ${
                    stage.status === "completed" ? "bg-green-300" : "bg-gray-200"
                  }`} />
                )}
              </div>
              
              {/* Stage Info */}
              <div className={`flex-1 p-4 rounded-lg border-2 ${getStageColor(stage.status)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm">{stage.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{stage.description}</p>
                    {stage.date && (
                      <p className="text-xs text-gray-500 mt-2">
                        Completed: {new Date(stage.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant={stage.status === "completed" ? "default" : "outline"}>
                    {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="default" className="w-full">
            Submit Application
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

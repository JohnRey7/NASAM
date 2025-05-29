"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCheck } from "lucide-react"
export function NASSupervisorEvaluations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Interview Evaluations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Evaluation System</h3>
          <p className="text-gray-600">
            The evaluation submission system is currently being developed. 
            You will be able to submit interview evaluations here once it's ready.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

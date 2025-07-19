// components/application-progress-tracker.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, FileText, Users, Award } from "lucide-react"

export function ApplicationProgressTracker() {
  const [applicationStatus, setApplicationStatus] = useState<string>("Pending")
  const [hasDocuments, setHasDocuments] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch application status and documents
  useEffect(() => {
    const fetchApplicationProgress = async () => {
      try {
        setLoading(true)
        
        // Check application status
        const appResponse = await fetch('http://localhost:3000/api/application', {
          credentials: 'include'
        })
        
        if (appResponse.ok) {
          const appData = await appResponse.json()
          
          // Only set status if application actually exists
          if (appData.application) {
            if (appData.application.status) {
              setApplicationStatus(appData.application.status)
            } else {
              setApplicationStatus("Submitted") // Has application but no specific status
            }
          } else {
            setApplicationStatus("None") // No application exists
          }
        } else {
          setApplicationStatus("None") // Request failed, no application
        }

        // Check documents
        const docResponse = await fetch('http://localhost:3000/api/documents', {
          credentials: 'include'
        })
        
        if (docResponse.ok) {
          const docData = await docResponse.json()
          
          if (docData.document) {
            const hasAnyDocuments = [
              docData.document.studentPicture,
              docData.document.nbiClearance?.length > 0,
              docData.document.gradeReport?.length > 0,
              docData.document.incomeTaxReturn?.length > 0,
              docData.document.goodMoralCertificate?.length > 0,
              docData.document.physicalCheckup?.length > 0,
              docData.document.homeLocationSketch?.length > 0
            ].some(Boolean)
            
            setHasDocuments(hasAnyDocuments)
          } else {
            setHasDocuments(false)
          }
        } else {
          setHasDocuments(false)
        }
        
      } catch (error) {
        console.error('Error fetching application progress:', error)
        setApplicationStatus("None")
        setHasDocuments(false)
      } finally {
        setLoading(false)
      }
    }
    
    fetchApplicationProgress()
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchApplicationProgress, 30000)
    return () => clearInterval(interval)
  }, [])

  // Application progress steps in order
  const progressSteps = [
    {
      title: "Application Submitted",
      description: "Application form and documents received", 
      // If application exists at all (not "None"), mark as completed
      status: (applicationStatus !== "None") ? "Completed" : "Pending",
      icon: <FileText className="h-6 w-6" />
    },
    {
      title: "Under Review",
      description: "Document verification and initial screening",
      // Only completed if has documents OR admin changed status
      status: (hasDocuments || ["Document Verification", "Interview Scheduled", "Approved", "Rejected"].includes(applicationStatus)) 
        ? "Completed" : "Pending",
      icon: <CheckCircle className="h-6 w-6" />
    },
    {
      title: "Evaluation Phase", 
      description: "Assessment and interview process",
      status: ["Interview Scheduled", "Approved", "Rejected"].includes(applicationStatus) 
        ? "Completed" : "Pending",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Final Decision",
      description: "Application approval or rejection",
      status: ["Approved", "Rejected"].includes(applicationStatus) 
        ? "Completed" : "Pending",
      icon: <Award className="h-6 w-6" />
    }
  ]

  // Calculate overall progress
  const completedSteps = progressSteps.filter(step => step.status === "Completed").length
  const progress = Math.round((completedSteps / progressSteps.length) * 100)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
            <span className="ml-2 text-gray-600">Loading application status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[#800000]">
          <span>Application Progress</span>
          <span className="text-sm bg-[#800000] text-white px-3 py-1 rounded-full">
            {progress}% Complete
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-[#800000] h-2 rounded-full transition-all duration-700 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {progressSteps.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Connector Line */}
              {idx < progressSteps.length - 1 && (
                <div className="absolute left-3 top-6 bottom-[-32px] w-0.5 bg-gray-200" />
              )}
              
              <div className="flex items-start gap-6">
                {/* Status Icon */}
                <div className={`rounded-full p-1 ${step.status === "Completed" ? "bg-green-100" : "bg-yellow-100"}`}>
                  {step.status === "Completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                
                {/* Step Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      step.status === "Completed" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {step.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                  
                  {/* Show additional info for document step */}
                  {idx === 1 && step.status === "Completed" && hasDocuments && (
                    <div className="mt-2 text-xs text-green-600">
                      ✓ Documents uploaded successfully
                    </div>
                  )}
                  
                  {/* Timeline */}
                  <div className="mt-2 text-xs text-gray-400">
                    {step.status === "Completed" ? "Completed" : "Pending"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ApplicationProgressTracker
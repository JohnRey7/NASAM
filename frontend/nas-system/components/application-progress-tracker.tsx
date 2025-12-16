// components/application-progress-tracker.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, FileText, Users, Award, Calendar, Loader2 } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Comprehensive status interface matching backend response
interface ComprehensiveStatus {
  applicationForm: {
    status: string;
    message: string;
    submittedAt?: string;
    verifiedAt?: string;
  };
  documents: {
    status: string;
    message: string;
    uploadedCount: number;
    requiredCount: number;
    uploadedDocuments?: string[];
  };
  personalityTest: {
    status: string;
    message: string;
    completedAt?: string;
  };
  interview: {
    status: string;
    message: string;
    totalInterviews: number;
    completedInterviews: number;
    oasInterview?: {
      scheduledDateTime: string;
      endDateTime: string;
      isFinished: boolean;
    };
    departmentHeadInterview?: {
      scheduledDateTime: string;
      endDateTime: string;
      isFinished: boolean;
    };
    allInterviews?: Array<{
      id: string;
      type: string;
      scheduledDateTime: string;
      isFinished: boolean;
    }>;
  };
  evaluation: {
    status: string;
    message: string;
    grade: number | null;
    result: string | null;
    passingGrade?: number;
  };
  applicationStatus: {
    status: string;
    message: string;
    displayStatus: string;
    updatedAt?: string;
  };
}

export function ApplicationProgressTracker() {
  const [status, setStatus] = useState<ComprehensiveStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch comprehensive status from new endpoint
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/status/me`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          if (response.status === 404) {
            setStatus(null)
            setError(null)
            return
          }
          throw new Error('Failed to fetch status')
        }
        
        const data = await response.json()
        if (data.success && data.data) {
          setStatus(data.data)
          setError(null)
        } else {
          setStatus(null)
        }
      } catch (err) {
        console.error('Error fetching status:', err)
        setError('Failed to load application status')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStatus()
    
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Derive status flags from comprehensive status
  const hasApplication = status?.applicationForm?.status !== 'not_submitted'
  // Use the corrected status from backend (which checks evaluation state)
  const applicationStatusValue = status?.applicationStatus?.status || 'none'
  const displayStatus = status?.applicationStatus?.displayStatus || applicationStatusValue
  
  // Determine step completion based on status
  const isApplicationFormComplete = status?.applicationForm?.status === 'verified'
  const isDocumentsComplete = status?.documents?.status === 'verified'
  const isPersonalityTestComplete = status?.personalityTest?.status === 'completed'
  const isInterviewComplete = status?.interview?.status === 'completed'
  
  // Get next interview info
  const nextInterview = status?.interview?.allInterviews?.find(i => !i.isFinished)

  // Check if documents have been uploaded
  const hasDocumentsUploaded = (status?.documents?.uploadedCount || 0) > 0

  // Application progress steps in order - SEQUENTIAL LOGIC
  const progressSteps = [
    {
      title: "Application Form",
      description: "Application form and documents received", 
      status: !hasApplication ? "Not Submitted" :
              isApplicationFormComplete ? "Completed" :
              "Pending",
      icon: <FileText className="h-6 w-6" />
    },
    {
      title: "Documents",
      description: "Upload required documents for verification",
      // Documents: Locked until application form is verified, then Pending until document_verification
      status: !hasApplication ? "Not Submitted" :
              isDocumentsComplete ? "Completed" :
              isApplicationFormComplete ? "Pending" :
              hasDocumentsUploaded ? "Pending" : "Locked",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Personality Test",
      description: "Complete psychological assessment",
      // Personality Test: Locked until documents are verified
      status: !hasApplication ? "Not Submitted" :
              isPersonalityTestComplete ? "Completed" :
              isDocumentsComplete ? "Pending" : "Locked",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Interview",
      description: "Scheduled interview with OAS and department head",
      // Interview: Locked until personality test is complete
      status: !hasApplication ? "Not Submitted" :
              isInterviewComplete ? "Completed" :
              isPersonalityTestComplete ? "Pending" : "Locked",
      icon: <Calendar className="h-6 w-6" />,
      interviewDate: nextInterview?.scheduledDateTime || status?.interview?.oasInterview?.scheduledDateTime || null
    },
    {
      title: "Application Status",
      description: "Application approval or rejection",
      // Final status: Only show Completed when approved
      // Rejected applications show as Pending (Under Consideration) to applicant
      status: !hasApplication ? "Not Submitted" :
              displayStatus === "approved" ? "Completed" :
              displayStatus === "rejected" ? "Pending" :
              displayStatus === "under_consideration" ? "Pending" :
              applicationStatusValue === "pending_evaluation" ? "Pending" :
              isInterviewComplete ? "Pending" : "Locked",
      icon: <Award className="h-6 w-6" />,
      displayMessage: status?.applicationStatus?.message || '',
      isRejected: displayStatus === "rejected"
    }
  ]

  // Calculate overall progress
  const completedSteps = progressSteps.filter(step => step.status === "Completed").length
  const progress = Math.round((completedSteps / progressSteps.length) * 100)

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#800000]">Application Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#800000]" />
            <span className="ml-3 text-gray-600">Loading your application status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#800000]">Application Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show message to complete application form first
  if (!hasApplication) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#800000]">Application Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Application Found</h3>
            <p className="text-gray-500 mb-4">
              Please complete the Application Form first to view your application progress.
            </p>
            <p className="text-sm text-gray-400">
              Go to the "Application Form" tab to get started.
            </p>
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
                <div className={`rounded-full p-1 ${
                  step.status === "Completed" ? "bg-green-100" : 
                  step.status === "Pending" ? "bg-yellow-100" : "bg-gray-100"
                }`}>
                  {step.status === "Completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : step.status === "Pending" ? (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                {/* Step Details - Enhanced */}
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      step.status === "Completed" 
                        ? "bg-green-100 text-green-800" 
                        : step.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"     
                    }`}>
                      {step.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                  
                  {/* ✅ Enhanced status messages for Application Form step */}
                  {idx === 0 && (
                    <div className="mt-2 text-xs">
                      {step.status === "Pending" && (
                        <span className="text-yellow-600">⏳ Application received, awaiting OAS review</span>
                      )}
                      {step.status === "Completed" && (
                        <span className="text-green-600">✓ Application form processed by OAS staff</span>
                      )}
                    </div>
                  )}

                  {/* ✅ Enhanced status messages for Documents step */}
                  {idx === 1 && (
                    <div className="mt-2 text-xs">
                      {step.status === "Pending" && (
                        <span className="text-yellow-600">⏳ Awaiting OAS staff document review</span>
                      )}
                      {step.status === "Completed" && (
                        <span className="text-green-600">✓ Documents verified by OAS staff</span>
                      )}
                      {step.status === "Locked" && (
                        <span className="text-red-600">🔒 Locked - Application form must be verified first</span>
                      )}
                    </div>
                  )}
                  
                  {/* ✅ Enhanced status messages for Personality Test step */}
                  {idx === 2 && (
                    <div className="mt-2 text-xs">
                      {step.status === "Pending" && (
                        <span className="text-yellow-600">⏳ Ready to take personality assessment</span>
                      )}
                      {step.status === "Completed" && (
                        <span className="text-green-600">✓ Personality test completed</span>
                      )}
                      {step.status === "Locked" && (
                        <span className="text-red-600">🔒 Locked - Complete form and document verification first</span>
                      )}
                    </div>
                  )}

                  {/* ✅ Enhanced status messages for Interview step */}
                  {idx === 3 && (
                    <div className="mt-2 text-xs">
                      {step.status === "Completed" && step.interviewDate && (
                        <div>
                          <span className="text-green-600">✓ Interview completed</span>
                          <div className="mt-1 font-medium text-green-800">
                            {new Date(step.interviewDate).toLocaleString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      )}
                      {step.status === "Pending" && step.interviewDate && (
                        <div>
                          <span className="text-blue-600">📅 Interview scheduled</span>
                          <div className="mt-1 font-medium text-blue-800">
                            {new Date(step.interviewDate).toLocaleString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="mt-2 text-yellow-600">
                            ⏳ Waiting for interviews to be completed
                          </div>
                        </div>
                      )}
                      {step.status === "Pending" && !step.interviewDate && (
                        <span className="text-yellow-600">⏳ Awaiting interview scheduling</span>
                      )}
                      {step.status === "Locked" && (
                        <span className="text-red-600">🔒 Complete personality test first</span>
                      )}
                    </div>
                  )}

                  {/* ✅ Enhanced status messages for Application Status step */}
                  {idx === 4 && (
                    <div className="mt-2 text-xs">
                      {step.status === "Pending" && (
                        <span className="text-yellow-600">⏳ Under consideration - awaiting final decision</span>
                      )}
                      {step.status === "Completed" && displayStatus === "approved" && (
                        <span className="text-green-600">🎉 Application approved!</span>
                      )}
                      {step.status === "Locked" && (
                        <span className="text-red-600">🔒 Complete all previous steps first</span>
                      )}
                    </div>
                  )}
                  
                  {/* Timeline */}
                  <div className="mt-2 text-xs text-gray-400">
                    {step.status === "Completed" ? "Completed" : 
                     step.status === "Pending" ? "Awaiting OAS Action" : "Awaiting"}
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
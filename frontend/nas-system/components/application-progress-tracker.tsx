// components/application-progress-tracker.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, FileText, Users, Award, Calendar, Star } from "lucide-react"
import { applicationService } from "@/services/applicationService"

interface EvaluationStatus {
  hasEvaluation: boolean
  grade?: number
  status?: 'passed' | 'failed'
  passingGrade?: number
}

export function ApplicationProgressTracker() {
  const [applicationStatus, setApplicationStatus] = useState<string>("None")
  const [hasApplication, setHasApplication] = useState(false)
  const [hasDocuments, setHasDocuments] = useState(false)
  const [hasPersonalityTest, setHasPersonalityTest] = useState(false)
  const [interviewData, setInterviewData] = useState<any>(null)
  const [evaluationStatus, setEvaluationStatus] = useState<EvaluationStatus | null>(null)

  // Fetch application status and documents
  useEffect(() => {
    const fetchApplicationProgress = async () => {
      try {
        
        // STEP 1: Check application status FIRST
        const appResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/application`, {
          credentials: 'include'
        })
        
        if (!appResponse.ok || appResponse.status === 404) {
          // No application exists - don't fetch other statuses
          setApplicationStatus("None")
          setHasApplication(false)
          setHasDocuments(false)
          setHasPersonalityTest(false)
          setInterviewData(null)
          setEvaluationStatus(null)
          return // Stop here - no need to fetch other statuses
        }
        
        const appData = await appResponse.json()
        
        if (!appData.application) {
          // No application data - stop here
          setApplicationStatus("None")
          setHasApplication(false)
          return
        }
        
        // Application exists - set status and continue
        const backendStatus = appData.application.status
        console.log('🔍 DEBUG: Backend returned status:', backendStatus)
        setApplicationStatus(backendStatus)
        setHasApplication(true)

        // STEP 2: Only fetch other statuses if application exists
        // Check documents
        try {
          const docResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/documents`, {
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
        } catch (docError) {
          console.error('❌ Document check error:', docError)
          setHasDocuments(false)
        }

        // STEP 3: Check personality test (only if application exists)
        try {
          console.log('🔍 DEBUG: Checking personality test status...')
          const personalityResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/personality-test/status`, {
            credentials: 'include'
          })
          
          if (personalityResponse.ok) {
            const personalityData = await personalityResponse.json()
            const testExists = personalityData.hasTest || personalityData.testId
            setHasPersonalityTest(testExists)
          } else {
            setHasPersonalityTest(false)
          }
        } catch (personalityError) {
          console.error('❌ Personality test error:', personalityError)
          setHasPersonalityTest(false)
        }

        // STEP 4: Check interview data (only if application exists)
        try {
          console.log('🔍 DEBUG: Checking interview data...')
          const interview = await applicationService.getMyInterview()
          setInterviewData(interview)
        } catch (interviewError) {
          console.error('❌ Interview error:', interviewError)
          setInterviewData(null)
        }

        // STEP 5: Check evaluation status (only if application exists)
        try {
          console.log('🔍 DEBUG: Checking evaluation status...')
          const evalResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/evaluation/status/me`, {
            credentials: 'include'
          })
          
          if (evalResponse.ok) {
            const evalData = await evalResponse.json()
            setEvaluationStatus(evalData)
          } else {
            setEvaluationStatus({ hasEvaluation: false })
          }
        } catch (evalError) {
          console.error('❌ Evaluation status error:', evalError)
          setEvaluationStatus({ hasEvaluation: false })
        }
        
      } catch (error) {
        console.error('❌ Error fetching application progress:', error)
        setApplicationStatus("None")
        setHasApplication(false)
        setHasDocuments(false)
        setHasPersonalityTest(false)
      }
    }
    
    fetchApplicationProgress()
    
    // Only poll if we need to (don't poll continuously when no application exists)
    const interval = setInterval(() => {
      // Refresh to check for updates
      fetchApplicationProgress()
    }, 30000) // Increased to 30 seconds to reduce load
    
    return () => clearInterval(interval)
  }, [])

  // Determine if each step is complete for sequential logic
  const isApplicationFormComplete = ["form_verified", "document_verification", "approved", "rejected"].includes(applicationStatus)
  const isDocumentsComplete = ["document_verification", "approved", "rejected"].includes(applicationStatus)
  const isPersonalityTestComplete = hasPersonalityTest
  const isInterviewComplete = interviewData?.interview?.is_finished === true || interviewData?.is_finished === true
  const isEvaluationComplete = evaluationStatus?.hasEvaluation

  // Application progress steps in order - SEQUENTIAL LOGIC
  const progressSteps = [
    {
      title: "Application Form",
      description: "Application form and documents received", 
      status: applicationStatus === "None" ? "Not Submitted" :
              isApplicationFormComplete ? "Completed" :
              "Pending",
      icon: <FileText className="h-6 w-6" />
    },
    {
      title: "Documents",
      description: "Upload required documents for verification",
      // Documents: Locked until application form is verified, then Pending until document_verification
      status: applicationStatus === "None" ? "Not Submitted" :
              isDocumentsComplete ? "Completed" :
              isApplicationFormComplete ? "Pending" :
              hasDocuments ? "Pending" : "Locked",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Personality Test",
      description: "Complete psychological assessment",
      // Personality Test: Locked until documents are verified
      status: applicationStatus === "None" ? "Not Submitted" :
              isPersonalityTestComplete ? "Completed" :
              isDocumentsComplete ? "Pending" : "Locked",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Interview",
      description: "Scheduled interview with department head",
      // Interview: Locked until personality test is complete
      status: applicationStatus === "None" ? "Not Submitted" :
              isInterviewComplete ? "Completed" :
              isPersonalityTestComplete ? "Pending" : "Locked",
      icon: <Calendar className="h-6 w-6" />,
      interviewDate: interviewData?.interview?.startTime || interviewData?.startTime || null
    },
    {
      title: "Evaluation",
      description: "Performance evaluation by OAS Admin",
      // Evaluation: Locked until interview is complete
      status: applicationStatus === "None" ? "Not Submitted" :
              isEvaluationComplete ? "Completed" :
              isInterviewComplete ? "Pending" : "Locked",
      icon: <Star className="h-6 w-6" />,
      evaluationData: evaluationStatus
    },
    {
      title: "Application Status",
      description: "Application approval or rejection",
      // Final status: Only after evaluation is complete
      status: applicationStatus === "None" ? "Not Submitted" :
              applicationStatus === "rejected" ? "Completed" :
              applicationStatus === "approved" ? "Completed" :
              isEvaluationComplete ? "Pending" : "Locked",
      icon: <Award className="h-6 w-6" />
    }
  ]

  // Calculate overall progress
  const completedSteps = progressSteps.filter(step => step.status === "Completed").length
  const progress = Math.round((completedSteps / progressSteps.length) * 100)

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
                  step.status === "Pending" ? "bg-yellow-100" : "bg-gray-100"  // ✅ Gray for not submitted
                }`}>
                  {step.status === "Completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : step.status === "Pending" ? (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />  // ✅ Gray clock for not submitted
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
                            ⏳ Waiting for the Department Head to conduct the interview
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

                  {/* ✅ Enhanced status messages for Evaluation step */}
                  {idx === 4 && (
                    <div className="mt-2 text-xs">
                      {step.status === "Pending" && (
                        <span className="text-yellow-600">⏳ Awaiting evaluation by OAS Admin</span>
                      )}
                      {step.status === "Completed" && step.evaluationData && (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={step.evaluationData.status === 'passed' ? 'text-green-600' : 'text-red-600'}>
                              {step.evaluationData.status === 'passed' ? '✓ Passed' : '✗ Failed'}
                            </span>
                            <span className="text-gray-500">
                              (Grade: {step.evaluationData.grade?.toFixed(2)} / 5.00)
                            </span>
                          </div>
                          <div className="mt-1 text-gray-400">
                            Passing grade: {step.evaluationData.passingGrade?.toFixed(1)} or higher
                          </div>
                        </div>
                      )}
                      {step.status === "Locked" && (
                        <span className="text-red-600">🔒 Complete interview first</span>
                      )}
                    </div>
                  )}

                  {/* ✅ Enhanced status messages for Application Status step */}
                  {idx === 5 && (
                    <div className="mt-2 text-xs">
                      {step.status === "Pending" && (
                        <span className="text-yellow-600">⏳ Awaiting final decision</span>
                      )}
                      {step.status === "Completed" && applicationStatus === "approved" && (
                        <span className="text-green-600">🎉 Application approved!</span>
                      )}
                      {step.status === "Completed" && applicationStatus === "rejected" && (
                        <span className="text-red-600">😢 Application rejected</span>
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
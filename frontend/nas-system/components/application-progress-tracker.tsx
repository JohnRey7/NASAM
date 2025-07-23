// components/application-progress-tracker.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, FileText, Users, Award } from "lucide-react"

export function ApplicationProgressTracker() {
  const [applicationStatus, setApplicationStatus] = useState<string>("Pending")
  const [hasDocuments, setHasDocuments] = useState(false)
  const [hasPersonalityTest, setHasPersonalityTest] = useState(false)
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
          
          if (appData.application) {
            const backendStatus = appData.application.status
            console.log('🔍 DEBUG: Backend returned status:', backendStatus); // ✅ ADD THIS DEBUG
            
            // Set the exact status from backend - DON'T TRANSFORM IT
            setApplicationStatus(backendStatus); // ✅ USE EXACT STATUS
            console.log('🔍 DEBUG: Progress tracker status set to:', backendStatus); // ✅ ADD THIS DEBUG
          }
        } else {
          setApplicationStatus("None")
        }

        // Check documents (existing logic)
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

        // Check if personality test exists for this user
        try {
          console.log('🔍 DEBUG: Checking personality test status...')
          const personalityResponse = await fetch('http://localhost:3000/api/personality-test/status', {
            credentials: 'include'
          })
          
          console.log('🔍 DEBUG: Personality test response status:', personalityResponse.status)
          
          if (personalityResponse.ok) {
            const personalityData = await personalityResponse.json()
            console.log('🔍 DEBUG: Personality test data:', personalityData)
            
            const testExists = personalityData.hasTest || personalityData.testId
            console.log('🔍 DEBUG: Test exists:', testExists)
            console.log('🔍 DEBUG: Current application status:', applicationStatus)
            
            setHasPersonalityTest(testExists)
            
            // Note: Auto-completion happens on the backend when personality test is completed
            // No need for frontend to call auto-complete endpoint (avoids permission issues)
            if (testExists) {
              console.log('🎯 Personality test detected - backend should have auto-completed application')
            }
          } else {
            const errorText = await personalityResponse.text()
            console.error('❌ Personality test status check failed:', personalityResponse.status, errorText)
            setHasPersonalityTest(false)
          }
        } catch (personalityError) {
          console.error('❌ Error checking personality test:', personalityError)
          setHasPersonalityTest(false)
        }
        
      } catch (error) {
        console.error('Error fetching application progress:', error)
        setApplicationStatus("None")
        setHasDocuments(false)
        setHasPersonalityTest(false)
      } finally {
        setLoading(false)
      }
    }
    
    fetchApplicationProgress()
    // Auto refresh every 15 seconds to catch OAS updates quickly
    const interval = setInterval(fetchApplicationProgress, 15000)
    return () => clearInterval(interval)
  }, [])

  // Application progress steps in order - REVERTED TO ORIGINAL TITLES
  const progressSteps = [
    {
      title: "Application Form",
      description: "Application form and documents received", 
      // ✅ FIXED: Check for the exact status your backend sets
      status: applicationStatus === "None" ? "Not Submitted" :
              applicationStatus === "form_verified" ? "Completed" :  // ✅ CHECK THIS EXACT VALUE
              ["document_verification", "approved", "rejected"].includes(applicationStatus) ? "Completed" :
              "Pending",  // ✅ Default to pending for submitted but not verified
      icon: <FileText className="h-6 w-6" />
    },
    {
      title: "Documents",
      description: "Upload required documents for verification",
      status: applicationStatus === "None" ? "Not Submitted" :
              ["document_verification", "approved", "rejected"].includes(applicationStatus)
                ? "Completed" :
              applicationStatus === "form_verified"
                ? "Pending" : 
              hasDocuments ? "Pending" : "Not Submitted",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Personality Test",
      description: "Complete psychological assessment",
      status: applicationStatus === "None" ? "Not Submitted" :
              hasPersonalityTest ? "Completed" :
              applicationStatus === "document_verification" ? "Pending" : "Locked",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Application Status",
      description: "Application approval or rejection",
      status: applicationStatus === "None" ? "Not Submitted" :
              ["approved", "rejected"].includes(applicationStatus)
                ? "Completed" : "Not Submitted",
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

                  {/* ✅ Enhanced status messages for Application Status step */}
                  {idx === 3 && (
                    <div className="mt-2 text-xs">
                      {step.status === "Pending" && (
                        <span className="text-yellow-600">⏳ Awaiting final decision</span>
                      )}
                      {step.status === "Completed" && applicationStatus === "approved" && (
                        <span className="text-green-600">🎉 Application approved!</span>
                      )}
                      {step.status === "Completed" && applicationStatus === "rejected" && (
                        <span className="text-red-600">❌ Application rejected</span>
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
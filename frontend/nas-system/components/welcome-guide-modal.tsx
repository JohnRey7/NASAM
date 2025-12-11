"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, FileText, Upload, Brain, Calendar, Users, Award, Info } from "lucide-react"

export function WelcomeGuideModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if localStorage is available (for production/deployment compatibility)
    try {
      const hasSeenGuide = localStorage.getItem("nas_welcome_guide_seen")
      
      if (!hasSeenGuide) {
        // Show modal after a short delay for better UX
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 500)
        
        return () => clearTimeout(timer)
      }
    } catch (error) {
      // localStorage not available (e.g., private browsing mode)
      console.warn("localStorage not available:", error)
      // Still show the modal if localStorage fails
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = (markAsSeen: boolean = true) => {
    // Mark as seen in localStorage only if specified
    if (markAsSeen) {
      try {
        localStorage.setItem("nas_welcome_guide_seen", "true")
      } catch (error) {
        // Handle localStorage errors in production
        console.warn("Could not save to localStorage:", error)
      }
    }
    setIsOpen(false)
  }

  const steps = [
    {
      number: 1,
      title: "Welcome to the Non-Academic Scholarship Application System",
      icon: Info,
      description: "Thank you for your interest in applying for a scholarship. Please follow these steps carefully to complete your application successfully.",
      color: "text-blue-600"
    },
    {
      number: 2,
      title: "Complete the Application Form",
      icon: FileText,
      description: "Click on the 'Application Form' tab to begin. Fill out all required sections including your personal information, academic details, family background, educational history, and character references. Click 'Submit' when finished.",
      important: "Please wait for OAS Staff to verify your application form before proceeding to the next step.",
      color: "text-purple-600"
    },
    {
      number: 3,
      title: "Upload Required Documents",
      icon: Upload,
      description: "Once your application form has been verified, navigate to the 'Documents' tab and upload the following:",
      list: [
        "2x2 Photo",
        "NBI Clearance",
        "Grade Reports",
        "Parent's Income Tax Return (ITR)",
        "Good Moral Certificate",
        "Medical Checkup Results",
        "Certificates/Awards",
        "Home Location Sketch",
        "16PF Test Payment Receipt"
      ],
      important: "Click 'Upload' for each document. Please wait for OAS Staff to verify your documents before proceeding to the next step.",
      color: "text-green-600"
    },
    {
      number: 4,
      title: "Take the Personality Test",
      icon: Brain,
      description: "Once your documents have been verified, go to the 'Personality Test' tab and click 'Start Test.' Answer all questions honestly and click 'Submit' when complete.",
      important: "The personality test must be marked as reviewed by OAS Staff before you can proceed.",
      color: "text-orange-600"
    },
    {
      number: 5,
      title: "Wait for Interview Scheduling",
      icon: Calendar,
      description: "After completing the personality test, our OAS Staff will review your results and schedule your interviews. You will receive a notification once your interview has been scheduled.",
      color: "text-indigo-600"
    },
    {
      number: 6,
      title: "Attend Your Scheduled Interviews",
      icon: Users,
      description: "You will receive an email or notification with your interview schedule. Attend both the OAS Staff interview and Department Head interview as scheduled.",
      important: "Be prepared and arrive on time for your interviews.",
      color: "text-pink-600"
    },
    {
      number: 7,
      title: "Await Final Decision",
      icon: Award,
      description: "After your interviews, the OAS Staff will conduct a final evaluation. You will receive a notification informing you whether your application has been approved or is under consideration.",
      color: "text-yellow-600"
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#800000] flex items-center gap-2">
            <Info className="h-6 w-6" />
            Application Guide
          </DialogTitle>
          <DialogDescription>
            Follow these steps to successfully complete your scholarship application
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${step.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-500">Step {step.number}</span>
                        <h3 className="font-bold text-lg text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-2">{step.description}</p>
                      
                      {step.list && (
                        <ul className="list-disc list-inside space-y-1 mb-2 ml-2">
                          {step.list.map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-600">
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {step.important && (
                        <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                          <p className="text-sm font-medium text-yellow-800 flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{step.important}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            
            <div className="border-t pt-4 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-900 mb-1">Good luck with your application!</h4>
                    <p className="text-sm text-green-700">
                      Please ensure all information provided is truthful and accurate. If you have any questions, 
                      feel free to contact the Office of Academic Services (OAS).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              // Don't mark as seen, so it will show again next time
              handleClose(false)
            }}
          >
            Show Again Next Time
          </Button>
          <Button
            onClick={() => handleClose(true)}
            className="bg-[#800000] hover:bg-[#600000]"
          >
            Got it, Let's Start!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

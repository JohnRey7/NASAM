"use client"

import { useAuth } from "@/contexts/auth-context"
import { RoleBasedLayout } from "@/components/role-based-layout"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApplicationForm } from "@/components/application-form"
import { DocumentUpload } from "@/components/document-upload"
import { PersonalityTest } from "@/components/personality-test"
import { ApplicationProgressTracker } from "@/components/application-progress-tracker"
import { ApplicationFormProvider, useApplicationForm } from "@/contexts/application-form-context"
import { WelcomeGuideModal } from "@/components/welcome-guide-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Phone, Mail, MapPin } from "lucide-react"

export function DashboardClient() {
  const { user } = useAuth()
  const userRole = user?.role || "applicant"
  
  // Make sure we display the full name properly, not ID-based names
  let userName = user?.name || "Student"
  
  // Check for auto-generated names and replace with a generic name
  if (userName.startsWith("User ") || userName.startsWith("Student ") || userName.match(/^\d{2}-\d{4}-\d{3}$/)) {
    userName = "Student"
  }

  return (
    <RoleBasedLayout userRole={userRole} userName={userName}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#800000]">Dashboard</h2>
          <p className="text-gray-600">Welcome back, {userName}</p>
        </div>

        {userRole === "applicant" && <ApplicantDashboard />}
        {userRole === "oas_staff" && <OasStaffDashboard />}
        {userRole === "panelist" && <PanelistDashboard />}
      </div>
    </RoleBasedLayout>
  )
}

function ApplicantDashboard() {
  return (
    <ApplicationFormProvider>
      <ApplicantDashboardContent />
    </ApplicationFormProvider>
  )
}

function ApplicantDashboardContent() {
  const { isApplicationDeleted, deletionMessage, isLoading } = useApplicationForm()
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
        <span className="ml-3 text-gray-600">Loading your application...</span>
      </div>
    )
  }
  
  // Show deleted application message
  if (isApplicationDeleted) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-800 text-xl">Application Withdrawn</CardTitle>
              <CardDescription className="text-red-600">
                Your application is no longer active
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <p className="text-gray-700 leading-relaxed">
              {deletionMessage || 'Your application has been withdrawn by the administrator. Please contact the Office of Alumni and Scholarship (OAS) for more information or to submit a new application.'}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">Contact the Office of Alumni and Scholarship (OAS)</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#800000]" />
                <span>Ground Floor, Main Building, CIT-U Campus</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#800000]" />
                <span>(032) 261-7741 local 124</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#800000]" />
                <span>oas@cit.edu</span>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>If you believe this was done in error, please contact the OAS office immediately.</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Welcome Guide Modal - shows on first visit */}
      <WelcomeGuideModal />
      
      <Tabs defaultValue="form" className="w-full" id="application-form">
        <TabsList className="grid w-full grid-cols-4 mb-8 h-12 bg-white shadow-soft border-0 p-1">
          <TabsTrigger value="form" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Application Form</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Documents</TabsTrigger>
          <TabsTrigger value="test" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Personality Test</TabsTrigger>
          <TabsTrigger value="status" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Application Status</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <ApplicationForm />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentUpload />
        </TabsContent>

        <TabsContent value="test">
          <PersonalityTest />
        </TabsContent>

        <TabsContent value="status">
          <ApplicationProgressTracker />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OasStaffDashboard() {
  return (
    <div>
      <h2>OAS Staff Dashboard</h2>
      {/* Content for OAS Staff */}
    </div>
  )
}

function PanelistDashboard() {
  return (
    <div>
      <h2>Panelist Dashboard</h2>
      {/* Content for Panelist */}
    </div>
  )
}
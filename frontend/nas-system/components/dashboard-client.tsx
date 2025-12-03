"use client"

import { useAuth } from "@/contexts/auth-context"
import { RoleBasedLayout } from "@/components/role-based-layout"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApplicationForm } from "@/components/application-form"
import { DocumentUpload } from "@/components/document-upload"
import { PersonalityTest } from "@/components/personality-test"
import { ApplicationProgressTracker } from "@/components/application-progress-tracker"
import { ApplicationFormProvider } from "@/contexts/application-form-context"

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
  const [showMessages, setShowMessages] = useState(false)
  
  return (
    <ApplicationFormProvider>
      <div className="space-y-8">
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
    </ApplicationFormProvider>
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
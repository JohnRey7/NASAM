"use client"

import { useAuth } from "@/contexts/auth-context"
import { RoleBasedLayout } from "@/components/role-based-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Upload, CheckSquare } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApplicationForm } from "@/components/application-form"
import { ApplicationStatus } from "@/components/application-status"
import { DocumentUpload } from "@/components/document-upload"
import { PersonalityTest } from "@/components/personality-test"

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-[#800000]" />
              Application Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Complete your scholarship application form</p>
            <Link href="#application-form">
              <Button variant="outline" className="w-full">
                Go to Form
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Upload className="h-5 w-5 mr-2 text-[#800000]" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Upload required documents for verification</p>
            <Link href="#documents">
              <Button variant="outline" className="w-full">
                Upload Files
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckSquare className="h-5 w-5 mr-2 text-[#800000]" />
              Personality Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Take the required personality assessment</p>
            <Link href="#personality-test">
              <Button variant="outline" className="w-full">
                Start Test
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-[#800000]" />
              Interview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Check your scheduled interview date</p>
            <Link href="#status">
              <Button variant="outline" className="w-full">
                View Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="form" className="w-full" id="application-form">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="form">Application Form</TabsTrigger>
          <TabsTrigger value="documents" id="documents">
            Document Upload
          </TabsTrigger>
          <TabsTrigger value="personality-test" id="personality-test">
            Personality Test
          </TabsTrigger>
          <TabsTrigger value="status" id="status">
            Application Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <ApplicationForm />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentUpload />
        </TabsContent>

        <TabsContent value="personality-test">
          <PersonalityTest />
        </TabsContent>

        <TabsContent value="status">
          <ApplicationStatus />
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
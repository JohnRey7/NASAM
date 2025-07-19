"use client"

import { useAuth } from "@/contexts/auth-context"
import { RoleBasedLayout } from "@/components/role-based-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Upload, CheckSquare, CheckCircle } from "lucide-react"
import { ActivityHistory } from "@/components/activity-history"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApplicationForm } from "@/components/application-form"
import { DocumentUpload } from "@/components/document-upload"
import { PersonalityTest } from "@/components/personality-test"

import { ApplicationProgressTracker } from "@/components/application-progress-tracker"

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* 1. Application Form Card */}
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

        {/* 2. Document Upload Card */}
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

        {/* 3. Personality Test Card */}
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

        {/* 4. Application Status - Use your existing component */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-[#800000]" />
              Application Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Click to view detailed application progress
            </p>
            <Button variant="outline" className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              View Application Status
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="form" className="w-full" id="application-form">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="form">Application Form</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="test">Personality Test</TabsTrigger>
          <TabsTrigger value="status">Application Status</TabsTrigger>
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
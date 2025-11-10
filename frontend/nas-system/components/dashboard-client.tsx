"use client"

import { useAuth } from "@/contexts/auth-context"
import { RoleBasedLayout } from "@/components/role-based-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Upload, CheckSquare, CheckCircle, MessageSquare } from "lucide-react"
import { ActivityHistory } from "@/components/activity-history"
import { ConversationsList } from "@/components/conversations-list"
import Link from "next/link"
import { useState } from "react"
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
  const [showMessages, setShowMessages] = useState(false)
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* 1. Application Form Card */}
        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-2 bg-maroon-50 rounded-lg">
                <FileText className="h-5 w-5 text-[#800000]" />
              </div>
              <span>Application Form</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">Complete your scholarship application form</p>
            <Link href="#application-form">
              <Button variant="outline" className="w-full border-maroon-200 text-[#800000] hover:bg-maroon-50 transition-smooth">
                Go to Form
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 2. Document Upload Card */}
        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <span>Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">Upload required documents for verification</p>
            <Link href="#documents">
              <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 transition-smooth">
                Upload Files
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 3. Personality Test Card */}
        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckSquare className="h-5 w-5 text-green-600" />
              </div>
              <span>Personality Test</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">Take the required personality assessment</p>
            <Link href="#personality-test">
              <Button variant="outline" className="w-full border-green-200 text-green-600 hover:bg-green-50 transition-smooth">
                Start Test
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 4. Application Status - Use your existing component */}
        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <span>Application Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Click to view detailed application progress
            </p>
            <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 transition-smooth">
              <CheckCircle className="h-4 w-4 mr-2" />
              View Status
            </Button>
          </CardContent>
        </Card>
      </div>

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
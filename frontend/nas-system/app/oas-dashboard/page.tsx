"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicationReview } from "@/components/application-review"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ScholarEvaluation } from "@/components/scholar-evaluation"
import { AuditLogs } from "@/components/audit-logs"
import { useEffect, useState } from "react"
import axios from "axios"

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function OASDashboardPage() {
  const [applicationStats, setApplicationStats] = useState({
    pending: 0,
    documentVerification: 0,
    interviewScheduled: 0,
    approved: 0,
    rejected: 0,
  })

  useEffect(() => {
    const fetchApplicationStats = async () => {
      try {
        const responses = await Promise.all([
          axios.get('/api/users/applications?status=Pending'),
          axios.get('/api/users/applications?status=Document Verification'),
          axios.get('/api/users/applications?status=Interview Scheduled'),
          axios.get('/api/users/applications?status=Approved'),
          axios.get('/api/users/applications?status=Rejected'),
        ])

        setApplicationStats({
          pending: responses[0].data.pagination.totalDocs,
          documentVerification: responses[1].data.pagination.totalDocs,
          interviewScheduled: responses[2].data.pagination.totalDocs,
          approved: responses[3].data.pagination.totalDocs,
          rejected: responses[4].data.pagination.totalDocs,
        })
      } catch (error) {
        console.error('Error fetching application stats:', error)
      }
    }

    fetchApplicationStats()
  }, [])

  return (
    <DashboardLayout allowedRoles={["oas_staff"]}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#800000]">OAS Staff Dashboard</h2>
        <p className="text-gray-600">Manage scholarship applications, review documents, and evaluate scholars.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">{applicationStats.pending}</p>
            <p className="text-sm text-gray-500">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Document Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">{applicationStats.documentVerification}</p>
            <p className="text-sm text-gray-500">Under verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Interview Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">{applicationStats.interviewScheduled}</p>
            <p className="text-sm text-gray-500">For interview</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">{applicationStats.approved}</p>
            <p className="text-sm text-gray-500">Accepted scholars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">{applicationStats.rejected}</p>
            <p className="text-sm text-gray-500">Not qualified</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="evaluation">Scholar Evaluation</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <ApplicationReview />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="evaluation">
          <ScholarEvaluation />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
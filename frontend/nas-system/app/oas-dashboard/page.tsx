"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicationReview } from "@/components/application-review"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ScholarEvaluation } from "@/components/scholar-evaluation"
import { AuditLogs } from "@/components/audit-logs"
import { useEffect, useState } from "react"
import { oasDashboardService } from "@/services/oasDashboardService"

export default function OASDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    oasDashboardService.getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message || "Failed to load stats"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout allowedRoles={["oas_staff", "admin"]}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#800000]">OAS Staff Dashboard</h2>
        <p className="text-gray-600">Manage scholarship applications, review documents, and evaluate scholars.</p>
      </div>

      {loading ? (
        <div className="mb-8">Loading dashboard data...</div>
      ) : error ? (
        <div className="mb-8 text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">New Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#800000]">{stats?.newApplications ?? 0}</p>
              <p className="text-sm text-gray-500">Pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Document Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#800000]">{stats?.documentVerifications ?? 0}</p>
              <p className="text-sm text-gray-500">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Scheduled Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#800000]">{stats?.scheduledInterviews ?? 0}</p>
              <p className="text-sm text-gray-500">For this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Scholars</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#800000]">{stats?.activeScholars ?? 0}</p>
              <p className="text-sm text-gray-500">Current semester</p>
            </CardContent>
          </Card>
        </div>
      )}

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

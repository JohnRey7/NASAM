"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicationReview } from "@/components/application-review"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { OasEvaluationTable } from "@/components/oas-evaluation-table"
import { AuditLogs } from "@/components/audit-logs"
import { useEffect, useState } from "react"
import { oasDashboardService } from "@/services/oasDashboardService"
import { ToolsCard } from "./ToolsCard"

export default function OASDashboardPage() {
  const [stats, setStats] = useState<any>({
    newApplications: 0,
    documentVerifications: 0,
    scheduledInterviews: 0,
    activeScholars: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await oasDashboardService.getDashboardStats()
        setStats(statsData)
      } catch (err) {
        console.warn('Dashboard stats not available (using defaults):', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <DashboardLayout allowedRoles={["oas_staff", "admin"]}>
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-[#800000] tracking-tight">OAS Staff Dashboard</h2>
        <p className="text-gray-600 mt-2 text-lg">Manage scholarship applications, review documents, and evaluate scholars.</p>
      </div>

      {/* ✅ Removed the error display - always show stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">New Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#800000] mb-2">{stats?.newApplications ?? 0}</p>
            <p className="text-sm text-gray-500">Status: Pending</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">Document Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600 mb-2">{stats?.documentVerifications ?? 0}</p>
            <p className="text-sm text-gray-500">Form approved, awaiting docs</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">Ready for Interview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600 mb-2">{stats?.scheduledInterviews ?? 0}</p>
            <p className="text-sm text-gray-500">Documents verified</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">Active Scholars</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600 mb-2">{stats?.activeScholars ?? 0}</p>
            <p className="text-sm text-gray-500">Approved applications</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 h-12 bg-white shadow-soft border-0 p-1">
          <TabsTrigger value="applications" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Applications</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Analytics</TabsTrigger>
          <TabsTrigger value="evaluation" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Scholar Evaluation</TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Audit Logs</TabsTrigger>
          <TabsTrigger value="tools" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <ApplicationReview />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="evaluation">
          <OasEvaluationTable />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>

        <TabsContent value="tools">
          <ToolsCard />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

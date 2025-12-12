"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicationReview } from "@/components/application-review"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { AdminEvaluationTable } from "@/components/admin-evaluation-table"
import { AuditLogs } from "@/components/audit-logs"
import { useEffect, useState } from "react"
import { oasDashboardService } from "@/services/oasDashboardService"
import { ToolsCard } from "./ToolsCard"
import { UserManagement } from "@/components/user-management"
import { AcademicManagement } from "@/components/academic-management"
import { PersonalityTestManagement } from "@/components/personality-test-management"
import { DocumentManagement } from "@/components/admin/DocumentManagement"
import { InterviewManagement } from "@/components/admin/InterviewManagement"
import { EvaluationPeriodManagement } from "@/components/admin/EvaluationPeriodManagement"

export default function AdminDashboardPage() {
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
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-[#800000] tracking-tight">Admin Dashboard</h2>
        <p className="text-gray-600 mt-2 text-lg">Full system administration and management.</p>
      </div>

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

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="flex flex-wrap w-full mb-8 h-auto bg-white shadow-soft border-0 p-1 gap-1">
          <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">User Management</TabsTrigger>
          <TabsTrigger value="applications" className="flex-1 data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Applications</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Documents</TabsTrigger>
          <TabsTrigger value="interviews" className="flex-1 data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Interviews</TabsTrigger>
          <TabsTrigger value="academic" className="flex-1 data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Academic</TabsTrigger>
          <TabsTrigger value="scholar-eval" className="flex-1 data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Scholar Evaluation</TabsTrigger>
          <TabsTrigger value="eval-period" className="flex-1 data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Eval Period</TabsTrigger>
          <TabsTrigger value="personality" className="flex-1 data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Personality Test</TabsTrigger>
          <TabsTrigger value="system" className="flex-1 data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">System</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationReview />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManagement />
        </TabsContent>

        <TabsContent value="interviews">
          <InterviewManagement />
        </TabsContent>

        <TabsContent value="academic">
          <AcademicManagement />
        </TabsContent>

        <TabsContent value="scholar-eval">
          <AdminEvaluationTable />
        </TabsContent>

        <TabsContent value="eval-period">
          <EvaluationPeriodManagement />
        </TabsContent>

        <TabsContent value="personality">
          <PersonalityTestManagement />
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-6">
            <Tabs defaultValue="audit" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger value="audit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#800000] data-[state=active]:bg-transparent px-4 py-2">Audit Logs</TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#800000] data-[state=active]:bg-transparent px-4 py-2">Analytics</TabsTrigger>
                <TabsTrigger value="tools" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#800000] data-[state=active]:bg-transparent px-4 py-2">Tools</TabsTrigger>
              </TabsList>
              <div className="mt-6">
                <TabsContent value="audit">
                  <AuditLogs />
                </TabsContent>
                <TabsContent value="analytics">
                  <AnalyticsDashboard />
                </TabsContent>
                <TabsContent value="tools">
                  <ToolsCard />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

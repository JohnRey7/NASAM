"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicationReview } from "@/components/application-review"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ScholarEvaluation } from "@/components/scholar-evaluation"
import { AuditLogs } from "@/components/audit-logs"
import { FileText, Users, Calendar, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { oasService, type DashboardStats } from "@/services/oasService"

export default function OASDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    newApplications: 0,
    documentVerification: 0,
    scheduledInterviews: 0,
    activeScholars: 0,
    totalApplications: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const dashboardStats = await oasService.getDashboardStats()
      setStats(dashboardStats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout allowedRoles={["oas_staff"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-[#800000]">OAS Staff Dashboard</h2>
          <p className="text-gray-600">Manage scholarship applications and monitor system activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#800000]">
                {loading ? "..." : stats.newApplications}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Document Verification</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? "..." : stats.documentVerification}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {loading ? "..." : stats.scheduledInterviews}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for interview
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Scholars</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? "..." : stats.activeScholars}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently enrolled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="applications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="scholar-evaluation">Scholar Evaluation</TabsTrigger>
            <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
          <ApplicationReview />
        </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

          <TabsContent value="scholar-evaluation" className="space-y-4">
          <ScholarEvaluation />
        </TabsContent>

          <TabsContent value="audit-logs" className="space-y-4">
          <AuditLogs />
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  )
}

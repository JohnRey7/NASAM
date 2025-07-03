import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicationReview } from "@/components/application-review"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ScholarEvaluation } from "@/components/scholar-evaluation"
import { AuditLogs } from "@/components/audit-logs"

export default function OASDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["oas_staff", "admin"]}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#800000]">OAS Staff Dashboard</h2>
        <p className="text-gray-600">Manage scholarship applications, review documents, and evaluate scholars.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">New Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">24</p>
            <p className="text-sm text-gray-500">Pending review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Document Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">18</p>
            <p className="text-sm text-gray-500">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Scheduled Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">12</p>
            <p className="text-sm text-gray-500">For this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Scholars</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">156</p>
            <p className="text-sm text-gray-500">Current semester</p>
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

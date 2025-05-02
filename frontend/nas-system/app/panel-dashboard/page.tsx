import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PanelInterviews } from "@/components/panel-interviews"

export default function PanelDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["panelist"]}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#800000]">Panel Dashboard</h2>
        <p className="text-gray-600">Manage interviews and provide recommendations for scholarship applicants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Scheduled Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">8</p>
            <p className="text-sm text-gray-500">For this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completed Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">12</p>
            <p className="text-sm text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">5</p>
            <p className="text-sm text-gray-500">Awaiting your input</p>
          </CardContent>
        </Card>
      </div>

      <PanelInterviews />
    </DashboardLayout>
  )
}

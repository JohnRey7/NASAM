import { AuthProvider } from "@/contexts/auth-context"
import { DashboardClient } from "@/components/dashboard-client"
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import React from "react";
import ApplicationStatusBar from "../../components/application-status-bar";
import axios from "axios";

export default async function DashboardPage() {
  // Server-side authentication check
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('nas_user')

  if (!userCookie) {
    redirect('/')
  }

  try {
    const user = JSON.parse(userCookie.value)
    if (user.role !== 'applicant') {
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'oas_staff':
          redirect('/oas-dashboard')
        case 'panelist':
          redirect('/panel-dashboard')
        default:
          redirect('/')
      }
    }
  } catch (error) {
    redirect('/')
  }

  const [status, setStatus] = React.useState<string>("Draft");

  React.useEffect(() => {
    axios.get("/api/applications/me")
      .then(res => setStatus(res.data.status))
      .catch(() => setStatus("Draft"));
  }, []);

  return (
    <AuthProvider>
      <DashboardClient />
      <div>
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        {/* ...other dashboard sections... */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Application Status</h2>
          <ApplicationStatusBar status={status} />
        </div>
        {/* ...rest of dashboard... */}
      </div>
    </AuthProvider>
  )
}

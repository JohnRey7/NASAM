import { AuthProvider } from "@/contexts/auth-context"
import { DashboardClient } from "@/components/dashboard-client"
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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

  return (
    <AuthProvider>
      <DashboardClient />
    </AuthProvider>
  )
}

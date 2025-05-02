import { DashboardLayout } from "@/components/dashboard-layout"
import { UserProfile } from "@/components/user-profile"

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#800000]">User Profile</h2>
        <p className="text-gray-600">Manage your personal information and account settings</p>
      </div>

      <UserProfile />
    </DashboardLayout>
  )
}

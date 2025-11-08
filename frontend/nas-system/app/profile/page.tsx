"use client"

import { RoleBasedLayout } from "@/components/role-based-layout"
import { UserProfile } from "@/components/user-profile"
import { useAuth } from "@/contexts/auth-context"

export default function ProfilePage() {
  const { user } = useAuth()
  const userRole = user?.role || "applicant"
  const userName = user?.name || "User"

  return (
    <RoleBasedLayout userRole={userRole} userName={userName}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#800000]">User Profile</h2>
        <p className="text-gray-600">Manage your personal information and account settings</p>
      </div>

      <UserProfile />
    </RoleBasedLayout>
  )
}

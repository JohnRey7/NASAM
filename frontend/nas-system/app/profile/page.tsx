"use client"

import { RoleBasedLayout } from "@/components/role-based-layout"
import { UserProfile } from "@/components/user-profile"

export default function ProfilePage() {
  return (
    <RoleBasedLayout userRole="applicant" userName="User">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#800000]">User Profile</h2>
        <p className="text-gray-600">Manage your personal information and account settings</p>
      </div>

      <UserProfile />
    </RoleBasedLayout>
  )
}

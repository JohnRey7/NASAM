import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
interface DashboardLayoutProps {
  children: React.ReactNode
  allowedRoles?: Array<"applicant" | "oas_staff" | "panelist" | "nas_supervisor">
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#800000] text-white py-4 shadow-md">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">CIT-U Non-Academic Scholars</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  )
}

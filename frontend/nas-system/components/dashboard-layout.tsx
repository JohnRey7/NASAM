import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { UserNav } from "@/components/user-nav"
import Image from "next/image"

interface DashboardLayoutProps {
  children: React.ReactNode
  allowedRoles?: Array<"applicant" | "oas_staff" | "admin" | "department_head">;
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles as ("applicant" | "oas_staff" | "admin" | "department_head")[]}>
      <div className="min-h-screen gradient-bg">
        <header className="gradient-maroon text-white py-5 shadow-maroon-lg sticky top-0 z-50 backdrop-blur-sm">
          <div className="container mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-20 flex items-center justify-center">
                <Image 
  src="/LogoNasam.png" 
  alt="NASAM Logo" 
  fill 
  className="object-contain scale-[1.9]" 
  priority 
/>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">CIT-U Non-Academic Scholars</h1>
            </div>
            <UserNav />
          </div>
        </header>

        <main className="container mx-auto px-6 py-10 animate-fade-in">{children}</main>
      </div>
    </ProtectedRoute>
  )
}

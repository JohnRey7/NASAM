"use client"

import Link from "next/link"
import { Award } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationSystem } from "@/components/notification-system"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserNav } from "@/components/user-nav"
import { LogoutButton } from "@/components/logout-button"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="flex items-center gap-2">
            <Award className="h-6 w-6 text-[#800000]" />
            <span className="font-bold text-[#800000] hidden sm:inline">
              NAS System
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <NotificationSystem />
          <ModeToggle />
          <UserNav />
          <LogoutButton 
            variant="outline" 
            size="sm"
            className="text-red-600 border-red-600 hover:bg-red-50"
          />
        </div>
      </div>
    </header>
  )
}

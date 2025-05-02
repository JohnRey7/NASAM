import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationSystem } from "@/components/notification-system"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Award } from "lucide-react"
import { UserNav } from "@/components/user-nav"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="flex items-center space-x-2">
            <Award className="h-6 w-6 text-maroon-600" />
            <span className="font-bold text-xl hidden md:inline-block">NAS System</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <NotificationSystem />
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}

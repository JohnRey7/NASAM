import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationSystem } from "@/components/notification-system"
import { MessageNotificationBadge } from "@/components/message-notification-badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Award } from "lucide-react"
import { UserNav } from "@/components/user-nav"
import Image from "next/image"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-10 w-20 flex items-center justify-center">
              <Image 
                src="/LogoNasam.png" 
                alt="NASAM Logo" 
                fill 
                className="object-contain scale-[1.9]" 
                priority 
              />
            </div>
            <span className="font-bold text-xl hidden md:inline-block">CIT-U Non-Academic Scholars</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <MessageNotificationBadge />
          <NotificationSystem />
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}

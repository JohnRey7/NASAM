"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Home,
  FileText,
  Upload,
  Clock,
  User,
  Users,
  BarChart,
  Calendar,
  Shield,
  Settings,
  BookOpen,
  Award,
  ClipboardCheck,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles: string[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["applicant", "scholar", "oas", "panel"],
  },
  {
    title: "Application Form",
    href: "/application",
    icon: FileText,
    roles: ["applicant"],
  },
  {
    title: "Document Upload",
    href: "/documents",
    icon: Upload,
    roles: ["applicant", "scholar"],
  },
  {
    title: "Application Status",
    href: "/status",
    icon: Clock,
    roles: ["applicant", "scholar"],
  },
  {
    title: "Personality Test",
    href: "/personality-test",
    icon: ClipboardCheck,
    roles: ["applicant"],
  },
  {
    title: "OAS Dashboard",
    href: "/oas-dashboard",
    icon: Award,
    roles: ["oas"],
  },
  {
    title: "Application Review",
    href: "/applications-review",
    icon: FileText,
    roles: ["oas", "panel"],
  },
  {
    title: "Scholar Management",
    href: "/scholars",
    icon: Users,
    roles: ["oas"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart,
    roles: ["oas"],
  },
  {
    title: "Panel Dashboard",
    href: "/panel-dashboard",
    icon: Users,
    roles: ["panel"],
  },
  {
    title: "Interviews",
    href: "/interviews",
    icon: Calendar,
    roles: ["panel"],
  },
  {
    title: "Scholar Evaluation",
    href: "/evaluation",
    icon: BookOpen,
    roles: ["oas", "panel"],
  },
  {
    title: "Term-End Evaluation",
    href: "/term-end-evaluation",
    icon: ClipboardCheck,
    roles: ["scholar"],
  },
  {
    title: "Security & Audit",
    href: "/security",
    icon: Shield,
    roles: ["oas"],
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
    roles: ["applicant", "scholar", "oas", "panel"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["applicant", "scholar", "oas", "panel"],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const userRole = user?.role || "applicant"

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <Sidebar variant="floating" className="border-r">
      <SidebarHeader className="flex items-center justify-center py-4">
        <div className="flex items-center space-x-2">
          <Award className="h-6 w-6 text-maroon-600" />
          <span className="text-xl font-bold">NAS System</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <Link href={item.href} className="flex items-center">
                  <item.icon className="mr-2 h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{user?.name || "User"}</span>
          </div>
          <Button variant="ghost" size="sm">
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-6 px-4">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

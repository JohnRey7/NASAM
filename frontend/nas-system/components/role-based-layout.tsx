"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  Settings,
  User,
  Users,
  BarChart3,
  Shield,
  BookOpen,
  Upload,
  GraduationCap,
  Star,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

type UserRole = "applicant" | "oas_staff" | "panelist" | "nas_supervisor"

interface RoleBasedLayoutProps {
  children: React.ReactNode
  userRole: UserRole
  userName: string
}

export function RoleBasedLayout({ children, userRole, userName }: RoleBasedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications] = useState(3)
  const { logout } = useAuth()

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
      // Force logout even if there's an error
      window.location.href = "/"
    }
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    switch (userRole) {
      case "applicant":
        return [
          { name: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
          { name: "Application", href: "/application", icon: <FileText className="h-5 w-5" /> },
          { name: "Documents", href: "/documents", icon: <Upload className="h-5 w-5" /> },
          { name: "Interviews", href: "/interviews", icon: <Calendar className="h-5 w-5" /> },
          { name: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
        ]
      case "oas_staff":
        return [
          { name: "Dashboard", href: "/oas-dashboard", icon: <Home className="h-5 w-5" /> },
          { name: "Applications", href: "/applications", icon: <FileText className="h-5 w-5" /> },
          { name: "Interviews", href: "/interviews", icon: <Calendar className="h-5 w-5" /> },
          { name: "Scholars", href: "/scholars", icon: <GraduationCap className="h-5 w-5" /> },
          { name: "Analytics", href: "/analytics", icon: <BarChart3 className="h-5 w-5" /> },
          { name: "Security", href: "/security", icon: <Shield className="h-5 w-5" /> },
          { name: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
        ]
      case "panelist":
        return [
          { name: "Dashboard", href: "/panel-dashboard", icon: <Home className="h-5 w-5" /> },
          { name: "Applications", href: "/applications", icon: <FileText className="h-5 w-5" /> },
          { name: "Evaluations", href: "/evaluations", icon: <ClipboardCheck className="h-5 w-5" /> },
          { name: "Interviews", href: "/interviews", icon: <Calendar className="h-5 w-5" /> },
          { name: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
        ]
      case "nas_supervisor":
        return [
          { name: "Dashboard", href: "/nas-dashboard", icon: <Home className="h-5 w-5" /> },
          { name: "My Interviews", href: "/nas-interviews", icon: <Calendar className="h-5 w-5" /> },
          { name: "Evaluations", href: "/nas-evaluations", icon: <Star className="h-5 w-5" /> },
          { name: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
        ]
      default:
        return [
          { name: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
          { name: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
        ]
    }
  }

  const navigationItems = getNavigationItems()

  const getRoleDisplayName = () => {
    switch (userRole) {
      case "oas_staff":
        return "OAS Staff"
      case "panelist":
        return "Panelist"
      case "nas_supervisor":
        return "NAS Supervisor"
      case "applicant":
        return "Applicant"
      default:
        return "User"
    }
  }

  const getDashboardPath = () => {
    switch (userRole) {
      case "oas_staff":
        return "/oas-dashboard"
      case "panelist":
        return "/panel-dashboard"
      case "nas_supervisor":
        return "/nas-dashboard"
      case "applicant":
      default:
        return "/dashboard"
    }
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#800000] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
          <div className="flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-[#600000]">
                    <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b">
                      <h2 className="text-lg font-semibold">CIT-U NAS</h2>
                      <p className="text-sm text-gray-600">{getRoleDisplayName()}</p>
                </div>
                    <nav className="flex-1 p-4">
                  <ul className="space-y-2">
                    {navigationItems.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive(item.href)
                                  ? "bg-[#800000] text-white"
                                  : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.icon}
                              <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                    {/* Mobile Logout Button */}
                    <div className="p-4 border-t">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              <Link href={getDashboardPath()} className="flex items-center space-x-3 ml-4 md:ml-0">
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-[#800000]" />
          </div>
                <div>
                  <h1 className="text-xl font-bold">CIT-U NAS</h1>
                  <p className="text-xs opacity-90 hidden sm:block">Non-Academic Scholarship System</p>
              </div>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#600000]">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center p-0">
                    {notifications}
                  </Badge>
                )}
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" alt={userName} />
                      <AvatarFallback className="bg-white text-[#800000] font-medium">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {getRoleDisplayName()}
                      </p>
        </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
      </div>
    </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r">
              <div className="flex items-center flex-shrink-0 px-4">
                <Badge variant="outline" className="text-xs">
                  {getRoleDisplayName()}
                </Badge>
              </div>
              <div className="mt-5 flex-grow flex flex-col">
                <nav className="flex-1 px-2 space-y-1">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.href)
                          ? "bg-[#800000] text-white"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  ))}
                </nav>
                {/* Desktop Logout Button */}
                <div className="px-2 pb-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

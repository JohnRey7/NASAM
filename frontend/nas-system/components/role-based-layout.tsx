"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
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
  BarChart,
  Shield,
  BookOpen,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface RoleBasedLayoutProps {
  children: React.ReactNode
  userRole: string
  userName: string
}

export function RoleBasedLayout({ children, userRole, userName }: RoleBasedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleLogout = () => {
    // In a real app, this would clear auth tokens, etc.
    router.push("/")
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { name: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
      { name: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
    ]

    if (userRole === "applicant") {
      return [
        ...commonItems,
        { name: "Application", href: "/dashboard#application-form", icon: <FileText className="h-5 w-5" /> },
        { name: "Documents", href: "/dashboard#documents", icon: <ClipboardList className="h-5 w-5" /> },
        { name: "Personality Test", href: "/dashboard#personality-test", icon: <BookOpen className="h-5 w-5" /> },
        { name: "Interview", href: "/dashboard#status", icon: <Calendar className="h-5 w-5" /> },
      ]
    } else if (userRole === "oas_staff") {
      return [
        ...commonItems,
        { name: "Applications", href: "/applications", icon: <ClipboardList className="h-5 w-5" /> },
        { name: "Interviews", href: "/interviews", icon: <Calendar className="h-5 w-5" /> },
        { name: "Scholars", href: "/scholars", icon: <Users className="h-5 w-5" /> },
        { name: "Analytics", href: "/analytics", icon: <BarChart className="h-5 w-5" /> },
        { name: "Security", href: "/security", icon: <Shield className="h-5 w-5" /> },
      ]
    } else if (userRole === "panelist") {
      return [
        ...commonItems,
        { name: "Assigned Applications", href: "/assigned", icon: <ClipboardList className="h-5 w-5" /> },
        { name: "Interview Schedule", href: "/schedule", icon: <Calendar className="h-5 w-5" /> },
        { name: "Evaluations", href: "/evaluations", icon: <FileText className="h-5 w-5" /> },
      ]
    }

    return commonItems
  }

  const navigationItems = getNavigationItems()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/")
    }
    if (href === "/profile") {
      return pathname === "/profile"
    }
    return pathname === href || (pathname === "/dashboard" && href.includes("#"))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#800000] text-white py-2 px-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-white hover:bg-[#600000]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="bg-[#800000] text-white p-4">
                  <h2 className="text-xl font-bold">CIT-U NAS</h2>
                </div>
                <nav className="p-4">
                  <ul className="space-y-2">
                    {navigationItems.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${
                            isActive(item.href) ? "bg-gray-100 font-medium" : ""
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.icon}
                          <span className="ml-3">{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold ml-2">CIT-U Non-Academic Scholars</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button variant="ghost" size="icon" className="text-white hover:bg-[#600000]">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                    {notifications}
                  </Badge>
                )}
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-[#600000]">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt={userName} />
                    <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{userName}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{userName}</span>
                    <span className="text-xs text-gray-500 capitalize">{userRole.replace("-", " ")}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar - desktop only */}
        <aside className="hidden md:block w-64 bg-white border-r">
          <nav className="p-4">
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center p-3 rounded-md transition-colors relative ${
                        item.name === "Profile"
                          ? "text-[#800000] bg-gray-100 font-medium"
                          : active
                          ? "text-[#800000] bg-gray-100 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-[#800000]"
                      }`}
                    >
                      {(active || item.name === "Profile") && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#800000] rounded-r-md" />
                      )}
                      <div className={`${(active || item.name === "Profile") ? "text-[#800000]" : "text-gray-500"}`}>
                        {item.icon}
                      </div>
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Mobile menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <div className="bg-[#800000] text-white p-4">
              <h2 className="text-xl font-bold">CIT-U NAS</h2>
            </div>
            <nav className="p-4">
              <ul className="space-y-1">
                {navigationItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center p-3 rounded-md transition-colors relative ${
                          item.name === "Profile"
                            ? "text-[#800000] bg-gray-100 font-medium"
                            : active
                            ? "text-[#800000] bg-gray-100 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#800000]"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {(active || item.name === "Profile") && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#800000] rounded-r-md" />
                        )}
                        <div className={`${(active || item.name === "Profile") ? "text-[#800000]" : "text-gray-500"}`}>
                          {item.icon}
                        </div>
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 p-8 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}

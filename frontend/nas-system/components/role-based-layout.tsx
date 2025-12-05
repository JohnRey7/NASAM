"use client"

import React, { useState, useEffect } from "react"
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
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { NotificationDropdown } from "./notification-dropdown"
import { MessageNotificationBadge } from "./message-notification-badge"
import { useAuth } from "@/contexts/auth-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface RoleBasedLayoutProps {
  children: React.ReactNode
  userRole: string
  userName: string
}

export function RoleBasedLayout({ children, userRole, userName }: RoleBasedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  // Fetch student picture
  useEffect(() => {
    if (user?.id) {
      fetchStudentPicture()
    }
  }, [user?.id])

  const fetchStudentPicture = async () => {
    try {
      // Use /document-uploads to get current user's documents (no permission needed beyond auth)
      const response = await fetch(`${API_URL}/document-uploads`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.data?.studentPicture?.filePath) {
          // Remove "files/" prefix if present
          const cleanFilePath = data.data.studentPicture.filePath.replace(/^files\//, '')
          const imageUrl = `${API_URL}/files/${cleanFilePath}`
          
          // Fetch the image as blob to avoid CORS issues
          const imageResponse = await fetch(imageUrl, {
            credentials: 'include'
          })
          
          if (imageResponse.ok) {
            const blob = await imageResponse.blob()
            const objectUrl = URL.createObjectURL(blob)
            setProfileImage(objectUrl)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching student picture:', error)
    }
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
    } catch (error) {
      console.error('Logout failed:', error)
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { name: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
      { name: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
    ]

    // All roles only see Dashboard and Profile
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
            <MessageNotificationBadge />
            <NotificationDropdown />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-[#600000]">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileImage || undefined} alt={userName} />
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

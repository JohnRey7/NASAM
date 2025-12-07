"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumb() {
  const pathname = usePathname()

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean)
    
    const breadcrumbs: Array<{ name: string; href: string; icon: React.ReactNode }> = [
      { name: "Dashboard", href: "/dashboard", icon: <Home className="h-4 w-4" /> }
    ]

    // Map path segments to readable names
    const pathNameMap: { [key: string]: string } = {
      profile: "Profile Management",
      settings: "Settings",
      messages: "Messages",
      notifications: "Notifications",
      "oas-dashboard": "OAS Dashboard",
      "department-head-dashboard": "Department Head Dashboard",
      "admin-dashboard": "Admin Dashboard",
    }

    let currentPath = ""
    paths.forEach((path, index) => {
      currentPath += `/${path}`
      
      // Skip if it's the dashboard itself
      if (path === "dashboard") return
      
      const name = pathNameMap[path] || path.charAt(0).toUpperCase() + path.slice(1)
      breadcrumbs.push({
        name,
        href: currentPath,
        icon: undefined
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't show breadcrumb if we're on the dashboard
  if (pathname === "/dashboard") {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        
        return (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />}
            
            {isLast ? (
              <span className="font-medium text-[#800000] flex items-center">
                {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
                {crumb.name}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-[#800000] transition-colors flex items-center hover:underline"
              >
                {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
                {crumb.name}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

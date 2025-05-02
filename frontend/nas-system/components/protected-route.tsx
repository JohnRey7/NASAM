"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Array<"applicant" | "oas_staff" | "panelist">
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated" && allowedRoles && user) {
      if (!allowedRoles.includes(user.role as any)) {
        router.push("/unauthorized")
      }
    }
  }, [status, router, allowedRoles, user])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#800000]" />
      </div>
    )
  }

  if (status === "authenticated") {
    if (allowedRoles && user && !allowedRoles.includes(user.role as any)) {
      return null
    }
    return <>{children}</>
  }

  return null
}

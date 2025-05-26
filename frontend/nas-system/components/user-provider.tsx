"use client"

import { ReactNode } from "react"
import { AuthProvider } from "@/contexts/auth-context"

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  return <AuthProvider>{children}</AuthProvider>
} 
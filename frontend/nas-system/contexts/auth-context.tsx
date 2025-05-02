"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type UserRole = "applicant" | "oas_staff" | "panelist" | null
type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  status: AuthStatus
  login: (idNumber: string, password: string, remember: boolean) => Promise<void>
  logout: () => void
  register: (email: string, idNumber: string, password: string, course: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const router = useRouter()

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("nas_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setStatus("authenticated")
    } else {
      setStatus("unauthenticated")
    }
  }, [])

  const login = async (idNumber: string, password: string, remember: boolean) => {
    setStatus("loading")

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock users for different roles
    let mockUser: User

    if (idNumber === "admin123") {
      mockUser = {
        id: "1",
        name: "Admin User",
        email: "admin@cit.edu",
        role: "oas_staff",
      }
    } else if (idNumber === "panel123") {
      mockUser = {
        id: "2",
        name: "Panel Member",
        email: "panel@cit.edu",
        role: "panelist",
      }
    } else {
      mockUser = {
        id: "3",
        name: "Student User",
        email: "student@cit.edu",
        role: "applicant",
      }
    }

    setUser(mockUser)
    setStatus("authenticated")

    if (remember) {
      localStorage.setItem("nas_user", JSON.stringify(mockUser))
    }

    // Redirect based on role
    if (mockUser.role === "applicant") {
      router.push("/dashboard")
    } else if (mockUser.role === "oas_staff") {
      router.push("/oas-dashboard")
    } else if (mockUser.role === "panelist") {
      router.push("/panel-dashboard")
    }
  }

  const logout = () => {
    setUser(null)
    setStatus("unauthenticated")
    localStorage.removeItem("nas_user")
    router.push("/")
  }

  const register = async (email: string, idNumber: string, password: string, course: string) => {
    setStatus("loading")

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const newUser: User = {
      id: Math.random().toString(36).substring(2, 9),
      name: "New Student",
      email,
      role: "applicant",
    }

    setUser(newUser)
    setStatus("authenticated")
    localStorage.setItem("nas_user", JSON.stringify(newUser))

    router.push("/dashboard")
  }

  return <AuthContext.Provider value={{ user, status, login, logout, register }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

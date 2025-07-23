"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type UserRole = "applicant" | "oas_staff" | "admin" | "department_head" | null
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
  register: (email: string, idNumber: string, password: string, course: string, name?: string) => Promise<{
    success: boolean
    message: string
    data: any
  }>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const router = useRouter()

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if user is stored in localStorage
        const storedUser = localStorage.getItem("nas_user")
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Special handling for admin, oas_staff, and panelist users (they don't need backend validation)
          if (parsedUser.role === "admin" || parsedUser.role === "oas_staff" || parsedUser.role === "department_head") {
            setUser(parsedUser)
            setStatus("authenticated")
            return
          }
          
          // For regular users, verify with the backend
          try {
            const response = await fetch(`${API_URL}/auth/me`, {
              method: "GET",
              credentials: "include", // Include cookies
            })
            
            if (response.ok) {
              const data = await response.json()
              console.log("Backend user data:", data) // Debug log
              
              // Update user data with the latest from the server
              const updatedUser = {
                ...parsedUser,
                ...data.user,
                // Always use the backend name if available
                name: data.user?.name || parsedUser.name || "Student",
                role: data.user?.role?.name || parsedUser.role,
              }
              
              console.log("Updated user data:", updatedUser) // Debug log
              setUser(updatedUser)
              localStorage.setItem("nas_user", JSON.stringify(updatedUser))
              setStatus("authenticated")
            } else {
              // If backend says not authenticated, clear local storage
              localStorage.removeItem("nas_user")
              setStatus("unauthenticated")
            }
          } catch (apiError) {
            console.error("API error:", apiError)
            // If API call fails but we have a stored user, keep them logged in
            // This allows the app to work offline for returning users
            setUser(parsedUser)
            setStatus("authenticated")
          }
        } else {
          setStatus("unauthenticated")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setStatus("unauthenticated")
      }
    }
    
    checkAuthStatus()
  }, [])

  const login = async (idNumber: string, password: string, remember: boolean) => {
    setStatus("loading")
    
    try {
      // For regular users, use the API
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({
          idNumber,
          password,
          rememberMe: remember
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Login failed")
      }
      
      const data = await response.json()
      console.log("Login response data:", data) // Debug log
      
      // Check if the user has the 'applicant', 'oas_staff', or 'admin' role (from backend)
      const allowedRoles = ["applicant", "oas_staff", "admin", "department_head"];
      if (!data.user || !data.user.role || !allowedRoles.includes(data.user.role.name)) {
        throw new Error("Only applicants, OAS staff, or admins can log in here. Please use the correct portal for your role.");
      }
      
      // Map backend user data to frontend user format (store only role name)
      const loggedInUser: User = {
        id: data.user.id,
        name: data.user?.name || "Student",
        email: data.user.email || "",
        role: data.user.role.name, // Store only the role name (string)
      }
      
      console.log("Logged in user data:", loggedInUser) // Debug log
      setUser(loggedInUser)
      setStatus("authenticated")
      
      // Set both localStorage and cookie
      localStorage.setItem("nas_user", JSON.stringify(loggedInUser))
      document.cookie = `nas_user=${JSON.stringify(loggedInUser)}; path=/; max-age=${remember ? 2592000 : 86400}`
      
      // Redirect based on role
      if (loggedInUser.role === "admin" || loggedInUser.role === "oas_staff") {
        router.push("/oas-dashboard")
      }
      else if (loggedInUser.role === "department_head") {
        router.push("/department-head")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)
      setStatus("unauthenticated")
      throw error
    }
  }

  const logout = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include", // Include cookies
      })
      
      if (!response.ok) {
        console.error("Logout failed on server, but proceeding with client logout")
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Always clear local state regardless of server response
      setUser(null)
      setStatus("unauthenticated")
      localStorage.removeItem("nas_user")
      // Clear the cookie
      document.cookie = "nas_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      router.push("/")
    }
  }

  const register = async (email: string, idNumber: string, password: string, courseId: string, name?: string) => {
    setStatus("loading")

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({
          name: name || `Student ${idNumber}`,
          idNumber,
          email,
          password,
          courseId,
          rememberMe: false, // Don't remember by default until email is verified
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Registration failed")
      }

      const data = await response.json()
      
      // Don't automatically log in the user
      setStatus("unauthenticated")
      
      // Return the registration data for the UI to handle
      return {
        success: true,
        message: "Registration successful. Please check your email for verification.",
        data: data
      }
    } catch (error) {
      console.error("Registration error:", error)
      setStatus("unauthenticated")
      throw error
    }
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
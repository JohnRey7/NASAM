"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type UserRole = "applicant" | "oas_staff" | "panelist" | "nas_supervisor" | null
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
  logout: () => Promise<void>
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
          
          // Special handling for admin, panelist, and nas_supervisor users (they don't need backend validation)
          if (parsedUser.role === "oas_staff" || parsedUser.role === "panelist" || parsedUser.role === "nas_supervisor") {
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
                role: "applicant", // Regular users are always applicants
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

  const logout = async () => {
    try {
      // Set loading state
    setStatus("loading")

      // For regular users (applicants), call the backend logout endpoint
      if (user?.role === "applicant") {
    try {
          await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
            credentials: "include",
          })
        } catch (error) {
          console.error("Backend logout error:", error)
          // Continue with logout even if backend call fails
        }
      }
      
      // Clear all authentication data
      localStorage.removeItem("nas_user")
      
      // Clear all cookies
      document.cookie = "nas_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
      document.cookie = "jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
      
      // Clear session storage as well
      sessionStorage.clear()
      
      // Reset user state
      setUser(null)
      setStatus("unauthenticated")
      
      // Force redirect to home page
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      
      // Even if there's an error, force logout
      localStorage.removeItem("nas_user")
      document.cookie = "nas_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
      document.cookie = "jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
      sessionStorage.clear()
      
      setUser(null)
      setStatus("unauthenticated")
      window.location.href = "/"
    }
  }

  const login = async (idNumber: string, password: string, remember: boolean) => {
    setStatus("loading")

    try {
      // Special cases for OAS, panelist, and NAS supervisor roles (hardcoded credentials)
      if (idNumber === "ADMIN001" && password === "Welcome1!") {
        // OAS staff hardcoded login
        const oasUser: User = {
          id: "admin-1",
          name: "OAS Administrator",
          email: "oas@example.com",
          role: "oas_staff",
}

        setUser(oasUser)
        setStatus("authenticated")
        
        // Set both localStorage and cookie
        localStorage.setItem("nas_user", JSON.stringify(oasUser))
        document.cookie = `nas_user=${JSON.stringify(oasUser)}; path=/; max-age=${remember ? 2592000 : 86400}`
        
        router.push("/oas-dashboard")
        return
  }

      if (idNumber === "panel123" && password === "panel123") {
        // Panelist hardcoded login
        const panelistUser: User = {
          id: "panel-1",
          name: "Panel Member",
          email: "panel@example.com",
          role: "panelist",
}
        
        setUser(panelistUser)
        setStatus("authenticated")
        
        // Set both localStorage and cookie
        localStorage.setItem("nas_user", JSON.stringify(panelistUser))
        document.cookie = `nas_user=${JSON.stringify(panelistUser)}; path=/; max-age=${remember ? 2592000 : 86400}`
        
        router.push("/panel-dashboard")
        return
      }

      if (idNumber === "nas123" && password === "nas123") {
        // NAS Supervisor hardcoded login
        const nasSupervisorUser: User = {
          id: "nas-1",
          name: "NAS Supervisor",
          email: "nas@example.com",
          role: "nas_supervisor",
        }
        
        setUser(nasSupervisorUser)
        setStatus("authenticated")
        
        // Set both localStorage and cookie
        localStorage.setItem("nas_user", JSON.stringify(nasSupervisorUser))
        document.cookie = `nas_user=${JSON.stringify(nasSupervisorUser)}; path=/; max-age=${remember ? 2592000 : 86400}`
        
        router.push("/nas-dashboard")
        return
      }

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

      // Map backend user data to frontend user format
      const loggedInUser: User = {
        id: data.user.id,
        // Always use the backend name if available
        name: data.user?.name || "Student",
        email: data.user.email || "",
        role: "applicant", // Regular users are always applicants
      }

      console.log("Logged in user data:", loggedInUser) // Debug log

      setUser(loggedInUser)
      setStatus("authenticated")

      // Set both localStorage and cookie
      localStorage.setItem("nas_user", JSON.stringify(loggedInUser))
      document.cookie = `nas_user=${JSON.stringify(loggedInUser)}; path=/; max-age=${remember ? 2592000 : 86400}`

      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      setStatus("unauthenticated")
      throw error
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
          roleId: "683490a6e02b1d61dbb4bf0e", // Applicant role ID from the seeded roles
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
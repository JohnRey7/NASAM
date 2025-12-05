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
  course?: {
    courseId: string
    name: string
  }
  department?: {
    _id: string
    departmentCode: string
    name: string
  }
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

  // Helper function to fetch user's full name from application form
  const fetchUserFullName = async (userId: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/application/user/${userId}`, {
        credentials: "include",
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.data?.firstName && data.data?.lastName) {
          const fullName = `${data.data.firstName} ${data.data.middleName ? data.data.middleName + ' ' : ''}${data.data.lastName}${data.data.suffix ? ' ' + data.data.suffix : ''}`
          return fullName.trim()
        }
      }
    } catch (error) {
      console.error("Error fetching application name:", error)
    }
    return null
  }

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
              
              // Try to get the full name from application form
              let displayName = data.user?.name || parsedUser.name || data.user?.idNumber || "User"
              
              // If the name looks like an ID number, try to fetch from application
              if (displayName.match(/^\d{2}-\d{4}-\d{3}$/)) {
                const fullName = await fetchUserFullName(data.user?.id || parsedUser.id)
                if (fullName) {
                  displayName = fullName
                }
              }
              
              // Update user data with the latest from the server
              const updatedUser = {
                ...parsedUser,
                ...data.user,
                name: displayName,
                role: data.user?.role?.name || parsedUser.role,
                course: data.user?.course ? {
                  courseId: data.user.course.courseId || "",
                  name: data.user.course.name || ""
                } : parsedUser.course,
                department: data.user?.department ? {
                  _id: data.user.department._id || data.user.department,
                  departmentCode: data.user.department.departmentCode || "",
                  name: data.user.department.name || ""
                } : parsedUser.department
              }
              
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
      
      if (!data.user) {
        throw new Error("User information is missing. Please contact administrator.");
      }
      
      // Try to get the full name from application form
      let displayName = data.user?.name || data.user?.idNumber || "User"
      
      // If the name looks like an ID number, try to fetch from application
      if (displayName.match(/^\d{2}-\d{4}-\d{3}$/)) {
        const fullName = await fetchUserFullName(data.user.id)
        if (fullName) {
          displayName = fullName
        }
      }
      
      // Map backend user data to frontend user format
      const loggedInUser: User = {
        id: data.user.id,
        name: displayName,
        email: data.user.email || "",
        role: data.user.role?.name || "applicant", // Default to applicant if role name is missing
        course: data.user.course ? {
          courseId: data.user.course.courseId || "",
          name: data.user.course.name || ""
        } : undefined,
        department: data.user.department ? {
          _id: data.user.department._id || data.user.department,
          departmentCode: data.user.department.departmentCode || "",
          name: data.user.department.name || ""
        } : undefined
      }
      
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
    // Clear local state immediately
    setUser(null)
    setStatus("unauthenticated")
    localStorage.removeItem("nas_user")
    // Clear all auth-related cookies
    document.cookie = "nas_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    
    try {
      // Call backend to clear server-side session
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout API error:", error)
    }
    
    // Force a full page reload to clear all cached state
    window.location.href = "/"
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
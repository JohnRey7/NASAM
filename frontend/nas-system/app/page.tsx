"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { ScholarshipInfo } from "@/components/scholarship-info"
import { VerificationHandler } from "@/components/verification-handler"
import { Suspense } from "react"
import { useAuth } from "@/contexts/auth-context"

export default function Home() {
  const { user, status } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (status === "authenticated" && user) {
      if (user.role === "admin") {
        router.replace("/admin-dashboard")
      } else if (user.role === "oas_staff") {
        router.replace("/oas-dashboard")
      } else if (user.role === "department_head") {
        router.replace("/department-head")
      } else {
        router.replace("/dashboard")
      }
    }
  }, [status, user, router])

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If authenticated, show loading while redirecting
  if (status === "authenticated" && user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Suspense fallback={null}>
        <VerificationHandler />
      </Suspense>
      <header className="gradient-maroon text-white py-6 shadow-maroon-lg">
        <div className="container mx-auto px-4 flex justify-left items-center">
          <h1 className="text-3xl font-bold tracking-tight">CIT-U Non-Academic Scholars</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 items-center animate-fade-in">
        <div className="md:w-1/2">
          <ScholarshipInfo />
        </div>

        <div className="md:w-1/2 w-full max-w-md">
          <Card className="w-full shadow-strong border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-maroon-50 to-maroon-100 border-b border-maroon-200 pb-6">
              <CardTitle className="text-[#800000] text-2xl font-bold">Scholarship Portal</CardTitle>
              <CardDescription className="text-base">Login or register to apply for a scholarship</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-6 bg-white">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 p-1">
                  <TabsTrigger value="login" className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-soft">Login</TabsTrigger>
                  <TabsTrigger value="register" className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-soft">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="mt-6">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="register" className="mt-6">
                  <RegisterForm />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center border-t bg-gray-50 py-4">
              <p className="text-sm text-gray-600">© {new Date().getFullYear()} CIT-U Non-Academic Scholars</p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}

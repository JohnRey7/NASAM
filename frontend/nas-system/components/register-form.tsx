"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

// Sample courses - in a real app, these would come from an API
const COURSES = [
  { id: "bsit", name: "BS Information Technology" },
  { id: "bscs", name: "BS Computer Science" },
  { id: "bsce", name: "BS Civil Engineering" },
  { id: "bsee", name: "BS Electrical Engineering" },
  { id: "bsme", name: "BS Mechanical Engineering" },
  { id: "bsarch", name: "BS Architecture" },
  { id: "bsacct", name: "BS Accountancy" },
  { id: "bsba", name: "BS Business Administration" },
  { id: "bstm", name: "BS Tourism Management" },
  { id: "bshm", name: "BS Hospitality Management" },
]

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const { toast } = useToast()
  const { register } = useAuth()
  const [course, setCourse] = useState("")
  const router = useRouter()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const idNumber = formData.get("id-number") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    if (!course) {
      setErrorMessage("Please select a course")
      setIsLoading(false)
      return
    }

    try {
      // Show loading toast
      toast({
        title: "Creating Account",
        description: "Please wait while we create your account...",
      })

      const result = await register(email, idNumber, password, course, name)
      
      // Show success toast
      toast({
        title: "Registration Successful",
        description: "Please check your email for verification instructions.",
      })

      // Reset form safely
      const form = event.currentTarget
      if (form) {
        form.reset()
        setCourse("")
      }
      
      // Switch to login tab
      document.querySelector('[data-value="login"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    } catch (error) {
      console.error("Registration error:", error)
      const errorMsg = error instanceof Error ? error.message : "Registration failed. Please try again."
      setErrorMessage(errorMsg)
      toast({
        title: "Registration Failed",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" placeholder="Enter your full name" required type="text" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" placeholder="Enter your email" required type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="id-number-reg">ID Number</Label>
        <Input id="id-number-reg" name="id-number" placeholder="Enter your student ID" required type="text" autoComplete="username" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-reg">Password</Label>
        <Input id="password-reg" name="password" required type="password" placeholder="Create a strong password" autoComplete="new-password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="course">Course</Label>
        <Select name="course" required value={course} onValueChange={setCourse}>
          <SelectTrigger>
            <SelectValue placeholder="Select your course" />
          </SelectTrigger>
          <SelectContent>
            {COURSES.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {errorMessage && (
        <div className="text-red-500 text-sm">{errorMessage}</div>
      )}
      
      <Button type="submit" className="w-full bg-[#800000] hover:bg-[#600000]" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Register"}
      </Button>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link
          href="#"
          className="text-[#800000] hover:underline"
          onClick={(e) => {
            e.preventDefault()
            document.querySelector('[data-value="login"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
          }}
        >
          Login
        </Link>
      </div>
    </form>
  )
}
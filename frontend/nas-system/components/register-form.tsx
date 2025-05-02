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
  const { toast } = useToast()
  const { register } = useAuth()
  const [course, setCourse] = useState("")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const idNumber = formData.get("id-number") as string
    const password = formData.get("password") as string

    try {
      await register(email, idNumber, password, course)
      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now login.",
      })
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" placeholder="Enter your email" required type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="id-number-reg">ID Number</Label>
        <Input id="id-number-reg" name="id-number" placeholder="Enter your student ID" required type="text" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-reg">Password</Label>
        <Input id="password-reg" name="password" required type="password" placeholder="Create a strong password" />
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

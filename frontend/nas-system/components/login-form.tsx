"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { login } = useAuth()
  const [rememberMe, setRememberMe] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const idNumber = formData.get("id-number") as string
    const password = formData.get("password") as string

    try {
      await login(idNumber, password, rememberMe)
      toast({
        title: "Login successful",
        description: "Welcome back to the Non-Academic Scholars System",
      })
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="id-number">ID Number</Label>
        <Input id="id-number" name="id-number" placeholder="Enter your student ID" required type="text" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-sm text-[#800000] hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input id="password" name="password" required type="password" />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember"
          name="remember"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
        />
        <Label htmlFor="remember" className="text-sm font-normal">
          Remember password
        </Label>
      </div>
      <Button type="submit" className="w-full bg-[#800000] hover:bg-[#600000]" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="#"
          className="text-[#800000] hover:underline"
          onClick={(e) => {
            e.preventDefault()
            document.querySelector('[data-value="register"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
          }}
        >
          Create account
        </Link>
      </div>
    </form>
  )
}

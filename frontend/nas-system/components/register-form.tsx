"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

import courseService, { Course } from "@/services/courseService"

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [idNumberError, setIdNumberError] = useState("")
  const [idNumber, setIdNumber] = useState("")

  const [passwordError, setPasswordError] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [fullNameError, setFullNameError] = useState("")
  const [fullName, setFullName] = useState("")
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [privacyAcceptedError, setPrivacyAcceptedError] = useState("")
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false)
  const { toast } = useToast()
  const { register } = useAuth()
  const [course, setCourse] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true)
      try {
        const courses = await courseService.getPublicCourses()
        setCourses(courses)
      } catch (error) {
        console.error("Failed to fetch courses:", error)
        toast({
          title: "Error",
          description: "Failed to load courses. Please try refreshing the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [toast])

  // Format ID Number with automatic hyphen insertion
  const formatIdNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")
    
    // Apply format: DD-DDDD-DDD
    let formatted = digits
    if (digits.length > 2) {
      formatted = digits.slice(0, 2) + "-" + digits.slice(2)
    }
    if (digits.length > 6) {
      formatted = digits.slice(0, 2) + "-" + digits.slice(2, 6) + "-" + digits.slice(6, 9)
    }
    
    return formatted
  }

  // Validate ID Number format
  const validateIdNumber = (value: string): boolean => {
    const idPattern = /^\d{2}-\d{4}-\d{3}$/
    return idPattern.test(value)
  }

  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIdNumber(e.target.value)
    setIdNumber(formatted)
    
    // Clear error when user starts typing
    if (idNumberError) {
      setIdNumberError("")
    }
  }

  // Validate Full Name (letters, spaces, hyphens, apostrophes only)
  const validateFullName = (value: string): boolean => {
    const namePattern = /^[a-zA-Z\s'-]+$/
    return namePattern.test(value) && value.trim().length > 0
  }

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFullName(value)
    
    if (fullNameError) {
      setFullNameError("")
    }
  }

  // Validate Password (min 8 chars + complexity)
  const validatePassword = (value: string): { valid: boolean; message: string } => {
    if (value.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" }
    }

    let complexityCount = 0
    if (/[A-Z]/.test(value)) complexityCount++ // Uppercase
    if (/[a-z]/.test(value)) complexityCount++ // Lowercase
    if (/[0-9]/.test(value)) complexityCount++ // Digit
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) complexityCount++ // Special char

    if (complexityCount < 3) {
      return { 
        valid: false, 
        message: "Password must include at least 3 of: uppercase letter, lowercase letter, number, special character (!@#$%^&*)" 
      }
    }

    return { valid: true, message: "" }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    
    if (passwordError) {
      setPasswordError("")
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    
    if (confirmPasswordError) {
      setConfirmPasswordError("")
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    setIdNumberError("")
    setPasswordError("")
    setConfirmPasswordError("")
    setFullNameError("")
    setPrivacyAcceptedError("")

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string

    // Validate Full Name
    if (!validateFullName(fullName)) {
      setFullNameError("Please enter a valid name. Only letters, spaces, hyphens, and apostrophes are allowed.")
      setIsLoading(false)
      return
    }

    // Validate ID Number format
    if (!validateIdNumber(idNumber)) {
      setIdNumberError("Please enter a valid CIT ID in the format: DD-DDDD-DDD (e.g., 22-6729-813)")
      setIsLoading(false)
      return
    }

    // Validate Password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message)
      setIsLoading(false)
      return
    }

    // Validate Confirm Password
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!privacyAccepted) {
      setPrivacyAcceptedError("You must agree to the Privacy Policy to create an account")
      setIsLoading(false)
      return
    }

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

      const result = await register(email, idNumber, password, course, fullName)
      
      // Show success toast
      toast({
        title: "Registration Successful",
        description: "Please check your email for verification instructions. Switching to login...",
      })

      // Reset form safely
      const form = event.currentTarget
      if (form) {
        form.reset()
        setCourse("")
        setIdNumber("")
        setFullName("")
        setPassword("")
        setConfirmPassword("")
        setPrivacyAccepted(false)
      }
      
      // Switch to login tab after 2 seconds
      setTimeout(() => {
        // Find the login tab button by its ID pattern or data-state
        const loginTab = document.querySelector('[id*="trigger-login"]') as HTMLElement
        if (loginTab) {
          loginTab.click()
        }
      }, 2000)
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
        <Input 
          id="name" 
          name="name" 
          placeholder="Enter your full name" 
          required 
          type="text"
          value={fullName}
          onChange={handleFullNameChange}
          className={fullNameError ? "border-red-500" : ""}
        />
        {fullNameError && (
          <div className="text-red-500 text-xs mt-1">{fullNameError}</div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" placeholder="Enter your email" required type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="id-number-reg">ID Number</Label>
        <Input 
          id="id-number-reg" 
          name="id-number" 
          placeholder="DD-DDDD-DDD (e.g., 22-6729-813)" 
          required 
          type="text" 
          autoComplete="username"
          value={idNumber}
          onChange={handleIdNumberChange}
          maxLength={11}
          className={idNumberError ? "border-red-500" : ""}
        />
        {idNumberError && (
          <div className="text-red-500 text-xs mt-1">{idNumberError}</div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-reg">Password</Label>
        <Input 
          id="password-reg" 
          name="password" 
          required 
          type="password" 
          placeholder="Min 8 chars, 3 of: A-Z, a-z, 0-9, !@#$%" 
          autoComplete="new-password"
          value={password}
          onChange={handlePasswordChange}
          className={passwordError ? "border-red-500" : ""}
        />
        {passwordError && (
          <div className="text-red-500 text-xs mt-1">{passwordError}</div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password-reg">Confirm Password</Label>
        <Input 
          id="confirm-password-reg" 
          name="confirm-password" 
          required 
          type="password" 
          placeholder="Re-enter your password" 
          autoComplete="new-password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          className={confirmPasswordError ? "border-red-500" : ""}
        />
        {confirmPasswordError && (
          <div className="text-red-500 text-xs mt-1">{confirmPasswordError}</div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="course">Course</Label>
        <Select name="course" required value={course} onValueChange={setCourse} disabled={isLoadingCourses}>
          <SelectTrigger>
            <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select your course"} />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c._id} value={c.courseId}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="privacyAccepted"
            checked={privacyAccepted}
            onCheckedChange={(checked) => {
              const isChecked = checked === true
              setPrivacyAccepted(isChecked)
              if (privacyAcceptedError) {
                setPrivacyAcceptedError("")
              }
            }}
            className={privacyAcceptedError ? "border-red-500" : ""}
          />
          <Label htmlFor="privacyAccepted" className="text-sm leading-5">
            I agree to the{" "}
            <Dialog open={privacyPolicyOpen} onOpenChange={setPrivacyPolicyOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-[#800000] hover:underline"
                  onClick={() => setPrivacyPolicyOpen(true)}
                >
                  Privacy Policy
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Privacy Policy</DialogTitle>
                  <DialogDescription>
                    This is a sample policy for the CIT-U Non-Academic Scholars portal.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-sm leading-6">
                  <p>
                    We respect your privacy. This portal collects the information you provide during account creation,
                    application submission, and document upload to process your scholarship application.
                  </p>
                  <div>
                    <div className="font-medium">Information we collect</div>
                    <div>
                      Name, CIT ID number, email address, course, application details, and uploaded documents.
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">How we use your information</div>
                    <div>
                      To verify your identity, evaluate your scholarship application, communicate status updates, and
                      manage program requirements.
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Data retention</div>
                    <div>
                      We retain your information for as long as necessary to administer the scholarship program and for
                      audit/record-keeping purposes.
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Data sharing</div>
                    <div>
                      Your information may be accessed by authorized staff involved in processing your scholarship
                      application. We do not sell personal information.
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Your choices</div>
                    <div>
                      You may request corrections to your information and inquire about your data by contacting the
                      program administrators.
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" className="bg-[#800000] hover:bg-[#600000]" onClick={() => setPrivacyPolicyOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Label>
        </div>
        {privacyAcceptedError && (
          <div className="text-red-500 text-xs mt-1">{privacyAcceptedError}</div>
        )}
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
    const loginTab = document.querySelector('[id*="trigger-login"]') as HTMLElement
    if (loginTab) {
      loginTab.click()
      loginTab.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }))
      loginTab.focus()
    }
  }}
>
  Login
</Link>
      </div>
    </form>
  )
}
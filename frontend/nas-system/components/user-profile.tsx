"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Camera, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

interface Course {
  _id: string
  name: string
}

interface ApplicationHistoryItem {
  id: string
  title: string
  description: string
  date: string
  status: "completed" | "current" | "pending"
  type: "submission" | "verification" | "test" | "interview" | "decision" | "review"
}

interface Application {
  _id: string
  typeOfScholarship: string
  status: string
  createdAt: string
  updatedAt: string
  userId: string
}

export function UserProfile() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [applicationHistory, setApplicationHistory] = useState<ApplicationHistoryItem[]>([])
  
  // Add state for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  
  // Add state for editable fields
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    courseId: "",
    courseName: "",
    email: "",
    address: "",
    contact: "",
    birthday: ""
  })

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("Fetching user data...") // Debug log
        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          console.log("Full user data from /auth/me:", data) // Debug log
          
          // Update form data with user data
          const updatedFormData = {
            fullName: data.user?.name || "",
            studentId: data.user?.idNumber || "",
            courseId: data.user?.course?._id || "",
            courseName: data.user?.course?.name || "",
            email: data.user?.email || "", // Get email from backend response
            address: data.user?.address || "",
            contact: data.user?.contact || "",
            birthday: data.user?.birthday || ""
          }
          
          console.log("Setting form data to:", updatedFormData) // Debug log
          setFormData(updatedFormData)
        } else {
          console.error("Failed to fetch user data. Status:", response.status)
          const errorData = await response.json().catch(() => null)
          console.error("User data error response:", errorData)
          
          toast({
            title: "Error",
            description: "Failed to load user data. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load user data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchUserData()
  }, [toast]) // Remove user from dependencies since we're getting email from backend

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)

    try {
      // Make API call to save changes
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.fullName,
          idNumber: formData.studentId,
          address: formData.address,
          contact: formData.contact,
          birthday: formData.birthday
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      // Update the user's name in the auth context
      if (user) {
        user.name = formData.fullName
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      })
      return
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(passwordData.newPassword)) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to change password")
      }

      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      })

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    } catch (error) {
      console.error("Password change error:", error)
      toast({
        title: "Password Change Failed",
        description: error instanceof Error ? error.message : "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // In your user-profile.tsx, create mock history based on real application data
  const generateHistoryFromApplication = (application: Application) => {
    const history: ApplicationHistoryItem[] = []
    
    // Always show submission
    history.push({
      id: `${application._id}-submitted`,
      title: "Application Submitted",
      description: `You submitted your application for the ${application.typeOfScholarship} program.`,
      date: application.createdAt,
      status: "completed",
      type: "submission"
    })
    
    // Add more events based on status - UPDATED WORDINGS
    if (application.status === "under_review" || application.status === "reviewing") {
      history.push({
        id: `${application._id}-review`,
        title: "Under Review",
        description: "Your application is currently being reviewed by OAS staff.",
        date: application.updatedAt,
        status: "current",
        type: "review"
      })
    }

    if (application.status === "form_verified") {
      history.push({
        id: `${application._id}-form-verified`,
        title: "Application Form Verified",
        description: "Your application form has been reviewed and verified.",
        date: application.updatedAt,
        status: "completed",
        type: "verification"
      })
    }

    if (application.status === "document_verification") {
      history.push({
        id: `${application._id}-doc-review`,
        title: "Document Verification",
        description: "Your submitted documents are being verified.",
        date: application.updatedAt,
        status: "current",
        type: "verification"
      })
    }
    
    if (application.status === "approved") {
      history.push({
        id: `${application._id}-decision`,
        title: "Application Approved",
        description: "Congratulations! Your scholarship application has been approved.",
        date: application.updatedAt,
        status: "completed",
        type: "decision"
      })
    }

    if (application.status === "rejected") {
      history.push({
        id: `${application._id}-decision`,
        title: "Application Decision",
        description: "Your application has been reviewed. Please check with OAS for details.",
        date: application.updatedAt,
        status: "completed",
        type: "decision"
      })
    }
    
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Fetch application history
  useEffect(() => {
    const fetchApplicationHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/applications/history`, {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setApplicationHistory(data.history || [])
        }
      } catch (error) {
        console.error("Error fetching application history:", error)
      }
    }

    if (!isInitialLoading) {
      fetchApplicationHistory()
    }
  }, [isInitialLoading])

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500" // Green for completed steps
      case "current":
        return "bg-blue-500"  // Blue for current step
      case "pending":
        return "bg-yellow-500" // Yellow for pending (only when application exists)
      default:
        return "bg-gray-400"  // Gray for not started
    }
  }

  // Add this function to your dashboard component (wherever you see the pending statuses)
  const getProgressStatus = (stepId: string, applicationData: any) => {
    if (!applicationData) {
      // No application submitted yet - ALL steps should be "not_submitted"
      return "not_submitted"
    }
    
    // Map your application status to progress steps
    const status = applicationData.status
    
    switch (stepId) {
      case "submission":
        return "completed" // Always completed if application exists
        
      case "review":
        if (status === "under_review" || status === "reviewing") return "pending"  // ✅ Only pending when actually under review
        if (status === "form_verified" || status === "document_verification" || status === "approved") return "completed"
        return "not_submitted"
        
      case "evaluation":
        if (status === "document_verification") return "pending"  // ✅ Only pending when in this phase
        if (status === "approved") return "completed"
        return "not_submitted"
        
      case "decision":
        if (status === "approved" || status === "rejected") return "completed"
        return "not_submitted"  // ✅ Not submitted until final decision
        
      default:
        return "not_submitted"  // ✅ Default to not_submitted
    }
  }

  // Update status label function
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "pending":
        return "Pending"
      case "not_submitted":
        return "Not Submitted"  // ✅ This will show by default
      default:
        return "Not Submitted"  // ✅ Changed from "Not Submitted" to this as fallback
    }
  }

  // New progress tracker state
  const totalSteps = 4
  const [applicationData, setApplicationData] = useState<Application | null>(null)
  const completedSteps = applicationData ? (applicationData.status === "approved" ? 4 : 3) : 0 // Mocked logic for completed steps

  // Mocked progress steps - replace with your actual steps
  const progressSteps = [
    {
      id: "submission",
      title: "Application Submitted",
      description: "Application form and documents received"
    },
    {
      id: "review", 
      title: "Under Review",
      description: "Document verification and initial screening"
    },
    {
      id: "evaluation",
      title: "Evaluation Phase",
      description: "Assessment and interview process"
    },
    {
      id: "decision",
      title: "Final Decision",
      description: "Application approval or rejection"
    },
  ]

  return (
    <Card>
      <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
        <CardTitle className="text-[#800000]">Profile Management</CardTitle>
        <CardDescription>Update your personal information and account settings</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isInitialLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading profile data...</p>
          </div>
        ) : (
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="history">Application History</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32 border-2 border-[#800000]">
                    <AvatarImage src={profileImage || user?.profileImage} alt={formData.fullName} />
                    <AvatarFallback className="text-2xl bg-[#800000]/10 text-[#800000]">
                      {formData.fullName ? getInitials(formData.fullName) : "NA"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="relative">
                    <input
                      type="file"
                      id="profile-image"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <label htmlFor="profile-image">
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        <Camera className="mr-2 h-4 w-4" />
                        Change Photo
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      value={formData.email}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input 
                        id="studentId" 
                        name="studentId"
                        value={formData.studentId}
                        readOnly
                        placeholder="Enter your student ID"
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Input 
                        id="course"
                        value={formData.courseName}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Complete Address</Label>
                    <Input 
                      id="address" 
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Number</Label>
                      <Input 
                        id="contact" 
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthday">Date of Birth</Label>
                      <Input 
                        id="birthday" 
                        name="birthday"
                        type="date" 
                        value={formData.birthday}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      name="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Password Requirements</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className={`h-4 w-4 mr-2 ${passwordData.newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm">Minimum 8 characters</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className={`h-4 w-4 mr-2 ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm">At least one uppercase letter</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className={`h-4 w-4 mr-2 ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm">At least one lowercase letter</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className={`h-4 w-4 mr-2 ${/\d/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm">At least one number</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className={`h-4 w-4 mr-2 ${/[@$!%*?&]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm">At least one special character</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full bg-[#800000] hover:bg-[#600000]"
                    onClick={handleChangePassword}
                    disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {isLoading ? "Changing Password..." : "Update Password"}
                  </Button>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        For security reasons, you will be logged out after changing your password.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div className="space-y-6">
                {applicationHistory.length > 0 ? (
                  <div className="relative">
                    <div className="absolute h-full w-0.5 bg-gray-200 left-2.5 top-0"></div>
                    <div className="space-y-8">
                      {applicationHistory.map((item: ApplicationHistoryItem, index: number) => (
                        <div key={item.id} className="relative pl-10">
                          <div className={`absolute left-0 top-1 h-5 w-5 rounded-full ${getStatusColor(item.status)}`}></div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{item.title}</h3>
                              <span className="text-sm text-gray-500">
                                {new Date(item.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    
                    
                    
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input id="province" defaultValue="Cebu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City/Municipality</Label>
                  <Input id="city" defaultValue="Cebu City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barangay">Barangay</Label>
                  <Input id="barangay" defaultValue="Lahug" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input id="street" defaultValue="123 Main Street" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input id="postal" defaultValue="6000" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={handleSaveProfile} disabled={isLoading} className="bg-[#800000] hover:bg-[#600000]">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Replace your existing progress tracker with this */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Application Progress</h3>
          
          {applicationData ? (
            <div className="text-sm text-gray-600 mb-4">
              {Math.round((completedSteps / totalSteps) * 100)}% Complete
            </div>
          ) : (
            <div className="text-sm text-gray-600 mb-4">
              0% Complete - Start your application
            </div>
          )}
          
          <div className="space-y-4">
            {progressSteps.map((step) => {
              const status = getProgressStatus(step.id, applicationData)
              
              return (
                <div key={step.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'completed' ? 'bg-green-500' :
                      status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}></div>
                    <div>
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'completed' ? 'bg-green-100 text-green-800' :
                    status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-600'  // ✅ Gray for "Not Submitted" instead of yellow
                  }`}>
                    {getStatusLabel(status)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

interface ApplicationHistoryItem {
  id: string
  title: string
  description: string
  date: string
  status: "completed" | "current" | "pending"
  type: "submission" | "verification" | "test" | "interview" | "decision" | "review"
}

export function UserProfile() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const { toast } = useToast()
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
    birthday: "",
    gender: "",
    province: "",
    city: "",
    barangay: "",
    street: "",
    postalCode: ""
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
          console.log("📥 Full user data from GET /auth/me:", data)
          console.log("📥 Personal info from response:", {
            address: data.user?.address,
            contact: data.user?.contact,
            birthday: data.user?.birthday,
            gender: data.user?.gender
          })
          console.log("📥 Location info from response:", {
            province: data.user?.province,
            city: data.user?.city,
            barangay: data.user?.barangay,
            street: data.user?.street,
            postalCode: data.user?.postalCode
          })
          
          // Update form data with user data
          const updatedFormData = {
            fullName: data.user?.name || "",
            studentId: data.user?.idNumber || "",
            courseId: data.user?.course?._id || "",
            courseName: data.user?.course?.name || "",
            email: data.user?.email || "",
            address: data.user?.address || "",
            contact: data.user?.contact || "",
            birthday: data.user?.birthday ? data.user.birthday.split('T')[0] : "",
            gender: data.user?.gender || "",
            province: data.user?.province || "",
            city: data.user?.city || "",
            barangay: data.user?.barangay || "",
            street: data.user?.street || "",
            postalCode: data.user?.postalCode || ""
          }
          
          console.log("📥 Setting form data to:", updatedFormData)
          setFormData(updatedFormData)
          
          // Fetch student picture from documents
          fetchStudentPicture()
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

  // Fetch student picture from documents
  const fetchStudentPicture = async () => {
    try {
      // Use /document-uploads to get current user's documents (no permission needed beyond auth)
      const response = await fetch(`${API_URL}/document-uploads`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📸 Student picture data:', data.data?.studentPicture)
        
        if (data.data?.studentPicture?.filePath) {
          // Remove "files/" prefix if present
          const cleanFilePath = data.data.studentPicture.filePath.replace(/^files\//, '')
          const imageUrl = `${API_URL}/files/${cleanFilePath}`
          console.log('📸 Loading image from:', imageUrl)
          
          // Fetch the image as blob to avoid CORS issues
          const imageResponse = await fetch(imageUrl, {
            credentials: 'include'
          })
          
          if (imageResponse.ok) {
            const blob = await imageResponse.blob()
            const objectUrl = URL.createObjectURL(blob)
            setProfileImage(objectUrl)
          } else {
            console.error('Failed to fetch image:', imageResponse.status)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching student picture:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)

    const dataToSave = {
      name: formData.fullName,
      idNumber: formData.studentId,
      address: formData.address,
      contact: formData.contact,
      birthday: formData.birthday,
      gender: formData.gender,
      province: formData.province,
      city: formData.city,
      barangay: formData.barangay,
      street: formData.street,
      postalCode: formData.postalCode
    }

    console.log('💾 Saving profile data to PUT /api/users/profile')
    console.log('💾 Data being sent:', dataToSave)

    try {
      // Make API call to save changes
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dataToSave),
      })

      console.log('💾 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('💾 Error response:', errorData)
        throw new Error("Failed to update profile")
      }

      const result = await response.json()
      console.log('✅ Profile saved successfully:', result)

      // Update the user's name in the auth context
      if (user) {
        user.name = formData.fullName
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("❌ Update error:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB.",
        variant: "destructive",
      })
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (event) => {
      setProfileImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to backend
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('studentPicture', file)

      const response = await fetch(`${API_URL}/document-uploads`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      console.log('📸 Upload response:', data)

      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully.",
      })

      // Refresh the image from backend
      fetchStudentPicture()
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      })
      // Revert preview on error
      fetchStudentPicture()
    } finally {
      setIsLoading(false)
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
                  <Input 
                    id="province" 
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    placeholder="e.g., Cebu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City/Municipality</Label>
                  <Input 
                    id="city" 
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Cebu City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barangay">Barangay</Label>
                  <Input 
                    id="barangay" 
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleInputChange}
                    placeholder="e.g., Lahug"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input 
                    id="street" 
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="e.g., 123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input 
                    id="postalCode" 
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="e.g., 6000"
                  />
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
      </CardContent>
    </Card>
  )
}

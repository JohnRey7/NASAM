"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Camera, CheckCircle, Clock, Eye, EyeOff, Lock, Save, User } from "lucide-react"

export function ProfileManagement() {
  const [profileTab, setProfileTab] = useState("personal")
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState("/placeholder.svg?height=96&width=96")

  const handleSavePersonal = () => {
    toast({
      title: "Profile Updated",
      description: "Your personal information has been updated successfully.",
    })
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Password Changed",
      description: "Your password has been changed successfully.",
    })

    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleUploadPhotoClick = () => {
    if (fileInputRef.current) {
      console.log("Opening file dialog")
      fileInputRef.current.click()
    } else {
      console.log("fileInputRef is null")
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedPhoto(file)
    setAvatarUrl(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append("studentPicture", file)

    try {
      const res = await fetch("/api/documents", {
        method: "PUT",
        body: formData,
        credentials: "include",
      })
      if (!res.ok) throw new Error("Upload failed")
      toast({
        title: "Photo Uploaded",
        description: "Your profile photo has been updated successfully.",
      })
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: "There was a problem uploading your photo.",
        variant: "destructive",
      })
      setAvatarUrl("/placeholder.svg?height=96&width=96")
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#800000]">Profile Management</h2>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow">
                    <AvatarImage src={avatarUrl} alt="Profile" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-photo-upload"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-white flex items-center justify-center cursor-pointer border border-gray-200"
                    title="Upload Photo"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="profile-photo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                <h3 className="text-xl font-bold">Juan Dela Cruz</h3>
                <p className="text-gray-500 mb-2">juan.delacruz@example.com</p>
                <Badge className="bg-[#800000]">Applicant</Badge>

                <div className="w-full mt-6 space-y-2">
                  <Button
                    variant="outline"
                    className={`w-full justify-start ${profileTab === "personal" ? "bg-gray-100" : ""}`}
                    onClick={() => setProfileTab("personal")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Personal Information
                  </Button>
                  <Button
                    variant="outline"
                    className={`w-full justify-start ${profileTab === "security" ? "bg-gray-100" : ""}`}
                    onClick={() => setProfileTab("security")}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Security
                  </Button>
                  <Button
                    variant="outline"
                    className={`w-full justify-start ${profileTab === "activity" ? "bg-gray-100" : ""}`}
                    onClick={() => setProfileTab("activity")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Activity History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
              <CardTitle className="text-[#800000]">
                {profileTab === "personal"
                  ? "Personal Information"
                  : profileTab === "security"
                    ? "Security Settings"
                    : "Activity History"}
              </CardTitle>
              <CardDescription>
                {profileTab === "personal"
                  ? "Update your personal details and preferences"
                  : profileTab === "security"
                    ? "Manage your account security settings"
                    : "View your recent account activities"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {profileTab === "personal" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" defaultValue="Juan" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" defaultValue="Dela Cruz" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="juan.delacruz@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input id="student-id" defaultValue="2023-12345" disabled />
                    <p className="text-xs text-gray-500">Student ID cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" defaultValue="+63 912 345 6789" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" defaultValue="123 Main St, Cebu City" />
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Some information can only be updated by contacting the Office of Academic Scholarships.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === "security" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Change Password</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
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
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Password Requirements</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">Minimum 8 characters</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">At least one uppercase letter</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">At least one number</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">At least one special character</span>
                      </li>
                    </ul>
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
              )}

              {profileTab === "activity" && (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Activity
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              IP Address
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">Login</td>
                            <td className="px-4 py-3 text-sm text-gray-500">2023-06-15 09:23:45</td>
                            <td className="px-4 py-3 text-sm text-gray-500">192.168.1.1</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">Updated Profile</td>
                            <td className="px-4 py-3 text-sm text-gray-500">2023-06-14 15:42:12</td>
                            <td className="px-4 py-3 text-sm text-gray-500">192.168.1.1</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">Submitted Application</td>
                            <td className="px-4 py-3 text-sm text-gray-500">2023-06-10 11:05:33</td>
                            <td className="px-4 py-3 text-sm text-gray-500">192.168.1.1</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">Uploaded Document</td>
                            <td className="px-4 py-3 text-sm text-gray-500">2023-06-10 10:47:21</td>
                            <td className="px-4 py-3 text-sm text-gray-500">192.168.1.1</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">Created Account</td>
                            <td className="px-4 py-3 text-sm text-gray-500">2023-06-05 14:22:18</td>
                            <td className="px-4 py-3 text-sm text-gray-500">192.168.1.1</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    Showing recent activities. For a complete history, please contact the administrator.
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              {profileTab === "personal" && (
                <Button className="bg-[#800000] hover:bg-[#600000]" onClick={handleSavePersonal}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              )}
              {profileTab === "security" && (
                <Button
                  className="bg-[#800000] hover:bg-[#600000]"
                  onClick={handleChangePassword}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

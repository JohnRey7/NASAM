"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Camera, Lock } from "lucide-react"

export function UserProfile() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSaveProfile = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    }, 1500)
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

  return (
    <Card>
      <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
        <CardTitle className="text-[#800000]">Profile Management</CardTitle>
        <CardDescription>Update your personal information and account settings</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
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
                  <AvatarImage src={profileImage || user?.profileImage} alt={user?.name} />
                  <AvatarFallback className="text-2xl bg-[#800000]/10 text-[#800000]">
                    {user?.name ? getInitials(user.name) : "NA"}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Input id="email" type="email" defaultValue={user?.email || "student@cit.edu"} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input id="student-id" defaultValue="2020-00001" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Input id="course" defaultValue="BS Information Technology" readOnly />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Complete Address</Label>
                  <Input id="address" defaultValue="123 Main St, Cebu City" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number</Label>
                    <Input id="contact" defaultValue="09123456789" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthday">Date of Birth</Label>
                    <Input id="birthday" type="date" defaultValue="2000-01-01" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>

              <div className="pt-4">
                <Button className="w-full bg-[#800000] hover:bg-[#600000]">
                  <Lock className="mr-2 h-4 w-4" />
                  Update Password
                </Button>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-medium mb-4">Login History</h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <p className="font-medium">Today, 09:23 AM</p>
                      <span className="text-green-600 text-sm">Current session</span>
                    </div>
                    <p className="text-sm text-gray-500">IP: 192.168.1.1 • Cebu City, Philippines</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <p className="font-medium">Yesterday, 03:45 PM</p>
                      <span className="text-gray-600 text-sm">Successful login</span>
                    </div>
                    <p className="text-sm text-gray-500">IP: 192.168.1.1 • Cebu City, Philippines</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <p className="font-medium">June 10, 2023, 10:12 AM</p>
                      <span className="text-gray-600 text-sm">Successful login</span>
                    </div>
                    <p className="text-sm text-gray-500">IP: 192.168.1.1 • Cebu City, Philippines</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute h-full w-0.5 bg-gray-200 left-2.5 top-0"></div>
                <div className="space-y-8">
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 h-5 w-5 rounded-full bg-[#800000]"></div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Application Submitted</h3>
                        <span className="text-sm text-gray-500">June 15, 2023</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        You submitted your application for the Non-Academic Scholarship program.
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 h-5 w-5 rounded-full bg-[#800000]"></div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Documents Verified</h3>
                        <span className="text-sm text-gray-500">June 18, 2023</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your submitted documents were verified by the OAS staff.
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 h-5 w-5 rounded-full bg-[#800000]"></div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Personality Test Completed</h3>
                        <span className="text-sm text-gray-500">June 20, 2023</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        You completed the required personality assessment test.
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 h-5 w-5 rounded-full bg-blue-500"></div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Interview Scheduled</h3>
                        <span className="text-sm text-gray-500">June 22, 2023</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your interview has been scheduled for June 25, 2023 at 10:00 AM.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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

        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={handleSaveProfile} disabled={isLoading} className="bg-[#800000] hover:bg-[#600000]">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

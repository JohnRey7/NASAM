"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export default function SettingsPageStandalone() {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    toast({
      title: "Theme Updated",
      description: `Theme changed to ${newTheme === 'system' ? 'system default' : newTheme} mode`,
      duration: 2000
    })
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#800000]">Settings</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>
            <Button
              variant="outline"
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 border-[#800000] text-[#800000] hover:bg-[#800000] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        <Tabs defaultValue="appearance" className="space-y-4 w-full">
          <TabsList className="w-full justify-start bg-white shadow-sm">
            <TabsTrigger value="appearance" className="data-[state=active]:bg-[#800000] data-[state=active]:text-white">Appearance</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-[#800000] data-[state=active]:text-white">Notifications</TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-[#800000] data-[state=active]:text-white">Account</TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-[#800000] data-[state=active]:text-white">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-[#800000]/20 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#800000]">Appearance Settings</CardTitle>
                  <CardDescription>Customize how the application looks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label className="text-base text-[#800000]">Theme Mode</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose your preferred color scheme for the application
                    </p>

                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          theme === 'light'
                            ? 'border-[#800000] bg-[#800000]/5'
                            : 'border-border hover:border-[#800000]/50'
                        }`}
                      >
                        <Sun className={`h-6 w-6 ${theme === 'light' ? 'text-[#800000]' : ''}`} />
                        <span className="text-sm font-medium">Light</span>
                        <span className="text-xs text-muted-foreground">Bright theme</span>
                      </button>

                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          theme === 'dark'
                            ? 'border-[#800000] bg-[#800000]/5'
                            : 'border-border hover:border-[#800000]/50'
                        }`}
                      >
                        <Moon className={`h-6 w-6 ${theme === 'dark' ? 'text-[#800000]' : ''}`} />
                        <span className="text-sm font-medium">Dark</span>
                        <span className="text-xs text-muted-foreground">Dark theme</span>
                      </button>

                      <button
                        onClick={() => handleThemeChange('system')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          theme === 'system'
                            ? 'border-[#800000] bg-[#800000]/5'
                            : 'border-border hover:border-[#800000]/50'
                        }`}
                      >
                        <Monitor className={`h-6 w-6 ${theme === 'system' ? 'text-[#800000]' : ''}`} />
                        <span className="text-sm font-medium">System</span>
                        <span className="text-xs text-muted-foreground">Auto theme</span>
                      </button>
                    </div>

                    <div className="mt-4 p-3 bg-[#800000]/10 border border-[#800000]/30 rounded-lg">
                      <p className="text-sm text-[#800000]">
                        <strong>Current theme:</strong> {theme === 'system' ? 'System Default' : theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : 'Loading...'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#800000]/20 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#800000]">Display Options</CardTitle>
                  <CardDescription>Adjust display and layout preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Use a more condensed layout</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Animations</Label>
                      <p className="text-sm text-muted-foreground">Enable smooth transitions and animations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-size">Font Size</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger id="font-size">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-[#800000]/20 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#800000]">Email Notifications</CardTitle>
                  <CardDescription>Manage email notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Application Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified about application status changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Interview Reminders</Label>
                      <p className="text-sm text-muted-foreground">Receive reminders for scheduled interviews</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Document Requests</Label>
                      <p className="text-sm text-muted-foreground">Notifications for document submissions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Evaluation Results</Label>
                      <p className="text-sm text-muted-foreground">Get notified about evaluation outcomes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#800000]/20 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#800000]">System Notifications</CardTitle>
                  <CardDescription>Control in-app notification behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Desktop Notifications</Label>
                      <p className="text-sm text-muted-foreground">Show browser notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sound Alerts</Label>
                      <p className="text-sm text-muted-foreground">Play sound for notifications</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-frequency">Notification Frequency</Label>
                    <Select defaultValue="instant">
                      <SelectTrigger id="notification-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">Instant</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-[#800000]/20 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#800000]">Profile Information</CardTitle>
                  <CardDescription>View your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input id="full-name" placeholder="Your full name" disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your.email@example.com" disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input id="student-id" placeholder="Your student ID" disabled className="bg-muted" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#800000]/20 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#800000]">Security</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" placeholder="Enter current password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" placeholder="Enter new password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" placeholder="Confirm new password" />
                  </div>
                  <Button variant="outline" className="w-full border-[#800000] text-[#800000] hover:bg-[#800000] hover:text-white">
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-[#800000]/20 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#800000]">Regional Settings</CardTitle>
                  <CardDescription>Configure language and regional preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fil">Filipino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="asia-manila">
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia-manila">Asia/Manila (GMT+8)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select defaultValue="mm-dd-yyyy">
                      <SelectTrigger id="date-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#800000]/20 shadow-md">
                <CardHeader>
                  <CardTitle className="text-[#800000]">Application Preferences</CardTitle>
                  <CardDescription>Customize your application experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-save Forms</Label>
                      <p className="text-sm text-muted-foreground">Automatically save form progress</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Tooltips</Label>
                      <p className="text-sm text-muted-foreground">Display helpful hints and tips</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Keyboard Shortcuts</Label>
                      <p className="text-sm text-muted-foreground">Enable keyboard navigation</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

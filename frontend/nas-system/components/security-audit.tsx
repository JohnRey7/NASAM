"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Download, Search, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  ipAddress: string
  location: string
  status: "success" | "warning" | "error"
}

// Sample audit logs
const auditLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "2023-06-15 09:23:45",
    user: "admin@cit-u.edu.ph",
    action: "User Login",
    ipAddress: "192.168.1.1",
    location: "Cebu City, Philippines",
    status: "success",
  },
  {
    id: "2",
    timestamp: "2023-06-15 10:15:22",
    user: "staff1@cit-u.edu.ph",
    action: "Application Status Update",
    ipAddress: "192.168.1.2",
    location: "Cebu City, Philippines",
    status: "success",
  },
  {
    id: "3",
    timestamp: "2023-06-15 11:05:17",
    user: "panelist2@cit-u.edu.ph",
    action: "Interview Schedule Created",
    ipAddress: "192.168.1.3",
    location: "Cebu City, Philippines",
    status: "success",
  },
  {
    id: "4",
    timestamp: "2023-06-15 13:45:30",
    user: "unknown",
    action: "Failed Login Attempt",
    ipAddress: "203.177.42.10",
    location: "Manila, Philippines",
    status: "error",
  },
  {
    id: "5",
    timestamp: "2023-06-15 14:22:18",
    user: "staff2@cit-u.edu.ph",
    action: "Document Access",
    ipAddress: "192.168.1.5",
    location: "Mandaue City, Philippines",
    status: "warning",
  },
  {
    id: "6",
    timestamp: "2023-06-15 15:10:05",
    user: "admin@cit-u.edu.ph",
    action: "User Role Modified",
    ipAddress: "192.168.1.1",
    location: "Cebu City, Philippines",
    status: "success",
  },
  {
    id: "7",
    timestamp: "2023-06-15 16:30:12",
    user: "staff3@cit-u.edu.ph",
    action: "Bulk Application Export",
    ipAddress: "192.168.1.6",
    location: "Cebu City, Philippines",
    status: "success",
  },
]

export function SecurityAudit() {
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [securityTab, setSecurityTab] = useState("audit")
  const { toast } = useToast()

  const handleExportLogs = () => {
    toast({
      title: "Logs Exported",
      description: "Audit logs have been exported successfully.",
    })
  }

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Security settings have been updated successfully.",
    })
  }

  const getStatusBadge = (status: AuditLog["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Success
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Warning
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Error
          </Badge>
        )
    }
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter)
    const matchesStatus = statusFilter === "all" || log.status === statusFilter

    return matchesSearch && matchesAction && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#800000]">Security and Audit</h2>
          <p className="text-gray-600">Manage system security settings and view audit logs</p>
        </div>
      </div>

      <Tabs value={securityTab} onValueChange={setSecurityTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card>
            <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-[#800000]">System Audit Logs</CardTitle>
                  <CardDescription>Track all system activities and user actions</CardDescription>
                </div>
                <Button variant="outline" className="flex items-center gap-2" onClick={handleExportLogs}>
                  <Download className="h-4 w-4" />
                  Export Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search logs by user, action, IP, or location"
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-40">
                      <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          <SelectItem value="Login">Login</SelectItem>
                          <SelectItem value="Application">Application</SelectItem>
                          <SelectItem value="Document">Document</SelectItem>
                          <SelectItem value="User">User Management</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-40">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            IP Address
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-500">{log.timestamp}</td>
                            <td className="px-4 py-3 text-sm">{log.user}</td>
                            <td className="px-4 py-3 text-sm">{log.action}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{log.ipAddress}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{log.location}</td>
                            <td className="px-4 py-3 text-sm">{getStatusBadge(log.status)}</td>
                          </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No logs found matching your filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    Showing {filteredLogs.length} of {auditLogs.length} logs
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
                <CardTitle className="text-[#800000]">Role-Based Access Control</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Users
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">Administrator</td>
                            <td className="px-4 py-3 text-sm">Full system access and control</td>
                            <td className="px-4 py-3 text-sm">3</td>
                            <td className="px-4 py-3 text-sm">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">OAS Staff</td>
                            <td className="px-4 py-3 text-sm">Application review and management</td>
                            <td className="px-4 py-3 text-sm">8</td>
                            <td className="px-4 py-3 text-sm">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">Panelist</td>
                            <td className="px-4 py-3 text-sm">Interview and evaluation access</td>
                            <td className="px-4 py-3 text-sm">15</td>
                            <td className="px-4 py-3 text-sm">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">Applicant</td>
                            <td className="px-4 py-3 text-sm">Limited to own application</td>
                            <td className="px-4 py-3 text-sm">247</td>
                            <td className="px-4 py-3 text-sm">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Button className="bg-[#800000] hover:bg-[#600000]">Add New Role</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
                <CardTitle className="text-[#800000]">Permission Matrix</CardTitle>
                <CardDescription>Configure access permissions by role</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Permission
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Admin
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              OAS Staff
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Panelist
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Applicant
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">View Applications</td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto" />
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">Manage Users</td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">Export Data</td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">View Analytics</td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">Manage Evaluations</td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Button className="bg-[#800000] hover:bg-[#600000]">Edit Permissions</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
              <CardTitle className="text-[#800000]">Security Settings</CardTitle>
              <CardDescription>Configure system security parameters</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Authentication Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-500">Require 2FA for all staff accounts</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Password Complexity</Label>
                        <p className="text-sm text-gray-500">Require strong passwords with special characters</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="space-y-2">
                      <Label>Password Expiry (Days)</Label>
                      <Input type="number" defaultValue="90" />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Login Attempts</Label>
                      <Input type="number" defaultValue="5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Location Restrictions</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Geolocation Restriction</Label>
                        <p className="text-sm text-gray-500">Restrict access to CIT-U campus only</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="space-y-2">
                      <Label>Allowed IP Range</Label>
                      <Input defaultValue="192.168.1.0/24" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Session Settings</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Session Timeout (Minutes)</Label>
                      <Input type="number" defaultValue="30" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Concurrent Sessions</Label>
                        <p className="text-sm text-gray-500">Allow users to be logged in from multiple devices</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Data Protection</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Data Encryption</Label>
                        <p className="text-sm text-gray-500">Encrypt sensitive data in the database</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Audit Logging</Label>
                        <p className="text-sm text-gray-500">Log all system activities for auditing</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="space-y-2">
                      <Label>Log Retention Period (Days)</Label>
                      <Input type="number" defaultValue="365" />
                    </div>
                  </div>
                </div>

                <Button className="bg-[#800000] hover:bg-[#600000]" onClick={handleSaveSettings}>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

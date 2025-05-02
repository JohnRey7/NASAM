"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Download, Search, Filter, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  details: string
  ipAddress: string
  status: "success" | "warning" | "error"
}

// Sample audit logs
const AUDIT_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2023-06-15 09:23:45",
    user: "admin@cit-u.edu.ph",
    action: "User Login",
    details: "Admin user logged in successfully",
    ipAddress: "192.168.1.1",
    status: "success",
  },
  {
    id: "LOG-002",
    timestamp: "2023-06-15 10:15:22",
    user: "staff1@cit-u.edu.ph",
    action: "Application Status Update",
    details: "Changed application APP-2023-001 status from 'pending' to 'document_verification'",
    ipAddress: "192.168.1.2",
    status: "success",
  },
  {
    id: "LOG-003",
    timestamp: "2023-06-15 11:05:17",
    user: "panelist2@cit-u.edu.ph",
    action: "Interview Schedule Created",
    details: "Scheduled interview for applicant 2020-00001 on 2023-06-20",
    ipAddress: "192.168.1.3",
    status: "success",
  },
  {
    id: "LOG-004",
    timestamp: "2023-06-15 13:45:30",
    user: "unknown",
    action: "Failed Login Attempt",
    details: "Multiple failed login attempts for user account staff3@cit-u.edu.ph",
    ipAddress: "203.177.42.10",
    status: "error",
  },
  {
    id: "LOG-005",
    timestamp: "2023-06-15 14:22:18",
    user: "staff2@cit-u.edu.ph",
    action: "Document Access",
    details: "Accessed sensitive financial documents for applicant 2020-00002",
    ipAddress: "192.168.1.5",
    status: "warning",
  },
  {
    id: "LOG-006",
    timestamp: "2023-06-15 15:10:05",
    user: "admin@cit-u.edu.ph",
    action: "User Role Modified",
    details: "Changed user staff4@cit-u.edu.ph role from 'staff' to 'admin'",
    ipAddress: "192.168.1.1",
    status: "success",
  },
  {
    id: "LOG-007",
    timestamp: "2023-06-15 16:30:12",
    user: "staff3@cit-u.edu.ph",
    action: "Bulk Application Export",
    details: "Exported data for 25 applications in CSV format",
    ipAddress: "192.168.1.6",
    status: "success",
  },
]

export function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  const handleExportLogs = () => {
    toast({
      title: "Logs Exported",
      description: "Audit logs have been exported successfully.",
    })
  }

  const getStatusBadge = (status: AuditLog["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Warning
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
    }
  }

  const filteredLogs = AUDIT_LOGS.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter)
    const matchesStatus = statusFilter === "all" || log.status === statusFilter

    return matchesSearch && matchesAction && matchesStatus
  })

  return (
    <div className="space-y-6">
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
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search logs by user, action, or details"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
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
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
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
                    Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{log.timestamp}</td>
                    <td className="px-4 py-3 text-sm">{log.user}</td>
                    <td className="px-4 py-3 text-sm">{log.action}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.details}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.ipAddress}</td>
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

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <span>
              Showing {filteredLogs.length} of {AUDIT_LOGS.length} logs
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
        </CardContent>
      </Card>
    </div>
  )
}

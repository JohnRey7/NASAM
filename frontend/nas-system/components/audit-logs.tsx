"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Download, Search, Filter, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AuditLog {
  _id: string
  timestamp: string
  userId: {
    _id: string
    username?: string
    email?: string
    name?: string
  } | null
  action: string
  module: string
  archived: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'


export function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch audit logs from API
  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      console.log('📋 Fetching audit logs from:', `${API_URL}/audit-logs`)
      const response = await fetch(`${API_URL}/audit-logs`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📋 Audit logs received:', data)
        setLogs(data)
      } else {
        const errorData = await response.json().catch(() => null)
        console.error('📋 Failed to fetch audit logs:', response.status, errorData)
        toast({
          title: "Error",
          description: `Failed to load audit logs: ${errorData?.message || response.statusText}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('📋 Error fetching audit logs:', error)
      toast({
        title: "Connection Error",
        description: "Could not connect to audit log service.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportLogs = async (format: 'pdf' | 'excel') => {
    try {
      const url = `${API_URL}/audit-logs/export/${format}`
      const response = await fetch(url, {
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `audit_logs.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(downloadUrl)

        toast({
          title: "Logs Exported",
          description: `Audit logs have been exported as ${format.toUpperCase()}.`,
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export audit logs.",
        variant: "destructive"
      })
    }
  }

  const getModuleBadge = (module: string) => {
    const colors: Record<string, string> = {
      'Authentication': 'bg-blue-100 text-blue-800 border-blue-200',
      'Application': 'bg-green-100 text-green-800 border-green-200',
      'Document': 'bg-purple-100 text-purple-800 border-purple-200',
      'Interview': 'bg-orange-100 text-orange-800 border-orange-200',
      'Evaluation': 'bg-pink-100 text-pink-800 border-pink-200',
    }
    
    return (
      <Badge variant="outline" className={colors[module] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {module}
      </Badge>
    )
  }

  const filteredLogs = logs.filter((log) => {
    const userName = log.userId?.username || log.userId?.email || log.userId?.name || 'Unknown'
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter

    return matchesSearch && matchesModule
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
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2" onClick={() => handleExportLogs('pdf')}>
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => handleExportLogs('excel')}>
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
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
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="Authentication">Authentication</SelectItem>
                  <SelectItem value="Application">Application</SelectItem>
                  <SelectItem value="Document">Document</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                  <SelectItem value="Evaluation">Evaluation</SelectItem>
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
                    Module
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                        <span className="ml-2 text-gray-500">Loading audit logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.userId?.username || log.userId?.email || log.userId?.name || 'Unknown User'}
                    </td>
                    <td className="px-4 py-3 text-sm">{log.action}</td>
                    <td className="px-4 py-3 text-sm">{getModuleBadge(log.module)}</td>
                  </tr>
                ))}

                {!loading && filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No logs found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <span>
              Showing {filteredLogs.length} of {logs.length} logs
            </span>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Download, Search, Filter, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AuditLog {
  _id: string
  timestamp: string
  userId: {
    _id: string
    name?: string
    idNumber?: string
    email?: string
  } | null
  action: string
  module: string
  archived: boolean
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
  hasMore: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
const ITEMS_PER_PAGE = 20


export function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    pages: 0,
    hasMore: false
  })
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchLogs = useCallback(async (page: number = 1, reset: boolean = false, search?: string, module?: string) => {
    // Use passed parameters or fall back to current state
    const searchValue = search !== undefined ? search : debouncedSearch
    const moduleValue = module !== undefined ? module : moduleFilter
    
    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      })
      
      if (searchValue) params.append('search', searchValue)
      if (moduleValue !== 'all') params.append('module', moduleValue)

      console.log('📋 Fetching audit logs from:', `${API_URL}/audit-logs?${params}`)
      const response = await fetch(`${API_URL}/audit-logs?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📋 Audit logs received:', data)
        
        // Handle both old format (array) and new format (with pagination)
        if (Array.isArray(data)) {
          setLogs(data)
          setPagination({
            page: 1,
            limit: data.length,
            total: data.length,
            pages: 1,
            hasMore: false
          })
        } else {
          if (reset) {
            setLogs(data.logs || [])
          } else {
            setLogs(prev => [...prev, ...(data.logs || [])])
          }
          setPagination(data.pagination || {
            page: 1,
            limit: ITEMS_PER_PAGE,
            total: data.logs?.length || 0,
            pages: 1,
            hasMore: false
          })
        }
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
      setLoadingMore(false)
    }
  }, [debouncedSearch, moduleFilter, toast])

  // Fetch logs when filters change (reset to page 1)
  useEffect(() => {
    setLogs([])
    fetchLogs(1, true, debouncedSearch, moduleFilter)
  }, [debouncedSearch, moduleFilter, fetchLogs])

  // Handle scroll for lazy loading
  const handleScroll = useCallback(() => {
    if (!tableContainerRef.current || loadingMore || !pagination.hasMore) return
    
    const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100
    
    if (isNearBottom) {
      fetchLogs(pagination.page + 1, false)
    }
  }, [loadingMore, pagination.hasMore, pagination.page, fetchLogs])

  // Page navigation
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.pages) return
    setLogs([])
    fetchLogs(page, true)
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
                placeholder="Search by user, action, or module..."
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

          <div 
            ref={tableContainerRef}
            className="overflow-x-auto max-h-[500px] overflow-y-auto border rounded-md"
            onScroll={handleScroll}
          >
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
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
                        <Loader2 className="h-6 w-6 animate-spin text-[#800000]" />
                        <span className="ml-2 text-gray-500">Loading audit logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.userId?.name || log.userId?.email || log.userId?.idNumber || 'Unknown User'}
                    </td>
                    <td className="px-4 py-3 text-sm">{log.action}</td>
                    <td className="px-4 py-3 text-sm">{getModuleBadge(log.module)}</td>
                  </tr>
                ))}

                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No logs found matching your filters
                    </td>
                  </tr>
                )}

                {loadingMore && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#800000]" />
                        <span className="text-sm text-gray-500">Loading more...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
            <span className="text-sm text-gray-500">
              Showing {logs.length} of {pagination.total} logs
              {pagination.pages > 1 && ` (Page ${pagination.page} of ${pagination.pages})`}
            </span>
            
            <div className="flex items-center gap-2">
              {pagination.pages > 1 && (
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        className={pageNum === pagination.page ? "bg-[#800000] text-white" : ""}
                        onClick={() => goToPage(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchLogs(1, true)}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Calendar, Download, MessageSquare, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { oasService, type Application } from "@/services/oasService"
export function ApplicationReview() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchApplications()
  }, [])
  const fetchApplications = async () => {
    try {
      setLoading(true)
      const data = await oasService.getAllApplications()
      setApplications(data.applications)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      await oasService.updateApplicationStatus(applicationId, newStatus)
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app._id === applicationId ? { ...app, status: newStatus as any } : app
      ))
      toast({
        title: "Success",
      description: `Application status updated to ${newStatus}`,
    })
    } catch (error) {
      console.error('Error updating status:', error)
                                      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
                                      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pending': { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      'Document Verification': { color: "bg-blue-100 text-blue-800", icon: FileText },
      'Interview Scheduled': { color: "bg-purple-100 text-purple-800", icon: Calendar },
      'Approved': { color: "bg-green-100 text-green-800", icon: CheckCircle },
      'Rejected': { color: "bg-red-100 text-red-800", icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending']
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
  )
}

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const filteredApplications = applications.filter(application => {
    const matchesFilter = filter === "all" || application.status === filter
    const matchesSearch = searchTerm === "" || 
      application.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.user?.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application._id.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Application Management
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, ID, or application number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Document Verification">Document Verification</SelectItem>
              <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredApplications.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {filter === "all" 
                ? "No applications have been submitted yet." 
                : `No applications with status "${filter}" found.`}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application._id}>
                  <TableCell className="font-mono text-sm">
                    {application._id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {application.firstName} {application.lastName}
                  </TableCell>
                  <TableCell className="font-mono">
                    {application.user?.idNumber || 'N/A'}
                  </TableCell>
                  <TableCell>{application.emailAddress}</TableCell>
                  <TableCell>{formatDate(application.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                          </DialogHeader>
                          
                          {selectedApplication && (
                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="actions">Actions</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium">Personal Information</h4>
                                    <p className="text-sm text-gray-600">
                                      Name: {selectedApplication.firstName} {selectedApplication.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Email: {selectedApplication.emailAddress}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Student ID: {selectedApplication.user?.idNumber || 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Application Status</h4>
                                    <div className="mt-2">
                                      {getStatusBadge(selectedApplication.status)}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                      Submitted: {formatDate(selectedApplication.createdAt)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Last Updated: {formatDate(selectedApplication.updatedAt)}
                                    </p>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="documents" className="space-y-4">
                                <div className="text-center py-8">
                                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-600">Document management coming soon</p>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="actions" className="space-y-4">
                                <div className="space-y-4">
                                  <h4 className="font-medium">Update Application Status</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      onClick={() => handleUpdateStatus(selectedApplication._id, 'Document Verification')}
                                      variant="outline"
                                      className="justify-start"
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Document Verification
                                    </Button>
                                    <Button
                                      onClick={() => handleUpdateStatus(selectedApplication._id, 'Interview Scheduled')}
                                      variant="outline"
                                      className="justify-start"
                                    >
                                      <Calendar className="h-4 w-4 mr-2" />
                                      Schedule Interview
                                    </Button>
                                    <Button
                                      onClick={() => handleUpdateStatus(selectedApplication._id, 'Approved')}
                                      variant="outline"
                                      className="justify-start text-green-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      onClick={() => handleUpdateStatus(selectedApplication._id, 'Rejected')}
                                      variant="outline"
                                      className="justify-start text-red-600"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
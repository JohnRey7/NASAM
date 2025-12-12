"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  User,
  CheckCircle2
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { ScholarEvaluationForm } from "@/components/scholar-evaluation-form"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface ApplicantForEvaluation {
  _id: string
  applicationId: string
  scholarId: string
  idNumber: string
  name: string
  firstName: string
  lastName: string
  email: string
  profilePicture?: string
  course: string
  yearLevel: string
  department: string
  departmentCode: string
  applicationStatus: string
  interviewsFinishedAt: string
  hasEvaluation: boolean
  evaluationStatus?: 'pending_timekeeping' | 'completed' | 'acknowledged' | null
  finalDecision?: 'pending' | 'approved' | 'rejected' | null
  evaluation?: {
    _id: string
    source?: 'scholar' | 'old'
    overallRating: number
    interpretation?: string
    status?: string
    finalDecision?: string
    evaluatedBy: { name: string; email: string; department?: string }
    evaluatorDepartment?: string
    createdAt: string
    updatedAt: string
    // Full evaluation data for editing
    evaluatorPosition?: string
    attendanceAndPunctuality?: {
      regularityOfAttendance: number
      promptnessInReporting: number
    }
    qualityOfWorkOutput?: {
      accuracyAndThoroughness: number
      organizationAndPresentation: number
      effectiveness: number
    }
    quantityOfWorkOutput?: {
      accomplishesMoreWork: number
      readinessInAccomplishing: number
    }
    personalQualities?: {
      responsibilityAndUrgency: number
      dependabilityAndReliability: number
      industryAndResourcefulness: number
      fairnessAndInitiative: number
      sociabilityAndDisposition: number
    }
    timekeepingRecord?: {
      excusedAbsences: number
      unexcusedAbsences: number
      lateMoreThan10mins: number
      lateLessThan1hr: number
      failureToPunch: number
      underTime: number
    }
    supervisorRemarks?: string
    nasRemarks?: string
    semester?: string
    schoolYear?: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface EvaluationManagementProps {
  userRole: 'admin' | 'oas_staff' | 'department_head'
}

export function EvaluationManagement({ userRole }: EvaluationManagementProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [applicants, setApplicants] = useState<ApplicantForEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filter, setFilter] = useState("all") // all, evaluated, pending
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [summary, setSummary] = useState({
    totalReadyForEvaluation: 0,
    evaluated: 0,
    pending: 0,
    pendingTimekeeping: 0
  })
  
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantForEvaluation | null>(null)
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [finishingEvaluation, setFinishingEvaluation] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch applicants ready for evaluation
  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: debouncedSearch
      })
      
      const response = await fetch(`${API_URL}/scholar-evaluation/ready-for-evaluation?${params}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch applicants:', response.status, errorData)
        throw new Error(errorData.message || `Failed to fetch applicants (${response.status})`)
      }
      
      const data = await response.json()
      
      // Apply client-side filter
      let filtered = data.applicants || []
      if (filter === 'evaluated') {
        filtered = filtered.filter((a: ApplicantForEvaluation) => a.hasEvaluation)
      } else if (filter === 'pending') {
        filtered = filtered.filter((a: ApplicantForEvaluation) => !a.hasEvaluation)
      }
      
      setApplicants(filtered)
      setPagination(data.pagination)
      setSummary(data.summary)
    } catch (err: any) {
      console.error('Error fetching applicants:', err)
      setError(err.message || 'Failed to load applicants')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearch, filter])

  useEffect(() => {
    fetchApplicants()
  }, [fetchApplicants])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleDeleteEvaluation = async (evaluationId: string) => {
    try {
      const response = await fetch(`${API_URL}/scholar-evaluation/${evaluationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete evaluation')
      }
      
      toast({
        title: "Success",
        description: "Evaluation deleted successfully",
      })
      
      setShowDeleteDialog(false)
      setSelectedApplicant(null)
      fetchApplicants()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  // Finish evaluation and determine pass/fail
  const handleFinishEvaluation = async () => {
    if (!selectedApplicant?.evaluation) return
    
    setFinishingEvaluation(true)
    try {
      const evaluationId = selectedApplicant.evaluation._id
      const source = selectedApplicant.evaluation.source || 'scholar'
      const overallRating = selectedApplicant.evaluation.overallRating
      
      // Determine pass/fail based on rating >= 3.0
      const passed = overallRating >= 3.0
      const finalDecision = passed ? 'approved' : 'rejected'
      
      // If it's from the old Evaluation model, update that
      if (source === 'old') {
        const response = await fetch(`${API_URL}/evaluations/${evaluationId}/id`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            evaluationStatus: passed ? 'passed' : 'failed'
          })
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || 'Failed to finish evaluation')
        }
      } else {
        // Update ScholarEvaluation
        const response = await fetch(`${API_URL}/scholar-evaluation/${evaluationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: 'completed',
            finalDecision: finalDecision
          })
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || 'Failed to finish evaluation')
        }
      }
      
      toast({
        title: passed ? "Scholar Approved!" : "Scholar Rejected",
        description: `${selectedApplicant.name} has been ${passed ? 'approved' : 'rejected'} with a rating of ${overallRating.toFixed(2)}`,
        variant: passed ? "default" : "destructive"
      })
      
      setShowFinishDialog(false)
      setSelectedApplicant(null)
      fetchApplicants()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setFinishingEvaluation(false)
    }
  }

  const getEvaluationBadge = (applicant: ApplicantForEvaluation) => {
    if (applicant.hasEvaluation && applicant.evaluation) {
      const rating = applicant.evaluation.overallRating
      const ratingNum = typeof rating === 'object' && '$numberDecimal' in rating 
        ? parseFloat((rating as any).$numberDecimal) 
        : Number(rating)
      
      const status = applicant.evaluationStatus || applicant.evaluation.status
      const finalDecision = applicant.finalDecision || applicant.evaluation.finalDecision
      
      // Show different badges based on status
      if (status === 'pending_timekeeping') {
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-orange-100 text-orange-700">
              <Clock className="h-3 w-3 mr-1" />
              Awaiting Timekeeping
            </Badge>
            <span className="text-xs text-gray-500">Rating: {ratingNum.toFixed(2)}</span>
          </div>
        )
      }
      
      if (status === 'completed' && finalDecision) {
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className={finalDecision === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
              {finalDecision === 'approved' ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Approved</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Rejected</>
              )}
            </Badge>
            <span className="text-xs text-gray-500">
              <Star className="h-3 w-3 inline fill-yellow-400 text-yellow-400" /> {ratingNum.toFixed(2)} / 5.00
            </span>
          </div>
        )
      }
      
      return (
        <Badge variant="outline" className="bg-green-100 text-green-700">
          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
          {ratingNum.toFixed(2)} / 5.00
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700">
        <Clock className="h-3 w-3 mr-1" />
        Pending Evaluation
      </Badge>
    )
  }

  const canEdit = userRole === 'admin' || userRole === 'oas_staff'
  const canDelete = userRole === 'admin' || userRole === 'oas_staff'

  // Get ALL pending applicants (not just filtered ones) for "Create Evaluation" dropdown
  // We need to use summary.pending instead of filtering current page
  const hasPendingApplicants = summary.pending > 0
  const pendingApplicantsOnCurrentPage = applicants.filter(a => !a.hasEvaluation)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#800000]">Scholar Evaluation</CardTitle>
            <CardDescription>
              Evaluate applicants who have completed their interviews
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="bg-green-50">
              {summary.evaluated} Evaluated
            </Badge>
            <Badge variant="outline" className="bg-amber-50">
              {summary.pending} Pending
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, ID number, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applicants</SelectItem>
                <SelectItem value="pending">Pending Evaluation</SelectItem>
                <SelectItem value="evaluated">Already Evaluated</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchApplicants}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchApplicants} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#800000]" />
            <span className="ml-2 text-gray-600">Loading applicants...</span>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course / Year
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evaluation Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evaluated By
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applicants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <User className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">No applicants ready for evaluation</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Applicants will appear here once both OAS and Department Head interviews are completed
                        </p>
                      </td>
                    </tr>
                  ) : (
                    applicants.map((applicant) => (
                      <tr key={applicant._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              {applicant.profilePicture ? (
                                <AvatarImage src={`${API_URL}/files/${applicant.profilePicture}`} />
                              ) : null}
                              <AvatarFallback className="text-xs">
                                {applicant.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{applicant.name}</p>
                              <p className="text-xs text-gray-500">{applicant.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {applicant.idNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{applicant.course}</div>
                          <div className="text-xs text-gray-400">{applicant.yearLevel}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {applicant.department}
                        </td>
                        <td className="px-4 py-3">
                          {getEvaluationBadge(applicant)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {applicant.evaluation?.overallRating ? (
                            <div className="flex flex-col items-center">
                              <span className={`text-lg font-bold ${
                                applicant.evaluation.overallRating >= 3.0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {applicant.evaluation.overallRating.toFixed(2)}
                              </span>
                              <span className={`text-xs ${
                                applicant.evaluation.overallRating >= 4.5 ? 'text-green-600' :
                                applicant.evaluation.overallRating >= 3.5 ? 'text-blue-600' :
                                applicant.evaluation.overallRating >= 3.0 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {applicant.evaluation.overallRating >= 4.5 ? 'Excellent' :
                                 applicant.evaluation.overallRating >= 3.5 ? 'Good' :
                                 applicant.evaluation.overallRating >= 3.0 ? 'Average' : 'Fail'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {applicant.evaluation?.evaluatedBy ? (
                            <div>
                              <p className="text-sm font-medium">{applicant.evaluation.evaluatedBy.name}</p>
                              {(applicant.evaluation.evaluatedBy.department || applicant.evaluation.evaluatorDepartment) && (
                                <p className="text-xs text-gray-500">
                                  {applicant.evaluation.evaluatedBy.department || applicant.evaluation.evaluatorDepartment}
                                </p>
                              )}
                              <p className="text-xs text-gray-400">
                                {new Date(applicant.evaluation.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {applicant.hasEvaluation ? (
                              <>
                                {/* View button - always visible */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => {
                                    setSelectedApplicant(applicant)
                                    setIsEditing(false)
                                    setShowEvaluationDialog(true)
                                  }}
                                  title="View Evaluation"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                {/* Edit/Update button - for OAS/Admin to update evaluation */}
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => {
                                      setSelectedApplicant(applicant)
                                      setIsEditing(true)
                                      setShowEvaluationDialog(true)
                                    }}
                                    title="Update Evaluation"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}

                                {/* Finish button - for OAS/Admin to finalize evaluation and determine pass/fail */}
                                {canEdit && applicant.evaluation && applicant.evaluation.status !== 'completed' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => {
                                      setSelectedApplicant(applicant)
                                      setShowFinishDialog(true)
                                    }}
                                    title="Finish & Determine Pass/Fail"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                )}

                                {/* Delete button */}
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedApplicant(applicant)
                                      setShowDeleteDialog(true)
                                    }}
                                    title="Delete Evaluation"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              /* Create button - for applicants without evaluation */
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedApplicant(applicant)
                                  setIsEditing(false)
                                  setShowEvaluationDialog(true)
                                }}
                                title="Create Evaluation"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} applicants
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Evaluation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the evaluation for {selectedApplicant?.name}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedApplicant?.evaluation?._id) {
                  handleDeleteEvaluation(selectedApplicant.evaluation._id)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Form Dialog - Uses ScholarEvaluationForm */}
      {selectedApplicant && (
        <ScholarEvaluationForm
          key={`${selectedApplicant._id}-${selectedApplicant.evaluation?._id || 'new'}-${isEditing}`}
          scholar={{
            _id: selectedApplicant.scholarId || selectedApplicant._id,
            userId: selectedApplicant.scholarId || selectedApplicant._id,
            idNumber: selectedApplicant.idNumber,
            name: selectedApplicant.name,
            firstName: selectedApplicant.firstName,
            lastName: selectedApplicant.lastName,
            course: selectedApplicant.course,
            programOfStudyAndYear: selectedApplicant.course,
            department: selectedApplicant.department,
            applicationId: selectedApplicant.applicationId
          }}
          open={showEvaluationDialog}
          onOpenChange={(open) => {
            setShowEvaluationDialog(open)
            if (!open) {
              setSelectedApplicant(null)
              setIsEditing(false)
            }
          }}
          onSuccess={() => {
            setShowEvaluationDialog(false)
            setSelectedApplicant(null)
            setIsEditing(false)
            fetchApplicants()
            toast({
              title: "Success",
              description: isEditing ? "Evaluation updated successfully" : "Evaluation created successfully",
            })
          }}
          existingEvaluation={selectedApplicant.hasEvaluation ? selectedApplicant.evaluation : undefined}
          readOnly={!isEditing && selectedApplicant.hasEvaluation}
          hideTimekeeping={userRole === 'department_head'}
          isCompletingTimekeeping={isEditing && selectedApplicant.evaluationStatus === 'pending_timekeeping' && (userRole === 'admin' || userRole === 'oas_staff')}
        />
      )}

      {/* Finish Evaluation Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Evaluation</DialogTitle>
            <DialogDescription>
              Finalize the evaluation for {selectedApplicant?.name}?
            </DialogDescription>
          </DialogHeader>
          {selectedApplicant?.evaluation && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overall Rating:</span>
                  <span className={`text-2xl font-bold ${
                    selectedApplicant.evaluation.overallRating >= 3.0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedApplicant.evaluation.overallRating.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Result:</span>
                  {selectedApplicant.evaluation.overallRating >= 3.0 ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      PASS
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      FAIL
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Passing grade is 3.0 or above. This action will mark the evaluation as completed
                  and {selectedApplicant.evaluation.overallRating >= 3.0 ? 'approve' : 'reject'} the scholar.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinishDialog(false)} disabled={finishingEvaluation}>
              Cancel
            </Button>
            <Button 
              onClick={handleFinishEvaluation} 
              disabled={finishingEvaluation}
              className={selectedApplicant?.evaluation?.overallRating && selectedApplicant.evaluation.overallRating >= 3.0 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
              }
            >
              {finishingEvaluation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm & Finish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Card>
  )
}

export default EvaluationManagement

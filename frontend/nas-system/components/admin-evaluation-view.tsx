"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useConfirmation } from "@/components/ui/confirmation-dialog"
import { scholarEvaluationService } from "@/services/scholarEvaluationService"
import { Eye, Download, Trash2, Search, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"

export function AdminEvaluationView() {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirmation()
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSemester, setFilterSemester] = useState("all")
  const [filterSchoolYear, setFilterSchoolYear] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("")

  useEffect(() => {
    loadEvaluations()
    loadStatistics()
  }, [filterSemester, filterSchoolYear, filterDepartment])

  const loadEvaluations = async () => {
    try {
      setLoading(true)
      const data = await scholarEvaluationService.getAllEvaluations(
        filterSemester && filterSemester !== 'all' ? filterSemester : undefined,
        filterSchoolYear || undefined,
        filterDepartment || undefined
      )
      setEvaluations(data.evaluations || [])
    } catch (error) {
      console.error('Error loading evaluations:', error)
      toast({
        title: "Error",
        description: "Failed to load evaluations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const data = await scholarEvaluationService.getEvaluationStatistics(
        filterSemester && filterSemester !== 'all' ? filterSemester : undefined,
        filterSchoolYear || undefined
      )
      setStatistics(data.statistics)
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  const handleViewEvaluation = (evaluation: any) => {
    setSelectedEvaluation(evaluation)
    setViewDialogOpen(true)
  }

  const handleDeleteEvaluation = async (id: string, scholarName: string) => {
    const confirmed = await confirm({
      title: "Delete Evaluation",
      description: `Are you sure you want to delete the evaluation for ${scholarName}?\n\nThis action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    })
    if (!confirmed) return

    try {
      await scholarEvaluationService.deleteEvaluation(id)
      toast({
        title: "Evaluation Deleted",
        description: `Evaluation for ${scholarName} has been deleted`,
        duration: 3000
      })
      loadEvaluations()
      loadStatistics()
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.message || "Failed to delete evaluation",
        variant: "destructive"
      })
    }
  }

  const getInterpretationColor = (interpretation: string) => {
    switch (interpretation) {
      case 'Very Good': return 'bg-green-500'
      case 'Good': return 'bg-blue-500'
      case 'Average': return 'bg-yellow-500'
      case 'Poor': return 'bg-orange-500'
      case 'Very Poor': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredEvaluations = evaluations.filter(evaluation => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      evaluation.scholarName?.toLowerCase().includes(search) ||
      evaluation.studentId?.toLowerCase().includes(search) ||
      evaluation.department?.toLowerCase().includes(search) ||
      evaluation.evaluatorName?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Evaluations</CardDescription>
              <CardTitle className="text-3xl">{statistics.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Very Good</CardDescription>
              <CardTitle className="text-3xl text-green-600">{statistics.byInterpretation['Very Good'] || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Good</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{statistics.byInterpretation['Good'] || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{statistics.byInterpretation['Average'] || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Poor/Very Poor</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {(statistics.byInterpretation['Poor'] || 0) + (statistics.byInterpretation['Very Poor'] || 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Scholar name, ID, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value="First Semester">First Semester</SelectItem>
                  <SelectItem value="Second Semester">Second Semester</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>School Year</Label>
              <Input
                placeholder="e.g., 2024-2025"
                value={filterSchoolYear}
                onChange={(e) => setFilterSchoolYear(e.target.value)}
              />
            </div>
            <div>
              <Label>Department</Label>
              <Input
                placeholder="e.g., LSAC, IT"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              />
            </div>
          </div>
          {(searchTerm || (filterSemester && filterSemester !== 'all') || filterSchoolYear || filterDepartment) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setFilterSemester("all")
                setFilterSchoolYear("")
                setFilterDepartment("")
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Scholar Evaluations ({filteredEvaluations.length})</CardTitle>
          <CardDescription>View and manage all submitted evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No evaluations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scholar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evaluator</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvaluations.map((evaluation) => (
                    <tr key={evaluation._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{evaluation.scholarName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{evaluation.studentId}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{evaluation.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{evaluation.ratingPeriod}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{evaluation.overallRating.toFixed(2)}</span>
                          <Badge className={`${getInterpretationColor(evaluation.interpretation)} text-white text-xs`}>
                            {evaluation.interpretation}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{evaluation.evaluatorName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(evaluation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewEvaluation(evaluation)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEvaluation(evaluation._id, evaluation.scholarName)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Evaluation Dialog */}
      {selectedEvaluation && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Evaluation Details - {selectedEvaluation.scholarName}</DialogTitle>
              <DialogDescription>{selectedEvaluation.ratingPeriod}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><Label className="text-xs text-gray-500">Scholar</Label><p className="font-medium">{selectedEvaluation.scholarName}</p></div>
                  <div><Label className="text-xs text-gray-500">Student ID</Label><p className="font-medium">{selectedEvaluation.studentId}</p></div>
                  <div><Label className="text-xs text-gray-500">Course</Label><p className="font-medium">{selectedEvaluation.course}</p></div>
                  <div><Label className="text-xs text-gray-500">Department</Label><p className="font-medium">{selectedEvaluation.department}</p></div>
                  <div><Label className="text-xs text-gray-500">Evaluator</Label><p className="font-medium">{selectedEvaluation.evaluatorName}</p></div>
                  <div><Label className="text-xs text-gray-500">Position</Label><p className="font-medium">{selectedEvaluation.evaluatorPosition}</p></div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-sm text-blue-700">Overall Rating</Label>
                      <p className="text-4xl font-bold text-blue-900">{selectedEvaluation.overallRating.toFixed(2)}</p>
                    </div>
                    <Badge className={`${getInterpretationColor(selectedEvaluation.interpretation)} text-white text-xl px-6 py-3`}>
                      {selectedEvaluation.interpretation}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-red-200 bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">A. ATTENDANCE AND PUNCTUALITY (20%)</h3>
                    <div className="space-y-1 text-sm">
                      <p>Regularity: <strong>{selectedEvaluation.attendanceAndPunctuality.regularityOfAttendance}</strong></p>
                      <p>Promptness: <strong>{selectedEvaluation.attendanceAndPunctuality.promptnessInReporting}</strong></p>
                    </div>
                  </div>

                  <div className="border-2 border-orange-200 bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-900 mb-2">B. QUALITY OF WORK OUTPUT (25%)</h3>
                    <div className="space-y-1 text-sm">
                      <p>Accuracy: <strong>{selectedEvaluation.qualityOfWorkOutput.accuracyAndThoroughness}</strong></p>
                      <p>Organization: <strong>{selectedEvaluation.qualityOfWorkOutput.organizationAndPresentation}</strong></p>
                      <p>Effectiveness: <strong>{selectedEvaluation.qualityOfWorkOutput.effectiveness}</strong></p>
                    </div>
                  </div>

                  <div className="border-2 border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2">C. QUANTITY OF WORK OUTPUT (15%)</h3>
                    <div className="space-y-1 text-sm">
                      <p>Accomplishes More Work: <strong>{selectedEvaluation.quantityOfWorkOutput.accomplishesMoreWork}</strong></p>
                      <p>Readiness: <strong>{selectedEvaluation.quantityOfWorkOutput.readinessInAccomplishing}</strong></p>
                    </div>
                  </div>

                  <div className="border-2 border-green-200 bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">D. PERSONAL QUALITIES (25%)</h3>
                    <div className="space-y-1 text-sm">
                      <p>Responsibility: <strong>{selectedEvaluation.personalQualities.responsibilityAndUrgency}</strong></p>
                      <p>Dependability: <strong>{selectedEvaluation.personalQualities.dependabilityAndReliability}</strong></p>
                      <p>Industry: <strong>{selectedEvaluation.personalQualities.industryAndResourcefulness}</strong></p>
                      <p>Fairness: <strong>{selectedEvaluation.personalQualities.fairnessAndInitiative}</strong></p>
                      <p>Sociability: <strong>{selectedEvaluation.personalQualities.sociabilityAndDisposition}</strong></p>
                    </div>
                  </div>

                  <div className="border-2 border-purple-200 bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">TIMEKEEPING RECORD</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <p>Excused Absences: <strong>{selectedEvaluation.timekeepingRecord.excusedAbsences}</strong></p>
                      <p>Unexcused Absences: <strong>{selectedEvaluation.timekeepingRecord.unexcusedAbsences}</strong></p>
                      <p>Late &gt;10mins: <strong>{selectedEvaluation.timekeepingRecord.lateMoreThan10mins}</strong></p>
                      <p>Late &lt;1hr: <strong>{selectedEvaluation.timekeepingRecord.lateLessThan1hr}</strong></p>
                      <p>Failure to Punch: <strong>{selectedEvaluation.timekeepingRecord.failureToPunch}</strong></p>
                      <p>Under Time: <strong>{selectedEvaluation.timekeepingRecord.underTime}</strong></p>
                    </div>
                  </div>

                  {selectedEvaluation.supervisorRemarks && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Label className="font-semibold">Supervisor Remarks</Label>
                      <p className="text-sm mt-2">{selectedEvaluation.supervisorRemarks}</p>
                    </div>
                  )}

                  {selectedEvaluation.nasRemarks && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Label className="font-semibold">NAS Remarks</Label>
                      <p className="text-sm mt-2">{selectedEvaluation.nasRemarks}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
      {ConfirmDialog}
    </div>
  )
}

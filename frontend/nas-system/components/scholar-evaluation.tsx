"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Search, User, XCircle, Loader2, Plus, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Helper to convert MongoDB Decimal128 to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  // Handle MongoDB Decimal128 format: { $numberDecimal: "value" }
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal) || 0
  }
  return 0
}

interface Scholar {
  id: string
  idNumber: string
  name: string
  course: string
  year: string
  department: string
  status: "active" | "probation" | "terminated"
  gpa: number
}

interface EvaluationForm {
  // Attendance and Punctuality
  attendanceAndPunctuality: {
    regularAttendance: number
    promptnessInReportingForDuty: number
  }
  // Quality of Work Output
  qualityOfWorkOutput: {
    accuracyAndThoroughnessOfWork: number
    organizationAndOrPresentationNeatnessOfWork: number
    effectiveness: number
  }
  // Quantity of Work Output
  quantityOfWorkOutput: {
    accomplishesMoreWorkOnTheGivenTime: number
    timelinessInAccomplishingTaskDuties: number
  }
  // Attitude and Work Behavior
  attitudeAndWorkBehavior: {
    senseOfResponsibilityAndUrgency: number
    dependabilityAndReliability: number
    industryAndResourcefulness: number
    alertnessAndInitiative: number
    sociabilityAndPleasantDisposition: number
  }
  // Time Keeping Record
  timeKeepingRecord: {
    excusedAbsences: number
    unexcusedAbsences: number
    lateGreaterThanTenMinutes: number
    lateGreaterThanOneHour: number
    failureToPunch: number
    underTime: number
  }
  // Remarks
  remarksAndRecommendationByImmediateSupervisor: string
  remarksCommentsByTheNAS: string
}

const initialEvaluationForm: EvaluationForm = {
  attendanceAndPunctuality: {
    regularAttendance: 0,
    promptnessInReportingForDuty: 0
  },
  qualityOfWorkOutput: {
    accuracyAndThoroughnessOfWork: 0,
    organizationAndOrPresentationNeatnessOfWork: 0,
    effectiveness: 0
  },
  quantityOfWorkOutput: {
    accomplishesMoreWorkOnTheGivenTime: 0,
    timelinessInAccomplishingTaskDuties: 0
  },
  attitudeAndWorkBehavior: {
    senseOfResponsibilityAndUrgency: 0,
    dependabilityAndReliability: 0,
    industryAndResourcefulness: 0,
    alertnessAndInitiative: 0,
    sociabilityAndPleasantDisposition: 0
  },
  timeKeepingRecord: {
    excusedAbsences: 0,
    unexcusedAbsences: 0,
    lateGreaterThanTenMinutes: 0,
    lateGreaterThanOneHour: 0,
    failureToPunch: 0,
    underTime: 0
  },
  remarksAndRecommendationByImmediateSupervisor: "",
  remarksCommentsByTheNAS: ""
}

// Star Icon Component
function StarIcon({ filled, half, onClick, onMouseEnter }: { 
  filled: boolean
  half?: boolean
  onClick?: () => void
  onMouseEnter?: () => void
}) {
  return (
    <svg
      className={`w-8 h-8 cursor-pointer transition-colors ${
        filled ? 'text-yellow-400' : 'text-gray-300'
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      {half ? (
        // Half star
        <defs>
          <linearGradient id="halfGrad">
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="50%" stopColor="#d1d5db" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        fill={half ? "url(#halfGrad)" : "currentColor"}
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  )
}

// Star Rating Component
function StarRating({ 
  label, 
  value, 
  onChange,
  description 
}: { 
  label: string
  value: number
  onChange: (value: number) => void
  description?: string
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  
  const handleClick = (starIndex: number, isHalf: boolean) => {
    const newValue = isHalf ? starIndex + 0.5 : starIndex + 1
    onChange(newValue)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    setHoverValue(isHalf ? starIndex + 0.5 : starIndex + 1)
  }

  const displayValue = hoverValue !== null ? hoverValue : value

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-medium text-[#800000]">{value} / 5</span>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <div 
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const starValue = starIndex + 1
          const isFilled = displayValue >= starValue
          const isHalf = !isFilled && displayValue >= starIndex + 0.5
          
          return (
            <div
              key={starIndex}
              className="relative"
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
            >
              <svg
                className={`w-8 h-8 cursor-pointer transition-all hover:scale-110 ${
                  isFilled ? 'text-yellow-400' : isHalf ? 'text-yellow-400' : 'text-gray-300'
                }`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const clickedHalf = x < rect.width / 2
                  handleClick(starIndex, clickedHalf)
                }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                {isHalf ? (
                  <>
                    <defs>
                      <linearGradient id={`halfGrad-${starIndex}`}>
                        <stop offset="50%" stopColor="#facc15" />
                        <stop offset="50%" stopColor="#d1d5db" />
                      </linearGradient>
                    </defs>
                    <path
                      fill={`url(#halfGrad-${starIndex})`}
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    />
                  </>
                ) : (
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                )}
              </svg>
            </div>
          )
        })}
        <span className="ml-2 text-sm text-gray-500">
          {displayValue === 0 && "Not rated"}
          {displayValue === 0.5 && "Very Poor"}
          {displayValue === 1 && "Poor"}
          {displayValue === 1.5 && "Below Average"}
          {displayValue === 2 && "Fair"}
          {displayValue === 2.5 && "Average"}
          {displayValue === 3 && "Good"}
          {displayValue === 3.5 && "Very Good"}
          {displayValue === 4 && "Excellent"}
          {displayValue === 4.5 && "Outstanding"}
          {displayValue === 5 && "Exceptional"}
        </span>
      </div>
    </div>
  )
}

// Number Input Component for Time Keeping
function NumberInput({ 
  label, 
  value, 
  onChange, 
  min = 0,
  description 
}: { 
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  description?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <Input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full"
      />
    </div>
  )
}

export function ScholarEvaluation() {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null)
  const [evaluationTab, setEvaluationTab] = useState("attendance")
  const [evaluationForm, setEvaluationForm] = useState<EvaluationForm>(initialEvaluationForm)
  const [scholars, setScholars] = useState<Scholar[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingEvaluation, setExistingEvaluation] = useState<any>(null)
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [selectedSemester, setSelectedSemester] = useState<string>("")
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newEvaluationSemester, setNewEvaluationSemester] = useState<string>("")
  const [newEvaluationSchoolYear, setNewEvaluationSchoolYear] = useState<string>("")
  const [availableSemesters, setAvailableSemesters] = useState<string[]>(['First Semester', 'Second Semester', 'Third Semester'])
  const [currentSchoolYear, setCurrentSchoolYear] = useState<string>("")
  const { toast } = useToast()

  // Generate school year options from 2526 to 3738
  const schoolYearOptions = Array.from({ length: 13 }, (_, i) => {
    const startYear = 25 + i
    const endYear = 26 + i
    return `${startYear}${endYear}`
  })

  // Fetch scholars (approved applicants)
  useEffect(() => {
    fetchScholars()
  }, [])

  const fetchScholars = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/application/all?status=approved`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const scholarData = (data.applications || []).map((app: any) => ({
          id: app._id,
          idNumber: app.user?.idNumber || app.idNumber || '',
          name: `${app.firstName} ${app.lastName}`,
          course: app.programOfStudyAndYear || app.education?.course || 'N/A',
          year: app.yearLevel || 'N/A',
          department: app.department || 'N/A',
          status: 'active' as const,
          gpa: 0
        }))
        setScholars(scholarData)
      }
    } catch (error) {
      console.error('Error fetching scholars:', error)
      toast({
        title: "Error",
        description: "Failed to fetch scholars list",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const populateFormFromEvaluation = (data: any) => {
    setEvaluationForm({
      attendanceAndPunctuality: {
        regularAttendance: toNumber(data.attendanceAndPunctuality?.regularAttendance),
        promptnessInReportingForDuty: toNumber(data.attendanceAndPunctuality?.promptnessInReportingForDuty)
      },
      qualityOfWorkOutput: {
        accuracyAndThoroughnessOfWork: toNumber(data.qualityOfWorkOutput?.accuracyAndThoroughnessOfWork),
        organizationAndOrPresentationNeatnessOfWork: toNumber(data.qualityOfWorkOutput?.organizationAndOrPresentationNeatnessOfWork),
        effectiveness: toNumber(data.qualityOfWorkOutput?.effectiveness)
      },
      quantityOfWorkOutput: {
        accomplishesMoreWorkOnTheGivenTime: toNumber(data.quantityOfWorkOutput?.accomplishesMoreWorkOnTheGivenTime),
        timelinessInAccomplishingTaskDuties: toNumber(data.quantityOfWorkOutput?.timelinessInAccomplishingTaskDuties)
      },
      attitudeAndWorkBehavior: {
        senseOfResponsibilityAndUrgency: toNumber(data.attitudeAndWorkBehavior?.senseOfResponsibilityAndUrgency),
        dependabilityAndReliability: toNumber(data.attitudeAndWorkBehavior?.dependabilityAndReliability),
        industryAndResourcefulness: toNumber(data.attitudeAndWorkBehavior?.industryAndResourcefulness),
        alertnessAndInitiative: toNumber(data.attitudeAndWorkBehavior?.alertnessAndInitiative),
        sociabilityAndPleasantDisposition: toNumber(data.attitudeAndWorkBehavior?.sociabilityAndPleasantDisposition)
      },
      timeKeepingRecord: {
        excusedAbsences: toNumber(data.timeKeepingRecord?.excusedAbsences),
        unexcusedAbsences: toNumber(data.timeKeepingRecord?.unexcusedAbsences),
        lateGreaterThanTenMinutes: toNumber(data.timeKeepingRecord?.lateGreaterThanTenMinutes),
        lateGreaterThanOneHour: toNumber(data.timeKeepingRecord?.lateGreaterThanOneHour),
        failureToPunch: toNumber(data.timeKeepingRecord?.failureToPunch),
        underTime: toNumber(data.timeKeepingRecord?.underTime)
      },
      remarksAndRecommendationByImmediateSupervisor: data.remarksAndRecommendationByImmediateSupervisor || "",
      remarksCommentsByTheNAS: data.remarksCommentsByTheNAS || ""
    })
  }

  const handleSelectScholar = async (scholar: Scholar) => {
    setSelectedScholar(scholar)
    setEvaluationTab("attendance")
    setEvaluationForm(initialEvaluationForm)
    setExistingEvaluation(null)
    setEvaluations([])
    setSelectedSemester("")
    setIsCreatingNew(false)
    setAvailableSemesters(['First Semester', 'Second Semester', 'Third Semester'])
    setCurrentSchoolYear("")
    setNewEvaluationSchoolYear("")
    setNewEvaluationSemester("")

    // Fetch all evaluations for this scholar
    if (scholar.idNumber) {
      try {
        // Fetch evaluations and available semesters in parallel
        const [evalResponse, semesterResponse] = await Promise.all([
          fetch(`${API_URL}/evaluations/user/${scholar.idNumber}`, { credentials: 'include' }),
          fetch(`${API_URL}/evaluations/available-semesters/${scholar.idNumber}`, { credentials: 'include' })
        ])
        
        // Process available semesters
        if (semesterResponse.ok) {
          const semesterData = await semesterResponse.json()
          setAvailableSemesters(semesterData.availableSemesters || [])
          setCurrentSchoolYear(semesterData.schoolYear || "")
          setNewEvaluationSchoolYear(semesterData.schoolYear || "")
        }
        
        // Process evaluations
        if (evalResponse.ok) {
          const data = await evalResponse.json()
          // Backend returns array of evaluations
          if (Array.isArray(data) && data.length > 0) {
            setEvaluations(data)
            // Auto-select the most recent evaluation
            const mostRecent = data[0]
            setExistingEvaluation(mostRecent)
            setSelectedSemester(mostRecent._id)
            setIsCreatingNew(false)
            populateFormFromEvaluation(mostRecent)
          } else {
            // No evaluations yet - set to create mode
            setIsCreatingNew(true)
            setEvaluations([])
          }
        } else {
          // Error or 404 - set to create mode
          setIsCreatingNew(true)
          setEvaluations([])
        }
      } catch (error) {
        console.error('Error fetching evaluations:', error)
      }
    }
  }

  // Fetch available semesters when school year changes
  const handleSchoolYearChange = async (schoolYear: string) => {
    setNewEvaluationSchoolYear(schoolYear)
    setNewEvaluationSemester("") // Reset semester selection
    
    if (selectedScholar?.idNumber && schoolYear) {
      try {
        const response = await fetch(
          `${API_URL}/evaluations/available-semesters/${selectedScholar.idNumber}?schoolYear=${schoolYear}`,
          { credentials: 'include' }
        )
        if (response.ok) {
          const data = await response.json()
          setAvailableSemesters(data.availableSemesters || [])
        }
      } catch (error) {
        console.error('Error fetching available semesters:', error)
      }
    }
  }

  const handleSelectEvaluation = (evaluationId: string) => {
    if (evaluationId === 'new') {
      setIsCreatingNew(true)
      setExistingEvaluation(null)
      setSelectedSemester('new')
      setNewEvaluationSemester('')
      setEvaluationForm(initialEvaluationForm)
      return
    }

    setIsCreatingNew(false)
    setNewEvaluationSemester('')
    const evaluation = evaluations.find(e => e._id === evaluationId)
    if (evaluation) {
      setExistingEvaluation(evaluation)
      setSelectedSemester(evaluationId)
      populateFormFromEvaluation(evaluation)
    }
  }

  const getSchoolYearFromDate = (dateStr: string, semester: string): string => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    if (semester === 'First Semester') {
      return `${year}-${year + 1}`
    }
    return `${year - 1}-${year}`
  }

  // Convert short school year to long format (e.g., '2526' -> '2025-2026')
  const schoolYearToLong = (shortYear: string): string => {
    if (!shortYear || shortYear.length !== 4) return shortYear
    const startYear = shortYear.substring(0, 2)
    const endYear = shortYear.substring(2, 4)
    return `20${startYear}-20${endYear}`
  }

  // Infer semester from date if not set (for legacy evaluations)
  const inferSemesterFromDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const month = date.getMonth() // 0-11
    // Aug-Dec = First Sem, Jan-May = Second Sem, Jun-Jul = Third Sem (Summer)
    if (month >= 7 && month <= 11) return 'First Semester'
    if (month >= 0 && month <= 4) return 'Second Semester'
    return 'Third Semester'
  }

  // Short format: "1st Sem (2526)" for compact display - uses schoolYear field if available
  const getShortEvaluationLabel = (semester: string | undefined, schoolYear: string | undefined, dateStr?: string): string => {
    const semesterMap: Record<string, string> = {
      'First Semester': '1st Sem',
      'Second Semester': '2nd Sem',
      'Third Semester': '3rd Sem'
    }
    // Handle legacy evaluations without semester field
    const effectiveSemester = semester || (dateStr ? inferSemesterFromDate(dateStr) : 'Unknown')
    
    // Use schoolYear field if available, otherwise calculate from date
    let shortYear = schoolYear
    if (!shortYear && dateStr) {
      const date = new Date(dateStr)
      const year = date.getFullYear()
      let startYear: number, endYear: number
      if (effectiveSemester === 'First Semester') {
        startYear = year
        endYear = year + 1
      } else {
        startYear = year - 1
        endYear = year
      }
      shortYear = `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`
    }
    
    return `${semesterMap[effectiveSemester] || effectiveSemester} (${shortYear || 'N/A'})`
  }

  const calculateOverallRating = (): number => {
    const ratings = [
      evaluationForm.attendanceAndPunctuality.regularAttendance,
      evaluationForm.attendanceAndPunctuality.promptnessInReportingForDuty,
      evaluationForm.qualityOfWorkOutput.accuracyAndThoroughnessOfWork,
      evaluationForm.qualityOfWorkOutput.organizationAndOrPresentationNeatnessOfWork,
      evaluationForm.qualityOfWorkOutput.effectiveness,
      evaluationForm.quantityOfWorkOutput.accomplishesMoreWorkOnTheGivenTime,
      evaluationForm.quantityOfWorkOutput.timelinessInAccomplishingTaskDuties,
      evaluationForm.attitudeAndWorkBehavior.senseOfResponsibilityAndUrgency,
      evaluationForm.attitudeAndWorkBehavior.dependabilityAndReliability,
      evaluationForm.attitudeAndWorkBehavior.industryAndResourcefulness,
      evaluationForm.attitudeAndWorkBehavior.alertnessAndInitiative,
      evaluationForm.attitudeAndWorkBehavior.sociabilityAndPleasantDisposition
    ]
    const sum = ratings.reduce((a, b) => a + b, 0)
    return parseFloat((sum / ratings.length).toFixed(2))
  }

  const handleSubmitEvaluation = async (semester: string) => {
    if (!selectedScholar) return
    if (!semester) {
      toast({
        title: "Error",
        description: "Please select a semester",
        variant: "destructive"
      })
      return
    }

    // For new evaluations, require school year
    if ((isCreatingNew || !existingEvaluation) && !newEvaluationSchoolYear) {
      toast({
        title: "Error",
        description: "Please select a school year",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const overallRating = calculateOverallRating()
      const payload = {
        ...evaluationForm,
        overallRating,
        semester,
        schoolYear: newEvaluationSchoolYear
      }

      let url: string
      let method: string

      if (isCreatingNew || !existingEvaluation) {
        // Creating new evaluation
        url = `${API_URL}/evaluations/${selectedScholar.idNumber}`
        method = 'POST'
      } else {
        // Updating existing evaluation by evaluationId
        url = `${API_URL}/evaluations/${existingEvaluation._id}/id`
        method = 'PATCH'
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const savedEvaluation = await response.json()
        toast({
          title: "Success",
          description: `Evaluation ${isCreatingNew ? 'created' : 'updated'} successfully for ${selectedScholar.name}`,
        })
        
        // Refresh evaluations list
        const refreshResponse = await fetch(`${API_URL}/evaluations/user/${selectedScholar.idNumber}`, {
          credentials: 'include'
        })
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json()
          setEvaluations(refreshedData)
          setExistingEvaluation(savedEvaluation)
          setSelectedSemester(savedEvaluation._id)
          setIsCreatingNew(false)
        }
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit evaluation')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit evaluation",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: Scholar["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        )
      case "probation":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Probation
          </Badge>
        )
      case "terminated":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Terminated
          </Badge>
        )
    }
  }

  const filteredScholars = scholars.filter((scholar) => {
    const matchesSearch =
      scholar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholar.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || scholar.department === departmentFilter
    const matchesStatus = statusFilter === "all" || scholar.status === statusFilter
    return matchesSearch && matchesDepartment && matchesStatus
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Scholar List */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
            <CardTitle className="text-[#800000]">NAS Scholars</CardTitle>
            <CardDescription>Select a scholar to evaluate</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name or ID"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="department-filter" className="text-xs">Department</Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger id="department-filter" className="h-8 text-xs">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter" className="text-xs">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="h-8 text-xs">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500">
              {filteredScholars.length} {filteredScholars.length === 1 ? "scholar" : "scholars"} found
            </p>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <ul className="divide-y">
                {filteredScholars.map((scholar) => (
                  <li
                    key={scholar.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedScholar?.id === scholar.id ? "bg-gray-50 border-l-4 border-[#800000]" : ""
                    }`}
                    onClick={() => handleSelectScholar(scholar)}
                  >
                    <div className="flex items-start">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>
                          {scholar.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{scholar.name}</p>
                        <p className="text-xs text-gray-500 truncate">{scholar.course}</p>
                        <p className="text-xs text-gray-400">ID: {scholar.idNumber}</p>
                        <div className="mt-1">
                          {getStatusBadge(scholar.status)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                {filteredScholars.length === 0 && !loading && (
                  <li className="p-8 text-center text-gray-500">
                    <User className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    No scholars found
                  </li>
                )}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Evaluation Form */}
      <div className="md:col-span-2">
        {selectedScholar ? (
          <Card>
            <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-[#800000]">{selectedScholar.name}</CardTitle>
                  <CardDescription>
                    {selectedScholar.course} | ID: {selectedScholar.idNumber}
                  </CardDescription>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedScholar.status)}
                  {evaluations.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">✓ {evaluations.length} evaluation(s)</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Evaluation Selector - Only show if there are existing evaluations */}
              {evaluations.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Label className="text-sm font-medium text-blue-800">Select Evaluation:</Label>
                    <div className="flex flex-wrap gap-2">
                      {evaluations.map((evaluation) => (
                        <Button
                          key={evaluation._id}
                          variant={selectedSemester === evaluation._id ? "default" : "outline"}
                          size="sm"
                          className={selectedSemester === evaluation._id 
                            ? "bg-[#800000] hover:bg-[#600000]" 
                            : "hover:bg-blue-100"
                          }
                          onClick={() => handleSelectEvaluation(evaluation._id)}
                        >
                          {getShortEvaluationLabel(evaluation.semester, evaluation.schoolYear, evaluation.createdAt)}
                        </Button>
                      ))}
                      <Button
                        variant={isCreatingNew ? "default" : "outline"}
                        size="sm"
                        className={isCreatingNew 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "border-green-500 text-green-600 hover:bg-green-50"
                        }
                        onClick={() => handleSelectEvaluation('new')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        New Evaluation
                      </Button>
                    </div>
                  </div>
                  {isCreatingNew && (
                    <p className="text-xs text-blue-600">Creating a new evaluation. Select semester when submitting.</p>
                  )}
                  {existingEvaluation && !isCreatingNew && (
                    <p className="text-xs text-gray-500">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Last updated: {new Date(existingEvaluation.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Message for first evaluation */}
              {evaluations.length === 0 && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">No evaluations yet for this scholar. Fill out the form below to create the first evaluation.</p>
                </div>
              )}

              {existingEvaluation && !isCreatingNew && (
                <p className="text-xs text-gray-500">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Last updated: {new Date(existingEvaluation.updatedAt).toLocaleDateString()}
                </p>
              )}

              {/* Overall Rating Display */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Overall Rating</h3>
                    <p className="text-xs text-gray-500">Automatically calculated from all ratings</p>
                  </div>
                  <div className="text-3xl font-bold text-[#800000]">
                    {calculateOverallRating().toFixed(2)} / 5
                  </div>
                </div>
              </div>

              <Tabs value={evaluationTab} onValueChange={setEvaluationTab}>
                <TabsList className="grid grid-cols-5 mb-6">
                  <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
                  <TabsTrigger value="quality" className="text-xs">Quality</TabsTrigger>
                  <TabsTrigger value="quantity" className="text-xs">Quantity</TabsTrigger>
                  <TabsTrigger value="attitude" className="text-xs">Attitude</TabsTrigger>
                  <TabsTrigger value="timekeeping" className="text-xs">Time Keeping</TabsTrigger>
                </TabsList>

                {/* Attendance and Punctuality */}
                <TabsContent value="attendance" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Attendance and Punctuality</CardTitle>
                      <CardDescription>Rate the scholar's attendance and punctuality (0-5)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <StarRating
                        label="Regular Attendance"
                        description="Consistency in attending work/duty assignments"
                        value={evaluationForm.attendanceAndPunctuality.regularAttendance}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          attendanceAndPunctuality: {
                            ...prev.attendanceAndPunctuality,
                            regularAttendance: value
                          }
                        }))}
                      />
                      <StarRating
                        label="Promptness in Reporting for Duty"
                        description="Timeliness in arriving at assigned work location"
                        value={evaluationForm.attendanceAndPunctuality.promptnessInReportingForDuty}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          attendanceAndPunctuality: {
                            ...prev.attendanceAndPunctuality,
                            promptnessInReportingForDuty: value
                          }
                        }))}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Quality of Work Output */}
                <TabsContent value="quality" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quality of Work Output</CardTitle>
                      <CardDescription>Rate the quality of work produced (0-5)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <StarRating
                        label="Accuracy and Thoroughness of Work"
                        description="Correctness and completeness of tasks performed"
                        value={evaluationForm.qualityOfWorkOutput.accuracyAndThoroughnessOfWork}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          qualityOfWorkOutput: {
                            ...prev.qualityOfWorkOutput,
                            accuracyAndThoroughnessOfWork: value
                          }
                        }))}
                      />
                      <StarRating
                        label="Organization and Presentation/Neatness of Work"
                        description="How well-organized and presentable the work output is"
                        value={evaluationForm.qualityOfWorkOutput.organizationAndOrPresentationNeatnessOfWork}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          qualityOfWorkOutput: {
                            ...prev.qualityOfWorkOutput,
                            organizationAndOrPresentationNeatnessOfWork: value
                          }
                        }))}
                      />
                      <StarRating
                        label="Effectiveness"
                        description="How effective the work output is in achieving goals"
                        value={evaluationForm.qualityOfWorkOutput.effectiveness}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          qualityOfWorkOutput: {
                            ...prev.qualityOfWorkOutput,
                            effectiveness: value
                          }
                        }))}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Quantity of Work Output */}
                <TabsContent value="quantity" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quantity of Work Output</CardTitle>
                      <CardDescription>Rate the amount of work produced (0-5)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <StarRating
                        label="Accomplishes More Work in the Given Time"
                        description="Productivity level compared to expected output"
                        value={evaluationForm.quantityOfWorkOutput.accomplishesMoreWorkOnTheGivenTime}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          quantityOfWorkOutput: {
                            ...prev.quantityOfWorkOutput,
                            accomplishesMoreWorkOnTheGivenTime: value
                          }
                        }))}
                      />
                      <StarRating
                        label="Timeliness in Accomplishing Task/Duties"
                        description="Ability to complete tasks within deadlines"
                        value={evaluationForm.quantityOfWorkOutput.timelinessInAccomplishingTaskDuties}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          quantityOfWorkOutput: {
                            ...prev.quantityOfWorkOutput,
                            timelinessInAccomplishingTaskDuties: value
                          }
                        }))}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Attitude and Work Behavior */}
                <TabsContent value="attitude" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Attitude and Work Behavior</CardTitle>
                      <CardDescription>Rate the scholar's work attitude (0-5)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <StarRating
                        label="Sense of Responsibility and Urgency"
                        description="Takes ownership of tasks and acts with appropriate urgency"
                        value={evaluationForm.attitudeAndWorkBehavior.senseOfResponsibilityAndUrgency}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          attitudeAndWorkBehavior: {
                            ...prev.attitudeAndWorkBehavior,
                            senseOfResponsibilityAndUrgency: value
                          }
                        }))}
                      />
                      <StarRating
                        label="Dependability and Reliability"
                        description="Can be counted on to complete assigned tasks"
                        value={evaluationForm.attitudeAndWorkBehavior.dependabilityAndReliability}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          attitudeAndWorkBehavior: {
                            ...prev.attitudeAndWorkBehavior,
                            dependabilityAndReliability: value
                          }
                        }))}
                      />
                      <StarRating
                        label="Industry and Resourcefulness"
                        description="Shows initiative and finds creative solutions"
                        value={evaluationForm.attitudeAndWorkBehavior.industryAndResourcefulness}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          attitudeAndWorkBehavior: {
                            ...prev.attitudeAndWorkBehavior,
                            industryAndResourcefulness: value
                          }
                        }))}
                      />
                      <StarRating
                        label="Alertness and Initiative"
                        description="Proactively identifies and addresses issues"
                        value={evaluationForm.attitudeAndWorkBehavior.alertnessAndInitiative}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          attitudeAndWorkBehavior: {
                            ...prev.attitudeAndWorkBehavior,
                            alertnessAndInitiative: value
                          }
                        }))}
                      />
                      <StarRating
                        label="Sociability and Pleasant Disposition"
                        description="Works well with others and maintains positive attitude"
                        value={evaluationForm.attitudeAndWorkBehavior.sociabilityAndPleasantDisposition}
                        onChange={(value) => setEvaluationForm(prev => ({
                          ...prev,
                          attitudeAndWorkBehavior: {
                            ...prev.attitudeAndWorkBehavior,
                            sociabilityAndPleasantDisposition: value
                          }
                        }))}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Time Keeping Record */}
                <TabsContent value="timekeeping" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Time Keeping Record</CardTitle>
                      <CardDescription>Enter the scholar's time keeping statistics (count)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <NumberInput
                          label="Excused Absences"
                          description="Number of absences with valid excuse"
                          value={evaluationForm.timeKeepingRecord.excusedAbsences}
                          onChange={(value) => setEvaluationForm(prev => ({
                            ...prev,
                            timeKeepingRecord: {
                              ...prev.timeKeepingRecord,
                              excusedAbsences: value
                            }
                          }))}
                        />
                        <NumberInput
                          label="Unexcused Absences"
                          description="Number of absences without valid excuse"
                          value={evaluationForm.timeKeepingRecord.unexcusedAbsences}
                          onChange={(value) => setEvaluationForm(prev => ({
                            ...prev,
                            timeKeepingRecord: {
                              ...prev.timeKeepingRecord,
                              unexcusedAbsences: value
                            }
                          }))}
                        />
                        <NumberInput
                          label="Late (>10 minutes)"
                          description="Number of times late by more than 10 minutes"
                          value={evaluationForm.timeKeepingRecord.lateGreaterThanTenMinutes}
                          onChange={(value) => setEvaluationForm(prev => ({
                            ...prev,
                            timeKeepingRecord: {
                              ...prev.timeKeepingRecord,
                              lateGreaterThanTenMinutes: value
                            }
                          }))}
                        />
                        <NumberInput
                          label="Late (>1 hour)"
                          description="Number of times late by more than 1 hour"
                          value={evaluationForm.timeKeepingRecord.lateGreaterThanOneHour}
                          onChange={(value) => setEvaluationForm(prev => ({
                            ...prev,
                            timeKeepingRecord: {
                              ...prev.timeKeepingRecord,
                              lateGreaterThanOneHour: value
                            }
                          }))}
                        />
                        <NumberInput
                          label="Failure to Punch"
                          description="Number of times failed to punch in/out"
                          value={evaluationForm.timeKeepingRecord.failureToPunch}
                          onChange={(value) => setEvaluationForm(prev => ({
                            ...prev,
                            timeKeepingRecord: {
                              ...prev.timeKeepingRecord,
                              failureToPunch: value
                            }
                          }))}
                        />
                        <NumberInput
                          label="Under Time"
                          description="Number of instances of leaving early"
                          value={evaluationForm.timeKeepingRecord.underTime}
                          onChange={(value) => setEvaluationForm(prev => ({
                            ...prev,
                            timeKeepingRecord: {
                              ...prev.timeKeepingRecord,
                              underTime: value
                            }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Remarks Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Remarks and Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Remarks and Recommendation by Immediate Supervisor</Label>
                        <Textarea
                          value={evaluationForm.remarksAndRecommendationByImmediateSupervisor}
                          onChange={(e) => setEvaluationForm(prev => ({
                            ...prev,
                            remarksAndRecommendationByImmediateSupervisor: e.target.value
                          }))}
                          placeholder="Enter supervisor's remarks and recommendations..."
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Remarks/Comments by the NAS</Label>
                        <Textarea
                          value={evaluationForm.remarksCommentsByTheNAS}
                          onChange={(e) => setEvaluationForm(prev => ({
                            ...prev,
                            remarksCommentsByTheNAS: e.target.value
                          }))}
                          placeholder="Enter NAS scholar's comments..."
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Submit Section with School Year and Semester Selection */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  {(isCreatingNew || evaluations.length === 0) && (
                    <>
                      {/* School Year Dropdown */}
                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 block">School Year</Label>
                        <Select 
                          value={newEvaluationSchoolYear} 
                          onValueChange={handleSchoolYearChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select school year..." />
                          </SelectTrigger>
                          <SelectContent>
                            {schoolYearOptions.map((sy) => (
                              <SelectItem key={sy} value={sy}>
                                {schoolYearToLong(sy)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Semester Dropdown */}
                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 block">
                          Select Semester {evaluations.length === 0 ? 'for Evaluation' : 'for New Evaluation'}
                        </Label>
                        {!newEvaluationSchoolYear ? (
                          <div className="p-3 bg-gray-100 border rounded-md">
                            <p className="text-sm text-gray-500">Select a school year first</p>
                          </div>
                        ) : availableSemesters.length === 0 ? (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                              All semesters for SY {schoolYearToLong(newEvaluationSchoolYear)} have been evaluated.
                            </p>
                          </div>
                        ) : (
                          <Select 
                            value={newEvaluationSemester} 
                            onValueChange={setNewEvaluationSemester}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select semester..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSemesters.includes('First Semester') && (
                                <SelectItem value="First Semester">First Semester</SelectItem>
                              )}
                              {availableSemesters.includes('Second Semester') && (
                                <SelectItem value="Second Semester">Second Semester</SelectItem>
                              )}
                              {availableSemesters.includes('Third Semester') && (
                                <SelectItem value="Third Semester">Third Semester (Summer)</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </>
                  )}
                  {!isCreatingNew && existingEvaluation && (
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        Editing: <span className="font-medium">{existingEvaluation.semester}</span>
                        {' '}({existingEvaluation.schoolYear ? schoolYearToLong(existingEvaluation.schoolYear) : getSchoolYearFromDate(existingEvaluation.createdAt, existingEvaluation.semester)})
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      const semester = isCreatingNew 
                        ? newEvaluationSemester 
                        : existingEvaluation?.semester
                      handleSubmitEvaluation(semester)
                    }}
                    className="bg-[#800000] hover:bg-[#600000] min-w-[200px]"
                    disabled={submitting || ((isCreatingNew || evaluations.length === 0) && (!newEvaluationSchoolYear || !newEvaluationSemester || availableSemesters.length === 0))}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {(isCreatingNew || evaluations.length === 0) ? 'Creating...' : 'Updating...'}
                      </>
                    ) : (
                      (isCreatingNew || evaluations.length === 0) ? 'Create Evaluation' : 'Update Evaluation'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Scholar Selected</h3>
              <p className="text-gray-500 text-center max-w-md">
                Please select a scholar from the list to complete their term-end evaluation.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

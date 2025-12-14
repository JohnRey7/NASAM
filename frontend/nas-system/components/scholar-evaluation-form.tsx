"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { scholarEvaluationService, ScholarEvaluationData } from "@/services/scholarEvaluationService"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star } from "lucide-react"
import axios from "axios"

interface ScholarEvaluationFormProps {
  scholar: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  existingEvaluation?: any
  readOnly?: boolean  // When true, form is view-only (for department heads after submission)
  hideTimekeeping?: boolean  // Hide timekeeping section for department heads
  useDepartmentHeadEndpoint?: boolean  // Use /api/evaluations/:idNumber endpoint for department heads
}

export function ScholarEvaluationForm({ scholar, open, onOpenChange, onSuccess, existingEvaluation, readOnly = false, hideTimekeeping = false, useDepartmentHeadEndpoint = false }: ScholarEvaluationFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [evaluatorPosition, setEvaluatorPosition] = useState(existingEvaluation?.evaluatorPosition || '')
  
  // School year and semester for department head submissions
  const currentYear = new Date().getFullYear()
  const [schoolYear, setSchoolYear] = useState(existingEvaluation?.schoolYear || `${currentYear}-${currentYear + 1}`)
  const [semester, setSemester] = useState(existingEvaluation?.semester || '')
  
  const [attendance, setAttendance] = useState({
    regularityOfAttendance: existingEvaluation?.attendanceAndPunctuality?.regularityOfAttendance || 3,
    promptnessInReporting: existingEvaluation?.attendanceAndPunctuality?.promptnessInReporting || 3
  })
  
  const [quality, setQuality] = useState({
    accuracyAndThoroughness: existingEvaluation?.qualityOfWorkOutput?.accuracyAndThoroughness || 3,
    organizationAndPresentation: existingEvaluation?.qualityOfWorkOutput?.organizationAndPresentation || 3,
    effectiveness: existingEvaluation?.qualityOfWorkOutput?.effectiveness || 3
  })
  
  const [quantity, setQuantity] = useState({
    accomplishesMoreWork: existingEvaluation?.quantityOfWorkOutput?.accomplishesMoreWork || 3,
    readinessInAccomplishing: existingEvaluation?.quantityOfWorkOutput?.readinessInAccomplishing || 3
  })
  
  const [personal, setPersonal] = useState({
    responsibilityAndUrgency: existingEvaluation?.personalQualities?.responsibilityAndUrgency || 3,
    dependabilityAndReliability: existingEvaluation?.personalQualities?.dependabilityAndReliability || 3,
    industryAndResourcefulness: existingEvaluation?.personalQualities?.industryAndResourcefulness || 3,
    fairnessAndInitiative: existingEvaluation?.personalQualities?.fairnessAndInitiative || 3,
    sociabilityAndDisposition: existingEvaluation?.personalQualities?.sociabilityAndDisposition || 3
  })
  
  const [timekeeping, setTimekeeping] = useState({
    excusedAbsences: existingEvaluation?.timekeepingRecord?.excusedAbsences || 0,
    unexcusedAbsences: existingEvaluation?.timekeepingRecord?.unexcusedAbsences || 0,
    lateMoreThan10mins: existingEvaluation?.timekeepingRecord?.lateMoreThan10mins || 0,
    lateLessThan1hr: existingEvaluation?.timekeepingRecord?.lateLessThan1hr || 0,
    failureToPunch: existingEvaluation?.timekeepingRecord?.failureToPunch || 0,
    underTime: existingEvaluation?.timekeepingRecord?.underTime || 0
  })
  
  const [supervisorRemarks, setSupervisorRemarks] = useState(existingEvaluation?.supervisorRemarks || '')
  const [nasRemarks, setNasRemarks] = useState(existingEvaluation?.nasRemarks || '')

  const calculateOverallRating = () => {
    // Weights: Attendance 20%, Quality 25%, Quantity 20%, Personal Qualities 35% = 100%
    const attendanceAvg = (attendance.regularityOfAttendance + attendance.promptnessInReporting) / 2
    const attendanceScore = attendanceAvg * 0.20
    const qualityAvg = (quality.accuracyAndThoroughness + quality.organizationAndPresentation + quality.effectiveness) / 3
    const qualityScore = qualityAvg * 0.25
    const quantityAvg = (quantity.accomplishesMoreWork + quantity.readinessInAccomplishing) / 2
    const quantityScore = quantityAvg * 0.20
    const personalAvg = (personal.responsibilityAndUrgency + personal.dependabilityAndReliability + personal.industryAndResourcefulness + personal.fairnessAndInitiative + personal.sociabilityAndDisposition) / 5
    const personalScore = personalAvg * 0.35
    const overall = attendanceScore + qualityScore + quantityScore + personalScore
    let interpretation = ''
    if (overall >= 4.5) interpretation = 'Excellent'
    else if (overall >= 3.5) interpretation = 'Good'
    else if (overall >= 3.0) interpretation = 'Average'
    else interpretation = 'Fail'
    return { rating: overall.toFixed(2), interpretation }
  }

  const handleSubmit = async () => {
    if (!evaluatorPosition.trim()) {
      toast({ title: "Missing Information", description: "Please enter your position title", variant: "destructive" })
      return
    }
    
    try {
      setLoading(true)
      
      if (useDepartmentHeadEndpoint) {
        // Use /api/evaluations/:idNumber endpoint for department heads
        const idNumber = scholar.idNumber || scholar.studentId
        if (!idNumber || idNumber === 'N/A') {
          toast({ title: "Error", description: "Scholar ID number is required", variant: "destructive" })
          return
        }
        
        // Convert school year to short format (e.g., "2025-2026" -> "2526")
        const yearParts = schoolYear.split('-')
        const shortSchoolYear = yearParts.length === 2 
          ? `${yearParts[0].slice(-2)}${yearParts[1].slice(-2)}`
          : schoolYear
        
        // Note: semester is now determined by the backend from the current EvaluationPeriod
        const evaluationPayload = {
          idNumber,
          schoolYear: shortSchoolYear,
          attendanceAndPunctuality: {
            regularAttendance: attendance.regularityOfAttendance,
            promptnessInReportingForDuty: attendance.promptnessInReporting
          },
          qualityOfWorkOutput: {
            accuracyAndThoroughnessOfWork: quality.accuracyAndThoroughness,
            organizationAndOrPresentationNeatnessOfWork: quality.organizationAndPresentation,
            effectiveness: quality.effectiveness
          },
          quantityOfWorkOutput: {
            accomplishesMoreWorkOnTheGivenTime: quantity.accomplishesMoreWork,
            timelinessInAccomplishingTaskDuties: quantity.readinessInAccomplishing
          },
          attitudeAndWorkBehavior: {
            senseOfResponsibilityAndUrgency: personal.responsibilityAndUrgency,
            dependabilityAndReliability: personal.dependabilityAndReliability,
            industryAndResourcefulness: personal.industryAndResourcefulness,
            alertnessAndInitiative: personal.fairnessAndInitiative,
            sociabilityAndPleasantDisposition: personal.sociabilityAndDisposition
          },
          remarksAndRecommendationByImmediateSupervisor: supervisorRemarks,
          remarksCommentsByTheNAS: nasRemarks,
          overallRating: parseFloat(calculateOverallRating().rating)
        }
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
        // Use department-head specific endpoint for creating evaluations
        await axios.post(`${API_URL}/department-head/evaluation/${idNumber}`, evaluationPayload, {
          withCredentials: true
        })
        
        // Get scholar name - handle both firstName/lastName and name properties
        const scholarName = scholar.firstName && scholar.lastName 
          ? `${scholar.firstName} ${scholar.lastName}` 
          : scholar.name || 'Scholar'
        toast({ title: "Evaluation Submitted", description: `Successfully submitted evaluation for ${scholarName}`, duration: 3000 })
      } else {
        // Use original scholar-evaluation endpoint for OAS staff
        // Get scholar name - handle both firstName/lastName and name properties
        const oasScholarName = scholar.firstName && scholar.lastName 
          ? `${scholar.firstName} ${scholar.lastName}` 
          : scholar.name || 'Scholar'
        const evaluationData: ScholarEvaluationData = {
          scholar: scholar.userId || scholar._id,
          scholarName: oasScholarName,
          studentId: scholar.idNumber || 'N/A',
          course: scholar.programOfStudyAndYear || scholar.course || 'N/A',
          department: scholar.department || 'N/A',
          evaluatorPosition,
          attendanceAndPunctuality: attendance,
          qualityOfWorkOutput: quality,
          quantityOfWorkOutput: quantity,
          personalQualities: personal,
          timekeepingRecord: timekeeping,
          supervisorRemarks,
          nasRemarks
        }
        if (existingEvaluation) {
          await scholarEvaluationService.updateEvaluation(existingEvaluation._id, evaluationData)
          toast({ title: "Evaluation Updated", description: `Successfully updated evaluation for ${oasScholarName}`, duration: 3000 })
        } else {
          await scholarEvaluationService.createEvaluation(evaluationData)
          toast({ title: "Evaluation Submitted", description: `Successfully submitted evaluation for ${oasScholarName}`, duration: 3000 })
        }
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error submitting evaluation:', error)
      toast({ title: "Submission Failed", description: error.response?.data?.message || error.message || 'Failed to submit evaluation', variant: "destructive", duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  const RatingInput = ({ label, value, onChange, disabled = false }: { label: string, value: number, onChange: (val: number) => void, disabled?: boolean }) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null)
    
    const getRatingText = (rating: number) => {
      switch (rating) {
        case 5: return 'Very Good'
        case 4: return 'Good'
        case 3: return 'Average'
        case 2: return 'Poor'
        case 1: return 'Very Poor'
        default: return ''
      }
    }
    
    return (
      <div className="space-y-2">
        <Label className="text-sm">{label}</Label>
        <div className="flex gap-1 items-center">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button 
              key={rating} 
              type="button" 
              onClick={() => !disabled && onChange(rating)} 
              onMouseEnter={() => !disabled && setHoverValue(rating)}
              onMouseLeave={() => setHoverValue(null)}
              disabled={disabled}
              className={`p-1 transition-all ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-110'}`}
            >
              <Star 
                className={`w-8 h-8 transition-colors ${
                  (hoverValue !== null ? rating <= hoverValue : rating <= value)
                    ? 'fill-[#FFD700] text-[#FFD700]' 
                    : 'fill-transparent text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className="text-sm text-gray-600 ml-3 font-medium min-w-[80px]">
            {getRatingText(hoverValue !== null ? hoverValue : value)}
          </span>
        </div>
      </div>
    )
  }

  const overallPreview = calculateOverallRating()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-xl">
            {readOnly ? 'View' : existingEvaluation ? 'Edit' : 'Create'} Scholar Evaluation - {scholar?.firstName} {scholar?.lastName}
          </DialogTitle>
          <DialogDescription>
            Non-Academic Scholar Evaluation Form
            {readOnly && <span className="ml-2 text-amber-600 font-medium">(Read Only)</span>}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-6">
            {readOnly && (
              <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-lg">
                <p className="text-amber-800 font-medium">
                  📋 This evaluation has been submitted and is now read-only. Only OAS Staff can make changes.
                </p>
              </div>
            )}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-gray-500">Scholar Name</Label><p className="font-medium">{scholar?.firstName} {scholar?.lastName}</p></div>
                <div><Label className="text-xs text-gray-500">Student ID</Label><p className="font-medium">{scholar?.idNumber || 'N/A'}</p></div>
                <div><Label className="text-xs text-gray-500">Course</Label><p className="font-medium">{scholar?.programOfStudyAndYear || scholar?.course || 'N/A'}</p></div>
                <div><Label className="text-xs text-gray-500">Department/Office</Label><p className="font-medium">{scholar?.department || 'N/A'}</p></div>
              </div>
              <div><Label htmlFor="evaluatorPosition">Your Position Title *</Label><Input id="evaluatorPosition" value={evaluatorPosition} onChange={(e) => setEvaluatorPosition(e.target.value)} placeholder="e.g., Circulation in-charge" className="mt-1" disabled={readOnly} /></div>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg"><div className="flex justify-between items-center"><div><Label className="text-sm text-blue-700">Overall Rating Preview</Label><p className="text-3xl font-bold text-blue-900">{overallPreview.rating}</p></div><Badge className={`text-lg px-4 py-2 ${overallPreview.interpretation === 'Excellent' || overallPreview.interpretation === 'Good' ? 'bg-green-500' : overallPreview.interpretation === 'Average' ? 'bg-yellow-500' : 'bg-red-500'}`}>{overallPreview.interpretation}</Badge></div></div>
            <div className="border-2 border-red-200 bg-red-50 p-4 rounded-lg space-y-4"><h3 className="font-semibold text-red-900">A. ATTENDANCE AND PUNCTUALITY (20%)</h3><RatingInput label="Regularity of Attendance" value={attendance.regularityOfAttendance} onChange={(v) => setAttendance({...attendance, regularityOfAttendance: v})} disabled={readOnly} /><RatingInput label="Promptness in Reporting for Duty" value={attendance.promptnessInReporting} onChange={(v) => setAttendance({...attendance, promptnessInReporting: v})} disabled={readOnly} /></div>
            <div className="border-2 border-orange-200 bg-orange-50 p-4 rounded-lg space-y-4"><h3 className="font-semibold text-orange-900">B. QUALITY OF WORK OUTPUT (25%)</h3><RatingInput label="Accuracy and Thoroughness of Work" value={quality.accuracyAndThoroughness} onChange={(v) => setQuality({...quality, accuracyAndThoroughness: v})} disabled={readOnly} /><RatingInput label="Organizes and/or Presentation/Evidence of Work" value={quality.organizationAndPresentation} onChange={(v) => setQuality({...quality, organizationAndPresentation: v})} disabled={readOnly} /><RatingInput label="Effectiveness (Completion of Clients' Needs and Constraints)" value={quality.effectiveness} onChange={(v) => setQuality({...quality, effectiveness: v})} disabled={readOnly} /></div>
            <div className="border-2 border-yellow-200 bg-yellow-50 p-4 rounded-lg space-y-4"><h3 className="font-semibold text-yellow-900">C. QUANTITY OF WORK OUTPUT (15%)</h3><RatingInput label="Accomplishes More Work on the Given Time" value={quantity.accomplishesMoreWork} onChange={(v) => setQuantity({...quantity, accomplishesMoreWork: v})} disabled={readOnly} /><RatingInput label="Readiness in Accomplishing Tasks/Duties" value={quantity.readinessInAccomplishing} onChange={(v) => setQuantity({...quantity, readinessInAccomplishing: v})} disabled={readOnly} /></div>
            <div className="border-2 border-green-200 bg-green-50 p-4 rounded-lg space-y-4"><h3 className="font-semibold text-green-900">D. PERSONAL QUALITIES (25%)</h3><RatingInput label="Sense of Responsibility and Urgency" value={personal.responsibilityAndUrgency} onChange={(v) => setPersonal({...personal, responsibilityAndUrgency: v})} disabled={readOnly} /><RatingInput label="Dependability and Reliability" value={personal.dependabilityAndReliability} onChange={(v) => setPersonal({...personal, dependabilityAndReliability: v})} disabled={readOnly} /><RatingInput label="Industry and Resourcefulness" value={personal.industryAndResourcefulness} onChange={(v) => setPersonal({...personal, industryAndResourcefulness: v})} disabled={readOnly} /><RatingInput label="Fairness and Initiative" value={personal.fairnessAndInitiative} onChange={(v) => setPersonal({...personal, fairnessAndInitiative: v})} disabled={readOnly} /><RatingInput label="Sociability and Pleasant Disposition" value={personal.sociabilityAndDisposition} onChange={(v) => setPersonal({...personal, sociabilityAndDisposition: v})} disabled={readOnly} /></div>
            {!hideTimekeeping && (
              <div className="border-2 border-purple-200 bg-purple-50 p-4 rounded-lg space-y-4"><h3 className="font-semibold text-purple-900">TIMEKEEPING RECORD</h3><div className="grid grid-cols-3 gap-4"><div><Label>Excused Absences</Label><Input type="number" min="0" value={timekeeping.excusedAbsences} onChange={(e) => setTimekeeping({...timekeeping, excusedAbsences: parseInt(e.target.value) || 0})} disabled={readOnly} /></div><div><Label>Unexcused Absences</Label><Input type="number" min="0" value={timekeeping.unexcusedAbsences} onChange={(e) => setTimekeeping({...timekeeping, unexcusedAbsences: parseInt(e.target.value) || 0})} disabled={readOnly} /></div><div><Label>Late &gt;10mins</Label><Input type="number" min="0" value={timekeeping.lateMoreThan10mins} onChange={(e) => setTimekeeping({...timekeeping, lateMoreThan10mins: parseInt(e.target.value) || 0})} disabled={readOnly} /></div><div><Label>Late &lt;1hr</Label><Input type="number" min="0" value={timekeeping.lateLessThan1hr} onChange={(e) => setTimekeeping({...timekeeping, lateLessThan1hr: parseInt(e.target.value) || 0})} disabled={readOnly} /></div><div><Label>Failure to Punch</Label><Input type="number" min="0" value={timekeeping.failureToPunch} onChange={(e) => setTimekeeping({...timekeeping, failureToPunch: parseInt(e.target.value) || 0})} disabled={readOnly} /></div><div><Label>Under Time</Label><Input type="number" min="0" value={timekeeping.underTime} onChange={(e) => setTimekeeping({...timekeeping, underTime: parseInt(e.target.value) || 0})} disabled={readOnly} /></div></div></div>
            )}
            <div className="space-y-4"><div><Label htmlFor="supervisorRemarks">Remarks and Recommendation by Immediate Supervisor</Label><Textarea id="supervisorRemarks" value={supervisorRemarks} onChange={(e) => setSupervisorRemarks(e.target.value)} rows={3} placeholder="Enter your remarks and recommendations..." className="mt-1" disabled={readOnly} /></div><div><Label htmlFor="nasRemarks">Remarks / Comments by the NAS (Optional)</Label><Textarea id="nasRemarks" value={nasRemarks} onChange={(e) => setNasRemarks(e.target.value)} rows={2} placeholder="Optional comments..." className="mt-1" disabled={readOnly} /></div></div>
          </div>
        </ScrollArea>
        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button onClick={handleSubmit} disabled={loading} className="bg-[#800000] hover:bg-[#600000]">
              {loading ? 'Saving...' : existingEvaluation ? 'Update Evaluation' : 'Submit Evaluation'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
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

interface ScholarEvaluationFormProps {
  scholar: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  existingEvaluation?: any
}

export function ScholarEvaluationForm({ scholar, open, onOpenChange, onSuccess, existingEvaluation }: ScholarEvaluationFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [evaluatorPosition, setEvaluatorPosition] = useState(existingEvaluation?.evaluatorPosition || '')
  
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
    const attendanceAvg = (attendance.regularityOfAttendance + attendance.promptnessInReporting) / 2
    const attendanceScore = attendanceAvg * 0.20
    const qualityAvg = (quality.accuracyAndThoroughness + quality.organizationAndPresentation + quality.effectiveness) / 3
    const qualityScore = qualityAvg * 0.25
    const quantityAvg = (quantity.accomplishesMoreWork + quantity.readinessInAccomplishing) / 2
    const quantityScore = quantityAvg * 0.15
    const personalAvg = (personal.responsibilityAndUrgency + personal.dependabilityAndReliability + personal.industryAndResourcefulness + personal.fairnessAndInitiative + personal.sociabilityAndDisposition) / 5
    const personalScore = personalAvg * 0.25
    const overall = attendanceScore + qualityScore + quantityScore + personalScore
    let interpretation = ''
    if (overall >= 4.5) interpretation = 'Very Good'
    else if (overall >= 3.5) interpretation = 'Good'
    else if (overall >= 2.5) interpretation = 'Average'
    else if (overall >= 1.5) interpretation = 'Poor'
    else interpretation = 'Very Poor'
    return { rating: overall.toFixed(2), interpretation }
  }

  const handleSubmit = async () => {
    if (!evaluatorPosition.trim()) {
      toast({ title: "Missing Information", description: "Please enter your position title", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      const evaluationData: ScholarEvaluationData = {
        scholar: scholar.userId || scholar._id,
        scholarName: `${scholar.firstName} ${scholar.lastName}`,
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
        toast({ title: "Evaluation Updated", description: `Successfully updated evaluation for ${scholar.firstName} ${scholar.lastName}`, duration: 3000 })
      } else {
        await scholarEvaluationService.createEvaluation(evaluationData)
        toast({ title: "Evaluation Submitted", description: `Successfully submitted evaluation for ${scholar.firstName} ${scholar.lastName}`, duration: 3000 })
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

  const RatingInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2 items-center">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button key={rating} type="button" onClick={() => onChange(rating)} className={`w-10 h-10 rounded-md border-2 font-semibold transition-all ${value === rating ? 'bg-[#800000] text-white border-[#800000]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#800000]'}`}>
            {rating}
          </button>
        ))}
        <span className="text-sm text-gray-500 ml-2">
          {value === 5 ? 'Very Good' : value === 4 ? 'Good' : value === 3 ? 'Average' : value === 2 ? 'Poor' : 'Very Poor'}
        </span>
      </div>
    </div>
  )

  const overallPreview = calculateOverallRating()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{existingEvaluation ? 'Edit' : 'Create'} Scholar Evaluation - {scholar?.firstName} {scholar?.lastName}</DialogTitle>
          <DialogDescription>Non-Academic Scholar Evaluation Form</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-gray-500">Scholar Name</Label><p className="font-medium">{scholar?.firstName} {scholar?.lastName}</p></div>
                <div><Label className="text-xs text-gray-500">Student ID</Label><p className="font-medium">{scholar?.idNumber || 'N/A'}</p></div>
                <div><Label className="text-xs text-gray-500">Course</Label><p className="font-medium">{scholar?.programOfStudyAndYear || scholar?.course || 'N/A'}</p></div>
                <div><Label className="text-xs text-gray-500">Department/Office</Label><p className="font-medium">{scholar?.department || 'N/A'}</p></div>
              </div>
              <div><Label htmlFor="evaluatorPosition">Your Position Title *</Label><Input id="evaluatorPosition" value={evaluatorPosition} onChange={(e) => setEvaluatorPosition(e.target.value)} placeholder="e.g., Circulation in-charge" className="mt-1" /></div>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg"><div className="flex justify-between items-center"><div><Label className="text-sm text-blue-700">Overall Rating Preview</Label><p className="text-3xl font-bold text-blue-900">{overallPreview.rating}</p></div><Badge className={`text-lg px-4 py-2 ${overallPreview.interpretation === 'Very Good' ? 'bg-green-500' : overallPreview.interpretation === 'Good' ? 'bg-blue-500' : overallPreview.interpretation === 'Average' ? 'bg-yellow-500' : overallPreview.interpretation === 'Poor' ? 'bg-orange-500' : 'bg-red-500'}`}>{overallPreview.interpretation}</Badge></div></div>
            <div className="border-2 border-red-200 bg-red-50 p-4 rounded-lg space-y-4"><h3 className="font-semibold text-red-900">A. ATTENDANCE AND PUNCTUALITY (20%)</h3><RatingInput label="Regularity of Attendance" value={attendance.regularityOfAttendance} onChange={(v) => setAttendance({...attendance, regularityOfAttendance: v})} /><RatingInput label="Promptness in Reporting for Duty" value={attendance.promptnessInReporting} onChange={(v) => setAttendance({...attendance, promptnessInReporting: v})} /></div>
            <div className="border-2 border-orange-200 bg-orange-50 p-4 rounded-lg space-y-4"><h3 className="font-semibold text-orange-900">B. QUALITY OF WORK OUTPUT (25%)</h3><RatingInput label="Accuracy and Thoroughness of Work" value={quality.accuracyAndThoroughness} onChange={(v) => setQuality({...quality, accuracyAndThoroughness: v})} /><RatingInput label="Organizes and/or Presentation/Evidence of Work" value={quality.organizationAndPresentation} onChange={(v) => setQuality({...quality, organizationAndPresentation: v})} /><RatingInput label="Effectiveness (Completion of Clients' Needs and Constraints)" value={quality.effectiveness} onChange={(v) => setQuality({...quality, effectiveness: v})} /></div>
            <div className="border-2 border-yellow-200 bg-yellow-50 p-4 rounded-lg space-y-4"><h3 className="font-semibold text-yellow-900">C. QUANTITY OF WORK OUTPUT (15%)</h3><RatingInput label="Accomplishes More Work on the Given Time" value={quantity.accomplishesMoreWork} onChange={(v) => setQuantity({...quantity, accomplishesMoreWork: v})} /><RatingInput label="Readiness in Accomplishing Tasks/Duties" value={quantity.readinessInAccomplishing} onChange={(v) => setQuantity({...quantity, readinessInAccomplishing: v})} /></div>
            <div className="border-2 border-green-200 bg-green-50 p-4 rounded-lg space-y-4"><h3 className="font-semibold text-green-900">D. PERSONAL QUALITIES (25%)</h3><RatingInput label="Sense of Responsibility and Urgency" value={personal.responsibilityAndUrgency} onChange={(v) => setPersonal({...personal, responsibilityAndUrgency: v})} /><RatingInput label="Dependability and Reliability" value={personal.dependabilityAndReliability} onChange={(v) => setPersonal({...personal, dependabilityAndReliability: v})} /><RatingInput label="Industry and Resourcefulness" value={personal.industryAndResourcefulness} onChange={(v) => setPersonal({...personal, industryAndResourcefulness: v})} /><RatingInput label="Fairness and Initiative" value={personal.fairnessAndInitiative} onChange={(v) => setPersonal({...personal, fairnessAndInitiative: v})} /><RatingInput label="Sociability and Pleasant Disposition" value={personal.sociabilityAndDisposition} onChange={(v) => setPersonal({...personal, sociabilityAndDisposition: v})} /></div>
            <div className="border-2 border-purple-200 bg-purple-50 p-4 rounded-lg space-y-4"><h3 className="font-semibold text-purple-900">TIMEKEEPING RECORD</h3><div className="grid grid-cols-3 gap-4"><div><Label>Excused Absences</Label><Input type="number" min="0" value={timekeeping.excusedAbsences} onChange={(e) => setTimekeeping({...timekeeping, excusedAbsences: parseInt(e.target.value) || 0})} /></div><div><Label>Unexcused Absences</Label><Input type="number" min="0" value={timekeeping.unexcusedAbsences} onChange={(e) => setTimekeeping({...timekeeping, unexcusedAbsences: parseInt(e.target.value) || 0})} /></div><div><Label>Late &gt;10mins</Label><Input type="number" min="0" value={timekeeping.lateMoreThan10mins} onChange={(e) => setTimekeeping({...timekeeping, lateMoreThan10mins: parseInt(e.target.value) || 0})} /></div><div><Label>Late &lt;1hr</Label><Input type="number" min="0" value={timekeeping.lateLessThan1hr} onChange={(e) => setTimekeeping({...timekeeping, lateLessThan1hr: parseInt(e.target.value) || 0})} /></div><div><Label>Failure to Punch</Label><Input type="number" min="0" value={timekeeping.failureToPunch} onChange={(e) => setTimekeeping({...timekeeping, failureToPunch: parseInt(e.target.value) || 0})} /></div><div><Label>Under Time</Label><Input type="number" min="0" value={timekeeping.underTime} onChange={(e) => setTimekeeping({...timekeeping, underTime: parseInt(e.target.value) || 0})} /></div></div></div>
            <div className="space-y-4"><div><Label htmlFor="supervisorRemarks">Remarks and Recommendation by Immediate Supervisor</Label><Textarea id="supervisorRemarks" value={supervisorRemarks} onChange={(e) => setSupervisorRemarks(e.target.value)} rows={3} placeholder="Enter your remarks and recommendations..." className="mt-1" /></div><div><Label htmlFor="nasRemarks">Remarks / Comments by the NAS (Optional)</Label><Textarea id="nasRemarks" value={nasRemarks} onChange={(e) => setNasRemarks(e.target.value)} rows={2} placeholder="Optional comments..." className="mt-1" /></div></div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#800000] hover:bg-[#600000]">{loading ? 'Saving...' : existingEvaluation ? 'Update Evaluation' : 'Submit Evaluation'}</Button></div>
      </DialogContent>
    </Dialog>
  )
}
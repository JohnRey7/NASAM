"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useConfirmation } from "@/components/ui/confirmation-dialog"
import { scholarEvaluationService } from "@/services/scholarEvaluationService"
import { Calendar, Lock, Unlock, Bell } from "lucide-react"

export function AdminEvaluationControl() {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirmation()
  const [currentPeriod, setCurrentPeriod] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  // Form state for opening new period
  const [semester, setSemester] = useState("First Semester")
  const [schoolYear, setSchoolYear] = useState("2024-2025")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    loadCurrentPeriod()
  }, [])

  const loadCurrentPeriod = async () => {
    try {
      const data = await scholarEvaluationService.getCurrentPeriod()
      setCurrentPeriod(data.period)
      setIsOpen(data.isOpen)
    } catch (error) {
      console.error('Error loading period:', error)
    }
  }

  const handleOpenPeriod = async () => {
    if (!semester || !schoolYear) {
      toast({
        title: "Missing Information",
        description: "Please select semester and enter school year",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const result = await scholarEvaluationService.openEvaluationPeriod(semester, schoolYear, notes)
      
      toast({
        title: "Evaluation Period Opened",
        description: `${result.period.ratingPeriod} is now open. Department heads have been notified.`,
        duration: 5000
      })

      setNotes("")
      await loadCurrentPeriod()
    } catch (error: any) {
      console.error('Error opening period:', error)
      toast({
        title: "Failed to Open Period",
        description: error.response?.data?.message || error.message || "An error occurred",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClosePeriod = async () => {
    const confirmed = await confirm({
      title: "Close Evaluation Period",
      description: `Are you sure you want to close the evaluation period for ${currentPeriod?.ratingPeriod}?\n\nThis will:\n• Prevent new evaluations from being submitted\n• Lock the current evaluation data\n• Update statistics\n\nYou can open a new period later.`,
      confirmText: "Close Period",
      cancelText: "Cancel",
      type: "warning"
    })

    if (!confirmed) return

    try {
      setLoading(true)
      const result = await scholarEvaluationService.closeEvaluationPeriod()
      
      toast({
        title: "Evaluation Period Closed",
        description: `${result.period.ratingPeriod} has been closed successfully.`,
        duration: 5000
      })

      await loadCurrentPeriod()
    } catch (error: any) {
      console.error('Error closing period:', error)
      toast({
        title: "Failed to Close Period",
        description: error.response?.data?.message || error.message || "An error occurred",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-[#800000] to-[#600000] text-white">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Scholar Evaluation Period Control
        </CardTitle>
        <CardDescription className="text-gray-200">
          Manage when department heads can evaluate scholars
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Current Period Status */}
        <div className="mb-6">
          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Current Period Status</Label>
          {isOpen && currentPeriod ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Unlock className="h-5 w-5 text-green-600" />
                  <Badge className="bg-green-500 text-white text-sm px-3 py-1">OPEN</Badge>
                </div>
                <Badge variant="outline" className="text-sm">
                  {currentPeriod.totalEvaluations || 0} Evaluations Submitted
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-lg text-green-900">{currentPeriod.ratingPeriod}</p>
                <p className="text-sm text-gray-600">
                  Opened: {new Date(currentPeriod.openedAt).toLocaleDateString()} at {new Date(currentPeriod.openedAt).toLocaleTimeString()}
                </p>
                {currentPeriod.notes && (
                  <p className="text-sm text-gray-700 mt-2 italic">Note: {currentPeriod.notes}</p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Bell className="h-4 w-4" />
                <span>Department heads have been notified and can submit evaluations</span>
              </div>
              <Button 
                onClick={handleClosePeriod} 
                disabled={loading}
                variant="destructive"
                className="mt-4 w-full"
              >
                <Lock className="mr-2 h-4 w-4" />
                {loading ? 'Closing...' : 'Close Evaluation Period'}
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-gray-500" />
                <Badge variant="secondary" className="text-sm">CLOSED</Badge>
              </div>
              <p className="text-gray-600">No evaluation period is currently open</p>
              {currentPeriod && (
                <p className="text-sm text-gray-500 mt-2">
                  Last period: {currentPeriod.ratingPeriod} (Closed: {new Date(currentPeriod.closedAt).toLocaleDateString()})
                </p>
              )}
            </div>
          )}
        </div>

        {/* Open New Period Form */}
        {!isOpen && (
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-lg mb-4 text-blue-900">Open New Evaluation Period</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="semester">Semester *</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger id="semester" className="bg-white">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Semester">First Semester</SelectItem>
                    <SelectItem value="Second Semester">Second Semester</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="schoolYear">School Year *</Label>
                <Select value={schoolYear} onValueChange={setSchoolYear}>
                  <SelectTrigger id="schoolYear" className="bg-white">
                    <SelectValue placeholder="Select school year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                    <SelectItem value="2027-2028">2027-2028</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or instructions for department heads..."
                  rows={3}
                  className="bg-white"
                />
              </div>

              <div className="bg-blue-100 border border-blue-300 rounded p-3 text-sm text-blue-900">
                <p className="font-semibold mb-1">📧 What happens when you open:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>All department heads will receive a notification</li>
                  <li>They can start evaluating their assigned scholars</li>
                  <li>Evaluations will be saved for this period</li>
                  <li>You can close the period anytime</li>
                </ul>
              </div>

              <Button 
                onClick={handleOpenPeriod} 
                disabled={loading}
                className="w-full bg-[#800000] hover:bg-[#600000]"
                size="lg"
              >
                <Unlock className="mr-2 h-5 w-5" />
                {loading ? 'Opening Period...' : 'Open Evaluation Period'}
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <p className="text-sm text-yellow-900 font-semibold mb-2">ℹ️ Important Notes:</p>
          <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
            <li>Only one evaluation period can be open at a time</li>
            <li>Department heads can edit evaluations while period is open</li>
            <li>Closing a period locks all evaluations for that semester</li>
            <li>You can view past evaluations anytime in the Evaluations tab</li>
          </ul>
        </div>
      </CardContent>
      {ConfirmDialog}
    </Card>
  )
}

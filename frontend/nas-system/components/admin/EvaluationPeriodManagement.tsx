"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { evaluationPeriodService, EvaluationPeriod } from "@/services/evaluationPeriodService"
import { format } from "date-fns"
import { Loader2, Calendar, CheckCircle, XCircle } from "lucide-react"

export function EvaluationPeriodManagement() {
  const [currentPeriod, setCurrentPeriod] = useState<EvaluationPeriod | null>(null)
  const [history, setHistory] = useState<EvaluationPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  // Form states
  const [semester, setSemester] = useState("First Semester")
  const [schoolYear, setSchoolYear] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [currentRes, historyRes] = await Promise.all([
        evaluationPeriodService.getCurrentPeriod(),
        evaluationPeriodService.getAllPeriods()
      ])

      if (currentRes.success && currentRes.isOpen) {
        setCurrentPeriod(currentRes.period)
      } else {
        setCurrentPeriod(null)
      }

      setHistory(historyRes.periods || [])
    } catch (error) {
      console.error("Error fetching evaluation data:", error)
      toast({
        title: "Error",
        description: "Failed to load evaluation period data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPeriod = async () => {
    if (!schoolYear) {
      toast({
        title: "Error",
        description: "School Year is required",
        variant: "destructive"
      })
      return
    }

    try {
      setProcessing(true)
      await evaluationPeriodService.openPeriod({
        semester,
        schoolYear,
        notes
      })
      
      toast({
        title: "Success",
        description: "Evaluation period opened successfully"
      })
      
      setNotes("")
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to open evaluation period",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleClosePeriod = async () => {
    if (!confirm("Are you sure you want to close the current evaluation period?")) return

    try {
      setProcessing(true)
      await evaluationPeriodService.closePeriod({ notes })
      
      toast({
        title: "Success",
        description: "Evaluation period closed successfully"
      })
      
      setNotes("")
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to close evaluation period",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Status Card */}
        <Card className={currentPeriod ? "border-green-200 bg-green-50" : "border-gray-200"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Status
              {currentPeriod ? (
                <Badge className="bg-green-600">OPEN</Badge>
              ) : (
                <Badge variant="secondary">CLOSED</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {currentPeriod 
                ? `Evaluation is currently ongoing for ${currentPeriod.ratingPeriod}`
                : "No evaluation period is currently active"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentPeriod ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Opened By</p>
                    <p className="font-medium">{currentPeriod.openedBy?.name || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date Opened</p>
                    <p className="font-medium">{currentPeriod.openedAt ? format(new Date(currentPeriod.openedAt), "PPP") : "-"}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-green-200">
                  <Label htmlFor="close-notes">Closing Notes (Optional)</Label>
                  <Textarea 
                    id="close-notes" 
                    placeholder="Enter any notes about this period..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2 bg-white"
                  />
                  <Button 
                    onClick={handleClosePeriod} 
                    disabled={processing}
                    className="w-full mt-4 bg-red-600 hover:bg-red-700"
                  >
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Close Evaluation Period"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Semester">First Semester</SelectItem>
                        <SelectItem value="Second Semester">Second Semester</SelectItem>
                        <SelectItem value="Summer">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>School Year</Label>
                    <Input 
                      placeholder="e.g. 2024-2025" 
                      value={schoolYear}
                      onChange={(e) => setSchoolYear(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea 
                    placeholder="Enter any notes for this period..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleOpenPeriod} 
                  disabled={processing}
                  className="w-full bg-[#800000] hover:bg-[#600000]"
                >
                  {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Open Evaluation Period"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            <p>
              <strong>Opening a Period:</strong> When you open an evaluation period, all Department Heads will be notified to start evaluating their scholars.
            </p>
            <p>
              <strong>Closing a Period:</strong> Closing the period will prevent any further evaluations from being submitted or updated.
            </p>
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h4 className="font-semibold text-blue-800 mb-2">Note</h4>
              <p className="text-blue-700">
                Only one evaluation period can be open at a time. You must close the current period before opening a new one.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Period History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead>Opened By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No history found
                  </TableCell>
                </TableRow>
              ) : (
                history.map((period) => (
                  <TableRow key={period._id}>
                    <TableCell className="font-medium">{period.ratingPeriod}</TableCell>
                    <TableCell>
                      {period.isOpen ? (
                        <Badge className="bg-green-600">Open</Badge>
                      ) : (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </TableCell>
                    <TableCell>{period.openedAt ? format(new Date(period.openedAt), "MMM d, yyyy") : "-"}</TableCell>
                    <TableCell>{period.closedAt ? format(new Date(period.closedAt), "MMM d, yyyy") : "-"}</TableCell>
                    <TableCell>{period.openedBy?.name || "Unknown"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

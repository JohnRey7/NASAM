"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllUserPersonalityTests, deletePersonalityTestByUserId } from "@/services/personalityTestService"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export function PersonalityTestAnswers() {
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnswers()
  }, [])

  const fetchAnswers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getAllUserPersonalityTests()
      setAnswers(response.tests || [])
    } catch (error: any) {
      console.error("Error fetching answers:", error)
      setError(error.message || "Failed to fetch answers")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user's personality test results? This action cannot be undone.")) return
    
    try {
      await deletePersonalityTestByUserId(userId)
      toast({
        title: "Success",
        description: "Personality test results deleted successfully",
      })
      fetchAnswers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete results",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Error: {error}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Date Taken</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading answers...
                </TableCell>
              </TableRow>
            ) : answers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No answers found
                </TableCell>
              </TableRow>
            ) : (
              answers.map((answer) => {
                const user = answer.applicationId?.user
                const userName = user ? user.name : "Unknown User"
                const userId = user?._id

                return (
                  <TableRow key={answer._id}>
                    <TableCell className="font-medium">{userName}</TableCell>
                    <TableCell>{answer.completedAt ? format(new Date(answer.completedAt), "PPP") : "-"}</TableCell>
                    <TableCell>{answer.score ? parseFloat(answer.score.$numberDecimal || answer.score).toFixed(2) : 0}</TableCell>
                    <TableCell>
                      <Badge variant={answer.status === 'completed' ? 'default' : 'secondary'}>
                        {answer.status || (answer.endTime && new Date(answer.endTime) < new Date() ? 'expired' : 'in-progress')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        answer.riskLevelIndicator === 'High' ? 'destructive' : 
                        answer.riskLevelIndicator === 'Medium' ? 'secondary' : 'outline'
                      }>
                        {answer.riskLevelIndicator || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {userId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(userId)}
                          title="Delete Results"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

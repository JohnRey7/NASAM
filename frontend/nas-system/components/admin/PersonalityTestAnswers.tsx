"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllUserPersonalityTests } from "@/services/personalityTestService"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export function PersonalityTestAnswers() {
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading answers...
                </TableCell>
              </TableRow>
            ) : answers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No answers found
                </TableCell>
              </TableRow>
            ) : (
              answers.map((answer) => (
                <TableRow key={answer._id}>
                  <TableCell className="font-medium">{answer.userId?.name || "Unknown User"}</TableCell>
                  <TableCell>{answer.completedAt ? format(new Date(answer.completedAt), "PPP") : "-"}</TableCell>
                  <TableCell>{answer.score || 0}</TableCell>
                  <TableCell>
                    <Badge variant={answer.status === 'completed' ? 'default' : 'secondary'}>
                      {answer.status}
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

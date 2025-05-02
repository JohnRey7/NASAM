"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EvaluationQuestion {
  id: string
  question: string
  type: "rating" | "text"
}

const evaluationQuestions: EvaluationQuestion[] = [
  {
    id: "academic_performance",
    question: "How would you rate your academic performance this term?",
    type: "rating",
  },
  {
    id: "service_hours",
    question: "Were you able to complete all required service hours?",
    type: "rating",
  },
  {
    id: "challenges",
    question: "What challenges did you face this term?",
    type: "text",
  },
  {
    id: "improvements",
    question: "What improvements would you suggest for the scholarship program?",
    type: "text",
  },
  {
    id: "goals",
    question: "What are your academic and service goals for next term?",
    type: "text",
  },
]

export function TermEndEvaluation() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRatingChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleTextChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Check if all questions are answered
    const allAnswered = evaluationQuestions.every((q) => answers[q.id] && answers[q.id].trim() !== "")

    if (allAnswered) {
      setSubmitted(true)
    }

    setIsSubmitting(false)
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Term-End Evaluation</CardTitle>
          <CardDescription>Thank you for completing your term-end evaluation</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">Evaluation Submitted</AlertTitle>
            <AlertDescription className="text-green-700">
              Your term-end evaluation has been successfully submitted. The Office of Academic Scholarships will review
              your responses.
            </AlertDescription>
          </Alert>

          <div className="mt-6">
            <h3 className="font-medium text-lg mb-2">Next Steps</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Check your email for confirmation</li>
              <li>Complete any pending service hours by the deadline</li>
              <li>Prepare for next term's scholarship renewal</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Term-End Evaluation</CardTitle>
        <CardDescription>Please complete this evaluation to fulfill your scholarship requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {evaluationQuestions.map((q) => (
          <div key={q.id} className="space-y-3">
            <Label htmlFor={q.id} className="text-base font-medium">
              {q.question}
            </Label>

            {q.type === "rating" ? (
              <RadioGroup
                id={q.id}
                value={answers[q.id] || ""}
                onValueChange={(value) => handleRatingChange(q.id, value)}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excellent" id={`${q.id}-excellent`} />
                  <Label htmlFor={`${q.id}-excellent`}>Excellent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good" id={`${q.id}-good`} />
                  <Label htmlFor={`${q.id}-good`}>Good</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="average" id={`${q.id}-average`} />
                  <Label htmlFor={`${q.id}-average`}>Average</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="below_average" id={`${q.id}-below_average`} />
                  <Label htmlFor={`${q.id}-below_average`}>Below Average</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poor" id={`${q.id}-poor`} />
                  <Label htmlFor={`${q.id}-poor`}>Poor</Label>
                </div>
              </RadioGroup>
            ) : (
              <Textarea
                id={q.id}
                value={answers[q.id] || ""}
                onChange={(e) => handleTextChange(q.id, e.target.value)}
                placeholder="Enter your answer here..."
                className="min-h-[100px]"
              />
            )}

            <Separator className="my-2" />
          </div>
        ))}

        {!Object.keys(answers).length && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Required</AlertTitle>
            <AlertDescription>All questions must be answered before submitting.</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Evaluation"}
        </Button>
      </CardFooter>
    </Card>
  )
}

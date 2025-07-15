"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Clock, AlertTriangle } from "lucide-react"
import axios from "axios"

interface BackendQuestion {
  _id: string
  type: string
  question: string
}

interface Option {
  id: string
  text: string
  value: number
}

interface Answered {
  questionId: string
  answer: number
}

const API_URL = "http://localhost:3000/api"

export function PersonalityTest() {
  const [questions, setQuestions] = useState<BackendQuestion[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes (backend default)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Options for all questions (Likert scale)
  const likertOptions: Option[] = [
    { id: "1", text: "Strongly Disagree", value: 1 },
    { id: "2", text: "Disagree", value: 2 },
    { id: "3", text: "Neutral", value: 3 },
    { id: "4", text: "Agree", value: 4 },
    { id: "5", text: "Strongly Agree", value: 5 },
  ]

  // On mount, check if user has a test in progress or completed
  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API_URL}/personality-test/me`, { withCredentials: true })
        if (res.data && res.data.questions) {
          setQuestions(res.data.questions)
          setTestStarted(true)
          setTestCompleted(false)
          // Set timer if available
          if (res.data.endTime && res.data.startTime) {
            const end = new Date(res.data.endTime).getTime()
            const now = Date.now()
            setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)))
          }
          // Load answers if any
          if (res.data.answers && Array.isArray(res.data.answers)) {
            const answers: Record<string, string> = {}
            res.data.answers.forEach((ans: any) => {
              answers[ans.questionId?._id || ans.questionId] = likertOptions.find(o => o.value === ans.answer)?.id || ""
            })
            setFormData(answers)
          }
        } else {
          setTestStarted(false)
        }
      } catch (e: any) {
        setTestStarted(false)
        setQuestions([])
      } finally {
        setLoading(false)
      }
    }
    fetchTest()
  }, [])

  // Timer effect
  useEffect(() => {
    if (!testStarted || testCompleted) return
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [testStarted, testCompleted, timeLeft])

  const handleStartTest = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/personality-test/start`, {}, { withCredentials: true })
      if (res.data && res.data.questions) {
        setQuestions(res.data.questions)
        setTestStarted(true)
        setTestCompleted(false)
        setCurrentStep(1)
        setFormData({})
        setTimeLeft(res.data.timeLimitSeconds || 900)
        toast({
          title: "Test Started",
          description: `You have ${(res.data.timeLimitSeconds || 900) / 60} minutes to complete the personality test.`,
        })
      }
    } catch (e: any) {
      toast({
        title: "Could not start test",
        description: e?.response?.data?.message || "An error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (value: string) => {
    setFormData({ ...formData, [questions[currentStep - 1]._id]: value })
  }

  const handleNext = async () => {
    const q = questions[currentStep - 1]
    if (!formData[q._id]) {
      toast({
        title: "Required",
        description: "Please select an answer before proceeding.",
        variant: "destructive",
      })
      return
    }
    // Save single answer to backend
    await recordSingleAnswer(q._id, formData[q._id])
    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const recordSingleAnswer = async (questionId: string, optionId: string) => {
    try {
      const option = likertOptions.find(o => o.id === optionId)
      if (!option) return
      await axios.post(
        `${API_URL}/personality-test/answer-single`,
        { questionId, answer: option.value },
        { withCredentials: true }
      )
    } catch (error: any) {
      toast({
        title: "Failed to save answer",
        description: error?.response?.data?.message || "Could not save your answer.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Prepare answers for backend
      const formattedAnswers = Object.entries(formData).map(([questionId, optionId]) => {
        const option = likertOptions.find(o => o.id === optionId)
        return {
          questionId,
          answer: option ? option.value : null,
        }
      })
      await axios.post(`${API_URL}/personality-test/record`, formattedAnswers, { withCredentials: true })
      setTestCompleted(true)
      toast({
        title: "Test Completed",
        description: "Your personality test has been submitted successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error?.response?.data?.message || "Could not submit your answers.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  const progress = questions.length > 0 ? ((currentStep - 1) / questions.length) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">Loading...</div>
    )
  }

  if (!testStarted) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <CardTitle className="text-[#800000]">Personality Assessment</CardTitle>
          <CardDescription>
            This assessment will help us understand your personality traits and characteristics.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Important:</strong> Once you start the test, you will have 15 minutes to complete it. Please
                    ensure you have a quiet environment and won't be interrupted.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium">Instructions:</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The test consists of a set of questions randomly selected for you.</li>
                <li>Answer each question honestly based on how you typically think, feel, and behave.</li>
                <li>There are no right or wrong answers.</li>
                <li>You can navigate between questions using the Previous and Next buttons.</li>
                <li>Your progress will be saved as you go.</li>
                <li>The test will automatically submit when the time is up or when you complete all questions.</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-end">
          <Button onClick={handleStartTest} className="bg-[#800000] hover:bg-[#600000]" disabled={loading}>
            Start Test
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (testCompleted) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="bg-green-100 border-b border-green-200">
          <CardTitle className="text-green-800">Assessment Completed</CardTitle>
          <CardDescription>Thank you for completing the personality assessment.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Your responses have been recorded</h3>
            <p className="text-gray-600 mb-4">
              Your personality assessment has been submitted successfully. The results will be reviewed by the
              scholarship committee as part of your application.
            </p>
            <p className="text-sm text-gray-500">
              You answered {Object.keys(formData).length} out of {questions.length} questions.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-center">
          <Button className="bg-[#800000] hover:bg-[#600000]" onClick={() => window.location.href = "/dashboard"}>
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Summary step
  if (currentStep > questions.length) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <CardTitle className="text-[#800000]">Review & Submit</CardTitle>
          <CardDescription>Review your answers before submitting the test.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q._id} className="border rounded p-3">
                <div className="font-medium">{idx + 1}. {q.question}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {likertOptions.find(o => o.id === formData[q._id])?.text || <span className="text-red-500">No answer</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
            Previous
          </Button>
          <Button className="bg-[#800000] hover:bg-[#600000]" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Test"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Question step
  const question = questions[currentStep - 1]
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-[#800000]">Personality Assessment</CardTitle>
            <CardDescription>
              Question {currentStep} of {questions.length}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border">
            <Clock className="h-4 w-4 text-[#800000]" />
            <span className={`font-mono ${timeLeft < 60 ? "text-red-500 font-bold" : ""}`}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Progress: {Math.round(progress)}%</span>
              <span>
                {Object.keys(formData).length} of {questions.length} answered
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">{question.question}</h3>
            <RadioGroup
              value={formData[question._id] || ""}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {likertOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
          Previous
        </Button>
        <Button
          onClick={handleNext}
          className="bg-[#800000] hover:bg-[#600000]"
          disabled={!formData[question._id]}
        >
          {currentStep === questions.length ? "Review & Submit" : "Next"}
        </Button>
      </CardFooter>
    </Card>
  )
}

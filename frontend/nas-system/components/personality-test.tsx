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

interface Question {
  id: number
  text: string
  options: {
    id: string
    text: string
    value: number
  }[]
  trait: string
}

// Sample personality test questions
const personalityQuestions: Question[] = [
  {
    id: 1,
    text: "I enjoy being the center of attention at social gatherings.",
    options: [
      { id: "1-1", text: "Strongly Disagree", value: 1 },
      { id: "1-2", text: "Disagree", value: 2 },
      { id: "1-3", text: "Neutral", value: 3 },
      { id: "1-4", text: "Agree", value: 4 },
      { id: "1-5", text: "Strongly Agree", value: 5 },
    ],
    trait: "extraversion",
  },
  {
    id: 2,
    text: "I prefer to plan my day rather than go with the flow.",
    options: [
      { id: "2-1", text: "Strongly Disagree", value: 1 },
      { id: "2-2", text: "Disagree", value: 2 },
      { id: "2-3", text: "Neutral", value: 3 },
      { id: "2-4", text: "Agree", value: 4 },
      { id: "2-5", text: "Strongly Agree", value: 5 },
    ],
    trait: "conscientiousness",
  },
  {
    id: 3,
    text: "I find it easy to empathize with others' feelings.",
    options: [
      { id: "3-1", text: "Strongly Disagree", value: 1 },
      { id: "3-2", text: "Disagree", value: 2 },
      { id: "3-3", text: "Neutral", value: 3 },
      { id: "3-4", text: "Agree", value: 4 },
      { id: "3-5", text: "Strongly Agree", value: 5 },
    ],
    trait: "agreeableness",
  },
  {
    id: 4,
    text: "I often worry about things that might go wrong.",
    options: [
      { id: "4-1", text: "Strongly Disagree", value: 1 },
      { id: "4-2", text: "Disagree", value: 2 },
      { id: "4-3", text: "Neutral", value: 3 },
      { id: "4-4", text: "Agree", value: 4 },
      { id: "4-5", text: "Strongly Agree", value: 5 },
    ],
    trait: "neuroticism",
  },
  {
    id: 5,
    text: "I enjoy exploring new ideas and concepts.",
    options: [
      { id: "5-1", text: "Strongly Disagree", value: 1 },
      { id: "5-2", text: "Disagree", value: 2 },
      { id: "5-3", text: "Neutral", value: 3 },
      { id: "5-4", text: "Agree", value: 4 },
      { id: "5-5", text: "Strongly Agree", value: 5 },
    ],
    trait: "openness",
  },
  {
    id: 6,
    text: "I find it energizing to be around other people.",
    options: [
      { id: "6-1", text: "Strongly Disagree", value: 1 },
      { id: "6-2", text: "Disagree", value: 2 },
      { id: "6-3", text: "Neutral", value: 3 },
      { id: "6-4", text: "Agree", value: 4 },
      { id: "6-5", text: "Strongly Agree", value: 5 },
    ],
    trait: "extraversion",
  },
  {
    id: 7,
    text: "I keep my belongings neat and organized.",
    options: [
      { id: "7-1", text: "Strongly Disagree", value: 1 },
      { id: "7-2", text: "Disagree", value: 2 },
      { id: "7-3", text: "Neutral", value: 3 },
      { id: "7-4", text: "Agree", value: 4 },
      { id: "7-5", text: "Strongly Agree", value: 5 },
    ],
    trait: "conscientiousness",
  },
  {
    id: 8,
    text: "I try to be kind and considerate to everyone I meet.",
    options: [
      { id: "8-1", text: "Strongly Disagree", value: 1 },
      { id: "8-2", text: "Disagree", value: 2 },
      { id: "8-3", text: "Neutral", value: 3 },
      { id: "8-4", text: "Agree", value: 4 },
      { id: "8-5", text: "Strongly Agree", value: 5 },
    ],
    trait: "agreeableness",
  },
  {
    id: 9,
    text: "I remain calm under pressure.",
    options: [
      { id: "9-1", text: "Strongly Disagree", value: 1 },
      { id: "9-2", text: "Disagree", value: 2 },
      { id: "9-3", text: "Neutral", value: 3 },
      { id: "9-4", text: "Agree", value: 4 },
      { id: "9-5", text: "Strongly Agree", value: 5 },
    ],
    trait: "neuroticism",
  },
  {
    id: 10,
    text: "I enjoy trying new activities and experiences.",
    options: [
      { id: "10-1", text: "Strongly Disagree", value: 1 },
      { id: "10-2", text: "Disagree", value: 2 },
      { id: "10-3", text: "Neutral", value: 3 },
      { id: "10-4", text: "Agree", value: 4 },
      { id: "10-5", text: "Strongly Agree", value: 5 },
    ],
    trait: "openness",
  },
]

const API_URL = "http://localhost:3000/api"

export function PersonalityTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(1200) // 20 minutes in seconds
  const [testCompleted, setTestCompleted] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const { toast } = useToast()

  // Timer effect
  useEffect(() => {
    if (!testStarted || testCompleted) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTestCompletion()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [testStarted, testCompleted])

  const handleStartTest = () => {
    setTestStarted(true)
    toast({
      title: "Test Started",
      description: "You have 20 minutes to complete the personality test.",
    })
  }

  // Record a single answer to the backend
  const recordSingleAnswer = async (questionId: number, optionId: string) => {
    try {
      const question = personalityQuestions.find(q => q.id === questionId)
      const option = question?.options.find(o => o.id === optionId)
      if (!option) return
      await axios.post(
        `${API_URL}/personality-test/answer-single`,
        { questionId: questionId, answer: option.value },
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

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [personalityQuestions[currentQuestion].id]: value })
  }

  const handleNext = async () => {
    const qId = personalityQuestions[currentQuestion].id
    const optionId = answers[qId]
    if (optionId) {
      await recordSingleAnswer(qId, optionId)
    }
    if (currentQuestion < personalityQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      await handleTestCompletion()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleTestCompletion = async () => {
    setTestCompleted(true)
    try {
      // Prepare answers for backend
      const formattedAnswers = Object.entries(answers).map(([questionId, optionId]) => {
        const question = personalityQuestions.find(q => q.id === Number(questionId))
        const option = question?.options.find(o => o.id === optionId)
        return {
          questionId: questionId,
          answer: option ? option.value : null,
        }
      })
      // Send all answers to backend
      await axios.post(`${API_URL}/personality-test/record`, formattedAnswers, { withCredentials: true })
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
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  const progress = (Object.keys(answers).length / personalityQuestions.length) * 100

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
                    <strong>Important:</strong> Once you start the test, you will have 20 minutes to complete it. Please
                    ensure you have a quiet environment and won't be interrupted.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Instructions:</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The test consists of {personalityQuestions.length} questions.</li>
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
          <Button onClick={handleStartTest} className="bg-[#800000] hover:bg-[#600000]">
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
              You answered {Object.keys(answers).length} out of {personalityQuestions.length} questions.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-center">
          <Button asChild className="bg-[#800000] hover:bg-[#600000]">
            <a href="/dashboard">Return to Dashboard</a>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-[#800000]">Personality Assessment</CardTitle>
            <CardDescription>
              Question {currentQuestion + 1} of {personalityQuestions.length}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border">
            <Clock className="h-4 w-4 text-[#800000]" />
            <span className={`font-mono ${timeLeft < 300 ? "text-red-500 font-bold" : ""}`}>
              {formatTime(timeLeft)}
            </span>
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
                {Object.keys(answers).length} of {personalityQuestions.length} answered
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">{personalityQuestions[currentQuestion].text}</h3>
            <RadioGroup
              value={answers[personalityQuestions[currentQuestion].id] || ""}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {personalityQuestions[currentQuestion].options.map((option) => (
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
        <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
          Previous
        </Button>
        <Button
          onClick={handleNext}
          className="bg-[#800000] hover:bg-[#600000]"
          disabled={!answers[personalityQuestions[currentQuestion].id]}
        >
          {currentQuestion === personalityQuestions.length - 1 ? "Complete Test" : "Next"}
        </Button>
      </CardFooter>
    </Card>
  )
}

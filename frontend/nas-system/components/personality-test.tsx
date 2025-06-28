"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Clock, AlertTriangle } from "lucide-react"
import { startPersonalityTest, answerPersonalityTest, stopPersonalityTest } from "@/lib/personalityTestApi"

export function PersonalityTest() {
  const [testId, setTestId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes in seconds
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

  const handleStartTest = async () => {
    setLoading(true)
    try {
      const data = await startPersonalityTest()
      setTestId(data.testId)
      setQuestions(data.questions)
      setTestStarted(true)
      setTimeLeft(data.timeLimitSeconds || 900)
      toast({ title: "Test Started", description: "You have 15 minutes to complete the personality test." })
    } catch (e) {
      toast({ title: "Error", description: "Could not start test." })
    }
    setLoading(false)
  }

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [questions[currentQuestion]._id]: value })
  }

  const handleNext = async () => {
    const qid = questions[currentQuestion]._id
    const answer = answers[qid]
    if (!answer) return
    setLoading(true)
    try {
      await answerPersonalityTest([{ questionId: qid, answer }])
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        await handleTestCompletion()
      }
    } catch (e) {
      toast({ title: "Error", description: "Could not submit answer." })
    }
    setLoading(false)
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleTestCompletion = async () => {
    setLoading(true)
    try {
      await stopPersonalityTest()
      setTestCompleted(true)
      toast({ title: "Test Completed", description: "Your personality test has been submitted successfully." })
    } catch (e) {
      toast({ title: "Error", description: "Could not complete test." })
    }
    setLoading(false)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0

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
                <li>The test consists of randomly selected questions.</li>
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
            {loading ? "Starting..." : "Start Test"}
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
              You answered {Object.keys(answers).length} out of {questions.length} questions.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-center">
          <a href="/dashboard">
            <Button className="bg-[#800000] hover:bg-[#600000]">
              Return to Dashboard
            </Button>
          </a>
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
              Question {currentQuestion + 1} of {questions.length}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border">
            <Clock className="h-4 w-4 text-[#800000]" />
            <span className={`font-mono ${timeLeft < 120 ? "text-red-500 font-bold" : ""}`}>{formatTime(timeLeft)}</span>
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
                {Object.keys(answers).length} of {questions.length} answered
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">{questions[currentQuestion]?.question}</h3>
            <RadioGroup
              value={answers[questions[currentQuestion]?._id] || ""}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {[1,2,3,4,5].map((val) => (
                <div key={val} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                  <RadioGroupItem value={val.toString()} id={`q${questions[currentQuestion]?._id}-opt${val}`} />
                  <Label htmlFor={`q${questions[currentQuestion]?._id}-opt${val}`} className="flex-1 cursor-pointer">
                    {val === 1 && "Strongly Disagree"}
                    {val === 2 && "Disagree"}
                    {val === 3 && "Neutral"}
                    {val === 4 && "Agree"}
                    {val === 5 && "Strongly Agree"}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0 || loading}>
          Previous
        </Button>
        <Button
          onClick={handleNext}
          className="bg-[#800000] hover:bg-[#600000]"
          disabled={!answers[questions[currentQuestion]?._id] || loading}
        >
          {currentQuestion === questions.length - 1 ? "Complete Test" : "Next"}
        </Button>
      </CardFooter>
    </Card>
  )
}

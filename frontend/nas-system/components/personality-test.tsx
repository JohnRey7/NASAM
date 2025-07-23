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
import {
  startPersonalityTest,
  answerPersonalityTest,
  stopPersonalityTest,
  getMyPersonalityTest,
} from "@/services/personalityTestService"

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

// Remove local personalityQuestions, use backend data

export function PersonalityTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(1200) // 20 minutes in seconds
  const [testCompleted, setTestCompleted] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [testId, setTestId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [score, setScore] = useState<number | null>(null)
  const [riskLevel, setRiskLevel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string>("");
  const [isFormVerified, setIsFormVerified] = useState(false);
  const [areDocumentsVerified, setAreDocumentsVerified] = useState(false);
  const [canTakeTest, setCanTakeTest] = useState(false);
  const { toast } = useToast()

  // Timer effect remains unchanged
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
    try {
      const data = await startPersonalityTest()
      setTestStarted(true)
      setTestId(data.testId)
      setQuestions(data.questions)
      setTimeLeft(data.timeLimitSeconds || 1200)
      toast({
        title: "Test Started",
        description: "You have 20 minutes to complete the personality test.",
      })
    } catch (error: any) {
      toast({
        title: "Error starting test",
        description: error?.response?.data?.message || error.message,
        variant: "destructive",
      })
    }
  }

  const handleAnswer = async (optionId: string) => {
    if (!questions[currentQuestion]) return
    const questionId = questions[currentQuestion]._id
    const value = Number(optionId.split("-")[1]) // Option value from id (e.g., "1-2" -> 2)
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    try {
      await answerPersonalityTest([
        { questionId, answer: value },
      ])
    } catch (error: any) {
      toast({
        title: "Error saving answer",
        description: error?.response?.data?.message || error.message,
        variant: "destructive",
      })
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleTestCompletion()
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
      const result = await stopPersonalityTest()
      setScore(result.score)
      setRiskLevel(result.riskLevelIndicator)
      toast({
        title: "Personality test successfully submitted",
        description: "Your personality test has been completed and submitted successfully. Your application has been automatically approved.",
      })
    } catch (error: any) {
      toast({
        title: "Error submitting test",
        description: error?.response?.data?.message || error.message,
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  const progress = (Object.keys(answers).length / (questions.length || 1)) * 100

  // Check test status on mount
  useEffect(() => {
    async function checkVerificationStatus() {
      try {
        // Check application status
        const appResponse = await fetch('http://localhost:3000/api/application', {
          credentials: 'include'
        });
        
        if (appResponse.ok) {
          const appData = await appResponse.json();
          if (appData.application) {
            const status = appData.application.status;
            setApplicationStatus(status);
            
            // Form is verified if status is 'form_verified' or beyond
            const formVerified = ['form_verified', 'document_verification', 'approved', 'rejected'].includes(status);
            setIsFormVerified(formVerified);
            
            // Documents are verified if status is 'document_verification' or beyond  
            const documentsVerified = ['document_verification', 'approved', 'rejected'].includes(status);
            setAreDocumentsVerified(documentsVerified);
            
            // Can take test only if BOTH form and documents are verified
            setCanTakeTest(formVerified && documentsVerified);
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        setCanTakeTest(false);
      }
    }

    async function fetchTestStatus() {
      try {
        const data = await getMyPersonalityTest();
        if (data && data.test) {
          // If test is completed, show completion message
          if (data.test.endTime) {
            setTestCompleted(true);
            setScore(data.test.score ? Number(data.test.score) : null);
            setRiskLevel(data.test.riskLevelIndicator || null);
          }
        }
      } catch (error) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    }
    checkVerificationStatus();
    fetchTestStatus();
  }, []);

  if (loading) {
    return (
      <Card className="max-w-3xl mx-auto mt-10">
        <CardContent className="py-12 text-center text-gray-500">Loading...</CardContent>
      </Card>
    );
  }

  // Show access restriction if verification requirements not met
  if (!canTakeTest) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="bg-red-50 border-b border-red-200">
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Personality Assessment - Access Restricted
          </CardTitle>
          <CardDescription className="text-red-600">
            You must complete the verification process before taking the personality test.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>Access Denied:</strong> The personality test is only available after both your application form and documents have been verified by OAS staff.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Verification Status:</h3>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`w-4 h-4 rounded-full ${
                  isFormVerified ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium">Application Form</p>
                  <p className="text-sm text-gray-600">
                    {isFormVerified ? 'Verified by OAS staff' : 'Awaiting OAS verification'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isFormVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isFormVerified ? 'Verified' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`w-4 h-4 rounded-full ${
                  areDocumentsVerified ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium">Documents</p>
                  <p className="text-sm text-gray-600">
                    {areDocumentsVerified ? 'Verified by OAS staff' : 'Awaiting OAS verification'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  areDocumentsVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {areDocumentsVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>What to do next:</strong> Please wait for OAS staff to review and verify your application form and documents. 
                You will be able to take the personality test once both are verified. Check your progress in the Application Progress Tracker.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-center">
          <Button variant="outline" className="text-gray-600" disabled>
            Test Locked - Awaiting Verification
          </Button>
        </CardFooter>
      </Card>
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
                    <strong>Important:</strong> Once you start the test, you will have 20 minutes to complete it. Please
                    ensure you have a quiet environment and won't be interrupted.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Instructions:</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The test consists of 10 questions.</li>
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
      <Card className="max-w-3xl mx-auto border-green-300 shadow-lg bg-green-50">
        <CardHeader className="bg-green-100 border-b border-green-200 flex flex-col items-center">
          <div className="mx-auto w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <CardTitle className="text-green-800 text-2xl text-center">Assessment Completed</CardTitle>
          <CardDescription className="text-green-700 text-center mt-2">
            <span className="font-semibold block mb-2">
              Applicant is done taking the personality test.
            </span>
            <span className="block bg-green-200 text-green-900 rounded px-3 py-2 mt-2 shadow-inner font-medium">
              Please proceed to the <span className="underline">Application Status</span> tab and wait for the approval.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-gray-700 mb-4">
              Thank you for completing the personality assessment. Your responses have been recorded and will be reviewed by the scholarship committee.
            </p>
            <p className="text-sm text-gray-500 mb-2">
              You answered {Object.keys(answers).length} out of {questions.length} questions.
            </p>
            {score !== null && riskLevel && (
              <div className="mt-4">
                <p className="font-semibold">Your Score: {score.toFixed(2)}</p>
                <p className={`font-semibold ${riskLevel === "High" ? "text-red-600" : riskLevel === "Medium" ? "text-yellow-600" : "text-green-600"}`}>
                  Risk Level: {riskLevel}
                </p>
                <p className="text-sm mt-2">
                  {riskLevel === "High" && "Guidance: Your responses indicate areas that may need attention. The scholarship committee will review your application carefully."}
                  {riskLevel === "Medium" && "Guidance: Your responses show a balanced profile. Continue demonstrating your commitment to academic excellence."}
                  {riskLevel === "Low" && "Guidance: Excellent! Your responses demonstrate strong personal qualities that align well with our scholarship values."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-center">
          <Button className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg shadow">
            <a href="/dashboard">Return to Dashboard</a>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (!questions.length) {
    return null
  }

  // Render the test UI with backend questions
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
            <span className={`font-mono ${timeLeft < 300 ? "text-red-500 font-bold" : ""}`}>{formatTime(timeLeft)}</span>
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
              value={(() => {
                const qid = questions[currentQuestion]?._id
                const val = answers[qid]
                if (!val) return ""
                // Find the option id for this value
                const optIdx = [1,2,3,4,5].indexOf(val)
                return `${currentQuestion + 1}-${val}`
              })()}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {[1,2,3,4,5].map((val) => (
                <div key={`${currentQuestion + 1}-${val}`} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                  <RadioGroupItem value={`${currentQuestion + 1}-${val}`} id={`${currentQuestion + 1}-${val}`} />
                  <Label htmlFor={`${currentQuestion + 1}-${val}`} className="flex-1 cursor-pointer">
                    {[
                      "Strongly Disagree",
                      "Disagree",
                      "Neutral",
                      "Agree",
                      "Strongly Agree",
                    ][val - 1]}
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
          disabled={!answers[questions[currentQuestion]?._id]}
        >
          {currentQuestion === questions.length - 1 ? "Complete Test" : "Next"}
        </Button>
      </CardFooter>
    </Card>
  )
}

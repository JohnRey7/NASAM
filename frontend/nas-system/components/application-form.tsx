"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ArrowRight, Save, FileDown } from "lucide-react"

export function ApplicationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const totalSteps = 3

  const handleSave = () => {
    setIsSaving(true)

    // Simulate saving
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Progress saved",
        description: "Your application has been saved successfully.",
      })
    }, 1000)
  }

  const handleSubmit = () => {
    setIsSubmitting(true)

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully.",
      })

      // Switch to status tab
      document.querySelector('[data-value="status"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    }, 1500)
  }

  const handleExportPDF = () => {
    toast({
      title: "PDF Generated",
      description: "Your application has been exported as PDF.",
    })
  }

  return (
    <Card>
      <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
        <CardTitle className="text-[#800000]">Scholarship Application Form</CardTitle>
        <CardDescription>Complete all sections to submit your application</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full mx-1 ${index + 1 <= currentStep ? "bg-[#800000]" : "bg-gray-200"}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Personal Information</span>
            <span>Educational Background</span>
            <span>Financial Information</span>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" placeholder="Enter your first name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" placeholder="Enter your last name" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth-date">Date of Birth</Label>
                <Input id="birth-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Complete Address</Label>
              <Textarea id="address" placeholder="Enter your complete address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-number">Contact Number</Label>
                <Input id="contact-number" placeholder="Enter your contact number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-address">Email Address</Label>
                <Input id="email-address" type="email" placeholder="Enter your email address" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-year">Current Year Level</Label>
                <Select>
                  <SelectTrigger id="current-year">
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">First Year</SelectItem>
                    <SelectItem value="2">Second Year</SelectItem>
                    <SelectItem value="3">Third Year</SelectItem>
                    <SelectItem value="4">Fourth Year</SelectItem>
                    <SelectItem value="5">Fifth Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-gpa">Current GPA</Label>
                <Input id="current-gpa" placeholder="Enter your GPA" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="previous-school">Previous School Attended</Label>
              <Input id="previous-school" placeholder="Enter your previous school" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">Academic Achievements</Label>
              <Textarea
                id="achievements"
                placeholder="List any academic achievements, awards, or recognitions"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Have you received any scholarship before?</Label>
              <RadioGroup defaultValue="no">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="scholarship-yes" />
                  <Label htmlFor="scholarship-yes" className="font-normal">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="scholarship-no" />
                  <Label htmlFor="scholarship-no" className="font-normal">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="family-income">Annual Family Income</Label>
              <Select>
                <SelectTrigger id="family-income">
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below-100k">Below ₱100,000</SelectItem>
                  <SelectItem value="100k-200k">₱100,000 - ₱200,000</SelectItem>
                  <SelectItem value="200k-300k">₱200,000 - ₱300,000</SelectItem>
                  <SelectItem value="300k-400k">₱300,000 - ₱400,000</SelectItem>
                  <SelectItem value="400k-500k">₱400,000 - ₱500,000</SelectItem>
                  <SelectItem value="above-500k">Above ₱500,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="family-members">Number of Family Members</Label>
              <Input id="family-members" type="number" min="1" placeholder="Enter number of family members" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="working-members">Number of Working Family Members</Label>
              <Input id="working-members" type="number" min="0" placeholder="Enter number of working family members" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-statement">Financial Statement</Label>
              <Textarea
                id="financial-statement"
                placeholder="Briefly describe your financial situation and why you need this scholarship"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Are you currently employed?</Label>
              <RadioGroup defaultValue="no">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="employed-yes" />
                  <Label htmlFor="employed-yes" className="font-normal">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="employed-no" />
                  <Label htmlFor="employed-no" className="font-normal">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Progress"}
          </Button>

          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)} className="bg-[#800000] hover:bg-[#600000]">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-[#800000] hover:bg-[#600000]" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

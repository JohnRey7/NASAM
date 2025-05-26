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

  const totalSteps = 4

  const handleSave = () => {
    setIsSaving(true)
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
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully.",
      })
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
            <span>Family Background</span>
            <span>Education</span>
            <span>References</span>
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
                <Label htmlFor="type-of-scholarship">Type of Scholarship</Label>
                <Select>
                  <SelectTrigger id="type-of-scholarship">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sponsored">Sponsored</SelectItem>
                    <SelectItem value="Merit">Merit</SelectItem>
                    <SelectItem value="Need-based">Need-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scholarship-sponsor">Name of Scholarship Sponsor</Label>
                <Input id="scholarship-sponsor" placeholder="Enter sponsor name" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program-study">Program of Study and Year</Label>
                <Input id="program-study" placeholder="e.g., BSIT 3rd Year" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remaining-units">Remaining Units (Including This Term)</Label>
                <Input id="remaining-units" type="number" min="0" placeholder="Enter remaining units" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="remaining-terms">Remaining Terms to Graduate</Label>
                <Input id="remaining-terms" type="number" min="0" placeholder="Enter remaining terms" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="citizenship">Citizenship</Label>
                <Input id="citizenship" placeholder="Enter your citizenship" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="civil-status">Civil Status</Label>
                <Select>
                  <SelectTrigger id="civil-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                    <SelectItem value="Separated">Separated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual-income">Annual Family Income</Label>
                <Select>
                  <SelectTrigger id="annual-income">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="residing-at">Residing At</Label>
                <Input id="residing-at" placeholder="e.g., Parent's House" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permanent-address">Permanent Residential Address</Label>
                <Input id="permanent-address" placeholder="Enter permanent address" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-number">Contact Number</Label>
              <Input id="contact-number" placeholder="Enter your contact number" />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Father's Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="father-first-name">First Name</Label>
                  <Input id="father-first-name" placeholder="Enter father's first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father-last-name">Last Name</Label>
                  <Input id="father-last-name" placeholder="Enter father's last name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="father-age">Age</Label>
                  <Input id="father-age" type="number" min="0" placeholder="Enter age" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father-occupation">Occupation</Label>
                  <Input id="father-occupation" placeholder="Enter occupation" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="father-income">Gross Annual Income</Label>
                  <Input id="father-income" placeholder="Enter annual income" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father-contact">Contact Number</Label>
                  <Input id="father-contact" placeholder="Enter contact number" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Mother's Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mother-first-name">First Name</Label>
                  <Input id="mother-first-name" placeholder="Enter mother's first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother-last-name">Last Name</Label>
                  <Input id="mother-last-name" placeholder="Enter mother's last name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mother-age">Age</Label>
                  <Input id="mother-age" type="number" min="0" placeholder="Enter age" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother-occupation">Occupation</Label>
                  <Input id="mother-occupation" placeholder="Enter occupation" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mother-income">Gross Annual Income</Label>
                  <Input id="mother-income" placeholder="Enter annual income" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother-contact">Contact Number</Label>
                  <Input id="mother-contact" placeholder="Enter contact number" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Siblings Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sibling-name">Name</Label>
                    <Input id="sibling-name" placeholder="Enter sibling's name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sibling-age">Age</Label>
                    <Input id="sibling-age" type="number" min="0" placeholder="Enter age" />
                  </div>
                </div>
                <Button variant="outline" className="w-full">Add Another Sibling</Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Elementary Education</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="elementary-school">Name and Address of School</Label>
                  <Input id="elementary-school" placeholder="Enter school name and address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elementary-average">General Average</Label>
                  <Input id="elementary-average" type="number" min="0" max="100" step="0.01" placeholder="Enter average" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Secondary Education</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="secondary-school">Name and Address of School</Label>
                  <Input id="secondary-school" placeholder="Enter school name and address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-average">General Average</Label>
                  <Input id="secondary-average" type="number" min="0" max="100" step="0.01" placeholder="Enter average" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">College Education</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="college-year">Year Level</Label>
                    <Input id="college-year" type="number" min="1" placeholder="Enter year level" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first-sem-grade">First Semester Average Final Grade</Label>
                    <Input id="first-sem-grade" type="number" min="0" max="100" step="0.01" placeholder="Enter grade" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="second-sem-grade">Second Semester Average Final Grade</Label>
                  <Input id="second-sem-grade" type="number" min="0" max="100" step="0.01" placeholder="Enter grade" />
                </div>
                <Button variant="outline" className="w-full">Add Another Year</Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Current Membership in Organizations</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Name of Organization</Label>
                    <Input id="org-name" placeholder="Enter organization name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-position">Position</Label>
                    <Input id="org-position" placeholder="Enter your position" />
                  </div>
                </div>
                <Button variant="outline" className="w-full">Add Another Organization</Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">References</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ref-name">Name</Label>
                    <Input id="ref-name" placeholder="Enter reference name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ref-relationship">Relationship to the Applicant</Label>
                    <Input id="ref-relationship" placeholder="Enter relationship" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ref-contact">Contact Number</Label>
                  <Input id="ref-contact" placeholder="Enter contact number" />
                </div>
                <Button variant="outline" className="w-full">Add Another Reference</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Progress"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#800000] hover:bg-[#600000]"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

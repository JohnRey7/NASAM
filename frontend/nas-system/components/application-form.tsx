"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ArrowRight, Save, FileDown } from "lucide-react"
import { applicationService, ApplicationFormData } from "@/services/applicationService"
import { useRouter } from "next/navigation"

interface Organization {
  name: string;
  position: string;
}

export function ApplicationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ApplicationFormData>({
    firstName: "",
    lastName: "",
    typeOfScholarship: "",
    nameOfScholarshipSponsor: "",
    programOfStudyAndYear: "",
    remainingUnitsIncludingThisTerm: 0,
    remainingTermsToGraduate: 0,
    citizenship: "",
    civilStatus: "",
    annualFamilyIncome: "",
    residingAt: "",
    permanentResidentialAddress: "",
    contactNumber: "",
    familyBackground: {
      father: {
        firstName: "",
        lastName: "",
        age: 0,
        occupation: "",
        grossAnnualIncome: "",
        contactNumber: ""
      },
      mother: {
        firstName: "",
        lastName: "",
        age: 0,
        occupation: "",
        grossAnnualIncome: "",
        contactNumber: ""
      },
      siblings: []
    },
    education: {
      elementary: {
        nameAndAddressOfSchool: "",
        generalAverage: 0
      },
      secondary: {
        nameAndAddressOfSchool: "",
        generalAverage: 0
      },
      collegeLevel: [],
      currentMembershipInOrganizations: []
    },
    references: []
  })
  const [siblings, setSiblings] = useState([{ 
    name: "", 
    age: 0, 
    programCurrentlyTakingOrFinished: "", 
    schoolOrOccupation: "" 
  }])
  const [organizations, setOrganizations] = useState<Organization[]>([{ name: "", position: "" }])
  const [collegeLevels, setCollegeLevels] = useState([{
    yearLevel: 1,
    firstSemesterAverageFinalGrade: 0,
    secondSemesterAverageFinalGrade: 0,
    thirdSemesterAverageFinalGrade: 0
  }])
  const [references, setReferences] = useState([{
    name: "",
    relationshipToTheApplicant: "",
    contactNumber: ""
  }])
  const { toast } = useToast()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const totalSteps = 4

  useEffect(() => {
    loadExistingApplication()
  }, [])

  const loadExistingApplication = async () => {
    try {
      const existingApplication = await applicationService.getMyApplication()
      if (existingApplication) {
        setFormData(existingApplication)
        setSiblings(existingApplication.familyBackground.siblings)
        setOrganizations(existingApplication.education.currentMembershipInOrganizations)
        setCollegeLevels(existingApplication.education.collegeLevel)
        setReferences(existingApplication.references)
      }
    } catch (error) {
      console.error('Error loading application:', error)
    }
  }

  const addSibling = () => {
    const newSibling = { 
      name: "", 
      age: 0, 
      programCurrentlyTakingOrFinished: "", 
      schoolOrOccupation: "" 
    };
    setSiblings([...siblings, newSibling]);
    setFormData(prev => ({
      ...prev,
      familyBackground: {
        ...prev.familyBackground,
        siblings: [...siblings, newSibling]
      }
    }));
  };

  const removeSibling = (index: number) => {
    const newSiblings = siblings.filter((_, i) => i !== index);
    setSiblings(newSiblings);
    setFormData(prev => ({
      ...prev,
      familyBackground: {
        ...prev.familyBackground,
        siblings: newSiblings
      }
    }));
  };

  const updateSibling = (index: number, field: keyof ApplicationFormData['familyBackground']['siblings'][0], value: string | number) => {
    const newSiblings = [...siblings];
    newSiblings[index] = {
      ...newSiblings[index],
      [field]: value
    };
    setSiblings(newSiblings);
  };

  const addOrganization = () => {
    const newOrg = { name: "", position: "" };
    setOrganizations([...organizations, newOrg]);
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        currentMembershipInOrganizations: [
          ...(prev.education.currentMembershipInOrganizations || []),
          { nameOfOrganization: "", position: "" }
        ]
      }
    }));
  };

  const removeOrganization = (index: number) => {
    const newOrganizations = organizations.filter((_, i) => i !== index);
    setOrganizations(newOrganizations);
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        currentMembershipInOrganizations: newOrganizations.map(org => ({
          nameOfOrganization: org.name,
          position: org.position
        }))
      }
    }));
  };

  const updateOrganization = (index: number, field: "name" | "position", value: string) => {
    const newOrganizations = [...organizations]
    newOrganizations[index][field] = value
    setOrganizations(newOrganizations)
  }

  const addCollegeLevel = () => {
    const newLevel = {
      yearLevel: collegeLevels.length + 1,
      firstSemesterAverageFinalGrade: 0,
      secondSemesterAverageFinalGrade: 0,
      thirdSemesterAverageFinalGrade: 0
    };
    setCollegeLevels([...collegeLevels, newLevel]);
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        collegeLevel: [...(prev.education.collegeLevel || []), newLevel]
      }
    }));
  };

  const removeCollegeLevel = (index: number) => {
    const newLevels = collegeLevels.filter((_, i) => i !== index);
    setCollegeLevels(newLevels);
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        collegeLevel: newLevels
      }
    }));
  };

  const updateCollegeLevel = (index: number, field: "yearLevel" | "firstSemesterAverageFinalGrade" | "secondSemesterAverageFinalGrade" | "thirdSemesterAverageFinalGrade", value: number) => {
    const newCollegeLevels = [...collegeLevels]
    newCollegeLevels[index][field] = value
    setCollegeLevels(newCollegeLevels)
  }

  const addReference = () => {
    const newRef = { 
      name: "", 
      relationshipToTheApplicant: "", 
      contactNumber: "" 
    };
    setReferences([...references, newRef]);
    setFormData(prev => ({
      ...prev,
      references: [...(prev.references || []), newRef]
    }));
  };

  const removeReference = (index: number) => {
    const newReferences = references.filter((_, i) => i !== index);
    setReferences(newReferences);
    setFormData(prev => ({
      ...prev,
      references: newReferences
    }));
  };

  const updateReference = (index: number, field: "name" | "relationshipToTheApplicant" | "contactNumber", value: string) => {
    const newReferences = [...references]
    newReferences[index][field] = value
    setReferences(newReferences)
  }

  const updateFatherField = (field: keyof ApplicationFormData['familyBackground']['father'], value: string | number) => {
    setFormData(prev => ({
      ...prev,
      familyBackground: {
        ...prev.familyBackground,
        father: {
          ...prev.familyBackground.father,
          [field]: value
        }
      }
    }));
  };

  const updateMotherField = (field: keyof ApplicationFormData['familyBackground']['mother'], value: string | number) => {
    setFormData(prev => ({
      ...prev,
      familyBackground: {
        ...prev.familyBackground,
        mother: {
          ...prev.familyBackground.mother,
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const completeFormData = {
        ...formData,
        familyBackground: {
          ...formData.familyBackground,
          siblings: siblings.map(sibling => ({
            name: sibling.name,
            age: sibling.age,
            programCurrentlyTakingOrFinished: sibling.programCurrentlyTakingOrFinished || '',
            schoolOrOccupation: sibling.schoolOrOccupation || ''
          }))
        },
        education: {
          ...formData.education,
          collegeLevel: collegeLevels.map(level => ({
            yearLevel: level.yearLevel,
            firstSemesterAverageFinalGrade: level.firstSemesterAverageFinalGrade,
            secondSemesterAverageFinalGrade: level.secondSemesterAverageFinalGrade,
            thirdSemesterAverageFinalGrade: level.thirdSemesterAverageFinalGrade || 0
          })),
          currentMembershipInOrganizations: organizations.map(org => ({
            nameOfOrganization: org.name,
            position: org.position
          }))
        },
        references: references.map(ref => ({
          name: ref.name,
          relationshipToTheApplicant: ref.relationshipToTheApplicant,
          contactNumber: ref.contactNumber
        }))
      };

      console.log('Saving form data:', JSON.stringify(completeFormData, null, 2));
      
      await applicationService.updateApplication(completeFormData);
      toast({
        title: "Progress saved",
        description: "Your application has been saved successfully.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      const requiredFields = [
        'firstName', 'lastName', 'typeOfScholarship', 'nameOfScholarshipSponsor',
        'programOfStudyAndYear', 'remainingUnitsIncludingThisTerm', 'remainingTermsToGraduate',
        'citizenship', 'civilStatus', 'annualFamilyIncome', 'residingAt',
        'permanentResidentialAddress', 'contactNumber'
      ] as const;

      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error(`Please fill in all required fields. Missing: ${field}`);
        }
      }

      // Validate familyBackground
      if (!formData.familyBackground?.father || !formData.familyBackground?.mother) {
        throw new Error('Please fill in both father and mother information');
      }

      // Validate education
      if (!formData.education?.elementary || !formData.education?.secondary) {
        throw new Error('Please fill in both elementary and secondary education information');
      }

      // Prepare complete form data
      const completeFormData = {
        ...formData,
        familyBackground: {
          ...formData.familyBackground,
          siblings: siblings.map(sibling => ({
            name: sibling.name,
            age: sibling.age,
            programCurrentlyTakingOrFinished: sibling.programCurrentlyTakingOrFinished || '',
            schoolOrOccupation: sibling.schoolOrOccupation || ''
          }))
        },
        education: {
          ...formData.education,
          collegeLevel: collegeLevels.map(level => ({
            yearLevel: level.yearLevel,
            firstSemesterAverageFinalGrade: level.firstSemesterAverageFinalGrade,
            secondSemesterAverageFinalGrade: level.secondSemesterAverageFinalGrade,
            thirdSemesterAverageFinalGrade: level.thirdSemesterAverageFinalGrade || 0
          })),
          currentMembershipInOrganizations: organizations.map(org => ({
            nameOfOrganization: org.name,
            position: org.position
          }))
        },
        references: references.map(ref => ({
          name: ref.name,
          relationshipToTheApplicant: ref.relationshipToTheApplicant,
          contactNumber: ref.contactNumber
        }))
      };

      console.log('Submitting form data:', JSON.stringify(completeFormData, null, 2));

      // Use the new submitApplication method
      const result = await applicationService.submitApplication(completeFormData);
      
      console.log('Submit response:', result);

      toast({
        title: "Success",
        description: "Your application has been submitted successfully.",
      });

      // Optionally refresh the form data
      const updatedApplication = await applicationService.getMyApplication();
      if (updatedApplication) {
        setFormData(updatedApplication);
        // Update other state variables
        setSiblings(updatedApplication.familyBackground.siblings || []);
        setOrganizations((updatedApplication.education.currentMembershipInOrganizations || []).map((org: { nameOfOrganization: string; position: string }) => ({
          name: org.nameOfOrganization,
          position: org.position
        })));
        setCollegeLevels(updatedApplication.education.collegeLevel || []);
        setReferences(updatedApplication.references || []);
      }

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!formData._id) {
      toast({
        title: "Error",
        description: "Cannot export PDF: Application not saved yet.",
        variant: "destructive"
      });
      return;
    }

    try {
      const pdfBlob = await applicationService.exportToPDF(formData._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'application-form.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    toast({
      title: "PDF Generated",
      description: "Your application has been exported as PDF.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const validateStep1 = () => {
    const requiredFields = [
      'firstName', 'lastName', 'typeOfScholarship', 'nameOfScholarshipSponsor',
      'programOfStudyAndYear', 'remainingUnitsIncludingThisTerm', 'remainingTermsToGraduate',
      'citizenship', 'civilStatus', 'annualFamilyIncome', 'residingAt',
      'permanentResidentialAddress', 'contactNumber'
    ] as const;

    for (const field of requiredFields) {
      if (!formData[field]) {
        toast({
          title: "Required Field Missing",
          description: `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    // Validate father's information
    const fatherFields = ['firstName', 'lastName', 'age', 'occupation', 'grossAnnualIncome', 'contactNumber'] as const;
    for (const field of fatherFields) {
      if (!formData.familyBackground.father[field]) {
        toast({
          title: "Required Field Missing",
          description: `Please fill in father's ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: "destructive"
        });
        return false;
      }
    }

    // Validate mother's information
    const motherFields = ['firstName', 'lastName', 'age', 'occupation', 'grossAnnualIncome', 'contactNumber'] as const;
    for (const field of motherFields) {
      if (!formData.familyBackground.mother[field]) {
        toast({
          title: "Required Field Missing",
          description: `Please fill in mother's ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: "destructive"
        });
        return false;
      }
    }

    // Validate at least one sibling
    if (siblings.length === 0) {
      toast({
        title: "Required Information Missing",
        description: "Please add at least one sibling",
        variant: "destructive"
      });
      return false;
    }

    // Validate each sibling's required fields
    for (const [index, sibling] of siblings.entries()) {
      if (!sibling.name || !sibling.age) {
        toast({
          title: "Required Field Missing",
          description: `Please fill in all required fields for sibling ${index + 1}`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const validateStep3 = () => {
    // Validate elementary education
    if (!formData.education.elementary.nameAndAddressOfSchool || !formData.education.elementary.generalAverage) {
      toast({
        title: "Required Field Missing",
        description: "Please fill in all elementary education information",
        variant: "destructive"
      });
      return false;
    }

    // Validate secondary education
    if (!formData.education.secondary.nameAndAddressOfSchool || !formData.education.secondary.generalAverage) {
      toast({
        title: "Required Field Missing",
        description: "Please fill in all secondary education information",
        variant: "destructive"
      });
      return false;
    }

    // Validate at least one college level
    if (collegeLevels.length === 0) {
      toast({
        title: "Required Information Missing",
        description: "Please add at least one college level",
        variant: "destructive"
      });
      return false;
    }

    // Validate each college level
    for (const [index, level] of collegeLevels.entries()) {
      if (!level.yearLevel || !level.firstSemesterAverageFinalGrade || !level.secondSemesterAverageFinalGrade) {
        toast({
          title: "Required Field Missing",
          description: `Please fill in all required fields for year ${index + 1}`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const validateStep4 = () => {
    // Validate at least two references
    if (references.length < 2) {
      toast({
        title: "Required Information Missing",
        description: "Please add at least two references",
        variant: "destructive"
      });
      return false;
    }

    // Validate each reference
    for (const [index, ref] of references.entries()) {
      if (!ref.name || !ref.relationshipToTheApplicant || !ref.contactNumber) {
        toast({
          title: "Required Field Missing",
          description: `Please fill in all required fields for reference ${index + 1}`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

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
                <Input
                  id="first-name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type-of-scholarship">Type of Scholarship</Label>
                <Select
                  value={formData.typeOfScholarship}
                  onValueChange={(value) => setFormData({...formData, typeOfScholarship: value})}
                >
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
                <Input
                  id="scholarship-sponsor"
                  value={formData.nameOfScholarshipSponsor}
                  onChange={(e) => setFormData({...formData, nameOfScholarshipSponsor: e.target.value})}
                  placeholder="Enter sponsor name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program-study">Program of Study and Year</Label>
                <Input
                  id="program-study"
                  value={formData.programOfStudyAndYear}
                  onChange={(e) => setFormData({...formData, programOfStudyAndYear: e.target.value})}
                  placeholder="e.g., BSIT 3rd Year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remaining-units">Remaining Units (Including This Term)</Label>
                <Input
                  id="remaining-units"
                  type="number"
                  min="0"
                  value={formData.remainingUnitsIncludingThisTerm}
                  onChange={(e) => setFormData({...formData, remainingUnitsIncludingThisTerm: Number(e.target.value)})}
                  placeholder="Enter remaining units"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="remaining-terms">Remaining Terms to Graduate</Label>
                <Input
                  id="remaining-terms"
                  type="number"
                  min="0"
                  value={formData.remainingTermsToGraduate}
                  onChange={(e) => setFormData({...formData, remainingTermsToGraduate: Number(e.target.value)})}
                  placeholder="Enter remaining terms"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="citizenship">Citizenship</Label>
                <Input
                  id="citizenship"
                  value={formData.citizenship}
                  onChange={(e) => setFormData({...formData, citizenship: e.target.value})}
                  placeholder="Enter your citizenship"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="civil-status">Civil Status</Label>
                <Select
                  value={formData.civilStatus}
                  onValueChange={(value) => setFormData({...formData, civilStatus: value})}
                >
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
                <Select
                  value={formData.annualFamilyIncome}
                  onValueChange={(value) => setFormData({...formData, annualFamilyIncome: value})}
                >
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
                <Input
                  id="residing-at"
                  value={formData.residingAt}
                  onChange={(e) => setFormData({...formData, residingAt: e.target.value})}
                  placeholder="e.g., Parent's House"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permanent-address">Permanent Residential Address</Label>
                <Input
                  id="permanent-address"
                  value={formData.permanentResidentialAddress}
                  onChange={(e) => setFormData({...formData, permanentResidentialAddress: e.target.value})}
                  placeholder="Enter permanent address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-number">Contact Number</Label>
              <Input
                id="contact-number"
                value={formData.contactNumber}
                onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                placeholder="Enter your contact number"
              />
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
                  <Input
                    id="father-first-name"
                    value={formData.familyBackground.father.firstName}
                    onChange={(e) => updateFatherField('firstName', e.target.value)}
                    placeholder="Enter father's first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father-last-name">Last Name</Label>
                  <Input
                    id="father-last-name"
                    value={formData.familyBackground.father.lastName}
                    onChange={(e) => updateFatherField('lastName', e.target.value)}
                    placeholder="Enter father's last name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="father-age">Age</Label>
                  <Input
                    id="father-age"
                    type="number"
                    min="0"
                    value={formData.familyBackground.father.age}
                    onChange={(e) => updateFatherField('age', Number(e.target.value))}
                    placeholder="Enter age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father-occupation">Occupation</Label>
                  <Input
                    id="father-occupation"
                    value={formData.familyBackground.father.occupation}
                    onChange={(e) => updateFatherField('occupation', e.target.value)}
                    placeholder="Enter occupation"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="father-income">Gross Annual Income</Label>
                  <Input
                    id="father-income"
                    value={formData.familyBackground.father.grossAnnualIncome}
                    onChange={(e) => updateFatherField('grossAnnualIncome', e.target.value)}
                    placeholder="Enter annual income"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father-contact">Contact Number</Label>
                  <Input
                    id="father-contact"
                    value={formData.familyBackground.father.contactNumber}
                    onChange={(e) => updateFatherField('contactNumber', e.target.value)}
                    placeholder="Enter contact number"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Mother's Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mother-first-name">First Name</Label>
                  <Input
                    id="mother-first-name"
                    value={formData.familyBackground.mother.firstName}
                    onChange={(e) => updateMotherField('firstName', e.target.value)}
                    placeholder="Enter mother's first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother-last-name">Last Name</Label>
                  <Input
                    id="mother-last-name"
                    value={formData.familyBackground.mother.lastName}
                    onChange={(e) => updateMotherField('lastName', e.target.value)}
                    placeholder="Enter mother's last name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mother-age">Age</Label>
                  <Input
                    id="mother-age"
                    type="number"
                    min="0"
                    value={formData.familyBackground.mother.age}
                    onChange={(e) => updateMotherField('age', Number(e.target.value))}
                    placeholder="Enter age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother-occupation">Occupation</Label>
                  <Input
                    id="mother-occupation"
                    value={formData.familyBackground.mother.occupation}
                    onChange={(e) => updateMotherField('occupation', e.target.value)}
                    placeholder="Enter occupation"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mother-income">Gross Annual Income</Label>
                  <Input
                    id="mother-income"
                    value={formData.familyBackground.mother.grossAnnualIncome}
                    onChange={(e) => updateMotherField('grossAnnualIncome', e.target.value)}
                    placeholder="Enter annual income"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother-contact">Contact Number</Label>
                  <Input
                    id="mother-contact"
                    value={formData.familyBackground.mother.contactNumber}
                    onChange={(e) => updateMotherField('contactNumber', e.target.value)}
                    placeholder="Enter contact number"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Siblings Information</h3>
              {siblings.map((sibling, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Sibling {index + 1}</h4>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSibling(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor={`sibling-name-${index}`}>Name</Label>
                      <Input
                        id={`sibling-name-${index}`}
                        value={sibling.name}
                        onChange={(e) => updateSibling(index, "name", e.target.value)}
                        placeholder="Enter sibling's name"
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor={`sibling-age-${index}`}>Age</Label>
                      <Input
                        id={`sibling-age-${index}`}
                        type="number"
                        min="0"
                        value={sibling.age}
                        onChange={(e) => updateSibling(index, "age", Number(e.target.value))}
                        placeholder="Enter age"
                      />
                  </div>
                </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`sibling-program-${index}`}>Program Currently Taking or Finished</Label>
                      <Input
                        id={`sibling-program-${index}`}
                        value={sibling.programCurrentlyTakingOrFinished}
                        onChange={(e) => updateSibling(index, "programCurrentlyTakingOrFinished", e.target.value)}
                        placeholder="Enter program"
                      />
              </div>
                    <div className="space-y-2">
                      <Label htmlFor={`sibling-school-${index}`}>School or Occupation</Label>
                      <Input
                        id={`sibling-school-${index}`}
                        value={sibling.schoolOrOccupation}
                        onChange={(e) => updateSibling(index, "schoolOrOccupation", e.target.value)}
                        placeholder="Enter school or occupation"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addSibling}>
                Add Another Sibling
              </Button>
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
                  <Input
                    id="elementary-school"
                    value={formData.education.elementary.nameAndAddressOfSchool}
                    onChange={(e) => setFormData({...formData, education: {...formData.education, elementary: {...formData.education.elementary, nameAndAddressOfSchool: e.target.value}}})}
                    placeholder="Enter school name and address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elementary-average">General Average</Label>
                  <Input
                    id="elementary-average"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.education.elementary.generalAverage}
                    onChange={(e) => setFormData({...formData, education: {...formData.education, elementary: {...formData.education.elementary, generalAverage: Number(e.target.value)}}})}
                    placeholder="Enter average"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Secondary Education</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="secondary-school">Name and Address of School</Label>
                  <Input
                    id="secondary-school"
                    value={formData.education.secondary.nameAndAddressOfSchool}
                    onChange={(e) => setFormData({...formData, education: {...formData.education, secondary: {...formData.education.secondary, nameAndAddressOfSchool: e.target.value}}})}
                    placeholder="Enter school name and address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-average">General Average</Label>
                  <Input
                    id="secondary-average"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.education.secondary.generalAverage}
                    onChange={(e) => setFormData({...formData, education: {...formData.education, secondary: {...formData.education.secondary, generalAverage: Number(e.target.value)}}})}
                    placeholder="Enter average"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">College Education</h3>
              {collegeLevels.map((level, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Year {index + 1}</h4>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollegeLevel(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor={`college-year-${index}`}>Year Level</Label>
                      <Input
                        id={`college-year-${index}`}
                        type="number"
                        min="1"
                        value={level.yearLevel}
                        onChange={(e) => updateCollegeLevel(index, "yearLevel", Number(e.target.value))}
                        placeholder="Enter year level"
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor={`first-sem-grade-${index}`}>First Semester Average Final Grade</Label>
                      <Input
                        id={`first-sem-grade-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={level.firstSemesterAverageFinalGrade}
                        onChange={(e) => updateCollegeLevel(index, "firstSemesterAverageFinalGrade", Number(e.target.value))}
                        placeholder="Enter grade"
                      />
                  </div>
                </div>
                  <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                      <Label htmlFor={`second-sem-grade-${index}`}>Second Semester Average Final Grade</Label>
                      <Input
                        id={`second-sem-grade-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={level.secondSemesterAverageFinalGrade}
                        onChange={(e) => updateCollegeLevel(index, "secondSemesterAverageFinalGrade", Number(e.target.value))}
                        placeholder="Enter grade"
                      />
                </div>
                    <div className="space-y-2">
                      <Label htmlFor={`third-sem-grade-${index}`}>Third Semester Average Final Grade</Label>
                      <Input
                        id={`third-sem-grade-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={level.thirdSemesterAverageFinalGrade}
                        onChange={(e) => updateCollegeLevel(index, "thirdSemesterAverageFinalGrade", Number(e.target.value))}
                        placeholder="Enter grade"
                      />
              </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addCollegeLevel}>
                Add Another Year
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Current Membership in Organizations</h3>
              {organizations.map((org, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Organization {index + 1}</h4>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOrganization(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor={`org-name-${index}`}>Name of Organization</Label>
                      <Input
                        id={`org-name-${index}`}
                        value={org.name}
                        onChange={(e) => updateOrganization(index, "name", e.target.value)}
                        placeholder="Enter organization name"
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor={`org-position-${index}`}>Position</Label>
                      <Input
                        id={`org-position-${index}`}
                        value={org.position}
                        onChange={(e) => updateOrganization(index, "position", e.target.value)}
                        placeholder="Enter your position"
                      />
                  </div>
                </div>
              </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addOrganization}>
                Add Another Organization
              </Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">References</h3>
              <div className="space-y-4">
                {references.map((ref, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Reference {index + 1}</h4>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReference(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                        <Label htmlFor={`ref-name-${index}`}>Name</Label>
                        <Input
                          id={`ref-name-${index}`}
                          value={ref.name}
                          onChange={(e) => updateReference(index, "name", e.target.value)}
                          placeholder="Enter reference name"
                        />
                  </div>
                  <div className="space-y-2">
                        <Label htmlFor={`ref-relationship-${index}`}>Relationship to the Applicant</Label>
                        <Input
                          id={`ref-relationship-${index}`}
                          value={ref.relationshipToTheApplicant}
                          onChange={(e) => updateReference(index, "relationshipToTheApplicant", e.target.value)}
                          placeholder="Enter relationship"
                        />
                  </div>
                </div>
                <div className="space-y-2">
                      <Label htmlFor={`ref-contact-${index}`}>Contact Number</Label>
                      <Input
                        id={`ref-contact-${index}`}
                        value={ref.contactNumber}
                        onChange={(e) => updateReference(index, "contactNumber", e.target.value)}
                        placeholder="Enter contact number"
                      />
                </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addReference}>
                  Add Another Reference
                </Button>
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
              onClick={handleNext}
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

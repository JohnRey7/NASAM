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
import axios from "axios"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const API_URL = "http://localhost:3000/api";

const defaultFormData: ApplicationFormData = {
  user: undefined,
  emailAddress: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  programOfStudyAndYear: '',
  existingScholarship: '',
  remainingUnitsIncludingThisTerm: 0,
  remainingTermsToGraduate: 0,
  citizenship: '',
  civilStatus: '',
  annualFamilyIncome: '',
  currentResidenceAddress: '',
  residingAt: '',
  permanentResidentialAddress: '',
  contactNumber: '',
  familyBackground: {
    father: {
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      age: 0,
      occupation: '',
      grossAnnualIncome: '',
      companyName: '',
      companyAddress: '',
      homeAddress: '',
      contactNumber: ''
    },
    mother: {
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      age: 0,
      occupation: '',
      grossAnnualIncome: '',
      companyName: '',
      companyAddress: '',
      homeAddress: '',
      contactNumber: ''
    },
    siblings: []
  },
  education: {
    elementary: {
      nameAndAddressOfSchool: '',
      honorOrAwardsReceived: '',
      nameOfOrganizationAndPositionHeld: '',
      generalAverage: 0,
      rankAmongGraduates: '',
      contestTrainingsConferencesParticipated: ''
    },
    secondary: {
      nameAndAddressOfSchool: '',
      honorOrAwardsReceived: '',
      nameOfOrganizationAndPositionHeld: '',
      generalAverage: 0,
      rankAmongGraduates: '',
      contestTrainingsConferencesParticipated: ''
    },
    collegeLevel: [],
    currentMembershipInOrganizations: []
  },
  references: []
};

type Organization = {
  nameOfOrganization: string;
  position: string;
};

type ApplicationFormProps = {
  applicationId?: string;
  initialData?: ApplicationFormData;
  readOnly?: boolean;
  onUpdateSuccess?: () => void;
};

export function ApplicationForm({ applicationId, initialData, readOnly, onUpdateSuccess }: ApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [formData, setFormData] = useState<ApplicationFormData>(defaultFormData)
  const [siblings, setSiblings] = useState([{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }])
  const [organizations, setOrganizations] = useState([{ nameOfOrganization: "", position: "" }])
  const [collegeLevels, setCollegeLevels] = useState([{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }])
  const [references, setReferences] = useState([{ name: "", relationshipToTheApplicant: "", contactNumber: "" }])
  const { toast } = useToast()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState("")
  const [position, setPosition] = useState("")
  const [organizationErrors, setOrganizationErrors] = useState<string[]>([])
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "oas_staff";
  const [showConfirm, setShowConfirm] = useState(false);

  const totalSteps = 4

  useEffect(() => {
    if (initialData) {
      setFormData({ ...defaultFormData, ...initialData });
      setIsReadOnly(!!readOnly);
    } else if (applicationId) {
      // Load specific application by ID
      (async () => {
        try {
          const app = await applicationService.getApplicationById(applicationId);
          if (app) {
            setFormData({ ...defaultFormData, ...app });
            setIsReadOnly(!!readOnly);
          }
        } catch (e) {
          setError('Failed to load application');
        }
      })();
    } else {
      // Default: load current user's application
      loadExistingApplication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, applicationId]);

  useEffect(() => {
    if (typeof readOnly === 'boolean') {
      setIsReadOnly(readOnly);
    }
  }, [readOnly]);

  const loadExistingApplication = async () => {
    try {
      const existingApplication = await applicationService.getMyApplication();
      console.log('Loaded application:', existingApplication);
      const appData = existingApplication?.application || existingApplication;
      if (appData && appData.firstName) {
        setIsReadOnly(true);
        setFormData({
          ...defaultFormData,
          ...appData,
          familyBackground: {
            ...defaultFormData.familyBackground,
            ...appData.familyBackground,
            father: {
              ...defaultFormData.familyBackground.father,
              ...appData.familyBackground?.father
            },
            mother: {
              ...defaultFormData.familyBackground.mother,
              ...appData.familyBackground?.mother
            },
            siblings: appData.familyBackground?.siblings?.length > 0
              ? appData.familyBackground.siblings
              : [{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }]
          },
          education: {
            ...defaultFormData.education,
            ...appData.education,
            elementary: {
              ...defaultFormData.education.elementary,
              ...appData.education?.elementary
            },
            secondary: {
              ...defaultFormData.education.secondary,
              ...appData.education?.secondary
            },
            collegeLevel: appData.education?.collegeLevel?.length > 0
              ? appData.education.collegeLevel
              : [{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }],
            currentMembershipInOrganizations: appData.education?.currentMembershipInOrganizations?.length > 0
              ? appData.education.currentMembershipInOrganizations
              : [{ nameOfOrganization: "", position: "" }]
          },
          references: appData.references?.length > 0
            ? appData.references
            : [{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]
        });
        setSiblings(appData.familyBackground?.siblings?.length > 0
          ? appData.familyBackground.siblings
          : [{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }]);
        setCollegeLevels(appData.education?.collegeLevel?.length > 0
          ? appData.education.collegeLevel
          : [{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }]);
        setOrganizations(appData.education?.currentMembershipInOrganizations?.length > 0
          ? appData.education.currentMembershipInOrganizations
          : [{ nameOfOrganization: "", position: "" }]);
        setReferences(appData.references?.length > 0
          ? appData.references
          : [{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]);
      } else {
        setFormData(defaultFormData);
        setSiblings([{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }]);
        setCollegeLevels([{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }]);
        setOrganizations([{ nameOfOrganization: "", position: "" }]);
        setReferences([{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]);
        setIsReadOnly(false);
      }
    } catch (error) {
      console.error('Error loading application:', error);
    }
  }

  const addSibling = () => {
    const newSibling = { name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" };
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
    setFormData(prev => ({
      ...prev,
      familyBackground: {
        ...prev.familyBackground,
        siblings: newSiblings
      }
    }));
  };

  const addOrganization = () => {
    if (organizationName.trim() && position.trim()) {
      setFormData(prev => ({
        ...prev,
        education: {
          ...prev.education,
          currentMembershipInOrganizations: [
            ...prev.education.currentMembershipInOrganizations,
            {
              nameOfOrganization: organizationName,
              position: position
            }
          ]
        }
      }))
      setOrganizationName("")
      setPosition("")
    }
  };

  const removeOrganization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        currentMembershipInOrganizations: prev.education.currentMembershipInOrganizations.filter((_, i) => i !== index)
      }
    }))
  }

  const updateOrganization = (index: number, field: "nameOfOrganization" | "position", value: string) => {
    const newOrganizations = [...organizations]
    newOrganizations[index][field] = value
    setOrganizations(newOrganizations)
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        currentMembershipInOrganizations: newOrganizations
      }
    }))
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
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        collegeLevel: newCollegeLevels
      }
    }))
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
    setFormData(prev => ({
      ...prev,
      references: newReferences
    }))
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
          siblings: siblings.map(sibling => ({ name: sibling.name, age: sibling.age }))
        },
        education: {
          ...formData.education,
          collegeLevel: collegeLevels.map(level => ({ yearLevel: level.yearLevel, firstSemesterAverageFinalGrade: level.firstSemesterAverageFinalGrade, secondSemesterAverageFinalGrade: level.secondSemesterAverageFinalGrade }))
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

  const validateOrganizations = () => {
    // Only validate if there are any organizations (other than a single empty one)
    if (
      organizations.length === 1 &&
      organizations[0].nameOfOrganization.trim() === "" &&
      organizations[0].position.trim() === ""
    ) {
      setOrganizationErrors([]);
      return true;
    }
    const errors = organizations.map((org, idx) => {
      if (!org.nameOfOrganization.trim()) {
        return `Organization ${idx + 1}: Name of Organization is required.`;
      }
      return "";
    });
    setOrganizationErrors(errors);
    // If any error exists, return false
    return errors.every((err) => err === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (applicationId) {
        // Update existing application
        await applicationService.updateApplicationById(applicationId, formData);
        toast({ title: "Success", description: "Application updated successfully.", duration: 3000 });
        setShowConfirm(true);
      } else {
        // Create new application
        await applicationService.submitApplication(formData);
        toast({ title: "Success", description: "Application submitted successfully.", duration: 3000 });
      }
    } catch (error) {
      // handle error
      setError('Failed to submit or update application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Call your backend endpoint (authenticated)
      const response = await axios.get(`${API_URL}/application/pdf`, {
        responseType: "blob", // Important for binary data
        withCredentials: true // Send cookies if using authentication
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "application-form.pdf");
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
      'firstName', 'lastName', 'programOfStudyAndYear', 'remainingUnitsIncludingThisTerm', 'remainingTermsToGraduate',
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
    if (isAdminOrStaff) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      return;
    }
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

  // Defensive fallback for education fields
  const safeEducation = formData.education || { elementary: {}, secondary: {}, collegeLevel: [], currentMembershipInOrganizations: [] };
  const safeElementary = safeEducation.elementary || { nameAndAddressOfSchool: '', honorOrAwardsReceived: '', nameOfOrganizationAndPositionHeld: '', generalAverage: 0, rankAmongGraduates: '', contestTrainingsConferencesParticipated: '' };
  const safeSecondary = safeEducation.secondary || { nameAndAddressOfSchool: '', honorOrAwardsReceived: '', nameOfOrganizationAndPositionHeld: '', generalAverage: 0, rankAmongGraduates: '', contestTrainingsConferencesParticipated: '' };
  const safeCollegeLevels = safeEducation.collegeLevel || [];
  const safeOrganizations = safeEducation.currentMembershipInOrganizations || [];

  // Defensive fallback for nested objects to prevent undefined errors
  const safeFamilyBackground = formData.familyBackground || { father: {}, mother: {}, siblings: [] };
  const safeFather = safeFamilyBackground.father || { firstName: '', middleName: '', lastName: '', suffix: '', age: 0, occupation: '', grossAnnualIncome: '', companyName: '', companyAddress: '', homeAddress: '', contactNumber: '' };
  const safeMother = safeFamilyBackground.mother || { firstName: '', middleName: '', lastName: '', suffix: '', age: 0, occupation: '', grossAnnualIncome: '', companyName: '', companyAddress: '', homeAddress: '', contactNumber: '' };
  const safeSiblings = safeFamilyBackground.siblings || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Scholarship Application Form</CardTitle>
          <CardDescription>Complete all sections to submit your application</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-10">
          {/* --- Personal Information Section --- */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-address">Email Address (optional)</Label>
                  <Input
                    id="email-address"
                    value={formData.emailAddress}
                    onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                    placeholder="Enter your email address"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter your first name"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middle-name">Middle Name (optional)</Label>
                  <Input
                    id="middle-name"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    placeholder="Enter your middle name"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter your last name"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix (optional)</Label>
                  <Input
                    id="suffix"
                    value={formData.suffix}
                    onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                    placeholder="e.g., Jr., III"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program-study">Program of Study and Year</Label>
                  <Input
                    id="program-study"
                    value={formData.programOfStudyAndYear}
                    onChange={(e) => setFormData({ ...formData, programOfStudyAndYear: e.target.value })}
                    placeholder="e.g., BSIT 3rd Year"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="existing-scholarship">Existing Scholarship (optional)</Label>
                  <Input
                    id="existing-scholarship"
                    value={formData.existingScholarship}
                    onChange={(e) => setFormData({ ...formData, existingScholarship: e.target.value })}
                    placeholder="Enter existing scholarship"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remaining-units">Remaining Units (Including This Term)</Label>
                  <Input
                    id="remaining-units"
                    type="number"
                    min="0"
                    value={formData.remainingUnitsIncludingThisTerm}
                    onChange={(e) => setFormData({ ...formData, remainingUnitsIncludingThisTerm: Number(e.target.value) })}
                    placeholder="Enter remaining units"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remaining-terms">Remaining Terms to Graduate</Label>
                  <Input
                    id="remaining-terms"
                    type="number"
                    min="0"
                    value={formData.remainingTermsToGraduate}
                    onChange={(e) => setFormData({ ...formData, remainingTermsToGraduate: Number(e.target.value) })}
                    placeholder="Enter remaining terms"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="citizenship">Citizenship</Label>
                  <Input
                    id="citizenship"
                    value={formData.citizenship}
                    onChange={(e) => setFormData({ ...formData, citizenship: e.target.value })}
                    placeholder="Enter your citizenship"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="civil-status">Civil Status</Label>
                  <Select
                    value={formData.civilStatus}
                    onValueChange={(value) => setFormData({ ...formData, civilStatus: value })}
                    disabled={isReadOnly}
                    required
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
                    onValueChange={(value) => setFormData({ ...formData, annualFamilyIncome: value })}
                    disabled={isReadOnly}
                    required
                  >
                    <SelectTrigger id="annual-income">
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<100k">Below ₱100,000</SelectItem>
                      <SelectItem value="100k-200k">₱100,000 - ₱200,000</SelectItem>
                      <SelectItem value="200k-300k">₱200,000 - ₱300,000</SelectItem>
                      <SelectItem value="300k-400k">₱300,000 - ₱400,000</SelectItem>
                      <SelectItem value="400k-500k">₱400,000 - ₱500,000</SelectItem>
                      <SelectItem value=">500k">Above ₱500,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-residence-address">Current Residence Address (optional)</Label>
                  <Input
                    id="current-residence-address"
                    value={formData.currentResidenceAddress}
                    onChange={(e) => setFormData({ ...formData, currentResidenceAddress: e.target.value })}
                    placeholder="Enter your current residence address"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residing-at">Residing At</Label>
                  <Select
                    value={formData.residingAt}
                    onValueChange={(value) => setFormData({ ...formData, residingAt: value })}
                    disabled={isReadOnly}
                    required
                  >
                    <SelectTrigger id="residing-at">
                      <SelectValue placeholder="Select residence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boarding House">Boarding House</SelectItem>
                      <SelectItem value="Parent's House">Parent's House</SelectItem>
                      <SelectItem value="Relative's House">Relative's House</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permanent-address">Permanent Residential Address</Label>
                  <Input
                    id="permanent-address"
                    value={formData.permanentResidentialAddress}
                    onChange={(e) => setFormData({ ...formData, permanentResidentialAddress: e.target.value })}
                    placeholder="Enter permanent address"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-number">Contact Number</Label>
                  <Input
                    id="contact-number"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="Enter your contact number"
                    disabled={isReadOnly}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- Family Background Section --- */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Father's Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="father-first-name">First Name</Label>
                    <Input
                      id="father-first-name"
                      value={safeFather.firstName}
                      onChange={(e) => updateFatherField('firstName', e.target.value)}
                      placeholder="Enter father's first name"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father-last-name">Last Name</Label>
                    <Input
                      id="father-last-name"
                      value={safeFather.lastName}
                      onChange={(e) => updateFatherField('lastName', e.target.value)}
                      placeholder="Enter father's last name"
                      disabled={isReadOnly}
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
                      value={safeFather.age}
                      onChange={(e) => updateFatherField('age', Number(e.target.value))}
                      placeholder="Enter age"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father-occupation">Occupation</Label>
                    <Input
                      id="father-occupation"
                      value={safeFather.occupation}
                      onChange={(e) => updateFatherField('occupation', e.target.value)}
                      placeholder="Enter occupation"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="father-income">Gross Annual Income</Label>
                    <Input
                      id="father-income"
                      value={safeFather.grossAnnualIncome}
                      onChange={(e) => updateFatherField('grossAnnualIncome', e.target.value)}
                      placeholder="Enter annual income"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father-contact">Contact Number</Label>
                    <Input
                      id="father-contact"
                      value={safeFather.contactNumber}
                      onChange={(e) => updateFatherField('contactNumber', e.target.value)}
                      placeholder="Enter contact number"
                      disabled={isReadOnly}
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
                      value={safeMother.firstName}
                      onChange={(e) => updateMotherField('firstName', e.target.value)}
                      placeholder="Enter mother's first name"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother-last-name">Last Name</Label>
                    <Input
                      id="mother-last-name"
                      value={safeMother.lastName}
                      onChange={(e) => updateMotherField('lastName', e.target.value)}
                      placeholder="Enter mother's last name"
                      disabled={isReadOnly}
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
                      value={safeMother.age}
                      onChange={(e) => updateMotherField('age', Number(e.target.value))}
                      placeholder="Enter age"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother-occupation">Occupation</Label>
                    <Input
                      id="mother-occupation"
                      value={safeMother.occupation}
                      onChange={(e) => updateMotherField('occupation', e.target.value)}
                      placeholder="Enter occupation"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mother-income">Gross Annual Income</Label>
                    <Input
                      id="mother-income"
                      value={safeMother.grossAnnualIncome}
                      onChange={(e) => updateMotherField('grossAnnualIncome', e.target.value)}
                      placeholder="Enter annual income"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother-contact">Contact Number</Label>
                    <Input
                      id="mother-contact"
                      value={safeMother.contactNumber}
                      onChange={(e) => updateMotherField('contactNumber', e.target.value)}
                      placeholder="Enter contact number"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Siblings Information</h3>
                {safeSiblings.map((sibling, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Sibling {index + 1}</h4>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSibling(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isReadOnly}
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
                          disabled={isReadOnly}
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
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addSibling} disabled={isReadOnly}>
                  Add Another Sibling
                </Button>
              </div>
            </div>
          )}

          {/* --- Education Section --- */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-6">
                <h3 className="font-medium">Elementary Education</h3>
                <div className="space-y-2">
                  <Label htmlFor="elementary-school">Name and Address of School</Label>
                  <Input
                    id="elementary-school"
                    value={safeElementary.nameAndAddressOfSchool}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          elementary: {
                            ...formData.education.elementary,
                            nameAndAddressOfSchool: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Enter school name and address"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elementary-honors">Honors/Awards Received (optional)</Label>
                  <Input
                    id="elementary-honors"
                    value={safeElementary.honorOrAwardsReceived || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          elementary: {
                            ...formData.education.elementary,
                            honorOrAwardsReceived: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="e.g., With Honors, Best in Math"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elementary-org">Name of Organization and Position Held (optional)</Label>
                  <Input
                    id="elementary-org"
                    value={safeElementary.nameOfOrganizationAndPositionHeld || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          elementary: {
                            ...formData.education.elementary,
                            nameOfOrganizationAndPositionHeld: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="e.g., Science Club President"
                    disabled={isReadOnly}
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
                    value={safeElementary.generalAverage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          elementary: {
                            ...formData.education.elementary,
                            generalAverage: Number(e.target.value),
                          },
                        },
                      })
                    }
                    placeholder="Enter average"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elementary-rank">Rank Among Graduates (optional)</Label>
                  <Input
                    id="elementary-rank"
                    value={safeElementary.rankAmongGraduates || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          elementary: {
                            ...formData.education.elementary,
                            rankAmongGraduates: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="e.g., Top 5"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elementary-contest">Contest/Trainings/Conferences Participated (optional)</Label>
                  <Input
                    id="elementary-contest"
                    value={safeElementary.contestTrainingsConferencesParticipated || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          elementary: {
                            ...formData.education.elementary,
                            contestTrainingsConferencesParticipated: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="e.g., Math Olympiad"
                    disabled={isReadOnly}
                  />
                </div>

                <h3 className="font-medium">Secondary Education</h3>
                <div className="space-y-2">
                  <Label htmlFor="secondary-school">Name and Address of School</Label>
                  <Input
                    id="secondary-school"
                    value={safeSecondary.nameAndAddressOfSchool}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          secondary: {
                            ...formData.education.secondary,
                            nameAndAddressOfSchool: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Enter school name and address"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-honors">Honors/Awards Received (optional)</Label>
                  <Input
                    id="secondary-honors"
                    value={safeSecondary.honorOrAwardsReceived || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          secondary: {
                            ...formData.education.secondary,
                            honorOrAwardsReceived: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="e.g., With High Honors"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-org">Name of Organization and Position Held (optional)</Label>
                  <Input
                    id="secondary-org"
                    value={safeSecondary.nameOfOrganizationAndPositionHeld || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          secondary: {
                            ...formData.education.secondary,
                            nameOfOrganizationAndPositionHeld: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="e.g., Student Council"
                    disabled={isReadOnly}
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
                    value={safeSecondary.generalAverage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          secondary: {
                            ...formData.education.secondary,
                            generalAverage: Number(e.target.value),
                          },
                        },
                      })
                    }
                    placeholder="Enter average"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-rank">Rank Among Graduates (optional)</Label>
                  <Input
                    id="secondary-rank"
                    value={safeSecondary.rankAmongGraduates || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          secondary: {
                            ...formData.education.secondary,
                            rankAmongGraduates: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="e.g., Top 10"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-contest">Contest/Trainings/Conferences Participated (optional)</Label>
                  <Input
                    id="secondary-contest"
                    value={safeSecondary.contestTrainingsConferencesParticipated || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          secondary: {
                            ...formData.education.secondary,
                            contestTrainingsConferencesParticipated: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="e.g., Debate Competition"
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">College Education</h3>
                {safeCollegeLevels.map((level, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Year {index + 1}</h4>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCollegeLevel(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isReadOnly}
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
                          disabled={isReadOnly}
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
                          disabled={isReadOnly}
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
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addCollegeLevel} disabled={isReadOnly}>
                  Add Another Year
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Current Membership in Organizations</h3>
                {safeOrganizations.map((org, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Organization {index + 1}</h4>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOrganization(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isReadOnly}
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
                          value={org.nameOfOrganization}
                          onChange={(e) => updateOrganization(index, "nameOfOrganization", e.target.value)}
                          placeholder="Enter organization name"
                          disabled={isReadOnly}
                        />
                        {organizationErrors[index] && organizationErrors[index] !== "" && (
                          <p className="text-red-500 text-xs mt-1">{organizationErrors[index]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`org-position-${index}`}>Position</Label>
                        <Input
                          id={`org-position-${index}`}
                          value={org.position}
                          onChange={(e) => updateOrganization(index, "position", e.target.value)}
                          placeholder="Enter your position"
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addOrganization} disabled={isReadOnly}>
                  Add Another Organization
                </Button>
              </div>
            </div>
          )}

          {/* --- References Section --- */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="font-medium">References</h3>
              {references.map((ref, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Reference {index + 1}</h4>
                    {!isReadOnly && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeReference(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`reference-name-${index}`}>Name</Label>
                      <Input
                        id={`reference-name-${index}`}
                        value={ref.name}
                        onChange={e => updateReference(index, 'name', e.target.value)}
                        placeholder="Enter reference's name"
                        disabled={isReadOnly}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`reference-relationship-${index}`}>Relationship to Applicant</Label>
                      <Input
                        id={`reference-relationship-${index}`}
                        value={ref.relationshipToTheApplicant}
                        onChange={e => updateReference(index, 'relationshipToTheApplicant', e.target.value)}
                        placeholder="Enter relationship"
                        disabled={isReadOnly}
                        required
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor={`reference-contact-${index}`}>Contact Number</Label>
                      <Input
                        id={`reference-contact-${index}`}
                        value={ref.contactNumber}
                        onChange={e => updateReference(index, 'contactNumber', e.target.value)}
                        placeholder="Enter contact number"
                        disabled={isReadOnly}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addReference}
                  className="mt-2"
                >
                  Add Reference
                </Button>
              )}
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
          </div>
          <div className="flex gap-2">
            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <>
                {isReadOnly ? (
                  <>
                    <Button disabled className="bg-[#800000]">
                      Application Submitted
                    </Button>
                    <Button onClick={handleExportPDF} variant="outline" className="ml-2">
                      Export to PDF
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-[#800000] hover:bg-[#600000]"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardFooter>
      </Card>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Application updated successfully.</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => {
                setShowConfirm(false);
                if (onUpdateSuccess) onUpdateSuccess();
              }}
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// services/applicationService.ts
async function getMyApplication() {
  const response = await axios.get(`${API_URL}/application`, { withCredentials: true });
  return response.data;
}

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

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
  gender: '',
  // New fields for eligibility validation
  shsgraduateCIT: false, // Backend field name
  isCitUSeniorHighGraduate: false,
  yearLevel: '',
  citUResidency: {
    semesterCount: 0,
    weightedAverageGrade: 0,
    hasFailingMarks: false,
    minimumUnitsCompleted: 0
  },
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
  const [siblings, setSiblings] = useState<Array<{ name: string; age: number; programCurrentlyTakingOrFinished?: string; schoolOrOccupation?: string }>>([])  // Start with empty array - siblings are optional
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
  const [hasExistingApplication, setHasExistingApplication] = useState(false);

  const totalSteps = 4

  // Validation functions
  const validateNameField = (value: string): boolean => {
    // Only allow letters, spaces, hyphens, and apostrophes
    const namePattern = /^[a-zA-Z\s'-]*$/;
    return namePattern.test(value);
  };

  const sanitizeNameInput = (value: string): string => {
    // Remove any characters that aren't letters, spaces, hyphens, or apostrophes
    return value.replace(/[^a-zA-Z\s'-]/g, '');
  };

  const validateAddressField = (value: string): boolean => {
    // Allow letters, numbers, spaces, and common address punctuation
    const addressPattern = /^[a-zA-Z0-9\s,.\-#/()]*$/;
    return addressPattern.test(value);
  };

  const sanitizeAddressInput = (value: string): string => {
    // Remove special characters except common address punctuation
    return value.replace(/[^a-zA-Z0-9\s,.\-#/()]/g, '');
  };

  const handleNameChange = (field: string, value: string) => {
    const sanitized = sanitizeNameInput(value);
    setFormData({ ...formData, [field]: sanitized });
  };

  const handleAddressChange = (field: string, value: string) => {
    const sanitized = sanitizeAddressInput(value);
    setFormData({ ...formData, [field]: sanitized });
  };

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
        setHasExistingApplication(true);
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
              : [{ nameOfOrganization: "", position: "" }], // Always show at least one
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
        setHasExistingApplication(false);
        setFormData(defaultFormData);
        setSiblings([{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }]);
        setCollegeLevels([{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }]);
        setOrganizations([{ nameOfOrganization: "", position: "" }]);
        setReferences([{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]);
        setIsReadOnly(false);
      }
    } catch (error: any) {
      console.error('Error loading application:', error);
      // If 404 or no application found, user hasn't submitted yet
      if (error?.response?.status === 404 || error?.message?.includes('not found')) {
        setHasExistingApplication(false);
        setIsReadOnly(false);
      }
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
    console.log("addOrganization clicked!")
    
    const newOrganization = {
      nameOfOrganization: '',
      position: ''
    }
    
    // Update the organizations state
    setOrganizations([...organizations, newOrganization])
    
    // Update the formData
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        currentMembershipInOrganizations: [...organizations, newOrganization]
      }
    }))
  };

  const removeOrganization = (index: number) => {
    const newOrganizations = organizations.filter((_, i) => i !== index)
    setOrganizations(newOrganizations)
    
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        currentMembershipInOrganizations: newOrganizations
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
    const newLevels = collegeLevels
      .filter((_, i) => i !== index)
      .map((level, i) => ({ ...level, yearLevel: i + 1 })); // Re-index yearLevels
    setCollegeLevels(newLevels);
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        collegeLevel: newLevels
      }
    }));
  };

  const updateCollegeLevel = (index: number, field: "firstSemesterAverageFinalGrade" | "secondSemesterAverageFinalGrade" | "thirdSemesterAverageFinalGrade", value: number) => {
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
        shsgraduateCIT: formData.isCitUSeniorHighGraduate, // Map to backend field name
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
      // Map frontend field to backend field
      const submissionData = {
        ...formData,
        shsgraduateCIT: formData.isCitUSeniorHighGraduate, // Map to backend field name
        familyBackground: {
          ...formData.familyBackground,
          siblings: siblings
        },
        education: {
          ...formData.education,
          collegeLevel: collegeLevels,
          currentMembershipInOrganizations: organizations
        },
        references: references
      };

      if (applicationId) {
        // Update existing application
        await applicationService.updateApplicationById(applicationId, submissionData);
        toast({ title: "Success", description: "Application updated successfully.", duration: 3000 });
        setShowConfirm(true);
      } else {
        // Create new application
        await applicationService.submitApplication(submissionData);
        setHasExistingApplication(true); // Now user has an application
        toast({ title: "Success", description: "Application submitted successfully.", duration: 3000 });
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive"
      });
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
      'permanentResidentialAddress', 'contactNumber', 'yearLevel'
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

    // Eligibility validation based on SRS requirements
    
    // 1. Year Level Requirement: Must be First Year or Second Year
    if (formData.yearLevel !== 'First Year' && formData.yearLevel !== 'Second Year') {
      toast({
        title: "Eligibility Error",
        description: "Only First Year and Second Year students are eligible for this scholarship.",
        variant: "destructive"
      });
      return false;
    }

    // 2. Family Income Requirement: Must not exceed ₱300,000
    if (formData.annualFamilyIncome === '>300k') {
      toast({
        title: "Eligibility Error",
        description: "Gross Annual Family Income must not exceed ₱300,000 to be eligible.",
        variant: "destructive"
      });
      return false;
    }

    // 3. Program Restriction: Must not be enrolled in BS Nursing
    if (formData.programOfStudyAndYear.toLowerCase().includes('nursing') || 
        formData.programOfStudyAndYear.toLowerCase().includes('bsn')) {
      toast({
        title: "Eligibility Error",
        description: "Students enrolled in BS Nursing are not eligible for this scholarship.",
        variant: "destructive"
      });
      return false;
    }

    // Note: CIT-U residency requirements are now validated in Step 3 (Education section)

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

    // Siblings are now optional - only validate if they exist
    // Validate each sibling's required fields (if any siblings are added)
    // for (const [index, sibling] of siblings.entries()) {
    //   if (!sibling.name || !sibling.age) {
    //     toast({
    //       title: "Required Field Missing",
    //       description: `Please fill in all required fields for sibling ${index + 1}`,
    //       variant: "destructive"
    //     });
    //     return false;
    //   }
    // }

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

    // Validate elementary education grade range (75-100)
    if (formData.education.elementary.generalAverage < 75 || formData.education.elementary.generalAverage > 100) {
      toast({
        title: "Invalid Grade",
        description: "Elementary education grade must be between 75-100.",
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

    // Validate secondary education grade range (75-100)
    if (formData.education.secondary.generalAverage < 75 || formData.education.secondary.generalAverage > 100) {
      toast({
        title: "Invalid Grade",
        description: "Secondary education grade must be between 75-100.",
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
      if (!level.yearLevel || !level.firstSemesterAverageFinalGrade) {
        toast({
          title: "Required Field Missing",
          description: `Please fill in all required fields for year ${index + 1}`,
          variant: "destructive"
        });
        return false;
      }
    }

    // Grade validation for CIT-U Senior High graduates
    if (formData.isCitUSeniorHighGraduate) {
      // Must have grade average >= 80% in secondary education
      if (formData.education.secondary.generalAverage < 80) {
        toast({
          title: "Eligibility Error",
          description: "CIT-U Senior High graduates must have a grade average of at least 80%.",
          variant: "destructive"
        });
        return false;
      }
    }

    // Residency Requirements for Non-CIT-U Senior High Graduates
    if (!formData.isCitUSeniorHighGraduate) {
      // Must have at least 1 semester residency
      if (!formData.citUResidency?.semesterCount || formData.citUResidency.semesterCount < 1) {
        toast({
          title: "Eligibility Error",
          description: "Non-CIT-U Senior High graduates must have at least 1 semester residency at CIT-U.",
          variant: "destructive"
        });
        return false;
      }

      // Weighted Average Grade must be >= 3.5
      if (!formData.citUResidency?.weightedAverageGrade || formData.citUResidency.weightedAverageGrade < 3.5) {
        toast({
          title: "Eligibility Error",
          description: "Non-CIT-U Senior High graduates must have a Weighted Average Grade of at least 3.5.",
          variant: "destructive"
        });
        return false;
      }

      // Must have no failing marks
      if (formData.citUResidency?.hasFailingMarks) {
        toast({
          title: "Eligibility Error",
          description: "Non-CIT-U Senior High graduates must have no failing marks.",
          variant: "destructive"
        });
        return false;
      }

      // Must have minimum load of 15 units (regular) or 6 units (summer)
      if (!formData.citUResidency?.minimumUnitsCompleted || formData.citUResidency.minimumUnitsCompleted < 6) {
        toast({
          title: "Eligibility Error",
          description: "Non-CIT-U Senior High graduates must have completed minimum load of 15 units (regular semester) or 6 units (summer).",
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
  const safeOrganizations = safeEducation.currentMembershipInOrganizations || [
    { nameOfOrganization: '', position: '' }
  ];

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
                    onChange={(e) => handleNameChange('firstName', e.target.value)}
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
                    onChange={(e) => handleNameChange('middleName', e.target.value)}
                    placeholder="Enter your middle name"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={formData.lastName}
                    onChange={(e) => handleNameChange('lastName', e.target.value)}
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
                    onChange={(e) => handleNameChange('suffix', e.target.value)}
                    placeholder="Sr."
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program-study">Program of Study and Year</Label>
                  <Input
                    id="program-study"
                    value={formData.programOfStudyAndYear}
                    onChange={(e) => setFormData({ ...formData, programOfStudyAndYear: e.target.value })}
                    placeholder="e.g., BSIT, BSCS, BSBA"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                
                {/* New Eligibility Fields */}
                <div className="space-y-2">
                  <Label htmlFor="year-level">Year Level</Label>
                  <Select
                    value={formData.yearLevel}
                    onValueChange={(value) => setFormData({ ...formData, yearLevel: value })}
                    disabled={isReadOnly}
                    required
                  >
                    <SelectTrigger id="year-level">
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Year">First Year</SelectItem>
                      <SelectItem value="Second Year">Second Year</SelectItem>
                      <SelectItem value="Third Year">Third Year (Not Eligible)</SelectItem>
                      <SelectItem value="Fourth Year">Fourth Year (Not Eligible)</SelectItem>
                      <SelectItem value="Fifth Year">Fifth Year (Not Eligible)</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value=">300k">Above ₱300,000 (Not Eligible)</SelectItem>
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
                <h3 className="font-medium">Siblings Information (Optional)</h3>
                {safeSiblings.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <p className="text-gray-500 mb-3">No siblings added. This section is optional.</p>
                    <Button variant="outline" onClick={addSibling} disabled={isReadOnly}>
                      Add Sibling
                    </Button>
                  </div>
                ) : (
                  <>
                    {safeSiblings.map((sibling, index) => (
                      <div key={index} className="space-y-4 p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium">Sibling {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSibling(index)}
                            className="text-red-500 hover:text-red-700"
                            disabled={isReadOnly}
                          >
                            Remove
                          </Button>
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
                  </>
                )}
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
                    min="75"
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
                    placeholder="Enter average (75-100)"
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
                    min="75"
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
                    placeholder="Enter average (75-100)"
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

                {/* CIT-U Senior High Graduate Question */}
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label className="text-blue-800 font-medium">Are you a CIT-U Senior High Graduate?</Label>
                  <RadioGroup
                    value={formData.isCitUSeniorHighGraduate ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, isCitUSeniorHighGraduate: value === "yes" })}
                    disabled={isReadOnly}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="citu-grad-yes-education" />
                      <Label htmlFor="citu-grad-yes-education">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="citu-grad-no-education" />
                      <Label htmlFor="citu-grad-no-education">No</Label>
                    </div>
                  </RadioGroup>
                  
                  {formData.isCitUSeniorHighGraduate && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        <strong>Grade Requirement:</strong> As a CIT-U Senior High graduate, your general average must be ≥ 80% (shown above in Secondary Education).
                      </p>
                      {formData.education.secondary.generalAverage > 0 && formData.education.secondary.generalAverage < 80 && (
                        <p className="text-sm text-red-600 mt-2">
                          ⚠️ Your current secondary education average ({formData.education.secondary.generalAverage}%) is below the required 80% for CIT-U Senior High graduates.
                        </p>
                      )}
                      {formData.education.secondary.generalAverage >= 80 && (
                        <p className="text-sm text-green-600 mt-2">
                          ✅ Your secondary education average ({formData.education.secondary.generalAverage}%) meets the requirement.
                        </p>
                      )}
                    </div>
                  )}

                  {/* CIT-U Residency Requirements for Non-CIT-U graduates */}
                  {!formData.isCitUSeniorHighGraduate && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-4">
                      <h4 className="font-semibold text-orange-800">CIT-U Residency Requirements (Non-CIT-U Senior High Graduates)</h4>
                      <p className="text-sm text-orange-700">
                        Since you are not a CIT-U Senior High graduate, you must meet the following residency requirements:
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="semester-count-education">Semesters Completed at CIT-U</Label>
                          <Input
                            id="semester-count-education"
                            type="number"
                            min="0"
                            value={formData.citUResidency?.semesterCount || 0}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              citUResidency: { 
                                ...formData.citUResidency, 
                                semesterCount: Number(e.target.value) 
                              } 
                            })}
                            placeholder="Enter number of semesters"
                            disabled={isReadOnly}
                            required={!formData.isCitUSeniorHighGraduate}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="weighted-average-education">Weighted Average Grade (Must be ≥ 3.5)</Label>
                          <Input
                            id="weighted-average-education"
                            type="number"
                            min="1.0"
                            max="4.0"
                            step="0.01"
                            value={formData.citUResidency?.weightedAverageGrade || 0}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              citUResidency: { 
                                ...formData.citUResidency, 
                                weightedAverageGrade: Number(e.target.value) 
                              } 
                            })}
                            placeholder="e.g., 3.75"
                            disabled={isReadOnly}
                            required={!formData.isCitUSeniorHighGraduate}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Do you have any failing marks?</Label>
                          <RadioGroup
                            value={formData.citUResidency?.hasFailingMarks ? "yes" : "no"}
                            onValueChange={(value) => setFormData({ 
                              ...formData, 
                              citUResidency: { 
                                ...formData.citUResidency, 
                                hasFailingMarks: value === "yes" 
                              } 
                            })}
                            disabled={isReadOnly}
                            className="flex flex-row space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="failing-yes-education" />
                              <Label htmlFor="failing-yes-education">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="failing-no-education" />
                              <Label htmlFor="failing-no-education">No</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="minimum-units-education">Minimum Units Completed (15 regular/6 summer)</Label>
                          <Input
                            id="minimum-units-education"
                            type="number"
                            min="0"
                            value={formData.citUResidency?.minimumUnitsCompleted || 0}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              citUResidency: { 
                                ...formData.citUResidency, 
                                minimumUnitsCompleted: Number(e.target.value) 
                              } 
                            })}
                            placeholder="Enter minimum units"
                            disabled={isReadOnly}
                            required={!formData.isCitUSeniorHighGraduate}
                          />
                        </div>
                      </div>

                      {/* Real-time validation feedback */}
                      <div className="mt-4 p-3 bg-white border border-orange-200 rounded">
                        <p className="text-sm font-medium text-orange-800 mb-2">Requirements Check:</p>
                        <div className="space-y-1 text-sm">
                          <div className={`flex items-center ${(formData.citUResidency?.semesterCount || 0) >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                            {(formData.citUResidency?.semesterCount || 0) >= 1 ? '✅' : '❌'} At least 1 semester completed
                          </div>
                          <div className={`flex items-center ${(formData.citUResidency?.weightedAverageGrade || 0) >= 3.5 ? 'text-green-600' : 'text-red-600'}`}>
                            {(formData.citUResidency?.weightedAverageGrade || 0) >= 3.5 ? '✅' : '❌'} Weighted Average Grade ≥ 3.5
                          </div>
                          <div className={`flex items-center ${!formData.citUResidency?.hasFailingMarks ? 'text-green-600' : 'text-red-600'}`}>
                            {!formData.citUResidency?.hasFailingMarks ? '✅' : '❌'} No failing marks
                          </div>
                          <div className={`flex items-center ${(formData.citUResidency?.minimumUnitsCompleted || 0) >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                            {(formData.citUResidency?.minimumUnitsCompleted || 0) >= 6 ? '✅' : '❌'} Minimum units completed (6+ units)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                        <Label htmlFor={`second-sem-grade-${index}`}>
                          Second Semester Average Final Grade <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                        </Label>
                        <Input
                          id={`second-sem-grade-${index}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={level.secondSemesterAverageFinalGrade}
                          onChange={(e) => updateCollegeLevel(index, "secondSemesterAverageFinalGrade", Number(e.target.value))}
                          placeholder="Enter grade (optional)"
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
                type="button"
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
            {hasExistingApplication && (
              <Button
                variant="outline"
                onClick={handleExportPDF}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            )}
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

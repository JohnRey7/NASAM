"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { applicationService, ApplicationFormData } from "@/services/applicationService"
import { useAuth } from "@/contexts/auth-context"

// Default form data structure matching ApplicationFormData type
const defaultFormData: ApplicationFormData = {
  user: undefined,
  emailAddress: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  birthDate: '',
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
  shsgraduateCIT: false,
  isCitUSeniorHighGraduate: false,
  yearLevel: '',
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
    siblings: [{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }]
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
    collegeLevel: [{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }],
    currentMembershipInOrganizations: [{ nameOfOrganization: "", position: "" }]
  },
  references: [{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]
}

interface Sibling {
  name: string;
  age: number;
  programCurrentlyTakingOrFinished: string;
  schoolOrOccupation: string;
}

interface CollegeLevel {
  yearLevel: number;
  firstSemesterAverageFinalGrade: number;
  secondSemesterAverageFinalGrade: number;
  thirdSemesterAverageFinalGrade: number;
}

interface Organization {
  nameOfOrganization: string;
  position: string;
}

interface Reference {
  name: string;
  relationshipToTheApplicant: string;
  contactNumber: string;
}

interface ApplicationFormContextType {
  formData: ApplicationFormData;
  setFormData: React.Dispatch<React.SetStateAction<ApplicationFormData>>;
  siblings: Sibling[];
  setSiblings: React.Dispatch<React.SetStateAction<Sibling[]>>;
  collegeLevels: CollegeLevel[];
  setCollegeLevels: React.Dispatch<React.SetStateAction<CollegeLevel[]>>;
  organizations: Organization[];
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
  references: Reference[];
  setReferences: React.Dispatch<React.SetStateAction<Reference[]>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  isReadOnly: boolean;
  setIsReadOnly: React.Dispatch<React.SetStateAction<boolean>>;
  hasExistingApplication: boolean;
  setHasExistingApplication: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  draftLoaded: boolean;
  saveDraftToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  resetForm: () => void;
}

const ApplicationFormContext = createContext<ApplicationFormContextType | null>(null)

export function ApplicationFormProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  
  // Form state
  const [formData, setFormData] = useState<ApplicationFormData>(defaultFormData)
  const [siblings, setSiblings] = useState<Sibling[]>([{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }])
  const [collegeLevels, setCollegeLevels] = useState<CollegeLevel[]>([{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }])
  const [organizations, setOrganizations] = useState<Organization[]>([{ nameOfOrganization: "", position: "" }])
  const [references, setReferences] = useState<Reference[]>([{ name: "", relationshipToTheApplicant: "", contactNumber: "" }])
  const [currentStep, setCurrentStep] = useState(1)
  
  // Status state
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [hasExistingApplication, setHasExistingApplication] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Load form data from server (existing application or draft)
  const loadFromServer = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First try to get existing submitted application
      const response = await applicationService.getMyApplication();
      
      if (response?.application) {
        const app = response.application;
        console.log('📋 Loaded existing application from server');
        
        // Populate form with existing application data
        setFormData({
          ...defaultFormData,
          ...app,
          emailAddress: app.emailAddress || user.email || '',
          programOfStudyAndYear: app.programOfStudyAndYear || user.course || '',
        });
        
        // Set array states
        if (app.familyBackground?.siblings?.length > 0) {
          setSiblings(app.familyBackground.siblings);
        }
        if (app.education?.collegeLevel?.length > 0) {
          setCollegeLevels(app.education.collegeLevel);
        }
        if (app.education?.currentMembershipInOrganizations?.length > 0) {
          setOrganizations(app.education.currentMembershipInOrganizations);
        }
        if (app.references?.length > 0) {
          setReferences(app.references);
        }
        
        setHasExistingApplication(true);
        setIsReadOnly(true);
        setDraftLoaded(true);
      } else {
        // No submitted application - try to load a draft
        await loadDraft();
      }
    } catch (error: any) {
      console.error('Error loading application:', error);
      // If 404 or no application found, try loading draft
      if (error?.response?.status === 404 || error?.message?.includes('not found')) {
        setHasExistingApplication(false);
        setIsReadOnly(false);
        await loadDraft();
      }
    } finally {
      setIsLoading(false);
      setInitialized(true);
    }
  }, [user]);

  // Load draft from server
  const loadDraft = async () => {
    try {
      const draftResponse = await applicationService.getDraft();
      if (draftResponse?.draft) {
        const draftData = draftResponse.draft;
        console.log('📖 Loaded draft from server:', draftData);
        
        // Restore form data from draft
        setFormData(prev => ({
          ...defaultFormData,
          ...draftData,
          emailAddress: draftData.emailAddress || prev.emailAddress || '',
          programOfStudyAndYear: draftData.programOfStudyAndYear || prev.programOfStudyAndYear || '',
          familyBackground: {
            ...defaultFormData.familyBackground,
            ...draftData.familyBackground,
            father: {
              ...defaultFormData.familyBackground.father,
              ...draftData.familyBackground?.father
            },
            mother: {
              ...defaultFormData.familyBackground.mother,
              ...draftData.familyBackground?.mother
            },
            siblings: draftData.familyBackground?.siblings?.length > 0
              ? draftData.familyBackground.siblings
              : [{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }]
          },
          education: {
            ...defaultFormData.education,
            ...draftData.education,
            elementary: {
              ...defaultFormData.education.elementary,
              ...draftData.education?.elementary
            },
            secondary: {
              ...defaultFormData.education.secondary,
              ...draftData.education?.secondary
            },
            collegeLevel: draftData.education?.collegeLevel?.length > 0
              ? draftData.education.collegeLevel
              : [{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }],
            currentMembershipInOrganizations: draftData.education?.currentMembershipInOrganizations?.length > 0
              ? draftData.education.currentMembershipInOrganizations
              : [{ nameOfOrganization: "", position: "" }],
          },
          references: draftData.references?.length > 0
            ? draftData.references
            : [{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]
        }));
        
        // Restore local state arrays
        setSiblings(draftData.familyBackground?.siblings?.length > 0
          ? draftData.familyBackground.siblings
          : [{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }]);
        setCollegeLevels(draftData.education?.collegeLevel?.length > 0
          ? draftData.education.collegeLevel
          : [{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }]);
        setOrganizations(draftData.education?.currentMembershipInOrganizations?.length > 0
          ? draftData.education.currentMembershipInOrganizations
          : [{ nameOfOrganization: "", position: "" }]);
        setReferences(draftData.references?.length > 0
          ? draftData.references
          : [{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]);
        
        // Restore current step
        if (draftData.currentStep) {
          setCurrentStep(draftData.currentStep);
        }
        
        setIsReadOnly(false);
        setDraftLoaded(true);
      } else {
        // No draft found - initialize with user data
        const courseStr: string = typeof user?.course === 'object' && user?.course 
          ? `${user.course.name} (${user.course.courseId})` 
          : (typeof user?.course === 'string' ? user.course : '');
        setFormData({
          ...defaultFormData,
          emailAddress: user?.email || '',
          programOfStudyAndYear: courseStr
        });
        setIsReadOnly(false);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      // If draft fails to load, just start with user data
      const courseStr: string = typeof user?.course === 'object' && user?.course 
        ? `${user.course.name} (${user.course.courseId})` 
        : (typeof user?.course === 'string' ? user.course : '');
      setFormData({
        ...defaultFormData,
        emailAddress: user?.email || '',
        programOfStudyAndYear: courseStr
      });
      setIsReadOnly(false);
    }
  };

  // Save draft to server
  const saveDraftToServer = useCallback(async () => {
    if (isReadOnly || hasExistingApplication) return;
    
    try {
      const draftData = {
        ...formData,
        currentStep,
        familyBackground: {
          ...formData.familyBackground,
          siblings
        },
        education: {
          ...formData.education,
          collegeLevel: collegeLevels,
          currentMembershipInOrganizations: organizations
        },
        references
      };
      
      await applicationService.saveDraft(draftData);
      console.log('💾 Draft saved to server');
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [formData, currentStep, siblings, collegeLevels, organizations, references, isReadOnly, hasExistingApplication]);

  // Reset form to defaults
  const resetForm = useCallback(() => {
    const courseStr: string = typeof user?.course === 'object' && user?.course 
      ? `${user.course.name} (${user.course.courseId})` 
      : (typeof user?.course === 'string' ? user.course : '');
    setFormData({
      ...defaultFormData,
      emailAddress: user?.email || '',
      programOfStudyAndYear: courseStr
    });
    setSiblings([{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }]);
    setCollegeLevels([{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }]);
    setOrganizations([{ nameOfOrganization: "", position: "" }]);
    setReferences([{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]);
    setCurrentStep(1);
    setIsReadOnly(false);
    setHasExistingApplication(false);
    setDraftLoaded(false);
  }, [user]);

  // Initial load from server when user is available
  useEffect(() => {
    if (user && !initialized) {
      loadFromServer();
    }
  }, [user, initialized, loadFromServer]);

  // Auto-save draft when form changes (debounced)
  useEffect(() => {
    if (!initialized || isReadOnly || hasExistingApplication || isLoading) return;
    
    const timeoutId = setTimeout(() => {
      saveDraftToServer();
    }, 2000); // Save after 2 seconds of inactivity
    
    return () => clearTimeout(timeoutId);
  }, [formData, siblings, collegeLevels, organizations, references, currentStep, initialized, isReadOnly, hasExistingApplication, isLoading, saveDraftToServer]);

  return (
    <ApplicationFormContext.Provider value={{
      formData,
      setFormData,
      siblings,
      setSiblings,
      collegeLevels,
      setCollegeLevels,
      organizations,
      setOrganizations,
      references,
      setReferences,
      currentStep,
      setCurrentStep,
      isReadOnly,
      setIsReadOnly,
      hasExistingApplication,
      setHasExistingApplication,
      isLoading,
      draftLoaded,
      saveDraftToServer,
      loadFromServer,
      resetForm
    }}>
      {children}
    </ApplicationFormContext.Provider>
  )
}

export function useApplicationForm() {
  const context = useContext(ApplicationFormContext)
  if (!context) {
    throw new Error('useApplicationForm must be used within an ApplicationFormProvider')
  }
  return context
}

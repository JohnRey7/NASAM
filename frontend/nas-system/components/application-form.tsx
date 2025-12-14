"use client"

import { useState, useEffect, useContext } from "react"
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
import { useApplicationForm } from "@/contexts/application-form-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

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

// Comprehensive list of world nationalities
const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguan", "Argentine",
  "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi",
  "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian",
  "Bosnian", "Botswanan", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe",
  "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean",
  "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comoran", "Congolese",
  "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican",
  "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean",
  "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese",
  "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinean",
  "Guinea-Bissauan", "Guyanese", "Haitian", "Honduran", "Hungarian", "Icelandic", "Indian",
  "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican",
  "Japanese", "Jordanian", "Kazakhstani", "Kenyan", "Kiribati", "Korean (North)", "Korean (South)",
  "Kosovar", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Lesothan", "Liberian",
  "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian",
  "Malaysian", "Maldivian", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian",
  "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Montenegrin", "Moroccan",
  "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian",
  "Nigerien", "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian",
  "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian",
  "Russian", "Rwandan", "Saint Kitts and Nevis", "Saint Lucian", "Salvadoran", "Samoan",
  "San Marinese", "Sao Tomean", "Saudi", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean",
  "Singaporean", "Slovak", "Slovenian", "Solomon Islander", "Somali", "South African",
  "South Sudanese", "Spanish", "Sri Lankan", "Sudanese", "Surinamese", "Swazi", "Swedish",
  "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan",
  "Trinidadian", "Tunisian", "Turkish", "Turkmen", "Tuvaluan", "Ugandan", "Ukrainian",
  "Uruguayan", "Uzbek", "Vanuatuan", "Vatican", "Venezuelan", "Vietnamese", "Yemeni",
  "Zambian", "Zimbabwean"
];

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
  // Try to use context for form persistence (when used in dashboard)
  let formContext: ReturnType<typeof useApplicationForm> | null = null;
  try {
    formContext = useApplicationForm();
  } catch {
    // Context not available - will use local state
  }

  // Use context state if available, otherwise use local state
  const [localCurrentStep, setLocalCurrentStep] = useState(1);
  const [localFormData, setLocalFormData] = useState<ApplicationFormData>(defaultFormData);
  const [localSiblings, setLocalSiblings] = useState<Array<{ name: string; age: number; programCurrentlyTakingOrFinished: string; schoolOrOccupation: string }>>([]);
  const [localOrganizations, setLocalOrganizations] = useState([{ nameOfOrganization: "", position: "" }]);
  const [localCollegeLevels, setLocalCollegeLevels] = useState([{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }]);
  const [localReferences, setLocalReferences] = useState([{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]);
  const [localIsReadOnly, setLocalIsReadOnly] = useState(false);
  const [localHasExistingApplication, setLocalHasExistingApplication] = useState(false);
  const [localDraftLoaded, setLocalDraftLoaded] = useState(false);
  const [localIsInitialLoad, setLocalIsInitialLoad] = useState(true);

  // Choose between context and local state
  const currentStep = formContext?.currentStep ?? localCurrentStep;
  const setCurrentStep = formContext?.setCurrentStep ?? setLocalCurrentStep;
  const formData = formContext?.formData ?? localFormData;
  const setFormData = formContext?.setFormData ?? setLocalFormData;
  const siblings = formContext?.siblings ?? localSiblings;
  const setSiblings = formContext?.setSiblings ?? setLocalSiblings;
  const organizations = formContext?.organizations ?? localOrganizations;
  const setOrganizations = formContext?.setOrganizations ?? setLocalOrganizations;
  const collegeLevels = formContext?.collegeLevels ?? localCollegeLevels;
  const setCollegeLevels = formContext?.setCollegeLevels ?? setLocalCollegeLevels;
  const references = formContext?.references ?? localReferences;
  const setReferences = formContext?.setReferences ?? setLocalReferences;
  const isReadOnly = readOnly ?? formContext?.isReadOnly ?? localIsReadOnly;
  const setIsReadOnly = formContext?.setIsReadOnly ?? setLocalIsReadOnly;
  const hasExistingApplication = formContext?.hasExistingApplication ?? localHasExistingApplication;
  const setHasExistingApplication = formContext?.setHasExistingApplication ?? setLocalHasExistingApplication;
  const draftLoaded = formContext?.draftLoaded ?? localDraftLoaded;
  const setDraftLoaded = setLocalDraftLoaded; // Local only - context manages internally
  const isLoading = formContext?.isLoading ?? false;
  const isInitialLoad = localIsInitialLoad; // Local only - for non-context mode
  const setIsInitialLoad = setLocalIsInitialLoad;
  const saveDraftToServerFromContext = formContext?.saveDraftToServer;

  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState("")
  const [position, setPosition] = useState("")
  const [organizationErrors, setOrganizationErrors] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "oas_staff";
  const [showConfirm, setShowConfirm] = useState(false);
  const [courses, setCourses] = useState<Array<{ courseId: string; name: string }>>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [userRegistrationData, setUserRegistrationData] = useState<{ email?: string; course?: { courseId: string; name: string } } | null>(null);

  // Helper function to get error class for inputs
  const getErrorClass = (fieldName: string) => fieldErrors[fieldName] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "";

  const totalSteps = 4

  // Fetch user registration data (email and course) from the backend
  // This is always needed to determine if fields should be disabled
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          withCredentials: true
        });
        if (response.data?.user) {
          const userData = {
            email: response.data.user.email || '',
            course: response.data.user.course || null
          };
          setUserRegistrationData(userData);
          
          // Only update form data when NOT using context (context handles its own loading)
          if (!formContext) {
            setFormData(prev => ({
              ...prev,
              emailAddress: prev.emailAddress || userData.email || '',
              programOfStudyAndYear: prev.programOfStudyAndYear || (userData.course ? `${userData.course.name} (${userData.course.courseId})` : '')
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, [formContext]);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await axios.get(`${API_URL}/course/all`, {
          withCredentials: true
        });

        if (response.data?.courses) {
          setCourses(response.data.courses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          title: "Warning",
          description: "Could not load courses. You may need to enter your program manually.",
          variant: "destructive"
        });
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Autofill email and program of study from user's registration data
  // This effect runs when userRegistrationData changes AND after hasExistingApplication is determined
  useEffect(() => {
    if (userRegistrationData && !hasExistingApplication && !initialData && !applicationId) {
      setFormData(prev => {
        // Only update if the fields are empty (not already filled by existing application)
        const newEmailAddress = prev.emailAddress || userRegistrationData.email || '';
        const newProgramOfStudy = prev.programOfStudyAndYear || (userRegistrationData.course ? `${userRegistrationData.course.name} (${userRegistrationData.course.courseId})` : '');
        
        // Only update if there's actually something to update
        if (newEmailAddress !== prev.emailAddress || newProgramOfStudy !== prev.programOfStudyAndYear) {
          return {
            ...prev,
            emailAddress: newEmailAddress,
            programOfStudyAndYear: newProgramOfStudy
          };
        }
        return prev;
      });
    }
  }, [userRegistrationData, hasExistingApplication, initialData, applicationId]);

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
    // Skip if using context - context handles loading
    if (formContext) return;
    
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
  }, [initialData, applicationId, formContext]);

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
        setIsInitialLoad(false);
      } else {
        setHasExistingApplication(false);
        // No submitted application - try to load a draft
        await loadDraft();
        setIsInitialLoad(false);
      }
    } catch (error: any) {
      console.error('Error loading application:', error);
      // If 404 or no application found, user hasn't submitted yet - try loading draft
      if (error?.response?.status === 404 || error?.message?.includes('not found')) {
        setHasExistingApplication(false);
        setIsReadOnly(false);
        await loadDraft();
        setIsInitialLoad(false);
      } else {
        // Other errors - still mark initial load as complete
        setIsInitialLoad(false);
      }
    }
  }

  // Load draft from server
  const loadDraft = async (showToast = true) => {
    try {
      const draftResponse = await applicationService.getDraft();
      if (draftResponse?.draft) {
        const draftData = draftResponse.draft;
        console.log('📖 Loaded draft from server:', draftData);
        
        // Restore form data from draft
        setFormData(prev => ({
          ...defaultFormData,
          ...draftData,
          // Preserve email and program from registration if draft doesn't have them
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
        
        // Only show toast on first load, not on tab switches
        if (showToast && !draftLoaded) {
          toast({
            title: "Draft Restored",
            description: "Your previously saved draft has been loaded.",
          });
        }
      } else {
        // No draft found - start fresh
        setFormData(prev => ({
          ...defaultFormData,
          emailAddress: prev.emailAddress || '',
          programOfStudyAndYear: prev.programOfStudyAndYear || ''
        }));
        setSiblings([{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }]);
        setCollegeLevels([{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }]);
        setOrganizations([{ nameOfOrganization: "", position: "" }]);
        setReferences([{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]);
        setIsReadOnly(false);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      // If draft fails to load, just start with empty form
      setFormData(prev => ({
        ...defaultFormData,
        emailAddress: prev.emailAddress || '',
        programOfStudyAndYear: prev.programOfStudyAndYear || ''
      }));
      setSiblings([{ name: "", age: 0, programCurrentlyTakingOrFinished: "", schoolOrOccupation: "" }]);
      setCollegeLevels([{ yearLevel: 1, firstSemesterAverageFinalGrade: 0, secondSemesterAverageFinalGrade: 0, thirdSemesterAverageFinalGrade: 0 }]);
      setOrganizations([{ nameOfOrganization: "", position: "" }]);
      setReferences([{ name: "", relationshipToTheApplicant: "", contactNumber: "" }]);
      setIsReadOnly(false);
    }
  }

  // Auto-save draft when form data changes (debounced) - only when not using context
  const saveDraftToServer = async () => {
    // Use context save if available
    if (saveDraftToServerFromContext) {
      return saveDraftToServerFromContext();
    }
    
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
      console.log('💾 Draft auto-saved');
    } catch (error) {
      console.error('Failed to auto-save draft:', error);
    }
  };

  // Debounced auto-save effect - only when NOT using context (context handles auto-save)
  useEffect(() => {
    // Skip if using context - context handles auto-save
    if (formContext) return;
    // Don't auto-save during initial load or if read-only
    if (isReadOnly || hasExistingApplication) return;
    
    const timeoutId = setTimeout(() => {
      saveDraftToServer();
    }, 2000); // Save after 2 seconds of inactivity
    
    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, siblings, collegeLevels, organizations, references, currentStep, isReadOnly, hasExistingApplication, isInitialLoad]);

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
        
        // Delete draft after successful submission
        try {
          await applicationService.deleteDraft();
          console.log('🗑️ Draft deleted after successful submission');
        } catch (draftError) {
          console.error('Failed to delete draft (non-critical):', draftError);
        }
        
        setHasExistingApplication(true); // Now user has an application
        toast({ title: "Success", description: "Application submitted successfully.", duration: 3000 });
        // Reload the page after a short delay to show the toast
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
      'firstName', 'lastName', 'birthDate', 'programOfStudyAndYear', 'remainingUnitsIncludingThisTerm', 'remainingTermsToGraduate',
      'citizenship', 'civilStatus', 'annualFamilyIncome', 'residingAt',
      'permanentResidentialAddress', 'contactNumber', 'yearLevel'
    ] as const;

    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;
    let firstErrorField = '';

    for (const field of requiredFields) {
      if (!formData[field]) {
        newErrors[field] = true;
        hasErrors = true;
        if (!firstErrorField) firstErrorField = field;
      }
    }

    // Eligibility validation based on SRS requirements
    
    // Eligibility checks with specific error messages
    let eligibilityError = false;

    // 1. Year Level Requirement: Must be First Year or Second Year
    if (formData.yearLevel && formData.yearLevel !== 'First Year' && formData.yearLevel !== 'Second Year') {
      newErrors['yearLevel'] = true;
      eligibilityError = true;
      toast({
        title: "Eligibility Requirement Not Met",
        description: "The NAS scholarship is only available to First Year and Second Year students. Please verify your year level.",
        variant: "destructive"
      });
    }

    // 2. Family Income Requirement: Must not exceed ₱300,000
    if (formData.annualFamilyIncome === '>300k') {
      newErrors['annualFamilyIncome'] = true;
      eligibilityError = true;
      toast({
        title: "Eligibility Requirement Not Met",
        description: "Applicants with annual family income above ₱300,000 are not eligible for the NAS scholarship.",
        variant: "destructive"
      });
    }

    // 3. Program Restriction: Must not be enrolled in BS Nursing
    if (formData.programOfStudyAndYear && 
        (formData.programOfStudyAndYear.toLowerCase().includes('nursing') || 
         formData.programOfStudyAndYear.toLowerCase().includes('bsn'))) {
      newErrors['programOfStudyAndYear'] = true;
      eligibilityError = true;
      toast({
        title: "Eligibility Requirement Not Met",
        description: "BS Nursing students are not eligible for the NAS scholarship program.",
        variant: "destructive"
      });
    }

    setFieldErrors(prev => ({ ...prev, ...newErrors }));

    if (eligibilityError) {
      return false;
    }

    if (hasErrors) {
      toast({
        title: "Required Fields Missing",
        description: "Please complete all required fields in the Personal Information section. Fields that need attention are highlighted in red.",
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
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;
    let incomeExceedsLimit = false;

    for (const field of fatherFields) {
      if (!formData.familyBackground.father[field]) {
        newErrors[`father_${field}`] = true;
        hasErrors = true;
      }
    }

    // Validate mother's information
    const motherFields = ['firstName', 'lastName', 'age', 'occupation', 'grossAnnualIncome', 'contactNumber'] as const;
    for (const field of motherFields) {
      if (!formData.familyBackground.mother[field]) {
        newErrors[`mother_${field}`] = true;
        hasErrors = true;
      }
    }

    // Validate gross annual income limit (₱200,000 max for eligibility)
    const INCOME_LIMIT = 200000;
    const parseIncome = (incomeStr: string): number => {
      if (!incomeStr) return 0;
      // Remove currency symbols, commas, and spaces, then parse
      const cleaned = incomeStr.replace(/[₱,\s]/g, '');
      return parseFloat(cleaned) || 0;
    };

    const fatherIncome = parseIncome(formData.familyBackground.father.grossAnnualIncome);
    const motherIncome = parseIncome(formData.familyBackground.mother.grossAnnualIncome);

    if (fatherIncome > INCOME_LIMIT) {
      newErrors['father_grossAnnualIncome'] = true;
      incomeExceedsLimit = true;
    }

    if (motherIncome > INCOME_LIMIT) {
      newErrors['mother_grossAnnualIncome'] = true;
      incomeExceedsLimit = true;
    }

    setFieldErrors(prev => ({ ...prev, ...newErrors }));

    if (incomeExceedsLimit) {
      toast({
        title: "Income Exceeds Eligibility Limit",
        description: "Father's or Mother's gross annual income exceeds ₱200,000.00. Applicants with family income above this limit are not eligible for the NAS scholarship.",
        variant: "destructive"
      });
      return false;
    }

    if (hasErrors) {
      toast({
        title: "Required Fields Missing",
        description: "Please complete all required fields in the Family Background section. Fields that need attention are highlighted in red.",
        variant: "destructive"
      });
      return false;
    }

    // Siblings are now optional - only validate if they exist

    return true;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;

    // Validate elementary education
    if (!formData.education.elementary.nameAndAddressOfSchool) {
      newErrors['elementary_school'] = true;
      hasErrors = true;
    }
    if (!formData.education.elementary.generalAverage) {
      newErrors['elementary_grade'] = true;
      hasErrors = true;
    }

    // Validate elementary education grade range (75-100)
    if (formData.education.elementary.generalAverage && 
        (formData.education.elementary.generalAverage < 75 || formData.education.elementary.generalAverage > 100)) {
      newErrors['elementary_grade'] = true;
      hasErrors = true;
    }

    // Validate secondary education
    if (!formData.education.secondary.nameAndAddressOfSchool) {
      newErrors['secondary_school'] = true;
      hasErrors = true;
    }
    if (!formData.education.secondary.generalAverage) {
      newErrors['secondary_grade'] = true;
      hasErrors = true;
    }

    // Validate secondary education grade range (75-100)
    if (formData.education.secondary.generalAverage &&
        (formData.education.secondary.generalAverage < 75 || formData.education.secondary.generalAverage > 100)) {
      newErrors['secondary_grade'] = true;
      hasErrors = true;
    }

    // Validate at least one college level
    if (collegeLevels.length === 0) {
      newErrors['college_levels'] = true;
      hasErrors = true;
    }

    // Validate each college level
    for (const [index, level] of collegeLevels.entries()) {
      if (!level.yearLevel) {
        newErrors[`college_${index}_yearLevel`] = true;
        hasErrors = true;
      }
      if (!level.firstSemesterAverageFinalGrade) {
        newErrors[`college_${index}_firstSem`] = true;
        hasErrors = true;
      }
    }

    // Grade validation for CIT-U Senior High graduates
    if (formData.isCitUSeniorHighGraduate) {
      // Must have grade average >= 80% in secondary education
      if (formData.education.secondary.generalAverage < 80) {
        newErrors['secondary_grade'] = true;
        hasErrors = true;
      }
    }

    // Residency Requirements for Non-CIT-U Senior High Graduates
    if (!formData.isCitUSeniorHighGraduate) {
      // Must have at least 1 semester residency
      if (!formData.citUResidency?.semesterCount || formData.citUResidency.semesterCount < 1) {
        newErrors['citU_semesterCount'] = true;
        hasErrors = true;
      }

      // Weighted Average Grade must be >= 3.5
      if (!formData.citUResidency?.weightedAverageGrade || formData.citUResidency.weightedAverageGrade < 3.5) {
        newErrors['citU_weightedAverage'] = true;
        hasErrors = true;
      }

      // Must have no failing marks
      if (formData.citUResidency?.hasFailingMarks) {
        newErrors['citU_failingMarks'] = true;
        hasErrors = true;
      }

      // Must have minimum load of 15 units (regular) or 6 units (summer)
      if (!formData.citUResidency?.minimumUnitsCompleted || formData.citUResidency.minimumUnitsCompleted < 6) {
        newErrors['citU_minimumUnits'] = true;
        hasErrors = true;
      }
    }

    setFieldErrors(prev => ({ ...prev, ...newErrors }));

    if (hasErrors) {
      toast({
        title: "Required Fields Missing",
        description: "Please complete all required fields in the Education section. Fields that need attention are highlighted in red.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateStep4 = () => {
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;

    // Validate at least two references
    if (references.length < 2) {
      newErrors['references_count'] = true;
      hasErrors = true;
    }

    // Validate each reference
    for (const [index, ref] of references.entries()) {
      if (!ref.name) {
        newErrors[`reference_${index}_name`] = true;
        hasErrors = true;
      }
      if (!ref.relationshipToTheApplicant) {
        newErrors[`reference_${index}_relationship`] = true;
        hasErrors = true;
      }
      if (!ref.contactNumber) {
        newErrors[`reference_${index}_contact`] = true;
        hasErrors = true;
      }
    }

    setFieldErrors(prev => ({ ...prev, ...newErrors }));

    if (hasErrors) {
      toast({
        title: "Required Fields Missing",
        description: "Please provide at least two references with complete information. Fields that need attention are highlighted in red.",
        variant: "destructive"
      });
      return false;
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
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Scholarship Application Form</CardTitle>
              <CardDescription>Complete all sections to submit your application</CardDescription>
            </div>
            {!isReadOnly && !hasExistingApplication && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await saveDraftToServer();
                    toast({
                      title: "Draft Saved",
                      description: "Your progress has been saved.",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to save draft. Please try again.",
                      variant: "destructive"
                    });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-10">
          {/* --- Personal Information Section --- */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-address">Email Address</Label>
                  <Input
                    id="email-address"
                    value={formData.emailAddress}
                    onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                    placeholder="Enter your email address"
                    disabled={isReadOnly || !!userRegistrationData?.email}
                    className={userRegistrationData?.email ? "bg-gray-100 cursor-not-allowed" : ""}
                  />
                  {userRegistrationData?.email && (
                    <p className="text-xs text-muted-foreground">This field is auto-filled from your registration.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={formData.firstName}
                    onChange={(e) => { handleNameChange('firstName', e.target.value); setFieldErrors(prev => ({ ...prev, firstName: false })); }}
                    placeholder="Enter your first name"
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('firstName')}
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
                    onChange={(e) => { handleNameChange('lastName', e.target.value); setFieldErrors(prev => ({ ...prev, lastName: false })); }}
                    placeholder="Enter your last name"
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('lastName')}
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
                  <Label htmlFor="birth-date">Birth Date</Label>
                  <Input
                    id="birth-date"
                    type="date"
                    value={formData.birthDate ? formData.birthDate.split('T')[0] : ''}
                    onChange={(e) => { setFormData({ ...formData, birthDate: e.target.value }); setFieldErrors(prev => ({ ...prev, birthDate: false })); }}
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('birthDate')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program-study">Program of Study</Label>
                  <Select
                    value={formData.programOfStudyAndYear}
                    onValueChange={(value) => { setFormData({ ...formData, programOfStudyAndYear: value }); setFieldErrors(prev => ({ ...prev, programOfStudyAndYear: false })); }}
                    disabled={isReadOnly || coursesLoading || !!userRegistrationData?.course}
                  >
                    <SelectTrigger id="program-study" className={`${userRegistrationData?.course ? "bg-gray-100 cursor-not-allowed" : ""} ${getErrorClass('programOfStudyAndYear')}`}>
                      <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select your program"} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.courseId} value={`${course.name} (${course.courseId})`}>
                          {course.name} ({course.courseId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {userRegistrationData?.course && (
                    <p className="text-xs text-muted-foreground">This field is auto-filled from your registration.</p>
                  )}
                </div>
                
                {/* New Eligibility Fields */}
                <div className="space-y-2">
                  <Label htmlFor="year-level">Year Level</Label>
                  <Select
                    value={formData.yearLevel}
                    onValueChange={(value) => { setFormData({ ...formData, yearLevel: value }); setFieldErrors(prev => ({ ...prev, yearLevel: false })); }}
                    disabled={isReadOnly}
                    required
                  >
                    <SelectTrigger id="year-level" className={getErrorClass('yearLevel')}>
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Year">First Year</SelectItem>
                      <SelectItem value="Second Year">Second Year</SelectItem>
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
                    onChange={(e) => { setFormData({ ...formData, remainingUnitsIncludingThisTerm: Number(e.target.value) }); setFieldErrors(prev => ({ ...prev, remainingUnitsIncludingThisTerm: false })); }}
                    placeholder="Enter remaining units"
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('remainingUnitsIncludingThisTerm')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remaining-terms">Remaining Terms to Graduate</Label>
                  <Input
                    id="remaining-terms"
                    type="number"
                    min="0"
                    value={formData.remainingTermsToGraduate}
                    onChange={(e) => { setFormData({ ...formData, remainingTermsToGraduate: Number(e.target.value) }); setFieldErrors(prev => ({ ...prev, remainingTermsToGraduate: false })); }}
                    placeholder="Enter remaining terms"
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('remainingTermsToGraduate')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="citizenship">Citizenship</Label>
                  <Select
                    value={formData.citizenship}
                    onValueChange={(value) => { setFormData({ ...formData, citizenship: value }); setFieldErrors(prev => ({ ...prev, citizenship: false })); }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="citizenship" className={getErrorClass('citizenship')}>
                      <SelectValue placeholder="Select your citizenship" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {NATIONALITIES.map((nationality) => (
                        <SelectItem key={nationality} value={nationality}>
                          {nationality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    onValueChange={(value) => { setFormData({ ...formData, civilStatus: value }); setFieldErrors(prev => ({ ...prev, civilStatus: false })); }}
                    disabled={isReadOnly}
                    required
                  >
                    <SelectTrigger id="civil-status" className={getErrorClass('civilStatus')}>
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
                    onValueChange={(value) => { setFormData({ ...formData, annualFamilyIncome: value }); setFieldErrors(prev => ({ ...prev, annualFamilyIncome: false })); }}
                    disabled={isReadOnly}
                    required
                  >
                    <SelectTrigger id="annual-income" className={getErrorClass('annualFamilyIncome')}>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<100k">Below ₱100,000</SelectItem>
                      <SelectItem value="100k-200k">₱100,000 - ₱200,000</SelectItem>
                      <SelectItem value="200k-300k">₱200,000 - ₱300,000</SelectItem>
                      <SelectItem value=">300k">Above ₱300,000</SelectItem>
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
                    onValueChange={(value) => { setFormData({ ...formData, residingAt: value }); setFieldErrors(prev => ({ ...prev, residingAt: false })); }}
                    disabled={isReadOnly}
                    required
                  >
                    <SelectTrigger id="residing-at" className={getErrorClass('residingAt')}>
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
                    onChange={(e) => { setFormData({ ...formData, permanentResidentialAddress: e.target.value }); setFieldErrors(prev => ({ ...prev, permanentResidentialAddress: false })); }}
                    placeholder="Enter permanent address"
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('permanentResidentialAddress')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-number">Contact Number</Label>
                  <Input
                    id="contact-number"
                    value={formData.contactNumber}
                    onChange={(e) => { setFormData({ ...formData, contactNumber: e.target.value }); setFieldErrors(prev => ({ ...prev, contactNumber: false })); }}
                    placeholder="Enter your contact number"
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('contactNumber')}
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
                      onChange={(e) => { updateFatherField('firstName', e.target.value); setFieldErrors(prev => ({ ...prev, father_firstName: false })); }}
                      placeholder="Enter father's first name"
                      disabled={isReadOnly}
                      className={getErrorClass('father_firstName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father-last-name">Last Name</Label>
                    <Input
                      id="father-last-name"
                      value={safeFather.lastName}
                      onChange={(e) => { updateFatherField('lastName', e.target.value); setFieldErrors(prev => ({ ...prev, father_lastName: false })); }}
                      placeholder="Enter father's last name"
                      disabled={isReadOnly}
                      className={getErrorClass('father_lastName')}
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
                      onChange={(e) => { updateFatherField('age', Number(e.target.value)); setFieldErrors(prev => ({ ...prev, father_age: false })); }}
                      placeholder="Enter age"
                      disabled={isReadOnly}
                      className={getErrorClass('father_age')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father-occupation">Occupation</Label>
                    <Input
                      id="father-occupation"
                      value={safeFather.occupation}
                      onChange={(e) => { updateFatherField('occupation', e.target.value); setFieldErrors(prev => ({ ...prev, father_occupation: false })); }}
                      placeholder="Enter occupation"
                      disabled={isReadOnly}
                      className={getErrorClass('father_occupation')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="father-income">Gross Annual Income</Label>
                    <Input
                      id="father-income"
                      value={safeFather.grossAnnualIncome}
                      onChange={(e) => { updateFatherField('grossAnnualIncome', e.target.value); setFieldErrors(prev => ({ ...prev, father_grossAnnualIncome: false })); }}
                      placeholder="Enter annual income"
                      disabled={isReadOnly}
                      className={getErrorClass('father_grossAnnualIncome')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father-contact">Contact Number</Label>
                    <Input
                      id="father-contact"
                      value={safeFather.contactNumber}
                      onChange={(e) => { updateFatherField('contactNumber', e.target.value); setFieldErrors(prev => ({ ...prev, father_contactNumber: false })); }}
                      placeholder="Enter contact number"
                      disabled={isReadOnly}
                      className={getErrorClass('father_contactNumber')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="father-company-name">Company Name (optional)</Label>
                    <Input
                      id="father-company-name"
                      value={safeFather.companyName || ''}
                      onChange={(e) => updateFatherField('companyName', e.target.value)}
                      placeholder="Enter company name"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father-company-address">Company Address (optional)</Label>
                    <Input
                      id="father-company-address"
                      value={safeFather.companyAddress || ''}
                      onChange={(e) => updateFatherField('companyAddress', e.target.value)}
                      placeholder="Enter company address"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father-home-address">Home Address</Label>
                  <Input
                    id="father-home-address"
                    value={safeFather.homeAddress || ''}
                    onChange={(e) => updateFatherField('homeAddress', e.target.value)}
                    placeholder="Enter home address"
                    disabled={isReadOnly}
                  />
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
                      onChange={(e) => { updateMotherField('firstName', e.target.value); setFieldErrors(prev => ({ ...prev, mother_firstName: false })); }}
                      placeholder="Enter mother's first name"
                      disabled={isReadOnly}
                      className={getErrorClass('mother_firstName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother-last-name">Last Name</Label>
                    <Input
                      id="mother-last-name"
                      value={safeMother.lastName}
                      onChange={(e) => { updateMotherField('lastName', e.target.value); setFieldErrors(prev => ({ ...prev, mother_lastName: false })); }}
                      placeholder="Enter mother's last name"
                      disabled={isReadOnly}
                      className={getErrorClass('mother_lastName')}
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
                      onChange={(e) => { updateMotherField('age', Number(e.target.value)); setFieldErrors(prev => ({ ...prev, mother_age: false })); }}
                      placeholder="Enter age"
                      disabled={isReadOnly}
                      className={getErrorClass('mother_age')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother-occupation">Occupation</Label>
                    <Input
                      id="mother-occupation"
                      value={safeMother.occupation}
                      onChange={(e) => { updateMotherField('occupation', e.target.value); setFieldErrors(prev => ({ ...prev, mother_occupation: false })); }}
                      placeholder="Enter occupation"
                      disabled={isReadOnly}
                      className={getErrorClass('mother_occupation')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mother-income">Gross Annual Income</Label>
                    <Input
                      id="mother-income"
                      value={safeMother.grossAnnualIncome}
                      onChange={(e) => { updateMotherField('grossAnnualIncome', e.target.value); setFieldErrors(prev => ({ ...prev, mother_grossAnnualIncome: false })); }}
                      placeholder="Enter annual income"
                      disabled={isReadOnly}
                      className={getErrorClass('mother_grossAnnualIncome')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother-contact">Contact Number</Label>
                    <Input
                      id="mother-contact"
                      value={safeMother.contactNumber}
                      onChange={(e) => { updateMotherField('contactNumber', e.target.value); setFieldErrors(prev => ({ ...prev, mother_contactNumber: false })); }}
                      placeholder="Enter contact number"
                      disabled={isReadOnly}
                      className={getErrorClass('mother_contactNumber')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mother-company-name">Company Name (optional)</Label>
                    <Input
                      id="mother-company-name"
                      value={safeMother.companyName || ''}
                      onChange={(e) => updateMotherField('companyName', e.target.value)}
                      placeholder="Enter company name"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother-company-address">Company Address (optional)</Label>
                    <Input
                      id="mother-company-address"
                      value={safeMother.companyAddress || ''}
                      onChange={(e) => updateMotherField('companyAddress', e.target.value)}
                      placeholder="Enter company address"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother-home-address">Home Address</Label>
                  <Input
                    id="mother-home-address"
                    value={safeMother.homeAddress || ''}
                    onChange={(e) => updateMotherField('homeAddress', e.target.value)}
                    placeholder="Enter home address"
                    disabled={isReadOnly}
                  />
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
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`sibling-program-${index}`}>Program/Course (optional)</Label>
                            <Input
                              id={`sibling-program-${index}`}
                              value={sibling.programCurrentlyTakingOrFinished || ''}
                              onChange={(e) => updateSibling(index, "programCurrentlyTakingOrFinished", e.target.value)}
                              placeholder="e.g., BS Computer Science"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sibling-school-${index}`}>School/Occupation (optional)</Label>
                            <Input
                              id={`sibling-school-${index}`}
                              value={sibling.schoolOrOccupation || ''}
                              onChange={(e) => updateSibling(index, "schoolOrOccupation", e.target.value)}
                              placeholder="e.g., CIT-U or Software Engineer"
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
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          elementary: {
                            ...formData.education.elementary,
                            nameAndAddressOfSchool: e.target.value,
                          },
                        },
                      });
                      setFieldErrors(prev => ({ ...prev, elementary_school: false }));
                    }}
                    placeholder="Enter school name and address"
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('elementary_school')}
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
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          elementary: {
                            ...formData.education.elementary,
                            generalAverage: Number(e.target.value),
                          },
                        },
                      });
                      setFieldErrors(prev => ({ ...prev, elementary_grade: false }));
                    }}
                    placeholder="Enter average (75-100)"
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('elementary_grade')}
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
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          secondary: {
                            ...formData.education.secondary,
                            nameAndAddressOfSchool: e.target.value,
                          },
                        },
                      });
                      setFieldErrors(prev => ({ ...prev, secondary_school: false }));
                    }}
                    placeholder="Enter school name and address"
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('secondary_school')}
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
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        education: {
                          ...formData.education,
                          secondary: {
                            ...formData.education.secondary,
                            generalAverage: Number(e.target.value),
                          },
                        },
                      });
                      setFieldErrors(prev => ({ ...prev, secondary_grade: false }));
                    }}
                    placeholder="Enter average (75-100)"
                    disabled={isReadOnly}
                    required
                    className={getErrorClass('secondary_grade')}
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
                        onChange={e => { updateReference(index, 'name', e.target.value); setFieldErrors(prev => ({ ...prev, [`reference_${index}_name`]: false })); }}
                        placeholder="Enter reference's name"
                        disabled={isReadOnly}
                        required
                        className={getErrorClass(`reference_${index}_name`)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`reference-relationship-${index}`}>Relationship to Applicant</Label>
                      <Input
                        id={`reference-relationship-${index}`}
                        value={ref.relationshipToTheApplicant}
                        onChange={e => { updateReference(index, 'relationshipToTheApplicant', e.target.value); setFieldErrors(prev => ({ ...prev, [`reference_${index}_relationship`]: false })); }}
                        placeholder="Enter relationship"
                        disabled={isReadOnly}
                        required
                        className={getErrorClass(`reference_${index}_relationship`)}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor={`reference-contact-${index}`}>Contact Number</Label>
                      <Input
                        id={`reference-contact-${index}`}
                        value={ref.contactNumber}
                        onChange={e => { updateReference(index, 'contactNumber', e.target.value); setFieldErrors(prev => ({ ...prev, [`reference_${index}_contact`]: false })); }}
                        placeholder="Enter contact number"
                        disabled={isReadOnly}
                        required
                        className={getErrorClass(`reference_${index}_contact`)}
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
                disabled={isSubmitting || hasExistingApplication}
                className="bg-[#800000] hover:bg-[#600000]"
              >
                {hasExistingApplication ? "Already Submitted" : (isSubmitting ? "Submitting..." : "Submit Application")}
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

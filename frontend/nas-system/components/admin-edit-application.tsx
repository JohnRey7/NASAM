"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

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

interface AdminEditApplicationProps {
  application: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AdminEditApplication({ application, open, onOpenChange, onSuccess }: AdminEditApplicationProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [courses, setCourses] = useState<Array<{ courseId: string; name: string }>>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

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
      } finally {
        setCoursesLoading(false);
      }
    };
    if (open) {
      fetchCourses();
    }
  }, [open]);

  useEffect(() => {
    if (application) {
      setFormData({
        // Personal Information
        firstName: application.firstName || '',
        middleName: application.middleName || '',
        lastName: application.lastName || '',
        suffix: application.suffix || '',
        birthDate: application.birthDate || '',
        emailAddress: application.emailAddress || application.user?.email || '',
        contactNumber: application.contactNumber || '',
        gender: application.gender || '',
        citizenship: application.citizenship || '',
        civilStatus: application.civilStatus || '',
        
        // Academic Information
        programOfStudyAndYear: application.programOfStudyAndYear || '',
        yearLevel: application.yearLevel || '',
        isCitUSeniorHighGraduate: application.isCitUSeniorHighGraduate ?? false,
        existingScholarship: application.existingScholarship || '',
        remainingUnitsIncludingThisTerm: application.remainingUnitsIncludingThisTerm || 0,
        remainingTermsToGraduate: application.remainingTermsToGraduate || 0,
        
        // Address Information
        currentResidenceAddress: application.currentResidenceAddress || '',
        permanentResidentialAddress: application.permanentResidentialAddress || '',
        residingAt: application.residingAt || '',
        
        // Financial Information
        annualFamilyIncome: application.annualFamilyIncome || '',
        
        // Family Background
        familyBackground: {
          father: {
            firstName: application.familyBackground?.father?.firstName || '',
            middleName: application.familyBackground?.father?.middleName || '',
            lastName: application.familyBackground?.father?.lastName || '',
            suffix: application.familyBackground?.father?.suffix || '',
            age: application.familyBackground?.father?.age || 0,
            occupation: application.familyBackground?.father?.occupation || '',
            grossAnnualIncome: application.familyBackground?.father?.grossAnnualIncome || '',
            companyName: application.familyBackground?.father?.companyName || '',
            companyAddress: application.familyBackground?.father?.companyAddress || '',
            homeAddress: application.familyBackground?.father?.homeAddress || '',
            contactNumber: application.familyBackground?.father?.contactNumber || '',
          },
          mother: {
            firstName: application.familyBackground?.mother?.firstName || '',
            middleName: application.familyBackground?.mother?.middleName || '',
            lastName: application.familyBackground?.mother?.lastName || '',
            suffix: application.familyBackground?.mother?.suffix || '',
            age: application.familyBackground?.mother?.age || 0,
            occupation: application.familyBackground?.mother?.occupation || '',
            grossAnnualIncome: application.familyBackground?.mother?.grossAnnualIncome || '',
            companyName: application.familyBackground?.mother?.companyName || '',
            companyAddress: application.familyBackground?.mother?.companyAddress || '',
            homeAddress: application.familyBackground?.mother?.homeAddress || '',
            contactNumber: application.familyBackground?.mother?.contactNumber || '',
          },
          siblings: application.familyBackground?.siblings || []
        },
        
        // Education
        education: {
          elementary: application.education?.elementary || {
            nameAndAddressOfSchool: '',
            honorOrAwardsReceived: '',
            nameOfOrganizationAndPositionHeld: '',
            generalAverage: 0,
            rankAmongGraduates: '',
            contestTrainingsConferencesParticipated: ''
          },
          secondary: application.education?.secondary || {
            nameAndAddressOfSchool: '',
            honorOrAwardsReceived: '',
            nameOfOrganizationAndPositionHeld: '',
            generalAverage: 0,
            rankAmongGraduates: '',
            contestTrainingsConferencesParticipated: ''
          },
          collegeLevel: application.education?.collegeLevel || [],
          currentMembershipInOrganizations: application.education?.currentMembershipInOrganizations || []
        },
        
        // References
        references: application.references || []
      })
    }
  }, [application])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (path: string[], value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev }
      let current = newData
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {}
        }
        current = current[path[i]]
      }
      
      current[path[path.length - 1]] = value
      return newData
    })
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
      const response = await fetch(`${API_URL}/application/${application._id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update application')
      }

      const result = await response.json()
      
      toast({
        title: "Application Updated",
        description: `Successfully updated application for ${formData.firstName} ${formData.lastName}`,
        duration: 3000
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating application:', error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update application',
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Application - {application?.firstName} {application?.lastName}</DialogTitle>
          <DialogDescription>
            Update applicant information. Changes will be saved to the application history.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="family">Family</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] w-full pr-4">
            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName || ''}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    value={formData.suffix || ''}
                    onChange={(e) => handleInputChange('suffix', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Birth Date *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate ? (typeof formData.birthDate === 'string' ? formData.birthDate.split('T')[0] : new Date(formData.birthDate).toISOString().split('T')[0]) : ''}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="emailAddress">Email Address</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    value={formData.emailAddress || ''}
                    onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber || ''}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="citizenship">Citizenship *</Label>
                  <Select
                    value={formData.citizenship || ''}
                    onValueChange={(value) => handleInputChange('citizenship', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select citizenship" />
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
                <div>
                  <Label htmlFor="civilStatus">Civil Status *</Label>
                  <Select value={formData.civilStatus || ''} onValueChange={(value) => handleInputChange('civilStatus', value)}>
                    <SelectTrigger>
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
                <div className="col-span-2">
                  <Label htmlFor="currentResidenceAddress">Current Residence Address</Label>
                  <Textarea
                    id="currentResidenceAddress"
                    value={formData.currentResidenceAddress || ''}
                    onChange={(e) => handleInputChange('currentResidenceAddress', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="permanentResidentialAddress">Permanent Residential Address *</Label>
                  <Textarea
                    id="permanentResidentialAddress"
                    value={formData.permanentResidentialAddress || ''}
                    onChange={(e) => handleInputChange('permanentResidentialAddress', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Academic Information Tab */}
            <TabsContent value="academic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="programOfStudyAndYear">Program of Study *</Label>
                  <Select
                    value={formData.programOfStudyAndYear || ''}
                    onValueChange={(value) => handleInputChange('programOfStudyAndYear', value)}
                    disabled={coursesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select program"} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.courseId} value={`${course.name} (${course.courseId})`}>
                          {course.name} ({course.courseId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="yearLevel">Year Level *</Label>
                  <Select value={formData.yearLevel || ''} onValueChange={(value) => handleInputChange('yearLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Year">First Year</SelectItem>
                      <SelectItem value="Second Year">Second Year</SelectItem>
                      <SelectItem value="Third Year">Third Year</SelectItem>
                      <SelectItem value="Fourth Year">Fourth Year</SelectItem>
                      <SelectItem value="Fifth Year">Fifth Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="annualFamilyIncome">Annual Family Income *</Label>
                  <Select value={formData.annualFamilyIncome || ''} onValueChange={(value) => handleInputChange('annualFamilyIncome', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<100k">Less than ₱100,000</SelectItem>
                      <SelectItem value="100k-200k">₱100,000 - ₱200,000</SelectItem>
                      <SelectItem value="200k-300k">₱200,000 - ₱300,000</SelectItem>
                      <SelectItem value=">300k">More than ₱300,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="existingScholarship">Existing Scholarship</Label>
                  <Input
                    id="existingScholarship"
                    value={formData.existingScholarship || ''}
                    onChange={(e) => handleInputChange('existingScholarship', e.target.value)}
                    placeholder="None or specify scholarship name"
                  />
                </div>
                <div>
                  <Label htmlFor="remainingUnits">Remaining Units (Including This Term) *</Label>
                  <Input
                    id="remainingUnits"
                    type="number"
                    value={formData.remainingUnitsIncludingThisTerm || 0}
                    onChange={(e) => handleInputChange('remainingUnitsIncludingThisTerm', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="remainingTerms">Remaining Terms to Graduate *</Label>
                  <Input
                    id="remainingTerms"
                    type="number"
                    value={formData.remainingTermsToGraduate || 0}
                    onChange={(e) => handleInputChange('remainingTermsToGraduate', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Family Background Tab */}
            <TabsContent value="family" className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Father's Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={formData.familyBackground?.father?.firstName || ''}
                      onChange={(e) => handleNestedChange(['familyBackground', 'father', 'firstName'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={formData.familyBackground?.father?.lastName || ''}
                      onChange={(e) => handleNestedChange(['familyBackground', 'father', 'lastName'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={formData.familyBackground?.father?.age || 0}
                      onChange={(e) => handleNestedChange(['familyBackground', 'father', 'age'], parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Occupation</Label>
                    <Input
                      value={formData.familyBackground?.father?.occupation || ''}
                      onChange={(e) => handleNestedChange(['familyBackground', 'father', 'occupation'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Contact Number</Label>
                    <Input
                      value={formData.familyBackground?.father?.contactNumber || ''}
                      onChange={(e) => handleNestedChange(['familyBackground', 'father', 'contactNumber'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Gross Annual Income</Label>
                    <Input
                      value={formData.familyBackground?.father?.grossAnnualIncome || ''}
                      onChange={(e) => handleNestedChange(['familyBackground', 'father', 'grossAnnualIncome'], e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Mother's Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={formData.familyBackground?.mother?.firstName || ''}
                      onChange={(e) => handleNestedChange(['familyBackground', 'mother', 'firstName'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={formData.familyBackground?.mother?.lastName || ''}
                      onChange={(e) => handleNestedChange(['familyBackground', 'mother', 'lastName'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={formData.familyBackground?.mother?.age || 0}
                      onChange={(e) => handleNestedChange(['familyBackground', 'mother', 'age'], parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Occupation</Label>
                    <Input
                      value={formData.familyBackground?.mother?.occupation || ''}
                      onChange={(e) => handleNestedChange(['familyBackground', 'mother', 'occupation'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Contact Number</Label>
                    <Input
                      value={formData.familyBackground?.mother?.contactNumber || ''}
                      onChange={(e) => handleNestedChange(['familyBackground', 'mother', 'contactNumber'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Gross Annual Income</Label>
                    <Input
                      value={formData.familyBackground?.mother?.grossAnnualIncome || ''}
                      onChange={(e) => handleNestedChange(['familyBackground', 'mother', 'grossAnnualIncome'], e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Elementary Education</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>School Name and Address</Label>
                    <Input
                      value={formData.education?.elementary?.nameAndAddressOfSchool || ''}
                      onChange={(e) => handleNestedChange(['education', 'elementary', 'nameAndAddressOfSchool'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>General Average</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.education?.elementary?.generalAverage || 0}
                      onChange={(e) => handleNestedChange(['education', 'elementary', 'generalAverage'], parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Honors/Awards</Label>
                    <Input
                      value={formData.education?.elementary?.honorOrAwardsReceived || ''}
                      onChange={(e) => handleNestedChange(['education', 'elementary', 'honorOrAwardsReceived'], e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Secondary Education</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>School Name and Address</Label>
                    <Input
                      value={formData.education?.secondary?.nameAndAddressOfSchool || ''}
                      onChange={(e) => handleNestedChange(['education', 'secondary', 'nameAndAddressOfSchool'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>General Average</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.education?.secondary?.generalAverage || 0}
                      onChange={(e) => handleNestedChange(['education', 'secondary', 'generalAverage'], parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Honors/Awards</Label>
                    <Input
                      value={formData.education?.secondary?.honorOrAwardsReceived || ''}
                      onChange={(e) => handleNestedChange(['education', 'secondary', 'honorOrAwardsReceived'], e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

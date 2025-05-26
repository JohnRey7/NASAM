import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ApplicationFormData {
  _id?: string;
  emailAddress?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  typeOfScholarship: string;
  nameOfScholarshipSponsor: string;
  programOfStudyAndYear: string;
  existingScholarship?: string;
  remainingUnitsIncludingThisTerm: number;
  remainingTermsToGraduate: number;
  citizenship: string;
  civilStatus: string;
  annualFamilyIncome: string;
  currentResidenceAddress?: string;
  residingAt: string;
  permanentResidentialAddress: string;
  contactNumber: string;
  familyBackground: {
    father: {
      firstName: string;
      middleName?: string;
      lastName: string;
      suffix?: string;
      age: number;
      occupation: string;
      grossAnnualIncome: string;
      companyName?: string;
      companyAddress?: string;
      homeAddress?: string;
      contactNumber: string;
    };
    mother: {
      firstName: string;
      middleName?: string;
      lastName: string;
      suffix?: string;
      age: number;
      occupation: string;
      grossAnnualIncome: string;
      companyName?: string;
      companyAddress?: string;
      homeAddress?: string;
      contactNumber: string;
    };
    siblings: Array<{
      name: string;
      age: number;
      programCurrentlyTakingOrFinished?: string;
      schoolOrOccupation?: string;
    }>;
  };
  education: {
    elementary: {
      nameAndAddressOfSchool: string;
      honorOrAwardsReceived?: string;
      nameOfOrganizationAndPositionHeld?: string;
      generalAverage: number;
      rankAmongGraduates?: string;
      contestTrainingsConferencesParticipated?: string;
    };
    secondary: {
      nameAndAddressOfSchool: string;
      honorOrAwardsReceived?: string;
      nameOfOrganizationAndPositionHeld?: string;
      generalAverage: number;
      rankAmongGraduates?: string;
      contestTrainingsConferencesParticipated?: string;
    };
    collegeLevel: Array<{
      yearLevel: number;
      firstSemesterAverageFinalGrade: number;
      secondSemesterAverageFinalGrade: number;
      thirdSemesterAverageFinalGrade?: number;
    }>;
    currentMembershipInOrganizations: Array<{
      nameOfOrganization: string;
      position: string;
    }>;
  };
  references: Array<{
    name: string;
    relationshipToTheApplicant: string;
    contactNumber: string;
  }>;
}

export const applicationService = {
  // Simplified method to handle application submission
  async submitApplication(formData: ApplicationFormData) {
    try {
      console.log('Creating new application');
      return await this.createApplication(formData);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error submitting application:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw new Error(error.response?.data?.message || 'Failed to submit application');
      }
      throw error;
    }
  },

  // Create a new application
  async createApplication(formData: ApplicationFormData) {
    try {
      console.log('Sending application data:', formData);
      const response = await axios.post(`${API_URL}/application`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Application created successfully:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error creating application:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw new Error(error.response?.data?.message || 'Failed to create application');
      }
      throw error;
    }
  },

  // Get the current user's application
  async getMyApplication() {
    try {
      const response = await axios.get(`${API_URL}/application/me`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          // No application found, return null so submitApplication can create one
          return null;
        }
        console.error('Error fetching application:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw new Error(error.response?.data?.message || 'Failed to fetch application');
      }
      throw error;
    }
  },

  // Update the current user's application
  async updateApplication(formData: ApplicationFormData) {
    try {
      console.log('Updating application with data:', JSON.stringify(formData, null, 2));
      const response = await axios.patch(`${API_URL}/application/me`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error updating application:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          requestData: formData,
          headers: error.config?.headers,
          url: error.config?.url
        });
        throw new Error(error.response?.data?.message || 'Failed to update application');
      }
      throw error;
    }
  },

  // Get a specific application by ID (for admins)
  async getApplicationById(id: string) {
    const response = await axios.get(`${API_URL}/application/${id}`, {
      withCredentials: true
    });
    return response.data;
  },

  // Update a specific application by ID (for admins)
  async updateApplicationById(id: string, formData: ApplicationFormData) {
    const response = await axios.patch(`${API_URL}/application/${id}`, formData, {
      withCredentials: true
    });
    return response.data;
  },

  // Delete a specific application by ID (for admins)
  async deleteApplication(id: string) {
    const response = await axios.delete(`${API_URL}/application/${id}`, {
      withCredentials: true
    });
    return response.data;
  },

  // Export application as PDF
  async exportToPDF(applicationId: string) {
    const response = await axios.get(`${API_URL}/application/${applicationId}/pdf`, {
      responseType: 'blob',
      withCredentials: true
    });
    return response.data;
  }
}; 
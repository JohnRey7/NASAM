import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ApplicationFormData {
  user?: string;
  emailAddress?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
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
  async submitApplication(formData: ApplicationFormData) {
    try {
      console.log('Submitting application with data:', JSON.stringify(formData, null, 2));
      return await this.createApplication(formData);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error submitting application:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          requestData: formData,
          config: error.config,
        });
        throw new Error(error.response?.data?.message || 'Failed to submit application');
      }
      console.error('Unexpected error submitting application:', error);
      throw error;
    }
  },

  async createApplication(formData: ApplicationFormData) {
    try {
      const cleanedFormData = {
        ...formData,
        education: {
          ...formData.education,
          currentMembershipInOrganizations:
            Array.isArray(formData.education.currentMembershipInOrganizations)
              ? formData.education.currentMembershipInOrganizations.filter(
                  org =>
                    typeof org.nameOfOrganization === 'string' &&
                    org.nameOfOrganization.trim() &&
                    typeof org.position === 'string' &&
                    org.position.trim()
                )
              : [],
        },
      };
      console.log('Sending application data:', JSON.stringify(cleanedFormData, null, 2));
      const response = await axios.post(`${API_URL}/application`, cleanedFormData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Application created successfully:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error creating application:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          requestData: formData,
          config: error.config,
        });
        throw new Error(error.response?.data?.message || 'Failed to create application');
      }
      console.error('Unexpected error creating application:', error);
      throw error;
    }
  },

  async getMyApplication() {
    try {
      console.log('Fetching application from:', `${API_URL}/application`);
      const response = await axios.get(`${API_URL}/application`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Fetched application:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching application:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          config: error.config,
        });
        if (error.response?.status === 400 || error.response?.status === 404) {
          console.log('No application found or invalid request, returning null');
          return null; // Handle no application or invalid request
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch application');
      }
      console.error('Unexpected error fetching application:', error);
      throw error;
    }
  },

  async updateApplication(formData: ApplicationFormData) {
    try {
      const cleanedFormData = {
        ...formData,
        education: {
          ...formData.education,
          currentMembershipInOrganizations:
            Array.isArray(formData.education.currentMembershipInOrganizations)
              ? formData.education.currentMembershipInOrganizations.filter(
                  org =>
                    typeof org.nameOfOrganization === 'string' &&
                    org.nameOfOrganization.trim() &&
                    typeof org.position === 'string' &&
                    org.position.trim()
                )
              : [],
        },
      };
      console.log('Updating application with data:', JSON.stringify(cleanedFormData, null, 2));
      const response = await axios.patch(`${API_URL}/application/me`, cleanedFormData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
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
          config: error.config,
        });
        throw new Error(error.response?.data?.message || 'Failed to update application');
      }
      console.error('Unexpected error updating application:', error);
      throw error;
    }
  },

  async getApplicationById(id: string) {
    try {
      console.log('Fetching application by ID:', id);
      const response = await axios.get(`${API_URL}/application/${id}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Fetched application by ID:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching application by ID:', {
          status: error.response?.status,
          data: error.response?.data,
          message占有: error.message,
          config: error.config,
        });
        throw new Error(error.response?.data?.message || 'Failed to fetch application');
      }
      console.error('Unexpected error fetching application by ID:', error);
      throw error;
    }
  },

  async updateApplicationById(id: string, formData: ApplicationFormData) {
    try {
      const cleanedFormData = {
        ...formData,
        education: {
          ...formData.education,
          currentMembershipInOrganizations:
            Array.isArray(formData.education.currentMembershipInOrganizations)
              ? formData.education.currentMembershipInOrganizations.filter(
                  org =>
                    typeof org.nameOfOrganization === 'string' &&
                    org.nameOfOrganization.trim() &&
                    typeof org.position === 'string' &&
                    org.position.trim()
              )
              : [],
        },
      };
      console.log('Updating application by ID with data:', JSON.stringify(cleanedFormData, null, 2));
      const response = await axios.patch(`${API_URL}/application/${id}`, cleanedFormData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Updated application by ID:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error updating application by ID:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          requestData: formData,
          config: error.config,
        });
        throw new Error(error.response?.data?.message || 'Failed to update application');
      }
      console.error('Unexpected error updating application by ID:', error);
      throw error;
    }
  },

  async deleteApplication(id: string) {
    try {
      console.log('Deleting application with ID:', id);
      const response = await axios.delete(`${API_URL}/application/${id}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Deleted application:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error deleting application:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          config: error.config,
        });
        throw new Error(error.response?.data?.message || 'Failed to delete application');
      }
      console.error('Unexpected error deleting application:', error);
      throw error;
    }
},

  async exportToPDF(applicationId: string) {
    try {
      console.log('Exporting application ID:', applicationId);
      const response = await axios.get(`${API_URL}/application/${applicationId}/pdf`, {
        responseType: 'blob',
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Exported application to PDF');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error exporting application to PDF:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          config: error.config,
        });
        throw new Error(error.response?.data?.message || 'Failed to export application to PDF');
      }
      console.error('Unexpected error exporting application to PDF:', error);
      throw error;
    }
  },
};
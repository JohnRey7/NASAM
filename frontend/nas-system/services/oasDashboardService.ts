import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const oasDashboardService = {
  async getDashboardStats() {
    // This calls the backend endpoint /api/oas/dashboard-stats
    // that returns { newApplications, documentVerifications, scheduledInterviews, activeScholars }
    const response = await axios.get(`${API_URL}/oas/dashboard-stats`, { withCredentials: true });
    return response.data;
  },
  async assignApplicantToDepartment(userId: string, departmentCode: string) {
    try {
      const response = await axios.post(`${API_URL}/admin/assign-applicant-to-department`, { userId, departmentCode }, { withCredentials: true });
      return response.data;
    } catch (error: any) {
      console.error('❌ Assignment service error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to assign applicant to department');
    }
  },
}; 
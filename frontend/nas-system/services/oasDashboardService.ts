import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const oasDashboardService = {
  async getDashboardStats() {
    // This assumes you have a backend endpoint like /api/oas-dashboard/stats
    // that returns { newApplications, documentVerifications, scheduledInterviews, activeScholars }
    const response = await axios.get(`${API_URL}/oas-dashboard/stats`, { withCredentials: true });
    return response.data;
  },
}; 
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const oasAnalyticsService = {
  async getAnalytics() {
    const response = await axios.get(`${API_URL}/oas/analytics`, { withCredentials: true });
    return response.data;
  }
};

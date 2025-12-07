import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const oasAnalyticsService = {
  async getAnalytics() {
    const response = await axios.get(`${API_URL}/oas/analytics`, { withCredentials: true });
    return response.data;
  },

  async exportAnalytics(format: 'csv' | 'pdf' = 'csv') {
    const response = await axios.get(`${API_URL}/oas/analytics/export`, {
      params: { format },
      responseType: 'blob',
      withCredentials: true
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Set filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'pdf' ? 'pdf' : 'csv';
    link.setAttribute('download', `analytics-report-${timestamp}.${extension}`);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response;
  }
};

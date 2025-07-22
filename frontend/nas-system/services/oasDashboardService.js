export const oasDashboardService = {
  async getDashboardStats() {
    try {
      console.log('🔍 Fetching dashboard stats...');
      
      const response = await fetch('http://localhost:3000/api/oas/dashboard-stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Dashboard stats received:', data);
      
      return data.stats; // Return the stats object
    } catch (error) {
      console.warn('⚠️ Dashboard stats service error:', error);
      throw error;
    }
  }

  // Add other dashboard-related methods here if needed
};
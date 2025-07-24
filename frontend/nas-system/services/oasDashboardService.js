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
  },

  async assignApplicantToDepartment(userId, departmentCode) {
    try {
      console.log('🔄 Assigning applicant to department:', { userId, departmentCode });
      
      const response = await fetch('http://localhost:3000/api/admin/assign-applicant-to-department', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, departmentCode })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Applicant assigned successfully:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Assignment service error:', error);
      throw error;
    }
  }

  // Add other dashboard-related methods here if needed
};
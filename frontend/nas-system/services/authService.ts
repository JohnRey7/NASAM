import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const authService = {
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    const response = await axios.post(`${API_URL}/auth/forgot-password/change-password`, { 
      email, 
      code, 
      newPassword 
    });
    return response.data;
  },
  // ... existing code ...

  async logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        withCredentials: true
      });
      // Clear any local storage or state if needed
      localStorage.removeItem('user');
      // You might want to redirect to login page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}; 
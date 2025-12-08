import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface EvaluationPeriod {
  _id: string;
  semester: string;
  schoolYear: string;
  ratingPeriod: string;
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
  openedBy?: any;
  closedBy?: any;
  notes?: string;
}

export const evaluationPeriodService = {
  getCurrentPeriod: async () => {
    const response = await axios.get(`${API_URL}/evaluation-period/current`, { withCredentials: true });
    return response.data;
  },

  getAllPeriods: async () => {
    const response = await axios.get(`${API_URL}/evaluation-period/all`, { withCredentials: true });
    return response.data;
  },

  openPeriod: async (data: { semester: string; schoolYear: string; notes?: string }) => {
    const response = await axios.post(`${API_URL}/evaluation-period/open`, data, { withCredentials: true });
    return response.data;
  },

  closePeriod: async (data: { notes?: string }) => {
    const response = await axios.post(`${API_URL}/evaluation-period/close`, data, { withCredentials: true });
    return response.data;
  }
};

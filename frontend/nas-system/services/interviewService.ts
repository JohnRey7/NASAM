import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Interview {
  _id: string;
  applicationId: any;
  interviewer: any;
  startTime: string;
  endTime: string;
  is_finished: boolean;
  is_deleted: boolean;
}

export interface CreateInterviewData {
  applicationId: string;
  interviewerId: string;
  startTime: string;
  endTime: string;
}

export const interviewService = {
  getAllInterviews: async (params?: any) => {
    const response = await axios.get(`${API_URL}/interviews/all`, { 
      params,
      withCredentials: true 
    });
    return response.data;
  },

  createInterview: async (data: CreateInterviewData) => {
    const response = await axios.post(`${API_URL}/interviews`, data, { withCredentials: true });
    return response.data;
  },

  updateInterview: async (id: string, data: any) => {
    const response = await axios.patch(`${API_URL}/interviews/${id}`, data, { withCredentials: true });
    return response.data;
  },

  deleteInterview: async (id: string) => {
    const response = await axios.delete(`${API_URL}/interviews/${id}`, { withCredentials: true });
    return response.data;
  }
};

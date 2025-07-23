import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const departmentHeadService = {
  async submitEvaluation(data: {
    applicantId: string;
    appearance: number;
    confidence: number;
    communication: number;
    impression: number;
    comments: string;
  }) {
    const response = await axios.post(`${API_URL}/department-head/evaluation`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async scheduleInterview(data: {
    applicantId: string;
    date: string;
    time: string;
    notes: string;
  }) {
    const response = await axios.post(`${API_URL}/department-head/interview`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async submitRecommendation(data: {
    applicantId: string;
    recommendation: 'recommended' | 'not_recommended';
    justification: string;
  }) {
    const response = await axios.post(`${API_URL}/department-head/recommendation`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async getAssignedApplicants() {
    const response = await axios.get(`${API_URL}/department-head/applicants`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async getReviews() {
    const response = await axios.get(`${API_URL}/review`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async getCourses() {
    const response = await axios.get(`${API_URL}/courses`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async getDepartments() {
    const response = await axios.get(`${API_URL}/departments?limit=1000`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data.data || response.data;
  },

  async registerDepartmentHead(data: {
    name: string;
    email: string;
    idNumber: string;
    password: string;
    // Add other fields as required by your backend
  }) {
    const response = await axios.post(`${API_URL}/auth/register/dept-head`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },
}; 
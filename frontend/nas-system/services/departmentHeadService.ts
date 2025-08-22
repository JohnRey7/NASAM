import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const departmentHeadService = {
  async submitEvaluation(data: {
    evaluateeUser: string;
    attendanceAndPunctuality: { rating: number; remarks: string };
    qualityOfWorkOutput: { rating: number; remarks: string };
    quantityOfWorkOutput: { rating: number; remarks: string };
    attitudeAndWorkBehavior: { rating: number; remarks: string };
    remarksAndRecommendationByImmediateSupervisor: string;
    remarksCommentsByTheNAS?: string;
    overallRating: number;
  }) {
    const response = await axios.post(`${API_URL}/evaluations`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async scheduleInterview(applicantId: string, scheduleDateTime: string, reason?: string) {
    const response = await axios.post(`${API_URL}/department-head/interview/schedule`, {
      applicationId: applicantId,
      interviewDate: scheduleDateTime,
      notes: reason || 'Scheduled by Department Head'
    }, {
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

  // Eye action functionality methods
  async getApplicationDetails(userId: string) {
    const response = await axios.get(`${API_URL}/application/user/${userId}`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async getApplicationDocuments(applicationId: string) {
    const response = await axios.get(`${API_URL}/oas/application/${applicationId}/documents`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async downloadApplicationPDF(userId: string) {
    const response = await axios.get(`${API_URL}/application/${userId}/pdf`, {
      withCredentials: true,
      responseType: 'blob',
    });
    return response.data;
  },

  async getPersonalityTestData(userId: string) {
    const response = await axios.get(`${API_URL}/personality-test/user/${userId}`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async getInterviewData(userId: string) {
    const response = await axios.get(`${API_URL}/interview/user/${userId}`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async rescheduleInterview(interviewId: string, newDate: string, newTime: string, notes?: string) {
    const response = await axios.patch(`${API_URL}/department-head/interview/${interviewId}/reschedule`, {
      date: newDate,
      time: newTime,
      notes: notes
    }, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async notifyApplicant(applicantId: string, message: string, type: string = 'interview_scheduled') {
    const response = await axios.post(`${API_URL}/notifications`, {
      recipientId: applicantId,
      message,
      type,
      priority: 'high'
    }, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },
};
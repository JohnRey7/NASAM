import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ScholarEvaluationData {
  scholar: string;
  scholarName: string;
  studentId: string;
  course: string;
  department: string;
  evaluatorPosition: string;
  
  attendanceAndPunctuality: {
    regularityOfAttendance: number;
    promptnessInReporting: number;
  };
  
  qualityOfWorkOutput: {
    accuracyAndThoroughness: number;
    organizationAndPresentation: number;
    effectiveness: number;
  };
  
  quantityOfWorkOutput: {
    accomplishesMoreWork: number;
    readinessInAccomplishing: number;
  };
  
  personalQualities: {
    responsibilityAndUrgency: number;
    dependabilityAndReliability: number;
    industryAndResourcefulness: number;
    fairnessAndInitiative: number;
    sociabilityAndDisposition: number;
  };
  
  timekeepingRecord: {
    excusedAbsences: number;
    unexcusedAbsences: number;
    lateMoreThan10mins: number;
    lateLessThan1hr: number;
    failureToPunch: number;
    underTime: number;
  };
  
  supervisorRemarks: string;
  nasRemarks?: string;
}

export const scholarEvaluationService = {
  // ==================== EVALUATION PERIOD ====================
  
  async getCurrentPeriod() {
    const response = await axios.get(`${API_URL}/evaluation-period/current`, {
      withCredentials: true
    });
    return response.data;
  },
  
  async getAllPeriods() {
    const response = await axios.get(`${API_URL}/evaluation-period/all`, {
      withCredentials: true
    });
    return response.data;
  },
  
  async openEvaluationPeriod(semester: string, schoolYear: string, notes?: string) {
    const response = await axios.post(`${API_URL}/evaluation-period/open`, {
      semester,
      schoolYear,
      notes
    }, {
      withCredentials: true
    });
    return response.data;
  },
  
  async closeEvaluationPeriod() {
    const response = await axios.post(`${API_URL}/evaluation-period/close`, {}, {
      withCredentials: true
    });
    return response.data;
  },
  
  // ==================== EVALUATIONS ====================
  
  async createEvaluation(data: ScholarEvaluationData) {
    const response = await axios.post(`${API_URL}/scholar-evaluation`, data, {
      withCredentials: true
    });
    return response.data;
  },
  
  async updateEvaluation(id: string, data: Partial<ScholarEvaluationData>) {
    const response = await axios.patch(`${API_URL}/scholar-evaluation/${id}`, data, {
      withCredentials: true
    });
    return response.data;
  },
  
  async getMyEvaluations(semester?: string, schoolYear?: string) {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (schoolYear) params.append('schoolYear', schoolYear);
    
    const response = await axios.get(`${API_URL}/scholar-evaluation/my?${params.toString()}`, {
      withCredentials: true
    });
    return response.data;
  },
  
  async getEvaluationById(id: string) {
    const response = await axios.get(`${API_URL}/scholar-evaluation/${id}`, {
      withCredentials: true
    });
    return response.data;
  },
  
  async deleteEvaluation(id: string) {
    const response = await axios.delete(`${API_URL}/scholar-evaluation/${id}`, {
      withCredentials: true
    });
    return response.data;
  },
  
  // ==================== ADMIN VIEWS ====================
  
  async getAllEvaluations(semester?: string, schoolYear?: string, department?: string) {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (schoolYear) params.append('schoolYear', schoolYear);
    if (department) params.append('department', department);
    
    const response = await axios.get(`${API_URL}/scholar-evaluation/all/list?${params.toString()}`, {
      withCredentials: true
    });
    return response.data;
  },
  
  async getEvaluationStatistics(semester?: string, schoolYear?: string) {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (schoolYear) params.append('schoolYear', schoolYear);
    
    const response = await axios.get(`${API_URL}/scholar-evaluation/statistics/summary?${params.toString()}`, {
      withCredentials: true
    });
    return response.data;
  }
};

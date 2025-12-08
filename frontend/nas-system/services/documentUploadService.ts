import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface DocumentUpload {
  _id: string;
  user: any;
  studentPicture?: any;
  nbiClearance?: any[];
  gradeReport?: any[];
  incomeTaxReturn?: any[];
  goodMoralCertificate?: any[];
  physicalCheckup?: any[];
  updatedAt: string;
}

export const documentUploadService = {
  getAllDocuments: async (params?: any) => {
    const response = await axios.get(`${API_URL}/document-uploads/all`, { 
      params,
      withCredentials: true 
    });
    return response.data;
  },

  getDocumentsByUser: async (userId: string) => {
    const response = await axios.get(`${API_URL}/document-uploads/user/${userId}`, { withCredentials: true });
    return response.data;
  },

  deleteDocument: async (userId: string) => {
    const response = await axios.delete(`${API_URL}/document-uploads/${userId}`, { withCredentials: true });
    return response.data;
  }
};

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  idNumber: string;
  role: string;
  roleId?: string;
  departmentCode?: string;
  courseId?: string;
  is_disabled: boolean;
  is_deleted: boolean;
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  idNumber: string;
  password?: string;
  roleId: string;
  departmentCode?: string;
  courseId?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roleId?: string;
  departmentCode?: string;
  courseId?: string;
}

const userService = {
  getAllUsers: async (params?: any) => {
    const response = await axios.get(`${API_URL}/users`, { 
      params,
      withCredentials: true 
    });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await axios.get(`${API_URL}/users/${id}`, { withCredentials: true });
    return response.data;
  },

  createUser: async (data: CreateUserData) => {
    const response = await axios.post(`${API_URL}/users`, data, { withCredentials: true });
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserData) => {
    const response = await axios.patch(`${API_URL}/users/${id}`, data, { withCredentials: true });
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await axios.delete(`${API_URL}/users/${id}`, { withCredentials: true });
    return response.data;
  },

  disableUser: async (id: string) => {
    const response = await axios.patch(`${API_URL}/users/${id}/disable`, {}, { withCredentials: true });
    return response.data;
  },

  enableUser: async (id: string) => {
    const response = await axios.patch(`${API_URL}/users/${id}/enable`, {}, { withCredentials: true });
    return response.data;
  },
  
  getDisabledUsers: async () => {
    const response = await axios.get(`${API_URL}/users/disabled`, { withCredentials: true });
    return response.data;
  },

  getDeletedUsers: async () => {
    const response = await axios.get(`${API_URL}/users/deleted`, { withCredentials: true });
    return response.data;
  }
};

export default userService;

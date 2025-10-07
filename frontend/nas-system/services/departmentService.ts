import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Department {
  _id: string;
  departmentCode: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentData {
  departmentCode: string;
  name: string;
}

export interface UpdateDepartmentData {
  departmentCode?: string;
  name?: string;
}

export interface DepartmentListResponse {
  data: Department[];
  total: number;
  page: number;
  pages: number;
}

const departmentService = {
  // Get all departments with pagination and search
  async getAllDepartments(page: number = 1, limit: number = 10, search: string = ''): Promise<DepartmentListResponse> {
    const response = await axios.get(`${API_URL}/api/departments`, {
      params: { page, limit, search },
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // Get department by code
  async getDepartmentByCode(departmentCode: string): Promise<Department> {
    const response = await axios.get(`${API_URL}/api/departments/${departmentCode}`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // Create new department
  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    const response = await axios.post(`${API_URL}/api/departments`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // Update department
  async updateDepartment(departmentCode: string, data: UpdateDepartmentData): Promise<Department> {
    const response = await axios.patch(`${API_URL}/api/departments/${departmentCode}`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // Delete department
  async deleteDepartment(departmentCode: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/api/departments/${departmentCode}`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },
};

export default departmentService;

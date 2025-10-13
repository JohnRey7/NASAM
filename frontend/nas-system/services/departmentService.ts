import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
    console.log('🏢 Fetching departments:', { page, limit, search });
    console.log('🏢 API URL:', `${API_URL}/departments`);
    
    try {
      const response = await axios.get(`${API_URL}/departments`, {
        params: { page, limit, search },
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('🏢 Department response:', response.data);
      console.log('🏢 Number of departments:', response.data?.data?.length || 0);
      
      return response.data;
    } catch (error) {
      console.error('🏢 Error fetching departments:', error);
      throw error;
    }
  },

  // Get department by code
  async getDepartmentByCode(departmentCode: string): Promise<Department> {
    const response = await axios.get(`${API_URL}/departments/${departmentCode}`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // Create new department
  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    const response = await axios.post(`${API_URL}/departments`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // Update department
  async updateDepartment(departmentCode: string, data: UpdateDepartmentData): Promise<Department> {
    const response = await axios.patch(`${API_URL}/departments/${departmentCode}`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // Delete department
  async deleteDepartment(departmentCode: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/departments/${departmentCode}`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },
};

export default departmentService;

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Permission {
  _id: string;
  name: string;
  description?: string;
}

export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[] | string[];
  is_deleted: boolean;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

const roleService = {
  getAllRoles: async (params?: any) => {
    const response = await axios.get(`${API_URL}/roles`, { 
      params,
      withCredentials: true 
    });
    return response.data;
  },

  getRoleById: async (id: string) => {
    const response = await axios.get(`${API_URL}/roles/${id}`, { withCredentials: true });
    return response.data;
  },

  createRole: async (data: CreateRoleData) => {
    const response = await axios.post(`${API_URL}/roles`, data, { withCredentials: true });
    return response.data;
  },

  updateRole: async (id: string, data: UpdateRoleData) => {
    const response = await axios.patch(`${API_URL}/roles/${id}`, data, { withCredentials: true });
    return response.data;
  },

  deleteRole: async (id: string) => {
    const response = await axios.delete(`${API_URL}/roles/${id}`, { withCredentials: true });
    return response.data;
  },

  getAllPermissions: async () => {
    const response = await axios.get(`${API_URL}/roles/permissions`, { withCredentials: true });
    return response.data;
  }
};

export default roleService;

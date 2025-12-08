import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Department {
  _id: string;
  departmentCode: string;
  name: string;
}

export interface Course {
  _id: string;
  courseId: string;
  name: string;
  departmentId?: Department | string | null;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseData {
  courseId: string;
  name: string;
  departmentId?: string;
}

export interface UpdateCourseData {
  courseId?: string;
  name?: string;
  departmentId?: string | null;
}

export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  pages: number;
}

const courseService = {
  // Get all courses (public access for registration)
  async getPublicCourses(): Promise<Course[]> {
    try {
      const response = await axios.get(`${API_URL}/course/public`, {
        params: { limit: 100 }, // Fetch all relevant courses
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data.courses || [];
    } catch (error) {
      console.error('Error fetching public courses:', error);
      return [];
    }
  },

  // Get all courses with pagination and search
  async getAllCourses(page: number = 1, limit: number = 25, search: string = ''): Promise<CourseListResponse> {
    console.log('📚 Fetching courses:', { page, limit, search });
    
    try {
      const response = await axios.get(`${API_URL}/course/all`, {
        params: { page, limit, search },
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('📚 Course response:', response.data);
      // Backend returns { message, courses, pagination }
      // Map it to the frontend-friendly shape { courses, total, page, pages }
      const { courses = [], pagination = {} } = response.data || {};
      return {
        courses,
        total: pagination.totalCourses || 0,
        page: pagination.currentPage || page,
        pages: pagination.totalPages || 1
      };
    } catch (error) {
      console.error('📚 Error fetching courses:', error);
      throw error;
    }
  },

  // Get deleted courses
  async getDeletedCourses(page: number = 1, limit: number = 25): Promise<CourseListResponse> {
    console.log('📚 Fetching deleted courses:', { page, limit });
    
    try {
      const response = await axios.get(`${API_URL}/course/all/deleted`, {
        params: { page, limit },
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('📚 Deleted courses response:', response.data);
      const { courses = [], pagination = {} } = response.data || {};
      return {
        courses,
        total: pagination.totalCourses || 0,
        page: pagination.currentPage || page,
        pages: pagination.totalPages || 1
      };
    } catch (error) {
      console.error('📚 Error fetching deleted courses:', error);
      throw error;
    }
  },

  // Create new course
  async createCourse(data: CreateCourseData): Promise<Course> {
    console.log('📚 Creating course:', data);
    
    const response = await axios.post(`${API_URL}/course`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data.course || response.data;
  },

  // Update course by courseId
  async updateCourse(courseId: string, data: UpdateCourseData): Promise<Course> {
    console.log('📚 Updating course:', courseId, data);
    
    const response = await axios.put(`${API_URL}/course/${courseId}`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data.course || response.data;
  },

  // Soft delete course by courseId
  async softDeleteCourse(courseId: string): Promise<{ message: string }> {
    console.log('📚 Soft deleting course:', courseId);
    
    const response = await axios.delete(`${API_URL}/course/${courseId}/soft`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // Permanently delete course by courseId
  async permanentDeleteCourse(courseId: string): Promise<{ message: string }> {
    console.log('📚 Permanently deleting course:', courseId);
    
    const response = await axios.delete(`${API_URL}/course/${courseId}/permanent`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // Restore soft-deleted course by courseId
  async restoreCourse(courseId: string): Promise<Course> {
    console.log('📚 Restoring course:', courseId);
    
    const response = await axios.put(`${API_URL}/course/${courseId}/restore`, {}, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data.course || response.data;
  },

  // Get courses by department
  async getCoursesByDepartment(departmentId: string, page: number = 1, limit: number = 25): Promise<CourseListResponse> {
    console.log('📚 Fetching courses by department:', { departmentId, page, limit });
    
    try {
      const response = await axios.get(`${API_URL}/course/department/${departmentId}`, {
        params: { page, limit },
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('📚 Courses by department response:', response.data);
      const { courses = [], pagination = {} } = response.data || {};
      return {
        courses,
        total: pagination.totalCourses || 0,
        page: pagination.currentPage || page,
        pages: pagination.totalPages || 1
      };
    } catch (error) {
      console.error('📚 Error fetching courses by department:', error);
      throw error;
    }
  },
};

export default courseService;

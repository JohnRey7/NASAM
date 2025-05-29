const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

export interface Application {
  _id: string
  firstName: string
  lastName: string
  emailAddress: string
  status: 'Pending' | 'Document Verification' | 'Interview Scheduled' | 'Approved' | 'Rejected'
  createdAt: string
  updatedAt: string
  user: {
    _id: string
    name: string
    idNumber: string
  }
}

export interface DashboardStats {
  newApplications: number
  documentVerification: number
  scheduledInterviews: number
  activeScholars: number
  totalApplications: number
}

class OASService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    }

    const token = getCookie('jwt')
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async getAllApplications(): Promise<{ applications: Application[], pagination: any }> {
    try {
      const data = await this.makeRequest('/application/all')
      return {
        applications: data.applications || [],
        pagination: data.pagination || {}
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      throw error
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const data = await this.makeRequest('/application/all?limit=1000') // Get all to calculate stats
      const applications = data.applications || []
      
      const stats = {
        newApplications: applications.filter((app: Application) => app.status === 'Pending').length,
        documentVerification: applications.filter((app: Application) => app.status === 'Document Verification').length,
        scheduledInterviews: applications.filter((app: Application) => app.status === 'Interview Scheduled').length,
        activeScholars: applications.filter((app: Application) => app.status === 'Approved').length,
        totalApplications: applications.length
      }
      
      return stats
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }

  async updateApplicationStatus(applicationId: string, status: string): Promise<void> {
    try {
      await this.makeRequest('/application/status', {
        method: 'PUT',
        body: JSON.stringify({ applicationId, status })
      })
    } catch (error) {
      console.error('Error updating application status:', error)
      throw error
    }
  }

  async getApplicationById(id: string): Promise<Application> {
    try {
      const data = await this.makeRequest(`/application/${id}`)
      return data.application
    } catch (error) {
      console.error('Error fetching application:', error)
      throw error
    }
  }

  async deleteApplication(id: string): Promise<void> {
    try {
      await this.makeRequest(`/application/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting application:', error)
      throw error
    }
  }
}

export const oasService = new OASService()
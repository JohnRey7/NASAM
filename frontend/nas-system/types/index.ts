export interface User {
  id: string
  email: string
  name: string
  role: "applicant" | "oas_staff" | "admin" | "department_head"
  isActive?: boolean
}

export type StatusType = "pending" | "reviewing" | "approved" | "rejected" | "incomplete"

export interface Application {
  _id: string
  applicantName: string
  email: string
  status: StatusType
  createdAt: string
  updatedAt: string
  documentsCount: number
}

export interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadDate: string
  status: "uploaded" | "verified" | "rejected"
}
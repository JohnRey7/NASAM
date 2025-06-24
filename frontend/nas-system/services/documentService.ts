import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

import { DocumentType } from "../components/document-upload"; // Adjusted path

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "complete" | "error";
  file: File | null;
}

interface BackendDocument {
  _id?: string;
  filePath: string;
  originalName: string;
  uploadedAt: string;
}

interface DocumentResponse {
  _id: string;
  applicationId: string;
  studentPicture?: BackendDocument;
  nbiClearance: BackendDocument[];
  gradeReport: BackendDocument[];
  incomeTaxReturn: BackendDocument[];
  goodMoralCertificate: BackendDocument[];
  physicalCheckup: BackendDocument[];
  certificates: BackendDocument[];
  homeLocationSketch: BackendDocument[];
  createdAt: string;
  updatedAt: string;
}

export const backendFieldMap: Record<DocumentType, string> = {
  studentPicture: "studentPicture",
  grades: "gradeReport",
  itr: "incomeTaxReturn",
  nbi: "nbiClearance",
  goodMoral: "goodMoralCertificate",
  physicalCheckup: "physicalCheckup",
  homeLocationSketch: "homeLocationSketch",
};

export const documentService = {
  // Upload documents
  async uploadDocuments(documents: Document[]): Promise<void> {
    const formData = new FormData();
    documents.forEach((doc) => {
      if (doc.file) {
        const backendField = backendFieldMap[doc.type];
        if (backendField) {
          formData.append(backendField, doc.file);
        }
      }
    });

    const response = await fetch(`${API_URL}/documents`, {
      method: "PUT",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to upload documents");
    }
  },

  // Fetch documents
  async getDocuments(): Promise<Document[]> {
    const response = await fetch(`${API_URL}/documents`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 404) {
      return []; // No documents found
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch documents");
    }

    const { document }: { document: DocumentResponse } = await response.json();
    const documents: Document[] = Object.entries(document).flatMap(([key, value]) => {
      const type = Object.keys(backendFieldMap).find(
        (k) => backendFieldMap[k as DocumentType] === key
      ) as DocumentType | undefined;
      if (!type || key === "_id" || key === "applicationId" || key === "createdAt" || key === "updatedAt") {
        return [];
      }
      return (Array.isArray(value) ? value : [value]).map((doc: BackendDocument) => ({
        id: doc._id || Math.random().toString(36).substring(2, 9),
        type,
        name: doc.originalName,
        size: 0, // Size not provided by backend; consider adding file size in backend response
        progress: 100,
        status: "complete" as const,
        file: null,
      }));
    });

    return documents;
  },

  // Delete all documents
  async deleteDocuments(): Promise<void> {
    const response = await fetch(`${API_URL}/documents`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete documents");
    }
  },

  // Placeholder for individual document deletion (requires new backend endpoint)
  /*
  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete document");
    }
  },
  */
};
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

interface GradeAverages {
  elementary?: number;
  juniorHighSchool?: number;
  seniorHighSchool?: number;
  college?: number;
}

interface IncomeTaxInfo {
  annualIncome?: number;
  taxableIncome?: number;
  taxYear?: string;
  employerName?: string;
  tin?: string;
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
  personalityTestPaymentReceipt: BackendDocument[];
  gradeAverages?: GradeAverages;
  incomeTaxInfo?: IncomeTaxInfo;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentsWithMetadata {
  documents: Document[];
  gradeAverages?: GradeAverages;
  incomeTaxInfo?: IncomeTaxInfo;
}

export const backendFieldMap: Record<DocumentType, string> = {
  studentPicture: "studentPicture",
  grades: "gradeReport",
  itr: "incomeTaxReturn",
  nbi: "nbiClearance",
  goodMoral: "goodMoralCertificate",
  physicalCheckup: "physicalCheckup",
  homeLocationSketch: "homeLocationSketch",
  personalityTestPaymentReceipt: "personalityTestPaymentReceipt",
};

export const documentService = {
  // Upload documents with grade averages and income tax info
  async uploadDocuments(
    documents: Document[], 
    gradeAverages?: {
      elementary?: number;
      juniorHighSchool?: number;
      seniorHighSchool?: number;
      college?: number;
    },
    incomeTaxInfo?: {
      annualIncome?: number;
      taxableIncome?: number;
      taxYear?: string;
      employerName?: string;
      tin?: string;
    }
  ): Promise<DocumentsWithMetadata> {
    console.log('📤 Frontend: Starting upload with documents:', documents);
    console.log('📤 Frontend: Documents with files:', documents.filter(doc => doc.file));
    
    const formData = new FormData();
    let fileCount = 0;
    
    documents.forEach((doc) => {
      console.log('📤 Frontend: Processing document:', { type: doc.type, hasFile: !!doc.file, fileName: doc.file?.name });
      if (doc.file) {
        const backendField = backendFieldMap[doc.type];
        console.log('📤 Frontend: Backend field mapping:', { type: doc.type, backendField });
        if (backendField) {
          formData.append(backendField, doc.file);
          fileCount++;
          console.log('📤 Frontend: Added file to FormData:', { backendField, fileName: doc.file.name });
        } else {
          console.warn('📤 Frontend: No backend field mapping found for type:', doc.type);
        }
      }
    });
    
    console.log('📤 Frontend: Total files added to FormData:', fileCount);

    // Add grade averages and income tax info as JSON
    if (gradeAverages) {
      formData.append('gradeAverages', JSON.stringify(gradeAverages));
    }
    if (incomeTaxInfo) {
      formData.append('incomeTaxInfo', JSON.stringify(incomeTaxInfo));
    }

    const response = await fetch(`${API_URL}/documents`, {
      method: "PUT",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to upload documents");
    }

    // Parse the upload response and convert it to the same format as getDocumentsWithMetadata
    const { document }: { document: DocumentResponse } = await response.json();
    const uploadedDocuments: Document[] = Object.entries(document).flatMap(([key, value]) => {
      const type = Object.keys(backendFieldMap).find(
        (k) => backendFieldMap[k as DocumentType] === key
      ) as DocumentType | undefined;
      if (!type || key === "_id" || key === "applicationId" || key === "createdAt" || key === "updatedAt" || key === "gradeAverages" || key === "incomeTaxInfo") {
        return [];
      }
      if (!value) return [];
      return (Array.isArray(value) ? value : [value]).filter(Boolean).map((doc: BackendDocument) => ({
        id: doc._id || Math.random().toString(36).substring(2, 9),
        type,
        name: doc.originalName,
        size: 0,
        progress: 100,
        status: "complete" as const,
        file: null,
      }));
    });

    return {
      documents: uploadedDocuments,
      gradeAverages: document.gradeAverages,
      incomeTaxInfo: document.incomeTaxInfo,
    };
  },

  // Fetch documents with metadata (grade averages and income tax info)
  async getDocumentsWithMetadata(): Promise<DocumentsWithMetadata> {
    const response = await fetch(`${API_URL}/documents`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 404) {
      return { documents: [], gradeAverages: undefined, incomeTaxInfo: undefined };
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
      if (!type || key === "_id" || key === "applicationId" || key === "createdAt" || key === "updatedAt" || key === "gradeAverages" || key === "incomeTaxInfo") {
        return [];
      }
      if (!value) return [];
      return (Array.isArray(value) ? value : [value]).filter(Boolean).map((doc: BackendDocument) => ({
        id: doc._id || Math.random().toString(36).substring(2, 9),
        type,
        name: doc.originalName,
        size: 0,
        progress: 100,
        status: "complete" as const,
        file: null,
      }));
    });

    return {
      documents,
      gradeAverages: document.gradeAverages,
      incomeTaxInfo: document.incomeTaxInfo,
    };
  },

  // Fetch documents (legacy, returns only documents array)
  async getDocuments(): Promise<Document[]> {
    const result = await this.getDocumentsWithMetadata();
    return result.documents;
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
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, CheckCircle, Eye, MessageSquare, Search, ClipboardCheck, Bell, Plus, Download, AlertTriangle, XCircle, RefreshCw, X, ZoomIn, ZoomOut, RotateCcw, Trash2 } from "lucide-react";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import React, { useState, useEffect } from "react";
import { departmentHeadService } from "@/services/departmentHeadService";
import { scholarEvaluationService } from "@/services/scholarEvaluationService";
import { ScholarEvaluationForm } from "@/components/scholar-evaluation-form";
import { MessageButton } from "@/components/message-button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface InterviewData {
  _id: string;
  interviewId: string;
  applicantName: string;
  applicantEmail?: string;
  applicantIdNumber?: string;
  course: string;
  courseId?: string;
  department?: string;
  departmentCode?: string;
  applicantDepartment?: string;
  schedule: string;
  status: 'not yet scheduled' | 'pending interview' | 'pending evaluation' | 'evaluated' | 'approved' | 'rejected';
  applicationStatus?: string;
  idNumber?: string;
  hasEvaluation?: boolean;
  // Backend fields
  applicationId?: any;
  interviewer?: any;
  type?: string;
  startTime?: string;
  endTime?: string;
  is_finished?: boolean;
  is_deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  programOfStudyAndYear?: string;
}

// Helper function to safely extract numeric values from MongoDB $numberDecimal format
const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'object' && value.$numberDecimal) {
    return parseFloat(value.$numberDecimal) || 0;
  }
  return 0;
};

const toInterviewDisplayDate = (dateValue: any) => {
  const d = new Date(dateValue)
  return new Date(d.getTime() - 8 * 60 * 60 * 1000)
}

export default function DepartmentHeadDashboardPage() {
  const { user } = useAuth();
  const { confirm, ConfirmDialog } = useConfirmation();
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [applicationDetails, setApplicationDetails] = useState<any>(null);
  const [interviewSchedule, setInterviewSchedule] = useState<string>('');
  const [scheduleReason, setScheduleReason] = useState<string>('');
  const [stats, setStats] = useState({
    scheduledInterviews: 0,
    completedInterviews: 0,
    pendingRecommendations: 0
  });
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 10;
  
  // Evaluation state
  const [evaluationPeriod, setEvaluationPeriod] = useState<any>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [selectedScholar, setSelectedScholar] = useState<any>(null);
  const [scholars, setScholars] = useState<any[]>([]);
  const [userDepartment, setUserDepartment] = useState<any>(null);
  const [scholarEvaluations, setScholarEvaluations] = useState<any[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [isViewingEvaluation, setIsViewingEvaluation] = useState(false);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [showEvaluationSelector, setShowEvaluationSelector] = useState(false);
  const [pendingScholarForEvaluation, setPendingScholarForEvaluation] = useState<any>(null);
  
  // Document state
  const [documents, setDocuments] = useState<any>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  
  // Personality test state  
  const [personalityTestData, setPersonalityTestData] = useState<any>(null);
  const [personalityTestLoading, setPersonalityTestLoading] = useState(false);
  
  // Interview state
  const [interviewData, setInterviewData] = useState<any>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  const [interviewers, setInterviewers] = useState<any[]>([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("09:00");
  const [interviewEndTime, setInterviewEndTime] = useState("10:00");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [reschedulingInterviewId, setReschedulingInterviewId] = useState<string | null>(null);
  
  // Image preview state
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  // Helper function to check if file is an image
  const isImageFile = (filename: string | undefined): boolean => {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerFilename = filename.toLowerCase();
    return imageExtensions.some(ext => lowerFilename.endsWith(ext));
  };

  // Handle preview document (for images)
  const handlePreviewDocument = async (docType: string, filePath: string, originalName?: string) => {
    const filename = originalName || filePath;
    if (!isImageFile(filename)) {
      toast({
        title: "Preview Not Available",
        description: "Preview is only available for image files. Use Download instead.",
      });
      return;
    }

    try {
      const cleanFilePath = filePath.replace(/^files\//, '');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/files/${cleanFilePath}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewImage({ url, name: originalName || docType });
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: `Failed to preview ${docType}: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  };

  // Close preview and cleanup
  const closePreview = () => {
    if (previewImage?.url) {
      window.URL.revokeObjectURL(previewImage.url);
    }
    setPreviewImage(null);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      if (newZoom <= 1) {
        setImagePosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setImagePosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Function to fetch application details
  const fetchApplicationDetails = async (applicationId: string) => {
    try {
      console.log('🔍 Fetching application details for applicationId:', applicationId);
      
      // Fetch full application data from the department-head API endpoint
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/department-head/application/${applicationId}`,
        { credentials: 'include' }
      );
      
      // Fallback to general application endpoint if department-head endpoint fails
      if (!response.ok) {
        console.log('📋 Department head endpoint failed, trying general endpoint...');
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/application/${applicationId}`,
          { credentials: 'include' }
        );
      }
      
      console.log('📋 Application API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const application = data.application || data;
        console.log('📋 Full application data:', application);
        
        // Calculate GPA from education.collegeLevel
        let gpa = 'N/A';
        if (application.education?.collegeLevel && Array.isArray(application.education.collegeLevel)) {
          const grades = application.education.collegeLevel.flatMap((level: any) => [
            level.firstSemesterAverageFinalGrade,
            level.secondSemesterAverageFinalGrade,
            level.thirdSemesterAverageFinalGrade
          ].filter((grade: any) => grade != null && !isNaN(grade)));
          
          if (grades.length > 0) {
            const avgGrade = grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length;
            gpa = avgGrade.toFixed(2);
          }
        }
        
        // Set the application details with real data from the API
        // Note: Backend uses 'birthDate' not 'dateOfBirth'
        setApplicationDetails({
          _id: application._id,
          userId: application.user?._id || application.user,
          applicationId: application._id,
          firstName: application.firstName || '',
          lastName: application.lastName || '',
          idNumber: application.user?.idNumber || application.idNumber || 'N/A',
          email: application.emailAddress || application.email || 'N/A',
          contactNumber: application.contactNumber || 'N/A',
          dateOfBirth: application.birthDate ? new Date(application.birthDate).toLocaleDateString() : 'N/A',
          gender: application.gender || 'N/A',
          programOfStudyAndYear: application.programOfStudyAndYear || 'N/A',
          gpa: gpa,
          yearLevel: application.yearLevel || 'N/A',
          school: 'CIT-University',
          fatherName: application.familyBackground?.father?.firstName ? 
            `${application.familyBackground.father.firstName} ${application.familyBackground.father.lastName}` : 'N/A',
          motherName: application.familyBackground?.mother?.firstName ? 
            `${application.familyBackground.mother.firstName} ${application.familyBackground.mother.lastName}` : 'N/A',
          familyIncome: application.annualFamilyIncome || 'N/A',
          numberOfSiblings: application.familyBackground?.numberOfSiblings || 'N/A',
          address: application.permanentResidentialAddress || application.currentResidenceAddress || 'N/A'
        });
        
        // Also fetch evaluations for this scholar
        const idNumber = application.user?.idNumber || application.idNumber;
        if (idNumber && idNumber !== 'N/A') {
          fetchScholarEvaluations(idNumber);
        } else {
          setScholarEvaluations([]);
        }
      } else {
        console.warn('⚠️ Failed to fetch application data, using fallback. Status:', response.status);
        // Fallback to interview data
        const interview = interviews.find(i => i._id === applicationId || i.applicationId?._id === applicationId);
        if (interview) {
          setApplicationDetails({
            _id: interview._id,
            userId: interview.applicationId?.user?._id || interview._id,
            applicationId: interview.applicationId?._id,
            firstName: interview.applicantName?.split(' ')[0] || '',
            lastName: interview.applicantName?.split(' ').slice(1).join(' ') || '',
            idNumber: interview.applicantIdNumber || 'N/A',
            email: interview.applicantEmail || 'N/A',
            contactNumber: 'N/A',
            dateOfBirth: 'N/A',
            gender: 'N/A',
            programOfStudyAndYear: interview.course || interview.programOfStudyAndYear || 'N/A',
            gpa: 'N/A',
            yearLevel: 'N/A',
            school: 'CIT-University',
            fatherName: 'N/A',
            motherName: 'N/A',
            familyIncome: 'N/A',
            numberOfSiblings: 'N/A',
            address: 'N/A'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error fetching application details:', error);
      toast({
        title: "Error",
        description: "Failed to load application details",
        variant: "destructive"
      });
    }
  };

  // Function to fetch evaluations for a scholar using /api/evaluations/user/:idNumber
  const fetchScholarEvaluations = async (idNumber: string) => {
    try {
      setLoadingEvaluations(true);
      setSelectedEvaluation(null); // Reset selected evaluation
      
      if (!idNumber || idNumber === 'N/A') {
        console.log('📋 No ID number available, skipping evaluation fetch');
        setScholarEvaluations([]);
        return;
      }
      
      // Use the department-head specific endpoint for fetching evaluations
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/department-head/evaluation/user/${idNumber}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // The response is an array of evaluations
        const evaluations = Array.isArray(data) ? data : (data.evaluations || []);
        setScholarEvaluations(evaluations);
        console.log('📋 Fetched evaluations for scholar:', evaluations);
        
        // Auto-select the first evaluation if available
        if (evaluations.length > 0) {
          setSelectedEvaluation(evaluations[0]);
        }
      } else {
        console.log('📋 No evaluations found or error:', response.status);
        setScholarEvaluations([]);
      }
    } catch (error) {
      console.error('❌ Error fetching scholar evaluations:', error);
      setScholarEvaluations([]);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  // Function to handle PDF download
  const handleDownloadPDF = async (application: any) => {
    try {
      console.log('📋 Downloading PDF for application:', application);
      
      // Try multiple possible application IDs
      const possibleIds = [
        applicationDetails?.applicationId,
        applicationDetails?.userId,
        applicationDetails?._id,
        application._id,
        application.userId
      ].filter(Boolean); // Remove undefined/null values
      
      console.log('🎯 Possible application IDs:', possibleIds);
      
      // Try different possible API endpoints with different IDs
      const endpoints = [];
      for (const id of possibleIds) {
        endpoints.push(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application-by-id/${id}/pdf`,
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/applications/${id}/pdf`,
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/department-head/application/${id}/pdf`,
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/application/${id}/pdf`
        );
      }
      
      let response = null;
      let successfulEndpoint = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log('🔍 Trying endpoint:', endpoint);
          response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
          });
          
          if (response.ok) {
            successfulEndpoint = endpoint;
            console.log('✅ Success with endpoint:', endpoint);
            break;
          } else {
            console.log('❌ Failed with endpoint:', endpoint, 'Status:', response.status);
          }
        } catch (endpointError) {
          console.log('❌ Error with endpoint:', endpoint, endpointError);
          continue;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`All PDF endpoints failed. Last status: ${response?.status || 'Network Error'}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${applicationDetails?.firstName || application.applicantName || 'application'}_${applicationDetails?.lastName || ''}_form.pdf`.replace(/\s+/g, '_');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `PDF downloaded successfully using ${successfulEndpoint}`,
      });
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      toast({
        title: "Error",
        description: `Failed to download PDF: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  };

  // Fetch documents for selected application
  const fetchDocuments = async (applicationId: string, userId?: string, idNumber?: string) => {
    setDocumentsLoading(true);
    setDocuments(null);
    try {
      console.log('📄 Fetching documents:', { applicationId, userId, idNumber });
      
      let response: Response | null = null;
      
      // Try department-head specific endpoint first (using idNumber)
      if (idNumber) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/department-head/documents/${idNumber}`,
          { credentials: 'include' }
        );
        console.log('📄 Department head documents endpoint response:', response.status);
      }

      // Fallback to OAS endpoint
      if (!response?.ok) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${applicationId}/documents`,
          { credentials: 'include' }
        );
        console.log('📄 OAS documents endpoint response:', response.status);
      }

      // Fallback to document endpoint
      if (!response?.ok && idNumber) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/document/${idNumber}`,
          { credentials: 'include' }
        );
        console.log('📄 Document endpoint response:', response.status);
      }

      // Fallback to document-uploads endpoint
      if (!response?.ok && userId) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/document-uploads/user/${userId}`,
          { credentials: 'include' }
        );
        console.log('📄 Document uploads endpoint response:', response.status);
      }

      if (response?.ok) {
        const data = await response.json();
        console.log('📄 Documents raw data:', data);
        
        // Transform the data to match frontend expected structure
        const rawDoc = data.data || data;
        
        // Helper function to check if a document field has content
        const hasDocument = (field: any) => {
          if (!field) return false;
          if (Array.isArray(field)) return field.length > 0;
          if (typeof field === 'object') return field.uploaded || field.filePath || field.filename;
          return false;
        };
        
        // Helper function to transform document field
        const transformDoc = (field: any) => {
          if (!field) return { uploaded: false };
          if (Array.isArray(field)) {
            return field.map(f => ({
              uploaded: true,
              filePath: f.filePath || f.filename,
              originalName: f.originalName,
              uploadedAt: f.uploadedAt || f.createdAt
            }));
          }
          if (typeof field === 'object' && (field.filePath || field.filename)) {
            return {
              uploaded: true,
              filePath: field.filePath || field.filename,
              originalName: field.originalName,
              uploadedAt: field.uploadedAt || field.createdAt
            };
          }
          return { uploaded: false };
        };
        
        // Count uploaded documents
        const docFields = ['studentPicture', 'nbiClearance', 'gradeReport', 'incomeTaxReturn', 'goodMoralCertificate', 'physicalCheckup', 'homeLocationSketch', 'personalityTestPaymentReceipt'];
        const totalRequired = docFields.length;
        const totalUploaded = docFields.filter(key => hasDocument(rawDoc[key])).length;
        
        const transformedData = {
          success: true,
          documents: {
            studentPicture: transformDoc(rawDoc.studentPicture),
            nbiClearance: transformDoc(rawDoc.nbiClearance),
            gradeReport: transformDoc(rawDoc.gradeReport),
            incomeTaxReturn: transformDoc(rawDoc.incomeTaxReturn),
            goodMoralCertificate: transformDoc(rawDoc.goodMoralCertificate),
            physicalCheckup: transformDoc(rawDoc.physicalCheckup),
            homeLocationSketch: transformDoc(rawDoc.homeLocationSketch),
            personalityTestPaymentReceipt: transformDoc(rawDoc.personalityTestPaymentReceipt)
          },
          summary: {
            totalUploaded,
            totalRequired,
            completionRate: Math.round((totalUploaded / totalRequired) * 100),
            isComplete: totalUploaded === totalRequired
          },
          gradeAverages: rawDoc.gradeAverages,
          incomeTaxInfo: rawDoc.incomeTaxInfo,
          userId: rawDoc.user
        };
        
        console.log('📄 Transformed documents data:', transformedData);
        setDocuments(transformedData);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Fetch personality test data
  const fetchPersonalityTestData = async (userId: string) => {
    if (!userId) return;
    setPersonalityTestLoading(true);
    try {
      console.log('🧠 Fetching personality test for userId:', userId);
      
      // Try department-head specific endpoint first
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/department-head/personality-test/user/${userId}`,
        { credentials: 'include' }
      );
      console.log('🧠 Department head personality test endpoint response:', response.status);
      
      // Fallback to general endpoint
      if (!response.ok) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/personality-test/user/${userId}`,
          { credentials: 'include' }
        );
        console.log('🧠 General personality test endpoint response:', response.status);
      }

      if (response.ok) {
        const data = await response.json();
        console.log('🧠 Personality test data:', data);
        setPersonalityTestData(data);
      } else if (response.status === 404) {
        setPersonalityTestData(null);
      }
    } catch (error) {
      console.error('Error fetching personality test:', error);
      setPersonalityTestData(null);
    } finally {
      setPersonalityTestLoading(false);
    }
  };

  // Fetch interview data for application
  const fetchInterviewData = async (applicationId: string) => {
    console.log('📅 Fetching interview data for applicationId:', applicationId);
    setInterviewLoading(true);
    setInterviewData(null);
    try {
      // Use /all endpoint to get all interviews including DepartmentHead type
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/interview/application/${applicationId}/all`,
        { credentials: 'include' }
      );
      
      console.log('📅 Interview API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📅 Interview data received:', result);
        setInterviewData(result);
      } else {
        console.log('📅 Interview API failed, setting null');
        setInterviewData({ interviews: [], isScheduled: false });
      }
    } catch (error) {
      console.error('Error fetching interview data:', error);
      setInterviewData({ interviews: [], isScheduled: false });
    } finally {
      setInterviewLoading(false);
    }
  };

  // Delete (soft delete) an interview
  const handleDeleteInterview = async (interviewId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/interview/${interviewId}/soft`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        toast({
          title: "Interview Deleted",
          description: "The interview has been successfully deleted.",
        });
        // Refresh interview data
        const appId = selectedApplication?.applicationId?._id || applicationDetails?.applicationId;
        if (appId) {
          fetchInterviewData(appId);
        }
        // Refresh the interviews list
        fetchApplicants(currentPage);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete interview');
      }
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete interview",
        variant: "destructive"
      });
    }
  };

  // Fetch interviewers
  const fetchInterviewers = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/users/interviewers`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const result = await response.json();
        setInterviewers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching interviewers:', error);
    }
  };

  // Fetch interviewers on mount
  useEffect(() => {
    fetchInterviewers();
  }, []);

  // Handle scheduling interview with new format - Department head is always the interviewer
  const handleScheduleInterviewNew = async (app: any) => {
    if (!interviewDate || !interviewTime || !interviewEndTime) {
      toast({
        title: "Error",
        description: "Please fill in all interview details",
        variant: "destructive",
      });
      return;
    }

    if (interviewEndTime <= interviewTime) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    // No need to check selectedInterviewer - department head is always the interviewer

    const applicationId = app?.applicationId || applicationDetails?.applicationId || applicationDetails?._id;
    if (!applicationId) {
      toast({
        title: "Error",
        description: "No application selected",
        variant: "destructive",
      });
      return;
    }

    setSchedulingInterview(true);
    try {
      // Create Date objects from the local date/time inputs
      // This ensures the time is interpreted as local time, not UTC
      const startDate = new Date(`${interviewDate}T${interviewTime}:00`);
      const endDate = new Date(`${interviewDate}T${interviewEndTime}:00`);
      
      // Convert to ISO string (includes timezone offset)
      const startDateTime = startDate.toISOString();
      const endDateTime = endDate.toISOString();

      console.log('📅 Scheduling interview:', {
        inputDate: interviewDate,
        inputStartTime: interviewTime,
        inputEndTime: interviewEndTime,
        startDateTime,
        endDateTime,
        localStartTime: startDate.toLocaleString(),
        localEndTime: endDate.toLocaleString()
      });

      // Use department-head specific endpoint - interviewer is automatically set to the department head
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/department-head/interview/schedule`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          startTime: startDateTime,
          endTime: endDateTime,
          notes: 'Scheduled by Department Head'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast({
        title: "Interview Scheduled",
        description: `Interview scheduled for ${new Date(startDateTime).toLocaleString()}. You are assigned as the interviewer.`,
      });

      // Reset form and refresh
      setInterviewDate('');
      setInterviewTime('09:00');
      setInterviewEndTime('10:00');
      setIsRescheduling(false);
      
      // Refresh only interview data inside the tab (not the whole page)
      await fetchInterviewData(applicationId);

    } catch (error) {
      console.error('Error scheduling interview:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('own academic department')) {
        toast({
          title: "Conflict of Interest",
          description: "You cannot interview an applicant from your own academic department.",
          variant: "destructive",
          duration: 7000
        });
      } else if (errorMessage.includes('already booked') || errorMessage.includes('another interview')) {
        toast({
          title: "Schedule Conflict",
          description: errorMessage,
          variant: "destructive",
          duration: 7000
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to schedule interview: ${errorMessage}`,
          variant: "destructive",
        });
      }
    } finally {
      setSchedulingInterview(false);
    }
  };

  // Handle rescheduling an existing interview
  const handleRescheduleInterview = async (interviewId: string) => {
    if (!interviewDate || !interviewTime) {
      toast({
        title: "Error",
        description: "Please fill in date and time",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📅 Rescheduling interview:', { interviewId, date: interviewDate, time: interviewTime });

      // Backend expects date and time as separate fields
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/department-head/interview/${interviewId}/reschedule`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: interviewDate,  // e.g., "2025-12-15"
          time: interviewTime,  // e.g., "11:00"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast({
        title: "Interview Rescheduled",
        description: `Interview rescheduled to ${new Date(`${interviewDate}T${interviewTime}`).toLocaleString()}.`,
      });

      // Reset form
      setInterviewDate('');
      setInterviewTime('09:00');
      setInterviewEndTime('10:00');
      setIsRescheduling(false);
      setReschedulingInterviewId(null);
      
      // Refresh only interview data inside the tab
      const applicationId = selectedApplication?.applicationId?._id || applicationDetails?.applicationId;
      if (applicationId) {
        await fetchInterviewData(applicationId);
      }

    } catch (error) {
      console.error('Error rescheduling interview:', error);
      toast({
        title: "Error",
        description: `Failed to reschedule interview: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  // Handle download document
  const handleDownloadDocument = async (docType: string, filePath: string, originalName?: string) => {
    try {
      const cleanFilePath = filePath.replace(/^files\//, '');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/files/${cleanFilePath}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to download document');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName || filePath;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "Document Downloaded", description: `${docType} has been downloaded.` });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: `Failed to download ${docType}`,
        variant: "destructive"
      });
    }
  };

  // Function to handle interview scheduling
  const handleScheduleInterview = async () => {
    try {
      if (!interviewSchedule) {
        toast({
          title: "Error",
          description: "Please select a date and time for the interview",
          variant: "destructive"
        });
        return;
      }

      if (!selectedApplication) {
        toast({
          title: "Error",
          description: "No application selected",
          variant: "destructive"
        });
        return;
      }

      console.log('📅 Scheduling interview for:', selectedApplication._id);
      console.log('📅 Schedule date:', interviewSchedule);
      console.log('📅 Reason:', scheduleReason);

      // Call backend API to schedule the interview and send notification
      const response = await departmentHeadService.scheduleInterview(
        selectedApplication._id, 
        interviewSchedule, 
        scheduleReason
      );

      console.log('✅ Interview scheduled successfully:', response);

      // Update the local state to reflect the scheduled interview
      const updatedInterviews = interviews.map(interview => {
        if (interview._id === selectedApplication._id) {
          return {
            ...interview,
            schedule: new Date(interviewSchedule).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            status: 'pending interview' as const
          };
        }
        return interview;
      });

      setInterviews(updatedInterviews);

      // Update stats after scheduling
      setStats({
        scheduledInterviews: updatedInterviews.filter(i => i.status === 'pending interview').length,
        completedInterviews: updatedInterviews.filter(i => 
          i.status === 'pending evaluation' || i.status === 'evaluated' || i.status === 'approved'
        ).length,
        pendingRecommendations: updatedInterviews.filter(i => i.status === 'pending evaluation').length
      });

      console.log('📊 Updated stats after scheduling:', {
        notYetScheduled: updatedInterviews.filter(i => i.status === 'not yet scheduled').length,
        pendingInterview: updatedInterviews.filter(i => i.status === 'pending interview').length,
        pendingEvaluation: updatedInterviews.filter(i => i.status === 'pending evaluation').length
      });

      toast({
        title: "Success",
        description: `Interview scheduled for ${new Date(interviewSchedule).toLocaleString()}. The applicant has been automatically notified.`,
        duration: 5000
      });

      // Reset form
      setInterviewSchedule('');
      setScheduleReason('');

    } catch (error) {
      console.error('❌ Error scheduling interview:', error);
      toast({
        title: "Error",
        description: `Failed to schedule interview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Fetch user's department information if not available
  useEffect(() => {
    const fetchUserDepartment = async () => {
      if (!user?.department) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/me`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            if (data.user?.department) {
              setUserDepartment(data.user.department);
              console.log('📍 Fetched department:', data.user.department);
            }
          }
        } catch (error) {
          console.error('Error fetching user department:', error);
        }
      } else {
        setUserDepartment(user.department);
      }
    };
    fetchUserDepartment();
  }, [user]);

  // Fetch evaluation period status
  useEffect(() => {
    const loadEvaluationPeriod = async () => {
      try {
        const data = await scholarEvaluationService.getCurrentPeriod();
        setEvaluationPeriod(data.period);
        if (data.isOpen) {
          console.log('📝 Evaluation period is open:', data.period.ratingPeriod);
        }
      } catch (error) {
        console.error('Error loading evaluation period:', error);
      }
    };
    loadEvaluationPeriod();
  }, []);

  // Fetch evaluations when applicationDetails changes and has an idNumber
  useEffect(() => {
    if (applicationDetails?.idNumber && applicationDetails.idNumber !== 'N/A') {
      fetchScholarEvaluations(applicationDetails.idNumber);
    }
  }, [applicationDetails?.idNumber]);

  // Fetch real data from backend with pagination (using new interviews endpoint)
  const fetchApplicants = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('🔍 Department Head Dashboard: Fetching interviews page', page);
      
      // Fetch interviews with pagination (limit 50 per page)
      const response = await departmentHeadService.getScheduledInterviews(page, 50, debouncedSearch);
      console.log('🔍 Department Head Dashboard: API response data:', response);
      
      const { interviews = [], total = 0, page: responsePage = 1, pages = 1, limit = 50 } = response;
      
      // Update pagination state
      setCurrentPage(responsePage);
      setTotalPages(pages);
      setTotalApplicants(total);
      setHasMore(responsePage < pages);
      
      // Transform interviews to applicants format for scholars state
      const applicants = interviews.map((interview: any) => {
        // Get department from user's course or user's department field
        const userCourse = interview.applicationId?.user?.course;
        const userDept = interview.applicationId?.user?.department;
        const department = userCourse?.departmentId?.name || 
                          userCourse?.department?.name ||
                          userDept?.name || 
                          userCourse?.departmentId?.departmentCode ||
                          userDept?.departmentCode ||
                          'N/A';
        
        return {
          id: interview.applicationId?.user?._id,
          _id: interview.applicationId?.user?._id,
          name: interview.applicantName || interview.applicationId?.user?.name,
          idNumber: interview.applicantIdNumber || interview.applicationId?.user?.idNumber,
          email: interview.applicantEmail || interview.applicationId?.user?.email,
          course: interview.course || interview.programOfStudyAndYear,
          department: department,
          applicationStatus: interview.applicationId?.status,
          interview: interview,
          evaluation: null // Will be loaded separately if needed
        };
      });
      
      // Update scholars - append or replace
      if (append) {
        setScholars(prev => [...prev, ...applicants]);
      } else {
        setScholars(applicants);
      }
      
      // Transform interviews data to InterviewData format
      // Use the backend-provided fields directly
      const newInterviewsData: InterviewData[] = interviews.map((interview: any) => {
        let schedule = 'To be scheduled';
        let status: InterviewData['status'] = 'not yet scheduled';
        
        // Determine status based on the application process stage
        // Check application status first (approved/rejected takes priority)
        if (interview.applicationId?.status === 'approved') {
          status = 'approved';
        } else if (interview.applicationId?.status === 'rejected') {
          status = 'rejected';
        } else if (interview.is_finished === true) {
          // Interview completed but no evaluation yet
          status = 'pending evaluation';
        } else if (interview.startTime) {
          // Interview scheduled but not completed
          status = 'pending interview';
        }
        // else: not yet scheduled (default)
        
        // Set schedule if interview exists
        if (interview.startTime) {
          schedule = toInterviewDisplayDate(interview.startTime).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        
        return {
          _id: interview._id,
          interviewId: interview.interviewId,
          applicantName: interview.applicantName,
          applicantEmail: interview.applicantEmail,
          applicantIdNumber: interview.applicantIdNumber,
          course: interview.course,
          courseId: interview.applicationId?.user?.course?.courseId,
          department: interview.applicantDepartment || userDepartment?.name,
          departmentCode: userDepartment?.departmentCode,
          schedule,
          status,
          // Preserve backend data for fetching details
          applicationId: interview.applicationId,
          interviewer: interview.interviewer,
          type: interview.type,
          startTime: interview.startTime,
          endTime: interview.endTime,
          is_finished: interview.is_finished,
          programOfStudyAndYear: interview.programOfStudyAndYear,
          hasEvaluation: interview.hasEvaluation || false
        };
      });
      
      // Update interviews - append or replace
      if (append) {
        setInterviews(prev => [...prev, ...newInterviewsData]);
      } else {
        setInterviews(newInterviewsData);
      }
      
      // Update stats from first page data
      if (!append) {
        const allData = newInterviewsData;
        setStats({
          scheduledInterviews: allData.filter((i: InterviewData) => i.status === 'pending interview').length,
          completedInterviews: allData.filter((i: InterviewData) => 
            i.status === 'pending evaluation' || i.status === 'evaluated' || i.status === 'approved'
          ).length,
          pendingRecommendations: allData.filter((i: InterviewData) => i.status === 'pending evaluation').length
        });
      }
      
      console.log('📊 Loaded', applicants.length, 'applicants. Total:', total);
    } catch (error) {
      console.error('Error fetching department applicants:', error);
      toast({
        title: "Error",
        description: "Failed to load applicants data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more function for lazy loading
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchApplicants(currentPage + 1, true);
    }
  };

  // Initial fetch and search effect
  useEffect(() => {
    setCurrentPage(1);
    fetchApplicants(1, false);
  }, [debouncedSearch]);

  return (
    <DashboardLayout allowedRoles={["department_head"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[#800000] tracking-tight">Department Head Dashboard</h1>
              {userDepartment && (
                <div className="mt-2 inline-flex items-center gap-2 bg-[#800000] text-white px-4 py-2 rounded-lg shadow-md">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold text-lg">{userDepartment.name}</span>
                  <span className="text-sm opacity-90">({userDepartment.departmentCode})</span>
                </div>
              )}
              <p className="text-gray-600 mt-3 text-lg">Review and evaluate applications assigned to your department.</p>
            </div>
          </div>
          {evaluationPeriod?.isOpen && (
            <div className="mt-4 bg-green-50 border-2 border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-600" />
                <p className="text-green-900 font-semibold">
                  Scholar Evaluation Period is OPEN: {evaluationPeriod.ratingPeriod}
                </p>
              </div>
              <p className="text-sm text-green-700 mt-1">
                You can now evaluate your assigned scholars. Use the evaluate button in the Actions column of the Assigned Applicants table.
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="card-hover border-0 shadow-soft bg-white">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#800000]/10 rounded-xl">
                  <Users className="h-8 w-8 text-[#800000]" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{totalApplicants}</p>
                  <p className="text-sm text-[#800000] mt-1 font-medium">total applicants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-soft bg-white">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.scheduledInterviews}</p>
                  <p className="text-sm text-blue-600 mt-1 font-medium">scheduled interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-soft bg-white">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedInterviews}</p>
                  <p className="text-sm text-green-600 mt-1 font-medium">completed interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-soft bg-white">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingRecommendations}</p>
                  <p className="text-sm text-orange-600 mt-1 font-medium">pending recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search by applicant name or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-gray-200 shadow-soft focus:ring-2 focus:ring-maroon-200 focus:border-[#800000] transition-smooth"
            />
          </div>
        </div>

        {/* Interviews Table */}
        <Card className="border-0 shadow-soft bg-white">
          <CardHeader className="border-b bg-gray-50 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Assigned Applicants
              {totalApplicants > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({totalApplicants} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                <span className="ml-2 text-sm text-gray-600">Loading applicants...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium min-w-[140px]">Interview ID</th>
                      <th className="text-left p-4 font-medium min-w-[180px]">Applicant Name</th>
                      <th className="text-left p-4 font-medium min-w-[200px]">Course</th>
                      <th className="text-left p-4 font-medium min-w-[120px]">Department</th>
                      <th className="text-left p-4 font-medium min-w-[150px]">Schedule</th>
                      <th className="text-left p-4 font-medium min-w-[120px]">Status</th>
                      <th className="text-left p-4 font-medium min-w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map((interview) => (
                        <tr key={interview._id} className="border-b hover:bg-gray-50">
                          <td className="p-4 whitespace-nowrap text-sm font-mono">{interview.interviewId}</td>
                          <td className="p-4 font-medium whitespace-nowrap">{interview.applicantName}</td>
                          <td className="p-4">{interview.course}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">
                              {interview.department || interview.departmentCode || userDepartment?.name || '-'}
                            </Badge>
                          </td>
                          <td className="p-4">{interview.schedule}</td>
                          <td className="p-4">
                            <Badge 
                              variant={
                                interview.status === 'approved' ? 'default' :
                                interview.status === 'rejected' ? 'destructive' :
                                interview.status === 'evaluated' ? 'default' : 
                                interview.status === 'pending evaluation' ? 'secondary' :
                                interview.status === 'pending interview' ? 'secondary' : 
                                'outline'
                              }
                              className={
                                interview.status === 'approved' ? 'bg-green-100 text-green-800' :
                                interview.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                interview.status === 'evaluated' ? 'bg-blue-100 text-blue-800' :
                                interview.status === 'pending evaluation' ? 'bg-orange-100 text-orange-800' :
                                interview.status === 'pending interview' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {interview.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              {/* Eye Button - View Application Details */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={async () => {
                                      setSelectedApplication(interview);
                                      setSelectedEvaluation(null);
                                      
                                      // Get the correct IDs from the interview object
                                      // applicationId is the nested object from backend with _id
                                      const appId = interview.applicationId?._id;
                                      const userId = interview.applicationId?.user?._id;
                                      const idNumber = interview.applicantIdNumber;
                                      
                                      console.log('🔍 Opening application details:', {
                                        interviewId: interview._id,
                                        applicationId: appId,
                                        userId: userId,
                                        idNumber: idNumber,
                                        fullApplicationId: interview.applicationId
                                      });
                                      
                                      // Fetch application details first
                                      if (appId) {
                                        await fetchApplicationDetails(appId);
                                        fetchDocuments(appId, userId, idNumber);
                                        fetchInterviewData(appId);
                                      }
                                      if (userId) {
                                        fetchPersonalityTestData(userId);
                                      }
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-6xl w-[95vw] h-[95vh] overflow-hidden flex flex-col">
                                  <DialogHeader>
                                    <DialogTitle>Application Details</DialogTitle>
                                    <DialogDescription>
                                      Review application for {selectedApplication?.applicantName}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <Tabs defaultValue="details" className="w-full flex-1 flex flex-col overflow-hidden">
                                    <TabsList className="grid w-full grid-cols-4">
                                      <TabsTrigger value="details">Details</TabsTrigger>
                                      <TabsTrigger value="documents" onClick={() => {
                                        if (applicationDetails) {
                                          fetchDocuments(applicationDetails.applicationId || applicationDetails._id, applicationDetails.userId, applicationDetails.idNumber);
                                        }
                                      }}>Documents</TabsTrigger>
                                      <TabsTrigger value="personality" onClick={() => {
                                        if (applicationDetails?.userId) {
                                          fetchPersonalityTestData(applicationDetails.userId);
                                        }
                                      }}>Personality Test</TabsTrigger>
                                      <TabsTrigger value="interview" onClick={() => {
                                        if (applicationDetails) {
                                          fetchInterviewData(applicationDetails.applicationId || applicationDetails._id);
                                        }
                                      }}>Interview</TabsTrigger>
                                    </TabsList>

                                    {/* Details Tab */}
                                    <TabsContent value="details" className="space-y-4 py-4 overflow-y-auto flex-1">
                                      {applicationDetails ? (
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Full Name</p>
                                              <p>{applicationDetails.firstName} {applicationDetails.lastName}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Student ID</p>
                                              <p>{applicationDetails.idNumber}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Email Address</p>
                                              <p>{applicationDetails.email}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Contact Number</p>
                                              <p>{applicationDetails.contactNumber || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                                              <p>{applicationDetails.dateOfBirth || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Gender</p>
                                              <p>{applicationDetails.gender || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Program/Year</p>
                                              <p>{applicationDetails.programOfStudyAndYear}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">GPA</p>
                                              <p>{applicationDetails.gpa || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Family Income</p>
                                              <p>{applicationDetails.familyIncome || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Address</p>
                                              <p>{applicationDetails.address || 'N/A'}</p>
                                            </div>
                                          </div>
                                          
                                          {/* Download Button */}
                                          <div className="pt-4 border-t">
                                            <Button
                                              variant="outline"
                                              onClick={() => handleDownloadPDF(selectedApplication)}
                                            >
                                              <Download className="mr-2 h-4 w-4" />
                                              Download Application PDF
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center py-8">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                                          <span className="ml-2 text-sm text-gray-600">Loading application details...</span>
                                        </div>
                                      )}
                                    </TabsContent>

                                    {/* Documents Tab */}
                                    <TabsContent value="documents" className="py-4 overflow-y-auto flex-1">
                                      {documentsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                                          <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
                                        </div>
                                      ) : documents ? (
                                        <div className="space-y-4">
                                          {/* Document Summary */}
                                          <div className="bg-gray-50 border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                              <h3 className="font-medium">Document Status Summary</h3>
                                              <Badge 
                                                variant={documents?.summary?.isComplete ? "default" : "secondary"}
                                                className={documents?.summary?.isComplete ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                              >
                                                {documents?.summary?.totalUploaded || 0}/{documents?.summary?.totalRequired || 8} Complete
                                              </Badge>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                              <div 
                                                className="bg-[#800000] h-2 rounded-full transition-all duration-300" 
                                                style={{ width: `${documents?.summary?.completionRate || 0}%` }}
                                              ></div>
                                            </div>
                                          </div>

                                          {/* Document List */}
                                          <div className="space-y-3">
                                            {[
                                              { key: 'studentPicture', label: 'Student Picture' },
                                              { key: 'nbiClearance', label: 'NBI Clearance' },
                                              { key: 'gradeReport', label: 'Grade Report' },
                                              { key: 'incomeTaxReturn', label: 'Income Tax Return' },
                                              { key: 'goodMoralCertificate', label: 'Good Moral Certificate' },
                                              { key: 'physicalCheckup', label: 'Physical Checkup' },
                                              { key: 'homeLocationSketch', label: 'Home Location Sketch' },
                                              { key: 'personalityTestPaymentReceipt', label: 'Personality Test Payment Receipt' }
                                            ].map(({ key, label }) => {
                                              const doc = documents?.documents?.[key];
                                              const isArray = Array.isArray(doc);
                                              const docList = isArray ? doc : (doc ? [doc] : []);
                                              const hasDocuments = isArray ? doc?.length > 0 : doc?.uploaded;
                                              const singleDocCanPreview = !isArray && doc?.uploaded && isImageFile(doc.originalName || doc.filePath || doc.filename);
                                              
                                              return (
                                                <div 
                                                  key={key} 
                                                  className={`p-3 border rounded-lg hover:bg-gray-50 ${singleDocCanPreview ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all' : ''}`}
                                                  onClick={() => {
                                                    if (singleDocCanPreview && !isArray) {
                                                      const filePath = doc.filePath || doc.filename;
                                                      if (filePath) {
                                                        handlePreviewDocument(label, filePath, doc.originalName);
                                                      }
                                                    }
                                                  }}
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                      {hasDocuments ? (
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                      ) : (
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                      )}
                                                      <div>
                                                        <p className="font-medium text-sm">
                                                          {label}
                                                          {singleDocCanPreview && !isArray && <span className="text-blue-500 ml-2 text-xs">(Click to preview)</span>}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                          {hasDocuments ? (
                                                            isArray && docList.length > 1 ? (
                                                              `${docList.length} files uploaded`
                                                            ) : (
                                                              <>
                                                                Uploaded: {(docList[0]?.uploadedAt || doc?.uploadedAt) ? new Date(docList[0]?.uploadedAt || doc?.uploadedAt).toLocaleDateString() : 'Unknown'}
                                                                {(docList[0]?.originalName || doc?.originalName) && <span className="ml-2">({String(docList[0]?.originalName || doc?.originalName)})</span>}
                                                              </>
                                                            )
                                                          ) : (
                                                            'Not submitted'
                                                          )}
                                                        </p>
                                                        
                                                        {/* Show Grade Averages for Grade Report */}
                                                        {key === 'gradeReport' && documents?.gradeAverages && (
                                                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                                            <p className="font-semibold text-blue-900 mb-1">Grade Averages:</p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                              {documents.gradeAverages.elementary && (
                                                                <span>Elementary: {documents.gradeAverages.elementary}%</span>
                                                              )}
                                                              {documents.gradeAverages.juniorHighSchool && (
                                                                <span>Junior HS: {documents.gradeAverages.juniorHighSchool}%</span>
                                                              )}
                                                              {documents.gradeAverages.seniorHighSchool && (
                                                                <span>Senior HS: {documents.gradeAverages.seniorHighSchool}%</span>
                                                              )}
                                                              {documents.gradeAverages.college && (
                                                                <span>College: {documents.gradeAverages.college}%</span>
                                                              )}
                                                            </div>
                                                          </div>
                                                        )}
                                                        
                                                        {/* Show Income Tax Info for ITR */}
                                                        {key === 'incomeTaxReturn' && documents?.incomeTaxInfo && (
                                                          <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                                                            <p className="font-semibold text-green-900 mb-1">Income Tax Information:</p>
                                                            <div className="space-y-1">
                                                              {documents.incomeTaxInfo.annualIncome && (
                                                                <p>Annual Income: ₱{documents.incomeTaxInfo.annualIncome.toLocaleString()}</p>
                                                              )}
                                                              {documents.incomeTaxInfo.taxableIncome && (
                                                                <p>Taxable Income: ₱{documents.incomeTaxInfo.taxableIncome.toLocaleString()}</p>
                                                              )}
                                                              {documents.incomeTaxInfo.taxYear && (
                                                                <p>Tax Year: {documents.incomeTaxInfo.taxYear}</p>
                                                              )}
                                                              {documents.incomeTaxInfo.employerName && (
                                                                <p>Employer: {documents.incomeTaxInfo.employerName}</p>
                                                              )}
                                                              {documents.incomeTaxInfo.tin && (
                                                                <p>TIN: {documents.incomeTaxInfo.tin}</p>
                                                              )}
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <Badge 
                                                        variant={hasDocuments ? "default" : "secondary"}
                                                        className={hasDocuments ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                                      >
                                                        {hasDocuments ? 'Submitted' : 'Missing'}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                  
                                                  {/* Individual file list for documents with multiple files */}
                                                  {hasDocuments && (
                                                    <div className="mt-3 space-y-2 border-t pt-3">
                                                      {docList.map((fileDoc: any, index: number) => {
                                                        const filePath = fileDoc?.filePath || fileDoc?.filename;
                                                        const originalName = fileDoc?.originalName || filePath;
                                                        const canPreviewFile = isImageFile(originalName);
                                                        
                                                        return (
                                                          <div key={index} className="flex items-center justify-between pl-8 py-1 text-sm bg-gray-50 rounded px-3">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                              <span className="text-gray-500 text-xs">{index + 1}.</span>
                                                              <span className="truncate text-gray-700" title={originalName}>
                                                                {originalName || `File ${index + 1}`}
                                                              </span>
                                                              {canPreviewFile && (
                                                                <span className="text-blue-500 text-xs flex-shrink-0">(image)</span>
                                                              )}
                                                            </div>
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                              {canPreviewFile && (
                                                                <Button 
                                                                  variant="ghost" 
                                                                  size="sm"
                                                                  className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (filePath) {
                                                                      handlePreviewDocument(`${label} (${index + 1})`, filePath, originalName);
                                                                    }
                                                                  }}
                                                                >
                                                                  <Eye className="h-3 w-3 mr-1" />
                                                                  Preview
                                                                </Button>
                                                              )}
                                                              <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                className="h-7 px-2"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  if (filePath) {
                                                                    handleDownloadDocument(`${label} (${index + 1})`, filePath, originalName);
                                                                  }
                                                                }}
                                                              >
                                                                <Download className="h-3 w-3 mr-1" />
                                                                Download
                                                              </Button>
                                                            </div>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>

                                          {/* Verification Status */}
                                          {documents?.documentsVerified && (
                                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                              <CheckCircle className="h-5 w-5 text-green-600" />
                                              <p className="text-sm text-green-800">Documents have been verified by OAS Staff</p>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-center py-8 text-gray-500">
                                          <p>No document data available</p>
                                        </div>
                                      )}
                                    </TabsContent>

                                    {/* Personality Test Tab */}
                                    <TabsContent value="personality" className="py-4 overflow-y-auto flex-1">
                                      {personalityTestLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                                          <span className="ml-2 text-sm text-gray-600">Loading personality test data...</span>
                                        </div>
                                      ) : personalityTestData ? (
                                        <div className="max-w-xl mx-auto">
                                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                            <div className="flex justify-center mb-2">
                                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                              </div>
                                            </div>
                                            <h2 className="text-lg font-bold text-green-800 mb-1">Assessment Completed</h2>
                                            <div className="text-xs text-gray-500 mb-2">
                                              Test ID: {personalityTestData._id}
                                            </div>
                                            <div className="flex items-center justify-center gap-4 mb-3 text-sm">
                                              <span className="text-gray-600">
                                                {Math.min(personalityTestData.answers?.length || 0, personalityTestData.questions?.length || 10)}/{personalityTestData.questions?.length || 10} questions
                                              </span>
                                              <span className="text-gray-400">•</span>
                                              <span className={`font-semibold ${
                                                personalityTestData.riskLevelIndicator === 'Very Low' ? 'text-red-600' :
                                                personalityTestData.riskLevelIndicator === 'Low' ? 'text-orange-600' :
                                                personalityTestData.riskLevelIndicator === 'Below Average' ? 'text-yellow-600' :
                                                personalityTestData.riskLevelIndicator === 'Average' ? 'text-blue-600' :
                                                personalityTestData.riskLevelIndicator === 'Above Average' ? 'text-green-600' : 'text-gray-600'
                                              }`}>
                                                {personalityTestData.riskLevelIndicator || 'Unknown'}
                                              </span>
                                            </div>
                                            <div className="bg-white/50 rounded-lg p-3 text-left">
                                              <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                  <span className="text-gray-500">Completed:</span>
                                                  <span className="ml-1 font-medium text-gray-700">
                                                    {personalityTestData.endTime ? new Date(personalityTestData.endTime).toLocaleDateString() : 'N/A'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500">Duration:</span>
                                                  <span className="ml-1 font-medium text-gray-700">
                                                    {personalityTestData.startTime && personalityTestData.endTime
                                                      ? `${Math.round((new Date(personalityTestData.endTime).getTime() - new Date(personalityTestData.startTime).getTime()) / (1000 * 60))} min`
                                                      : 'N/A'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            {personalityTestData.reviewed && (
                                              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                                ✓ Reviewed by OAS Staff
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                          <div className="flex">
                                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                            <div className="ml-3">
                                              <p className="text-sm text-yellow-700">
                                                <strong>Pending:</strong> Applicant has not completed the personality test yet.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </TabsContent>

                                    {/* Interview Tab */}
                                    <TabsContent value="interview" className="py-4 overflow-y-auto flex-1">
                                      {interviewLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                                          <span className="ml-2 text-sm text-gray-600">Loading interview data...</span>
                                        </div>
                                      ) : (
                                        (() => {
                                          const deptHeadInterview = interviewData?.interviews?.find((i: any) => i.type === 'DepartmentHead') || interviewData?.interview;
                                          
                                          if (deptHeadInterview) {
                                            return (
                                              <div className="space-y-4">
                                                {/* Interview Scheduled Banner */}
                                                <div className={`${deptHeadInterview.is_finished ? 'bg-green-50 border-green-400' : 'bg-blue-50 border-blue-400'} border-l-4 p-4`}>
                                                  <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                      {deptHeadInterview.is_finished ? (
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                      ) : (
                                                        <Calendar className="h-5 w-5 text-blue-400" />
                                                      )}
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                      <p className={`text-sm ${deptHeadInterview.is_finished ? 'text-green-700' : 'text-blue-700'} font-semibold mb-1`}>
                                                        {deptHeadInterview.is_finished ? 'Interview Completed' : 'Interview Scheduled'}
                                                      </p>
                                                      <div className="space-y-1">
                                                        <p className={`text-sm font-medium ${deptHeadInterview.is_finished ? 'text-green-800' : 'text-blue-800'}`}>
                                                          <strong>Date:</strong> {toInterviewDisplayDate(deptHeadInterview.startTime).toLocaleDateString('en-US', {
                                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                          })}
                                                        </p>
                                                        <p className={`text-sm font-medium ${deptHeadInterview.is_finished ? 'text-green-800' : 'text-blue-800'}`}>
                                                          <strong>Time:</strong> {toInterviewDisplayDate(deptHeadInterview.startTime).toLocaleTimeString('en-US', {
                                                            hour: 'numeric', minute: '2-digit', hour12: true
                                                          })}
                                                        </p>
                                                        {deptHeadInterview.interviewer && (
                                                          <p className={`text-sm font-medium ${deptHeadInterview.is_finished ? 'text-green-800' : 'text-blue-800'}`}>
                                                            <strong>Interviewer:</strong> {deptHeadInterview.interviewer.name || deptHeadInterview.interviewer.email}
                                                          </p>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Reschedule Form */}
                                                {!isRescheduling ? (
                                                  <div className="flex gap-3 flex-wrap">
                                                    <Button
                                                      variant="outline"
                                                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                                      onClick={() => {
                                                        setIsRescheduling(true);
                                                        setReschedulingInterviewId(deptHeadInterview._id);
                                                        if (deptHeadInterview.startTime) {
                                                          const existingDate = toInterviewDisplayDate(deptHeadInterview.startTime);
                                                          setInterviewDate(existingDate.toISOString().split('T')[0]);
                                                          setInterviewTime(existingDate.toTimeString().slice(0, 5));
                                                        }
                                                        if (deptHeadInterview.endTime) {
                                                          const existingEndDate = toInterviewDisplayDate(deptHeadInterview.endTime);
                                                          setInterviewEndTime(existingEndDate.toTimeString().slice(0, 5));
                                                        }
                                                      }}
                                                    >
                                                      <Calendar className="mr-2 h-4 w-4" />
                                                      Reschedule Interview
                                                    </Button>

                                                    {/* Finish/Revert Interview Button */}
                                                    <Button
                                                      variant={deptHeadInterview.is_finished ? "outline" : "default"}
                                                      className={deptHeadInterview.is_finished 
                                                        ? "border-orange-300 text-orange-600 hover:bg-orange-50" 
                                                        : "bg-green-600 hover:bg-green-700 text-white"
                                                      }
                                                      onClick={async () => {
                                                        try {
                                                          const endpoint = deptHeadInterview.is_finished ? 'revert-finish' : 'finish';
                                                          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/interview/${deptHeadInterview._id}/${endpoint}`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            credentials: 'include',
                                                          });
                                                          const result = await response.json();
                                                          if (result.success) {
                                                            toast({
                                                              title: deptHeadInterview.is_finished ? "Interview Reverted" : "Interview Finished",
                                                              description: deptHeadInterview.is_finished 
                                                                ? "Interview has been marked as not finished." 
                                                                : "Interview has been marked as finished. Application status updated to 'Pending Evaluation'.",
                                                            });

                                                            // Refresh only interview data inside the tab (not the whole page)
                                                            const appId = selectedApplication?.applicationId?._id || applicationDetails?.applicationId;
                                                            if (appId) {
                                                              await fetchInterviewData(appId);
                                                            }
                                                          } else {
                                                            throw new Error(result.message || 'Failed to update interview status');
                                                          }
                                                        } catch (error) {
                                                          console.error('Error updating interview status:', error);
                                                          toast({
                                                            title: "Error",
                                                            description: `Failed to update interview status: ${error instanceof Error ? error.message : String(error)}`,
                                                            variant: "destructive",
                                                          });
                                                        }
                                                      }}
                                                    >
                                                      <CheckCircle className="mr-2 h-4 w-4" />
                                                      {deptHeadInterview.is_finished ? "Revert Interview" : "Finish Interview"}
                                                    </Button>

                                                    {/* Delete Interview Button - only show if not finished */}
                                                    {!deptHeadInterview.is_finished && (
                                                      <Button
                                                        variant="outline"
                                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                                        onClick={async () => {
                                                          const confirmed = await confirm({
                                                            title: "Delete Interview",
                                                            description: "Are you sure you want to delete this interview? This action can be undone by an administrator.",
                                                            confirmText: "Delete",
                                                            cancelText: "Cancel",
                                                            type: "danger"
                                                          });
                                                          if (confirmed) {
                                                            handleDeleteInterview(deptHeadInterview._id);
                                                          }
                                                        }}
                                                      >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Interview
                                                      </Button>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="space-y-4 p-4 border rounded-lg">
                                                    <h4 className="font-medium">Reschedule Interview</h4>
                                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                                                      <p className="text-sm text-blue-700">
                                                        <strong>Note:</strong> You will be assigned as the interviewer for this applicant.
                                                      </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                      <Label>Date</Label>
                                                      <Input
                                                        type="date"
                                                        value={interviewDate}
                                                        onChange={(e) => setInterviewDate(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]}
                                                      />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                      <div className="space-y-2">
                                                        <Label>Start Time</Label>
                                                        <Input
                                                          type="time"
                                                          value={interviewTime}
                                                          onChange={(e) => {
                                                            setInterviewTime(e.target.value);
                                                            const [hours, minutes] = e.target.value.split(':').map(Number);
                                                            const endHours = (hours + 1) % 24;
                                                            setInterviewEndTime(`${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
                                                          }}
                                                        />
                                                      </div>
                                                      <div className="space-y-2">
                                                        <Label>End Time</Label>
                                                        <Input
                                                          type="time"
                                                          value={interviewEndTime}
                                                          onChange={(e) => setInterviewEndTime(e.target.value)}
                                                        />
                                                      </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                      <Button
                                                        className="bg-[#800000] hover:bg-[#600000]"
                                                        onClick={() => {
                                                          if (reschedulingInterviewId) {
                                                            handleRescheduleInterview(reschedulingInterviewId);
                                                          }
                                                        }}
                                                        disabled={!interviewDate}
                                                      >
                                                        Confirm Reschedule
                                                      </Button>
                                                      <Button variant="outline" onClick={() => {
                                                        setIsRescheduling(false);
                                                        setReschedulingInterviewId(null);
                                                      }}>
                                                        Cancel
                                                      </Button>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className="space-y-4">
                                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                                  <div className="flex">
                                                    <Calendar className="h-5 w-5 text-blue-400" />
                                                    <div className="ml-3">
                                                      <p className="text-sm text-blue-700">
                                                        <strong>Interview Status:</strong> Not Scheduled
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Schedule Form */}
                                                <div className="space-y-4 pt-4">
                                                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-2">
                                                    <p className="text-sm text-blue-700">
                                                      <strong>Note:</strong> You will be assigned as the interviewer for this applicant.
                                                    </p>
                                                  </div>
                                                  <div className="space-y-2">
                                                    <Label>Schedule Interview Date</Label>
                                                    <Input
                                                      type="date"
                                                      value={interviewDate}
                                                      onChange={(e) => setInterviewDate(e.target.value)}
                                                      min={new Date().toISOString().split('T')[0]}
                                                    />
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                      <Label>Start Time</Label>
                                                      <Input
                                                        type="time"
                                                        value={interviewTime}
                                                        onChange={(e) => {
                                                          setInterviewTime(e.target.value);
                                                          const [hours, minutes] = e.target.value.split(':').map(Number);
                                                          const endHours = (hours + 1) % 24;
                                                          setInterviewEndTime(`${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
                                                        }}
                                                      />
                                                    </div>
                                                    <div className="space-y-2">
                                                      <Label>End Time</Label>
                                                      <Input
                                                        type="time"
                                                        value={interviewEndTime}
                                                        onChange={(e) => setInterviewEndTime(e.target.value)}
                                                      />
                                                    </div>
                                                  </div>

                                                  <Button
                                                    className="bg-[#800000] hover:bg-[#600000]"
                                                    onClick={() => handleScheduleInterviewNew(selectedApplication)}
                                                    disabled={!interviewDate || schedulingInterview}
                                                  >
                                                    {schedulingInterview ? (
                                                      <>
                                                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                        Scheduling...
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        Schedule Interview
                                                      </>
                                                    )}
                                                  </Button>
                                                </div>
                                              </div>
                                            );
                                          }
                                        })()
                                      )}
                                    </TabsContent>
                                  </Tabs>

                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline" onClick={() => {
                                        setSelectedApplication(null);
                                        setIsRescheduling(false);
                                        setReschedulingInterviewId(null);
                                        setInterviewData(null);
                                        setDocuments(null);
                                        setPersonalityTestData(null);
                                      }}>
                                        Close
                                      </Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              {/* Evaluate Button */}
                              {evaluationPeriod?.isOpen && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={
                                    interview.hasEvaluation
                                      ? "text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                                      : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                  }
                                  title={
                                    interview.hasEvaluation 
                                      ? "View Evaluation (Read Only)" 
                                      : "Evaluate Scholar"
                                  }
                                  onClick={async () => {
                                    // Find the scholar data for this applicant by matching idNumber
                                    const scholar = scholars.find((s: any) => 
                                      s.idNumber === interview.applicantIdNumber ||
                                      s._id === interview.applicationId?.user?._id
                                    );
                                    
                                    const idNumber = interview.applicantIdNumber || scholar?.idNumber || applicationDetails?.idNumber;
                                    
                                    // Check if evaluation exists for this scholar
                                    if (idNumber) {
                                      try {
                                        // Use department-head specific endpoint for fetching evaluations
                                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/department-head/evaluation/user/${idNumber}`, {
                                          credentials: 'include'
                                        });
                                        if (response.ok) {
                                          const data = await response.json();
                                          const evaluations = Array.isArray(data) ? data : (data.evaluations || []);
                                          setScholarEvaluations(evaluations);
                                          
                                          if (evaluations.length > 0) {
                                            // Evaluation exists - show in read-only mode (grey icon)
                                            if (evaluations.length > 1) {
                                              // Multiple evaluations exist - show selector dialog
                                              const scholarData = scholar ? {
                                                ...scholar,
                                                firstName: scholar.firstName || scholar.name?.split(' ')[0] || interview.applicantName?.split(' ')[0] || '',
                                                lastName: scholar.lastName || scholar.name?.split(' ').slice(1).join(' ') || interview.applicantName?.split(' ').slice(1).join(' ') || '',
                                                idNumber: idNumber
                                              } : {
                                                _id: interview._id,
                                                name: interview.applicantName,
                                                firstName: interview.applicantName?.split(' ')[0] || '',
                                                lastName: interview.applicantName?.split(' ').slice(1).join(' ') || '',
                                                idNumber: idNumber,
                                                course: interview.course,
                                                department: interview.department
                                              };
                                              setPendingScholarForEvaluation(scholarData);
                                              setShowEvaluationSelector(true);
                                              return;
                                            } else {
                                              // Single evaluation exists - set it for read-only view
                                              setSelectedEvaluation(evaluations[0]);
                                              setIsViewingEvaluation(true);
                                            }
                                            
                                            if (scholar) {
                                              const scholarData = {
                                                ...scholar,
                                                firstName: scholar.firstName || scholar.name?.split(' ')[0] || interview.applicantName?.split(' ')[0] || '',
                                                lastName: scholar.lastName || scholar.name?.split(' ').slice(1).join(' ') || interview.applicantName?.split(' ').slice(1).join(' ') || '',
                                                idNumber: idNumber,
                                                department: scholar.department || user?.department?._id || user?.department
                                              };
                                              setSelectedScholar(scholarData);
                                              setShowEvaluationForm(true);
                                            } else {
                                              const scholarData = {
                                                _id: interview._id,
                                                name: interview.applicantName,
                                                firstName: interview.applicantName?.split(' ')[0] || '',
                                                lastName: interview.applicantName?.split(' ').slice(1).join(' ') || '',
                                                idNumber: idNumber,
                                                course: interview.course,
                                                department: interview.department || user?.department?._id || user?.department
                                              };
                                              setSelectedScholar(scholarData);
                                              setShowEvaluationForm(true);
                                            }
                                            return;
                                          } else {
                                            // No evaluation exists - allow creating new evaluation (green icon)
                                            setSelectedEvaluation(null);
                                            setIsViewingEvaluation(false);
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Error checking for existing evaluation:', error);
                                        // No evaluation found - allow creating new one
                                        setSelectedEvaluation(null);
                                        setIsViewingEvaluation(false);
                                      }
                                    }
                                    
                                    // Open evaluation form for creating new evaluation
                                    if (scholar) {
                                      const scholarData = {
                                        ...scholar,
                                        firstName: scholar.firstName || scholar.name?.split(' ')[0] || interview.applicantName?.split(' ')[0] || '',
                                        lastName: scholar.lastName || scholar.name?.split(' ').slice(1).join(' ') || interview.applicantName?.split(' ').slice(1).join(' ') || '',
                                        idNumber: idNumber,
                                        department: scholar.department || interview.department || interview.applicantDepartment || 'N/A'
                                      };
                                      setSelectedScholar(scholarData);
                                      setShowEvaluationForm(true);
                                    } else {
                                      // Use the interview data as scholar - parse name into first/last
                                      const nameParts = interview.applicantName?.split(' ') || [];
                                      setSelectedScholar({
                                        _id: interview._id,
                                        name: interview.applicantName,
                                        firstName: nameParts[0] || '',
                                        lastName: nameParts.slice(1).join(' ') || '',
                                        idNumber: idNumber,
                                        course: interview.course,
                                        department: interview.department || interview.applicantDepartment || 'N/A'
                                      });
                                      setShowEvaluationForm(true);
                                    }
                                  }}
                                >
                                  <ClipboardCheck className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {/* Message Button */}
                              <MessageButton
                                receiverId={interview._id}
                                receiverName={interview.applicantName}
                                applicationId={interview._id}
                                conversationType="admin-department-head"
                                variant="ghost"
                                size="sm"
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
                {interviews.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No applicants assigned to your department yet.
                  </div>
                )}
                
                {/* Load More Button */}
                {hasMore && interviews.length > 0 && (
                  <div className="flex justify-center py-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => fetchApplicants(currentPage + 1)}
                      disabled={loadingMore}
                      className="min-w-[200px]"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#800000] mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>Load More ({interviews.length} of {totalApplicants})</>
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Pagination Info */}
                {interviews.length > 0 && (
                  <div className="text-center py-2 text-sm text-gray-500 border-t">
                    Showing {interviews.length} of {totalApplicants} applicants
                    {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evaluation Selector Dialog - Shows when multiple evaluations exist */}
        <Dialog open={showEvaluationSelector} onOpenChange={setShowEvaluationSelector}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Select Evaluation to View</DialogTitle>
              <DialogDescription>
                Multiple evaluations found for {pendingScholarForEvaluation?.firstName} {pendingScholarForEvaluation?.lastName}. 
                Select which evaluation you want to view or create a new one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {scholarEvaluations.map((evaluation, index) => (
                <div 
                  key={evaluation._id || index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedEvaluation(evaluation);
                    setIsViewingEvaluation(true);
                    setSelectedScholar(pendingScholarForEvaluation);
                    setShowEvaluationSelector(false);
                    setShowEvaluationForm(true);
                  }}
                >
                  <div>
                    <p className="font-medium">{evaluation.semester} - {evaluation.schoolYear}</p>
                    <p className="text-sm text-gray-500">
                      Rating: {typeof evaluation.overallRating === 'object' && evaluation.overallRating.$numberDecimal 
                        ? parseFloat(evaluation.overallRating.$numberDecimal).toFixed(2) 
                        : parseFloat(evaluation.overallRating || 0).toFixed(2)}
                    </p>
                  </div>
                  <Badge variant={evaluation.evaluationStatus === 'passed' ? 'default' : 'destructive'}>
                    {evaluation.evaluationStatus}
                  </Badge>
                </div>
              ))}
              
              {/* Option to create new evaluation */}
              <div 
                className="flex items-center justify-center p-3 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedEvaluation(null);
                  setIsViewingEvaluation(false);
                  setSelectedScholar(pendingScholarForEvaluation);
                  setShowEvaluationSelector(false);
                  setShowEvaluationForm(true);
                }}
              >
                <Plus className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-700 font-medium">Create New Evaluation</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Scholar Evaluation Form */}
        {selectedScholar && (
          <ScholarEvaluationForm
            scholar={selectedScholar}
            open={showEvaluationForm}
            onOpenChange={(open) => {
              setShowEvaluationForm(open);
              if (!open) {
                setSelectedEvaluation(null);
                setIsViewingEvaluation(false);
              }
            }}
            onSuccess={() => {
              toast({
                title: "Success",
                description: "Evaluation submitted successfully",
                duration: 3000
              });
              setShowEvaluationForm(false);
              setSelectedEvaluation(null);
              setIsViewingEvaluation(false);
              // Refresh evaluations list using idNumber
              if (applicationDetails?.idNumber && applicationDetails.idNumber !== 'N/A') {
                fetchScholarEvaluations(applicationDetails.idNumber);
              }
            }}
            existingEvaluation={selectedEvaluation}
            readOnly={isViewingEvaluation || !!selectedEvaluation}
            hideTimekeeping={true}
            useDepartmentHeadEndpoint={true}
          />
        )}

        {/* Image Preview Dialog with Zoom and Pan */}
        {previewImage && (
          <Dialog open={!!previewImage} onOpenChange={(open) => !open && closePreview()}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              <DialogHeader className="p-4 pb-2">
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {previewImage.name}
                  </div>
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 mr-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 0.5}
                      className="h-8 w-8 p-0"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-14 text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 3}
                      className="h-8 w-8 p-0"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetZoom}
                      className="h-8 w-8 p-0 ml-1"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div 
                className="px-4 pb-4 overflow-hidden max-h-[75vh] flex items-center justify-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              >
                <img 
                  src={previewImage.url} 
                  alt={previewImage.name}
                  draggable={false}
                  className="object-contain rounded-lg select-none"
                  style={{ 
                    transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                    transformOrigin: 'center center',
                    maxWidth: zoomLevel <= 1 ? '100%' : 'none',
                    maxHeight: zoomLevel <= 1 ? '70vh' : 'none',
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      handleZoomIn();
                    } else {
                      handleZoomOut();
                    }
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {ConfirmDialog}
    </DashboardLayout>
  );
}

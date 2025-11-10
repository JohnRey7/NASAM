"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { useToast } from "@/components/ui/use-toast"  // ✅ CHANGED: from hooks to components
import {
  Search,
  Filter,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  MessageSquare,
  RefreshCw,
  Edit
} from "lucide-react"
import { AdminEditApplication } from "@/components/admin-edit-application"
import { MessageButton } from "@/components/message-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,  
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { applicationService } from "@/services/applicationService"

function DocumentChecker({ applicationId, userId }: { applicationId: string; userId?: string }) {
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [applicationId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // First try to get documents using the OAS endpoint
      let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${applicationId}/documents`, {
        credentials: 'include'
      });

      if (!response.ok && userId) {
        // If OAS endpoint fails and we have userId, try the document-uploads endpoint
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/document-uploads/user/${userId}`, {
          credentials: 'include'
        });
      }

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      console.log('📄 Document response:', data);
      console.log('📄 Document keys:', data.documents ? Object.keys(data.documents) : 'No documents');
      
      // Handle different response formats
      if (data.success !== undefined) {
        // OAS endpoint format
        if (data.success) {
          console.log('📄 Sample document:', data.documents?.studentPicture);
          setDocuments(data);
        } else {
          throw new Error(data.message);
        }
      } else if (data.data) {
        // document-uploads endpoint format
        const formattedData = {
          success: true,
          documents: data.data,
          gradeAverages: data.data.gradeAverages,
          incomeTaxInfo: data.data.incomeTaxInfo,
          userId: data.data.user
        };
        console.log('📄 Formatted data:', formattedData);
        setDocuments(formattedData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error instanceof Error ? error.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (docType: string, filePath: string, originalName?: string) => {
    try {
      // Remove "files/" prefix if present (for backward compatibility with old uploads)
      const cleanFilePath = filePath.replace(/^files\//, '');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/files/${cleanFilePath}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName || filePath; // Use originalName if available, otherwise UUID
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Document Downloaded",
        description: `${docType} has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: `Failed to download ${docType}: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  };

  const handleVerifyApplication = async (application: any) => {
    try {
      console.log('✅ Verifying application form for:', application._id);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${application._id}/verify-form`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Application form verified:', result);

      toast({
        title: "Application Form Verified",
        description: `Application form for ${application.firstName} ${application.lastName} has been verified and approved.`,
        duration: 5000
      });

      // Refresh the page to show updated status
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('❌ Verify application failed:', error);
      
      toast({
        title: "Verification Failed",
        description: `Failed to verify application form: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleVerifyAllDocuments = async () => {
    try {
      console.log('✅ Verifying all documents for application:', applicationId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${applicationId}/verify-documents`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Documents verified:', result);

      toast({
        title: "Documents Verified",
        description: `All documents have been verified and approved. Progress tracker updated.`,
        duration: 5000
      });

      // Refresh documents to show updated status
      await fetchDocuments();

    } catch (error) {
      console.error('❌ Verify documents failed:', error);
      
      toast({
        title: "Verification Failed",
        description: `Failed to verify documents: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleDeleteDocuments = async (applicationId: string) => {
    const isConfirmed = window.confirm(
      `🟠 DELETE DOCUMENTS ONLY\n\n` +
      `This will:\n` +
      `• ✅ Keep the application form intact\n` +
      `• ❌ Delete all uploaded documents\n` +
      `• 📄 Student must re-upload new documents\n\n` +
      `Perfect for: Bad documents, wrong files, corrupted uploads\n\n` +
      `Proceed?`
    );

    if (!isConfirmed) return;

    try {
      console.log('🗑️ Deleting documents only:', applicationId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${applicationId}/documents-only`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast({
        title: "Documents Deleted",
        description: "All documents have been deleted. Application form preserved. Student must re-upload documents.",
        duration: 5000
      });

      // Refresh documents to show empty state
      fetchDocuments();

    } catch (error) {
      console.error('❌ Delete documents failed:', error);
      
      toast({
        title: "Delete Failed",
        description: `Failed to delete documents: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const getDocumentIcon = (uploaded: boolean) => {
    return uploaded ? 
      <CheckCircle className="h-5 w-5 text-green-600" /> : 
      <XCircle className="h-5 w-5 text-red-600" />;
  };

  const documentTypes = [
    { key: 'studentPicture', label: 'Student Picture', required: true },
    { key: 'nbiClearance', label: 'NBI Clearance', required: true },
    { key: 'gradeReport', label: 'Grade Report', required: true },
    { key: 'incomeTaxReturn', label: 'Income Tax Return', required: true },
    { key: 'goodMoralCertificate', label: 'Good Moral Certificate', required: true },
    { key: 'physicalCheckup', label: 'Physical Checkup', required: true },
    { key: 'homeLocationSketch', label: 'Home Location Sketch', required: true }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
        <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error}</p>
        <Button onClick={fetchDocuments} variant="outline" size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Document Summary */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Document Status Summary</h3>
          <Badge 
            variant={documents?.summary?.isComplete ? "default" : "secondary"}
            className={documents?.summary?.isComplete ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
          >
            {documents?.summary?.totalUploaded || 0}/{documents?.summary?.totalRequired || 7} Complete
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-[#800000] h-2 rounded-full transition-all duration-300" 
            style={{ width: `${documents?.summary?.completionRate || 0}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {documents?.summary?.completionRate || 0}% Complete
        </p>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {documentTypes.map(({ key, label, required }) => {
          const doc = documents?.documents?.[key];
          return (
            <div key={key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                {getDocumentIcon(doc?.uploaded)}
                <div>
                  <p className="font-medium text-sm">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {doc?.uploaded ? (
                      <>
                        Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown'}
                        {doc.originalName && <span className="ml-2">({String(doc.originalName)})</span>}
                      </>
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
                {doc?.uploaded && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const downloadPath = doc.filePath || doc.filename;
                      const downloadName = doc.originalName || doc.filename;
                      if (downloadPath) {
                        handleDownloadDocument(label, downloadPath, downloadName);
                      } else {
                        toast({
                          title: "Download Failed",
                          description: "File path not found",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                )}
                
                <Badge 
                  variant={doc?.uploaded ? "default" : "secondary"}
                  className={doc?.uploaded ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                >
                  {doc?.uploaded ? 'Submitted' : 'Missing'}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t">
        <div className="flex gap-2">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleVerifyAllDocuments}
            disabled={!documents?.summary?.isComplete}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {documents?.summary?.isComplete ? 'Verify All Documents' : 'Documents Incomplete'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={fetchDocuments}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button 
            variant="destructive"
            onClick={() => handleDeleteDocuments(applicationId)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Delete Documents
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ApplicationReview() {
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [interviewDate, setInterviewDate] = useState("")
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [personalityTestData, setPersonalityTestData] = useState<any>(null);
  const [personalityTestLoading, setPersonalityTestLoading] = useState(false);
  const [remarks, setRemarks] = useState("")
  const { toast } = useToast()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<any | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [applicationToEdit, setApplicationToEdit] = useState<any>(null)

  const fetchApplications = () => {
    console.log('🚀 Starting to fetch applications...');
    setLoading(true)
    applicationService.getAllApplicationsForStaff()
      .then((apps) => {
        console.log('✅ Raw applications received:', apps);
        console.log('✅ Number of applications:', apps?.length || 0);
        
        // Sort FIFO: oldest first by submissionDate or createdAt
        const sorted = [...apps].sort((a, b) => new Date(a.submissionDate || a.createdAt).getTime() - new Date(b.submissionDate || b.createdAt).getTime())
        console.log('✅ Sorted applications:', sorted);
        setApplications(sorted)
      })
      .catch((err) => {
        console.error('❌ Error fetching applications:', err);
        setError(err.message || "Failed to load applications")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleEditClick = (application: any) => {
    setApplicationToEdit(application)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    fetchApplications() // Refresh the list
    toast({
      title: "Success",
      description: "Application list refreshed with latest changes",
      duration: 2000
    })
  }

  // Fetch server-side counts
  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      try {
        const res = await applicationService.getApplicationCounts();
        if (mounted && res && res.success) {
          setCounts(res.data);
        }
      } catch (err) {
        console.warn('Failed to fetch server counts, falling back to client counts', err);
      }
    };
    fetchCounts();
    return () => { mounted = false };
  }, []);

  // server-side counts (fallback to client-side computation)
  const totalCount = counts?.totalApplicants ?? applications.length
  const normalize = (s: any) => (s || '').toString().toLowerCase().replace(/\s+/g, '_')

  const pendingCount = counts?.counts?.pending ?? applications.filter(a => normalize(a.status) === 'pending').length
  const approvedCount = counts?.counts?.approved ?? applications.filter(a => normalize(a.status) === 'approved').length
  const rejectedCount = counts?.counts?.rejected ?? applications.filter(a => normalize(a.status) === 'rejected').length

  const filteredApplications = applications.filter((app) => {
    if (app.user?.idNumber === "ADMIN001") return false; // Exclude admin applications
    if (filter !== "all" && normalize(app.status) !== normalize(filter)) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (app.firstName + ' ' + app.lastName).toLowerCase().includes(searchLower) ||
        app.user?.idNumber?.toLowerCase().includes(searchLower) ||
        app._id?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Debug logging
  console.log('🔍 DEBUG - Total applications loaded:', applications.length);
  console.log('🔍 DEBUG - Current filter:', filter);
  console.log('🔍 DEBUG - Search term:', searchTerm);
  console.log('🔍 DEBUG - Filtered applications:', filteredApplications.length);
  console.log('🔍 DEBUG - Applications data:', applications.map(app => ({
    id: app._id,
    name: `${app.firstName} ${app.lastName}`,
    status: app.status,
    userIdNumber: app.user?.idNumber
  })));

  const getStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase?.() || "";
    switch (normalized) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-500">
            Pending
          </Badge>
        );
      case "document_verification":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Document Verification
          </Badge>
        );
      case "interview_scheduled":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700">
            Interview Scheduled
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  const handleScheduleInterview = async () => {
    if (!interviewDate) {
      toast({
        title: "Error",
        description: "Please select an interview date",
        variant: "destructive",
      })
      return
    }

    if (!selectedApplication) {
      toast({
        title: "Error",
        description: "No application selected",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('Scheduling interview for application:', selectedApplication._id);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/admin/interview/schedule`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: selectedApplication._id,
          interviewDate: interviewDate,
          notes: 'Scheduled via OAS Staff Dashboard'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Interview operation result:', result);

      // Handle both new and existing interviews
      if (result.isExisting) {
        if (result.isRescheduled) {
          // Interview was rescheduled
          const newDate = new Date(result.interviewDate).toLocaleDateString();
          toast({
            title: "Interview Rescheduled",
            description: `Interview for ${selectedApplication.firstName} ${selectedApplication.lastName} has been rescheduled to ${newDate}. Notification sent to the applicant.`,
            duration: 5000
          })
        } else {
          // Interview already exists - show existing interview details
          const existingDate = new Date(result.interviewDate).toLocaleDateString();
          toast({
            title: "Interview Already Scheduled",
            description: `${selectedApplication.firstName} ${selectedApplication.lastName} already has an interview scheduled for ${existingDate}. A reminder notification has been sent to the applicant.`,
            duration: 7000
          })
        }
      } else {
        // New interview scheduled
        toast({
          title: "Interview Scheduled",
          description: `Interview scheduled for ${selectedApplication.firstName} ${selectedApplication.lastName} on ${new Date(interviewDate).toLocaleDateString()}. Interview ID: ${result.interviewId}`,
          duration: 5000
        })
        
        // Update the application status to interview_scheduled for new interviews
        await handleUpdateStatus('interview_scheduled');
      }

      // Close dialog and reset form
      setSelectedApplication(null)
      setInterviewDate("")
      setIsRescheduling(false)
      
      // Refresh the applications list to show updated status
      fetchApplications();
      
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: `Failed to schedule interview: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = (newStatus: string) => {
    toast({
      title: "Status Updated",
      description: `Application status updated to ${newStatus}`,
    })

    // Close dialog
    setSelectedApplication(null)
    setRemarks("")
  }

  const handleDownloadApplicationPDF = async (application: any) => {
    console.log('🔍 DEBUG - Full application object:', application);
    console.log('🔍 DEBUG - application._id:', application._id);
    
    // Use application ID instead of user ID
    const applicationId = application._id;
    
    if (!applicationId || applicationId === 'undefined' || applicationId === 'null') {
      toast({
        title: "Error",
        description: "Application ID is missing or invalid",
        variant: "destructive"
      });
      return;
    }
    try {
      console.log(`📄 Downloading PDF for application: ${applicationId}`);
      
      // Use the new endpoint that takes application ID
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application-by-id/${applicationId}/pdf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/pdf',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      // Convert to blob and download
      const blob = await response.blob();
      console.log('📦 Blob size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('PDF file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `application-${application.firstName}_${application.lastName}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ PDF downloaded successfully`);
      
      toast({
        title: "PDF Downloaded",
        description: `${application.firstName} ${application.lastName}'s application has been downloaded successfully.`,
      });
      
    } catch (error) {
      console.error('❌ PDF download error:', error);
      toast({
        title: "Download Failed",
        description: `Failed to download PDF: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteApplication = async (application: any) => {
    // Confirmation dialog
    const isConfirmed = window.confirm(
      `⚠️ DELETE APPLICATION\n\n` +
      `Student: ${application.firstName} ${application.lastName}\n` +
      `Email: ${application.emailAddress}\n` +
      `Submission Date: ${new Date(application.submissionDate || application.createdAt).toLocaleDateString()}\n\n` +
      `This action will:\n` +
      `• Delete the entire application permanently\n` +
      `• Remove all associated documents\n` +
      `• Allow the student to submit a fresh application\n\n` +
      `Are you sure you want to proceed?`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      console.log('🗑️ Deleting application:', application._id);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${application._id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Application deleted successfully:', result);

      // Remove from local state
      setApplications(prev => prev.filter(app => app._id !== application._id));

      toast({
        title: "Application Deleted",
        description: `${application.firstName} ${application.lastName}'s application has been deleted successfully. They can now submit a new application.`,
        duration: 5000
      });

      // Refresh server-side counts
      try {
        const res = await applicationService.getApplicationCounts();
        if (res?.success) setCounts(res.data);
      } catch (err) {
        console.warn('Failed to refresh counts after delete', err);
      }

    } catch (error) {
      console.error('❌ Delete failed:', error);
      
      toast({
        title: "Delete Failed",
        description: `Failed to delete application: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  // Delete Application Form Only
  const handleDeleteApplicationForm = async (application: any) => {
    const isConfirmed = window.confirm(
      `🟡 DELETE APPLICATION FORM ONLY\n\n` +
      `Student: ${application.firstName} ${application.lastName}\n` +
      `Email: ${application.emailAddress}\n\n` +
      `This will:\n` +
      `• ❌ Delete the application form (answers, personal info)\n` +
      `• ✅ Keep all uploaded documents intact\n` +
      `• ✅ Student can resubmit form using existing documents\n\n` +
      `Perfect for: Wrong answers, form errors\n\n` +
      `Proceed?`
    );

    if (!isConfirmed) return;

    try {
      console.log('🗑️ Deleting application form only:', application._id);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${application._id}/form-only`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // Remove from applications list since form is deleted
      setApplications(prev => prev.filter(app => app._id !== application._id));

      toast({
        title: "Application Form Deleted",
        description: `${application.firstName} ${application.lastName}'s form deleted. Documents preserved for reuse.`,
        duration: 5000
      });

      // Refresh server-side counts
      try {
        const res = await applicationService.getApplicationCounts();
        if (res?.success) setCounts(res.data);
      } catch (err) {
        console.warn('Failed to refresh counts after form-only delete', err);
      }

    } catch (error) {
      toast({
        title: "Delete Failed",
        description: `Failed to delete application form: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  // Delete Documents Only
  const handleDeleteDocuments = async (application: any) => {
    const isConfirmed = window.confirm(
      `🟠 DELETE DOCUMENTS ONLY\n\n` +
      `Student: ${application.firstName} ${application.lastName}\n` +
      `Email: ${application.emailAddress}\n\n` +
      `This will:\n` +
      `• ✅ Keep the application form intact\n` +
      `• ❌ Delete all uploaded documents\n` +
      `• 📄 Student must re-upload new documents\n\n` +
      `Perfect for: Bad documents, wrong files, corrupted uploads\n\n` +
      `Proceed?`
    );

    if (!isConfirmed) return;

    try {
      console.log('🗑️ Deleting documents only:', application._id);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${application._id}/documents-only`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast({
        title: "Documents Deleted",
        description: `${application.firstName} ${application.lastName}'s documents deleted. Application form preserved.`,
        duration: 5000
      });

      // Refresh server-side counts (document-only delete doesn't change status usually, but refresh to be safe)
      try {
        const res = await applicationService.getApplicationCounts();
        if (res?.success) setCounts(res.data);
      } catch (err) {
        console.warn('Failed to refresh counts after documents delete', err);
      }

      // Refresh to show updated document status
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      toast({
        title: "Delete Failed", 
        description: `Failed to delete documents: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  // Fetch personality test data for selected application
  const fetchPersonalityTestData = async (userId: string) => {
    if (!userId) return;
    
    setPersonalityTestLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/personality-test/user/${userId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalityTestData(data);
        console.log('Personality test data fetched:', data);
      } else if (response.status === 404) {
        // No personality test found - this is normal
        setPersonalityTestData(null);
      } else {
        throw new Error('Failed to fetch personality test data');
      }
    } catch (error) {
      console.error('Error fetching personality test:', error);
      setPersonalityTestData(null);
    } finally {
      setPersonalityTestLoading(false);
    }
  };

  // Reset personality test data when application changes
  useEffect(() => {
    if (selectedApplication?.user?._id) {
      fetchPersonalityTestData(selectedApplication.user._id);
    } else {
      setPersonalityTestData(null);
    }
  }, [selectedApplication]);

  const handleVerifyApplication = async (application: any) => {
    try {
      console.log('✅ Verifying application form:', application._id);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${application._id}/verify`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Application verified:', result);
      console.log('🔍 DEBUG: New status should be:', result.application?.status); // ✅ ADD THIS DEBUG LINE

      // Update local state to reflect the change
      setApplications(prev => 
        prev.map(app => 
          app._id === application._id 
            ? { ...app, status: result.application?.status || 'form_verified' } // ✅ USE ACTUAL STATUS FROM RESPONSE
            : app
        )
      );

      // Update the selected application in the dialog
      if (selectedApplication) {
        setSelectedApplication({ ...selectedApplication, status: 'form_verified' });
      }

      toast({
        title: "Application Verified",
        description: `${application.firstName} ${application.lastName}'s application form has been verified and approved. Progress tracker updated.`,
        duration: 5000
      });

      // Refresh server-side counts
      try {
        const res = await applicationService.getApplicationCounts();
        if (res?.success) setCounts(res.data);
      } catch (err) {
        console.warn('Failed to refresh counts after verify', err);
      }

    } catch (error) {
      console.error('❌ Verify failed:', error);
      
      toast({
        title: "Verification Failed",
        description: `Failed to verify application: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <CardTitle className="text-[#800000]">Application Management</CardTitle>
          <CardDescription>Review and process scholarship applications</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex gap-3 w-full mb-2">
              <div className="flex-1 grid grid-cols-4 gap-3">
                <div className="p-3 bg-white border rounded">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-[#800000]">{totalCount}</p>
                </div>
                <div className="p-3 bg-white border rounded">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-xl font-bold">{pendingCount}</p>
                </div>
                <div className="p-3 bg-white border rounded">
                  <p className="text-xs text-gray-500">Approved</p>
                  <p className="text-xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <div className="p-3 bg-white border rounded">
                  <p className="text-xs text-gray-500">Rejected</p>
                  <p className="text-xl font-bold text-red-600">{rejectedCount}</p>
                </div>
              </div>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, ID, or application number"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="document_verification">Document Verification</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-2 text-left font-medium text-sm">Application ID</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Student Name</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Student ID</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Course</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Gender</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Submission Date</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Status</th>
                  <th className="py-3 px-2 text-left font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application: any) => (
                  <tr key={application._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm">{application._id}</td>
                    <td className="py-3 px-2 text-sm">{application.firstName} {application.lastName}</td>
                    <td className="py-3 px-2 text-sm">{application.user?.idNumber}</td>
                    <td className="py-3 px-2 text-sm">{application.programOfStudyAndYear}</td>
                    <td className="py-3 px-2 text-sm">{application.gender || 'Unknown'}</td>
                    <td className="py-3 px-2 text-sm">{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}</td>
                    <td className="py-3 px-2 text-sm">{getStatusBadge(application.status)}</td>
                    <td className="py-3 px-2 text-sm">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedApplication(application)}
                              title="View Application"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                              <DialogDescription>
                                Review application {application._id} submitted by {application.firstName} {application.lastName}
                              </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="personality">Personality Test</TabsTrigger>
                                <TabsTrigger value="interview">Interview</TabsTrigger>
                              </TabsList>

                              <TabsContent value="details" className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                                    <p>{application.firstName} {application.middleName} {application.lastName} {application.suffix}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Student ID</p>
                                    <p>{application.user?.idNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                                    <p>{application.emailAddress}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Program/Year</p>
                                    <p>{application.programOfStudyAndYear}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Existing Scholarship</p>
                                    <p>{application.existingScholarship}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Remaining Units</p>
                                    <p>{application.remainingUnitsIncludingThisTerm}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Remaining Terms</p>
                                    <p>{application.remainingTermsToGraduate}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Citizenship</p>
                                    <p>{application.citizenship}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Civil Status</p>
                                    <p>{application.civilStatus}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Annual Family Income</p>
                                    <p>{application.annualFamilyIncome}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Current Residence Address</p>
                                    <p>{application.currentResidenceAddress}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Permanent Address</p>
                                    <p>{application.permanentResidentialAddress}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Contact Number</p>
                                    <p>{application.contactNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <div>{getStatusBadge(application.status)}</div>  {/* ✅ Use <div> instead of <p> */}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Submission Date</p>
                                    <p>{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}</p>
                                  </div>
                                </div>
                                
                                {/* ✅ UPDATED: Add Verify Application button alongside Download */}
                                <div className="pt-4 border-t">
                                  <div className="flex gap-2">
                                    <Button
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => handleVerifyApplication(application)}
                                      disabled={application.status === 'form_verified'}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      {application.status === 'form_verified' ? 'Application Verified' : 'Verify Application'}
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      onClick={() => handleDownloadApplicationPDF(application)}
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      Download Application
                                    </Button>
                                    
                                    {application.status === 'form_verified' && (
                                      <Badge className="bg-green-100 text-green-800 self-center">
                                        ✅ Form Approved
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="documents" className="space-y-4 py-4">
                                <DocumentChecker applicationId={application._id} userId={application.user?._id || application.userId} />
                              </TabsContent>

                              <TabsContent value="personality" className="space-y-4 py-4">
                                {personalityTestLoading ? (
                                  <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                                    <span className="ml-2 text-sm text-gray-600">Loading personality test data...</span>
                                  </div>
                                ) : personalityTestData ? (
                                  <div className="max-w-2xl mx-auto">
                                    {/* Assessment Completed Card - Matching Applicant View */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                                      {/* Checkmark Icon */}
                                      <div className="flex justify-center mb-4">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                          <CheckCircle className="w-8 h-8 text-green-600" />
                                        </div>
                                      </div>

                                      {/* Title */}
                                      <h2 className="text-2xl font-bold text-green-800 mb-2">
                                        Assessment Completed
                                      </h2>
                                      
                                      {/* Subtitle */}
                                      <p className="text-green-700 mb-4">
                                        Applicant is done taking the personality test.
                                      </p>

                                      {/* Status Message */}
                                      <p className="text-sm text-green-600 mb-6">
                                        Please proceed to the{' '}
                                        <span className="font-semibold underline cursor-pointer"
                                              onClick={() => {
                                                // Switch to interview tab if available
                                                const interviewTab = document.querySelector('[value="interview"]') as HTMLElement;
                                                if (interviewTab) interviewTab.click();
                                              }}>
                                          Application Status
                                        </span>{' '}
                                        tab and wait for the approval.
                                      </p>

                                      {/* Completion Message */}
                                      <div className="bg-white/50 rounded-lg p-4 mb-6">
                                        <p className="text-sm text-gray-700 mb-4">
                                          Thank you for completing the personality assessment. Your responses have been recorded
                                          and will be reviewed by the scholarship committee.
                                        </p>
                                        
                                        <p className="text-sm text-gray-600 mb-4">
                                          You answered {personalityTestData.answers?.length || 0} out of {personalityTestData.questions?.length || personalityTestData.answers?.length || 0} questions.
                                        </p>

                                        {/* Risk Level Display */}
                                        <div className="space-y-2">
                                          <p className="text-lg font-semibold text-gray-800">
                                            Risk Level: <span className={`${
                                              personalityTestData.riskLevelIndicator === 'Low' 
                                                ? 'text-green-600'
                                                : personalityTestData.riskLevelIndicator === 'Medium'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                            }`}>
                                              {personalityTestData.riskLevelIndicator || 'Unknown'}
                                            </span>
                                          </p>
                                        </div>

                                        {/* Guidance Message */}
                                        <p className="text-sm text-gray-600 mt-4">
                                          <strong>Guidance:</strong> {' '}
                                          {personalityTestData.riskLevelIndicator === 'Low' && 'Excellent! Your responses demonstrate strong personal qualities that align well with our scholarship values.'}
                                          {personalityTestData.riskLevelIndicator === 'Medium' && 'Your responses show a balanced profile. Continue demonstrating your commitment to academic excellence.'}
                                          {personalityTestData.riskLevelIndicator === 'High' && 'Your responses indicate areas that may need attention. The scholarship committee will review your application carefully.'}
                                          {!personalityTestData.riskLevelIndicator && 'Your responses show a balanced profile. Continue demonstrating your commitment to academic excellence.'}
                                        </p>
                                      </div>

                                      {/* Additional Test Details */}
                                      <div className="bg-white/30 rounded-lg p-4 text-left">
                                        <h4 className="font-semibold text-gray-700 mb-3 text-center">Test Summary</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="text-gray-600">Completion Date:</span>
                                            <p className="font-medium text-gray-800">
                                              {personalityTestData.endTime 
                                                ? new Date(personalityTestData.endTime).toLocaleDateString()
                                                : 'N/A'
                                              }
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Time Taken:</span>
                                            <p className="font-medium text-gray-800">
                                              {personalityTestData.startTime && personalityTestData.endTime
                                                ? `${Math.round((new Date(personalityTestData.endTime).getTime() - new Date(personalityTestData.startTime).getTime()) / (1000 * 60))} minutes`
                                                : 'N/A'
                                              }
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Test ID:</span>
                                            <p className="font-medium text-gray-800 text-xs">
                                              {personalityTestData._id?.slice(-8) || 'N/A'}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Status:</span>
                                            <p className="font-medium text-green-700">
                                              Completed
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Action Button */}
                                      <div className="mt-6">
                                        <Button 
                                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                                          onClick={() => {
                                            toast({
                                              title: "Personality test Mark as reviewed",
                                              description: `Personality assessment for ${selectedApplication?.firstName} ${selectedApplication?.lastName} has been reviewed by staff.`,
                                            });
                                          }}
                                        >
                                          Mark as Reviewed
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                    <div className="flex">
                                      <div className="flex-shrink-0">
                                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                      </div>
                                      <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                          <strong>Pending:</strong> Applicant has not completed the personality test yet.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="interview" className="space-y-4 py-4">
                                {(() => {
                                  console.log('📅 Interview Data:', {
                                    scheduled: application.interviewScheduled,
                                    date: application.interviewDate,
                                    completed: application.interviewCompleted,
                                    status: application.interviewStatus
                                  });
                                  return null;
                                })()}
                                {application.interviewScheduled ? (
                                  <div className="space-y-4">
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                          <Calendar className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div className="ml-3 flex-1">
                                          <p className="text-sm text-blue-700 font-semibold mb-1">
                                            Interview Scheduled
                                          </p>
                                          {application.interviewDate ? (
                                            <p className="text-sm font-medium text-blue-800">
                                              {new Date(application.interviewDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                              })}
                                            </p>
                                          ) : (
                                            <p className="text-sm text-gray-500">Date not available</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {application.interviewCompleted ? (
                                      <div>
                                        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                                          <div className="flex">
                                            <div className="flex-shrink-0">
                                              <CheckCircle className="h-5 w-5 text-green-400" />
                                            </div>
                                            <div className="ml-3">
                                              <p className="text-sm text-green-700">
                                                <strong>Interview Completed</strong>
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          <div>
                                            <h3 className="text-sm font-medium text-gray-500">Interviewer Remarks</h3>
                                            <p className="mt-1 p-3 bg-gray-50 rounded-md">
                                              The applicant demonstrated excellent communication skills and a clear
                                              understanding of their academic goals. Their responses aligned well with
                                              the scholarship's objectives.
                                            </p>
                                          </div>

                                          <div>
                                            <h3 className="text-sm font-medium text-gray-500">Final Recommendation</h3>
                                            <div className="mt-1">
                                              {application.status === "approved" ? (
                                                <Badge className="bg-green-500">Recommended for Approval</Badge>
                                              ) : (
                                                <Badge className="bg-red-500">Not Recommended</Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="pt-4 flex gap-2">
                                          <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleUpdateStatus("approved")}
                                          >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve Application
                                          </Button>

                                          <Button
                                            className="bg-red-600 hover:bg-red-700"
                                            onClick={() => handleUpdateStatus("rejected")}
                                          >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject Application
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="pt-4">
                                        <p className="text-sm text-gray-500 mb-4">
                                          The interview has been scheduled but not yet completed.
                                        </p>

                                        {!isRescheduling ? (
                                          <div className="flex gap-3">
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                toast({
                                                  title: "Reminder Sent",
                                                  description:
                                                    "Interview reminder has been sent to the applicant and panelists.",
                                                })
                                              }}
                                            >
                                              <MessageSquare className="mr-2 h-4 w-4" />
                                              Send Reminder
                                            </Button>

                                            <Button
                                              variant="outline"
                                              className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                              onClick={() => {
                                                setIsRescheduling(true)
                                                setInterviewDate(application.interviewDate ? new Date(application.interviewDate).toISOString().split('T')[0] : '')
                                              }}
                                            >
                                              <Calendar className="mr-2 h-4 w-4" />
                                              Reschedule
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="space-y-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="reschedule-date">New Interview Date</Label>
                                              <Input
                                                id="reschedule-date"
                                                type="date"
                                                value={interviewDate}
                                                onChange={(e) => setInterviewDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                              />
                                            </div>

                                            <div className="flex gap-2">
                                              <Button
                                                className="bg-[#800000] hover:bg-[#600000]"
                                                onClick={handleScheduleInterview}
                                              >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Confirm Reschedule
                                              </Button>
                                              
                                              <Button
                                                variant="outline"
                                                onClick={() => setIsRescheduling(false)}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                      <div className="flex">
                                        <div className="flex-shrink-0">
                                          <Calendar className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div className="ml-3">
                                          <p className="text-sm text-blue-700">
                                            <strong>Interview Status:</strong> {application.interviewScheduled ? 'Scheduled' : 'Not Scheduled'}
                                          </p>
                                          {application.interviewDate && (
                                            <p className="text-sm text-blue-700 mt-1">
                                              <strong>Date:</strong> {new Date(application.interviewDate).toLocaleDateString('en-US', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                              })}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {!application.interviewScheduled && (
                                      <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="interview-date">Schedule Interview Date</Label>
                                          <Input
                                            id="interview-date"
                                            type="date"
                                            value={interviewDate}
                                            onChange={(e) => setInterviewDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                          />
                                        </div>

                                        <Button
                                          className="bg-[#800000] hover:bg-[#600000]"
                                          onClick={handleScheduleInterview}
                                        >
                                          <Calendar className="mr-2 h-4 w-4" />
                                          Schedule Interview
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {application.interviewScheduled && (
                                      <div className="pt-4">
                                        <p className="text-sm text-gray-600 mb-3">
                                          Interview has been scheduled. You can send a reminder to the applicant.
                                        </p>
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            toast({
                                              title: "Reminder Sent",
                                              description: "Interview reminder has been sent to the applicant.",
                                            })
                                          }}
                                        >
                                          <MessageSquare className="mr-2 h-4 w-4" />
                                          Send Reminder
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>

                            <DialogFooter>
                              <div className="flex gap-2 ml-auto">
                                
                                <Button 
                                  variant="destructive"
                                  onClick={() => handleDeleteApplication(application)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Delete Application
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedApplication(null)
                                    setIsRescheduling(false)
                                  }}
                                >
                                  Close
                                </Button>
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEditClick(application)}
                          title="Edit Application"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownloadApplicationPDF(application)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        {application.user?._id && application.firstName && (
                          <MessageButton
                            receiverId={application.user._id}
                            receiverName={`${application.firstName} ${application.lastName || ''}`}
                            applicationId={application._id}
                            conversationType="admin-applicant"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      No applications found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Admin Edit Dialog */}
      {applicationToEdit && (
        <AdminEditApplication
          application={applicationToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

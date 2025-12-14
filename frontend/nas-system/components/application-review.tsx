"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useConfirmation } from "@/components/ui/confirmation-dialog"

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
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Users,
  Award,
  AlertCircle
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
import { useAuth } from "@/contexts/auth-context"

function DocumentChecker({ applicationId, userId, idNumber }: { applicationId: string; userId?: string; idNumber?: string }) {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmation();
  
  const [documents, setDocuments] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  
  // Document sub-tabs state (similar to interview tabs)
  const [documentSubTab, setDocumentSubTab] = useState<'current' | 'deleted'>('current');
  const [deletedDocuments, setDeletedDocuments] = useState<any[]>([]);
  const [deletedDocumentsLoading, setDeletedDocumentsLoading] = useState(false);

  // Check if file is an image based on extension or mime type
  const isImageFile = (filename: string | undefined): boolean => {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerFilename = filename.toLowerCase();
    return imageExtensions.some(ext => lowerFilename.endsWith(ext));
  };

  const handlePreviewDocument = async (docType: string, filePath: string, originalName?: string) => {
    // Check if file is an image
    const filename = originalName || filePath;
    if (!isImageFile(filename)) {
      toast({
        title: "Preview Not Available",
        description: "Preview is only available for image files. Use Download instead.",
      });
      return;
    }

    try {
      // Remove "files/" prefix if present
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

  const closePreview = () => {
    if (previewImage?.url) {
      window.URL.revokeObjectURL(previewImage.url);
    }
    setPreviewImage(null);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      // Reset position if zooming back to 1 or below
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
      // Free panning - no constraints
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setImagePosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [applicationId, idNumber]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let response;
      
      // Try different endpoints in order of preference
      // 1. First try the OAS endpoint with applicationId
      response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${applicationId}/documents`, {
        credentials: 'include'
      });

      // 2. If OAS endpoint fails and we have idNumber, try the new document endpoint
      if (!response.ok && idNumber) {
        console.log('📄 Trying /api/document/:idNumber endpoint with:', idNumber);
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/document/${idNumber}`, {
          credentials: 'include'
        });
      }

      // 3. If still failing and we have userId, try the document-uploads endpoint
      if (!response.ok && userId) {
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

  const handleRevertFormVerification = async (application: any) => {
    const isConfirmed = await confirm({
      title: "Revert Application Verification",
      description: "This will revert the application form verification status back to pending. The application will need to be verified again.",
      confirmText: "Revert Verification",
      cancelText: "Cancel",
      type: "warning"
    });

    if (!isConfirmed) return;

    try {
      console.log('🔄 Reverting form verification for application:', application._id);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${application._id}/revert-form-verification`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('🔄 Form verification reverted:', result);

      toast({
        title: "Verification Reverted",
        description: `Application form verification has been reverted to pending status.`,
        duration: 5000
      });

      // Refresh the page to show updated status
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('❌ Revert form verification failed:', error);
      
      toast({
        title: "Revert Failed",
        description: `Failed to revert verification: ${error instanceof Error ? error.message : String(error)}`,
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

  const handleRevertDocumentVerification = async () => {
    const isConfirmed = await confirm({
      title: "Revert Document Verification",
      description: "This will revert the document verification status. The applicant will need to wait for documents to be verified again before they can take the personality test.",
      confirmText: "Revert Verification",
      cancelText: "Cancel",
      type: "warning"
    });

    if (!isConfirmed) return;

    try {
      console.log('🔄 Reverting document verification for application:', applicationId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${applicationId}/revert-document-verification`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('🔄 Document verification reverted:', result);

      toast({
        title: "Verification Reverted",
        description: `Document verification has been reverted. Documents need to be verified again.`,
        duration: 5000
      });

      // Refresh documents to show updated status
      await fetchDocuments();

    } catch (error) {
      console.error('❌ Revert verification failed:', error);
      
      toast({
        title: "Revert Failed",
        description: `Failed to revert verification: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleDeleteDocuments = async (applicationId: string) => {
    const isConfirmed = await confirm({
      title: "Soft Delete Documents Only",
      description: `This will:\n• ✅ Keep the application form intact\n• ❌ Mark all uploaded documents as deleted (soft delete)\n• ✅ CAN BE RESTORED if needed\n• 📄 Student can re-upload new documents\n\nPerfect for: Bad documents, wrong files, corrupted uploads`,
      confirmText: "Delete Documents",
      cancelText: "Cancel",
      type: "warning"
    });

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
        title: "Documents Soft Deleted",
        description: "All documents have been soft deleted. Application form preserved. Documents can be restored if needed.",
        duration: 5000
      });

      // Refresh documents to show empty state
      fetchDocuments();
      // Also refresh deleted documents list
      fetchDeletedDocuments();

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

  // Fetch deleted documents - filter by current user being viewed
  const fetchDeletedDocuments = async () => {
    setDeletedDocumentsLoading(true);
    try {
      // Add userId filter to only get deleted documents for the current application's user
      const queryParam = userId ? `?userId=${userId}` : '';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/document-uploads/deleted${queryParam}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('🗑️ Deleted documents fetched:', result);
        // Handle both array and { documents: [...] } formats
        let docs = Array.isArray(result) ? result : (result.documents || []);
        
        // Additional client-side filter to ensure we only show documents for the current user
        // This prevents cross-user data leaks even if the backend doesn't filter properly
        if (userId) {
          docs = docs.filter((doc: any) => 
            doc.user?._id === userId || 
            doc.user === userId ||
            doc.userId === userId
          );
        }
        
        setDeletedDocuments(docs);
      } else {
        console.log('🗑️ No deleted documents found or error fetching');
        setDeletedDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching deleted documents:', error);
      setDeletedDocuments([]);
    } finally {
      setDeletedDocumentsLoading(false);
    }
  };

  // Restore a deleted document
  const handleRestoreDocument = async (documentUserId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/document-uploads/${documentUserId}/restore`,
        {
          method: 'PUT',
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        toast({
          title: "Documents Restored",
          description: "The documents have been restored successfully.",
        });
        // Refresh deleted documents list
        fetchDeletedDocuments();
        // Refresh current documents if this was for the current user
        if (documentUserId === userId) {
          fetchDocuments();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to restore documents');
      }
    } catch (error) {
      console.error('Error restoring documents:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore documents",
        variant: "destructive"
      });
    }
  };

  // Permanently delete a document
  const handlePermanentDeleteDocument = async (documentUserId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/document-uploads/${documentUserId}/permanent`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        toast({
          title: "Documents Permanently Deleted",
          description: "The documents have been permanently removed.",
        });
        // Refresh deleted documents list
        fetchDeletedDocuments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to permanently delete documents');
      }
    } catch (error) {
      console.error('Error permanently deleting documents:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to permanently delete documents",
        variant: "destructive"
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
    { key: 'homeLocationSketch', label: 'Home Location Sketch', required: true },
    { key: 'personalityTestPaymentReceipt', label: 'Personality Test Payment Receipt', required: true }
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
      {/* Sub-tabs for Current and Deleted Documents */}
      <div className="mb-4">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium ${documentSubTab === 'current' ? 'border-b-2 border-[#800000] text-[#800000]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setDocumentSubTab('current')}
          >
            Current Documents
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${documentSubTab === 'deleted' ? 'border-b-2 border-[#800000] text-[#800000]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => {
              setDocumentSubTab('deleted')
              fetchDeletedDocuments()
            }}
          >
            Deleted Documents
          </button>
        </div>
      </div>

      {documentSubTab === 'current' ? (
        <>
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
            <p className="text-sm text-gray-600 mt-1">
              {documents?.summary?.completionRate || 0}% Complete
            </p>
          </div>

          {/* Document List */}
          <div className="space-y-3">
        {documentTypes.map(({ key, label, required }) => {
          const doc = documents?.documents?.[key];
          // Handle both single objects (studentPicture) and arrays
          const isArray = Array.isArray(doc);
          const docList = isArray ? doc : (doc ? [doc] : []);
          const hasDocuments = isArray ? doc?.length > 0 : doc?.uploaded;
          
          // For single docs (studentPicture), check if it's an image
          const singleDocCanPreview = !isArray && doc?.uploaded && isImageFile(doc.originalName || doc.filePath || doc.filename);
          
          return (
            <div 
              key={key} 
              className={`p-3 border rounded-lg hover:bg-gray-50 ${singleDocCanPreview ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all' : ''}`}
              onClick={() => {
                // Only auto-preview for single documents (like studentPicture)
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
                  {getDocumentIcon(hasDocuments)}
                  <div>
                    <p className="font-medium text-sm">
                      {label}
                      {required && <span className="text-red-500 ml-1">*</span>}
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
                              } else {
                                toast({
                                  title: "Download Failed",
                                  description: "File path not found",
                                  variant: "destructive"
                                });
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

      {/* Action Buttons */}
      <div className="pt-4 border-t">
        {/* Verification Status Banner */}
        {documents?.documentsVerified && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Documents Verified</p>
              {documents.documentsVerifiedAt && (
                <p className="text-xs text-green-600">
                  Verified on {new Date(documents.documentsVerifiedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {documents.documentsVerifiedBy && (
                    <span> by {documents.documentsVerifiedBy.name || documents.documentsVerifiedBy.email || 'OAS Staff'}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          {documents?.documentsVerified ? (
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleRevertDocumentVerification}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Revert Verification
            </Button>
          ) : (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleVerifyAllDocuments}
              disabled={!documents?.summary?.isComplete}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {documents?.summary?.isComplete ? 'Verify All Documents' : 'Documents Incomplete'}
            </Button>
          )}
          
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
            className="bg-red-600 hover:bg-red-700"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Delete Documents
          </Button>
        </div>
      </div>
        </>
      ) : (
        /* Deleted Documents Tab */
        <div className="space-y-4">
          {deletedDocumentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
              <span className="ml-2 text-sm text-gray-600">Loading deleted documents...</span>
            </div>
          ) : deletedDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No deleted documents found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedDocuments.map((doc: any) => (
                <div key={doc._id} className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        User: {doc.user?.name || doc.user?.email || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>ID Number:</strong> {doc.user?.idNumber || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Documents:</strong> {
                          [
                            doc.studentPicture?.filePath ? 'Student Picture' : null,
                            doc.nbiClearance?.length > 0 ? 'NBI Clearance' : null,
                            doc.gradeReport?.length > 0 ? 'Grade Report' : null,
                            doc.incomeTaxReturn?.length > 0 ? 'Income Tax Return' : null,
                            doc.goodMoralCertificate?.length > 0 ? 'Good Moral' : null,
                            doc.physicalCheckup?.length > 0 ? 'Physical Checkup' : null,
                            doc.homeLocationSketch?.length > 0 ? 'Home Sketch' : null,
                          ].filter(Boolean).join(', ') || 'No documents'
                        }
                      </p>
                      <p className="text-xs text-gray-400">
                        Deleted: {new Date(doc.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-300 text-green-600 hover:bg-green-50"
                        onClick={() => handleRestoreDocument(doc.user?._id || doc._id)}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: "Permanently Delete Documents",
                            description: "This action cannot be undone. All documents will be permanently removed from the system.",
                            confirmText: "Delete Permanently",
                            cancelText: "Cancel",
                            type: "danger"
                          });
                          if (confirmed) {
                            handlePermanentDeleteDocument(doc.user?._id || doc._id);
                          }
                        }}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Preview Dialog with Zoom */}
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
      {ConfirmDialog}
    </div>
  );
}

export function ApplicationReview() {
  const { user } = useAuth()
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc') // 'desc' = newest first (default)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [interviewDate, setInterviewDate] = useState("")
  const [interviewTime, setInterviewTime] = useState("09:00")
  const [interviewEndTime, setInterviewEndTime] = useState("10:00")
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [personalityTestData, setPersonalityTestData] = useState<any>(null);
  const [personalityTestLoading, setPersonalityTestLoading] = useState(false);
  const [remarks, setRemarks] = useState("")
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirmation()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<any | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [applicationToEdit, setApplicationToEdit] = useState<any>(null)
  const [personalityTestReviewed, setPersonalityTestReviewed] = useState(false)
  
  // Interview state - from Interview model
  const [interviewData, setInterviewData] = useState<any>(null)
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [deletedInterviews, setDeletedInterviews] = useState<any[]>([])
  const [deletedInterviewsLoading, setDeletedInterviewsLoading] = useState(false)
  const [interviewSubTab, setInterviewSubTab] = useState<'active' | 'deleted'>('active')
  const [interviewers, setInterviewers] = useState<any[]>([])
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>("")
  const [schedulingType, setSchedulingType] = useState<'OAS' | 'DepartmentHead' | null>(null)
  const [conflictError, setConflictError] = useState<{title: string, message: string} | null>(null)
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalDocs: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchApplications = useCallback(async (
    page: number = 1,
    order: 'asc' | 'desc' = sortOrder,
    search?: string,
    status?: string
  ) => {
    console.log('🚀 Starting to fetch applications with:', { page, order, search, status });
    setLoading(true)
    setError(null)
    
    try {
      const result = await applicationService.getAllApplications(order, page, 20, search, status)
      console.log('✅ Applications received:', result);
      
      setApplications(result.applications)
      setPagination({
        page: result.pagination.page || page,
        limit: result.pagination.limit || 20,
        totalDocs: result.pagination.totalDocs || 0,
        totalPages: result.pagination.totalPages || 1,
        hasNextPage: result.pagination.hasNextPage || false,
        hasPrevPage: result.pagination.hasPrevPage || false
      })
    } catch (err: any) {
      console.error('❌ Error fetching applications:', err);
      setError(err.message || "Failed to load applications")
    } finally {
      setLoading(false)
    }
  }, [sortOrder])

  // Fetch when filters change
  useEffect(() => {
    fetchApplications(1, sortOrder, debouncedSearch, filter)
  }, [debouncedSearch, filter, sortOrder, fetchApplications])

  // Fetch interview data for an application
  const fetchInterviewData = async (applicationId: string) => {
    setInterviewLoading(true)
    setInterviewData(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/interview/application/${applicationId}/all`,
        { credentials: 'include' }
      )
      
      if (response.ok) {
        const result = await response.json()
        console.log('📅 Interview data fetched:', result)
        setInterviewData(result)
      } else {
        console.log('📅 No interview found or error fetching')
        setInterviewData({ interviews: [], isScheduled: false })
      }
    } catch (error) {
      console.error('Error fetching interview data:', error)
      setInterviewData({ interviews: [], isScheduled: false })
    } finally {
      setInterviewLoading(false)
    }
  }

  // Fetch deleted interviews
  const fetchDeletedInterviews = async () => {
    if (!selectedApplication?._id) return
    
    setDeletedInterviewsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/interviews/deleted?applicationId=${selectedApplication._id}`,
        { credentials: 'include' }
      )
      
      if (response.ok) {
        const result = await response.json()
        console.log('🗑️ Deleted interviews fetched:', result)
        // Handle both array and { data: [...] } formats
        const interviews = Array.isArray(result) ? result : (result.data || [])
        setDeletedInterviews(interviews)
      } else {
        console.log('🗑️ No deleted interviews found or error fetching')
        setDeletedInterviews([])
      }
    } catch (error) {
      console.error('Error fetching deleted interviews:', error)
      setDeletedInterviews([])
    } finally {
      setDeletedInterviewsLoading(false)
    }
  }

  // Fetch interviewers (oas_staff and department_head users)
  const fetchInterviewers = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/users/interviewers`,
        { credentials: 'include' }
      )
      
      if (response.ok) {
        const result = await response.json()
        console.log('👥 Interviewers fetched:', result)
        setInterviewers(result.data || [])
      } else {
        console.log('👥 No interviewers found or error fetching')
        setInterviewers([])
      }
    } catch (error) {
      console.error('Error fetching interviewers:', error)
      setInterviewers([])
    }
  }

  // Fetch interviewers on component mount
  useEffect(() => {
    fetchInterviewers()
  }, [])

  // Delete (soft delete) an interview
  const handleDeleteInterview = async (interviewId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/interview/${interviewId}/soft`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      )
      
      if (response.ok) {
        toast({
          title: "Interview Deleted",
          description: "The interview has been moved to trash. You can restore it from the Deleted tab.",
        })
        // Refresh interview data
        if (selectedApplication?._id) {
          fetchInterviewData(selectedApplication._id)
        }
        // Refresh deleted interviews list
        fetchDeletedInterviews()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete interview')
      }
    } catch (error) {
      console.error('Error deleting interview:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete interview",
        variant: "destructive"
      })
    }
  }

  // Restore a deleted interview
  const handleRestoreInterview = async (interviewId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/interview/${interviewId}/restore`,
        {
          method: 'PUT',
          credentials: 'include'
        }
      )
      
      if (response.ok) {
        toast({
          title: "Interview Restored",
          description: "The interview schedule has been restored.",
        })
        // Refresh deleted interviews list
        fetchDeletedInterviews()
        // Refresh current interview data if we're viewing the same application
        if (selectedApplication?._id) {
          fetchInterviewData(selectedApplication._id)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to restore interview')
      }
    } catch (error) {
      console.error('Error restoring interview:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore interview",
        variant: "destructive"
      })
    }
  }

  // Permanently delete an interview
  const handlePermanentDeleteInterview = async (interviewId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/interview/${interviewId}/permanent`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      )
      
      if (response.ok) {
        toast({
          title: "Interview Permanently Deleted",
          description: "The interview has been permanently removed.",
        })
        // Refresh deleted interviews list
        fetchDeletedInterviews()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to permanently delete interview')
      }
    } catch (error) {
      console.error('Error permanently deleting interview:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to permanently delete interview",
        variant: "destructive"
      })
    }
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    fetchApplications(page, sortOrder, debouncedSearch, filter)
  }

  const handleEditClick = (application: any) => {
    setApplicationToEdit(application)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    fetchApplications(pagination.page, sortOrder, debouncedSearch, filter) // Refresh the list
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
  const totalCount = counts?.totalApplicants ?? pagination.totalDocs
  const normalize = (s: any) => (s || '').toString().toLowerCase().replace(/\s+/g, '_')

  const approvedCount = counts?.counts?.approved ?? 0
  const rejectedCount = counts?.counts?.rejected ?? 0
  // Under Consideration shows rejected count, since "rejected" status now displays as "Under Consideration"
  const underConsiderationCount = counts?.counts?.rejected ?? 0
  // Pending includes: pending + all other statuses (form_verified, document_verification, interview_scheduled, pending_evaluation, draft, etc.)
  const pendingCount = (counts?.counts?.pending ?? 0) + 
                       (counts?.counts?.draft ?? 0) + 
                       (counts?.counts?.form_verified ?? 0) + 
                       (counts?.counts?.document_verification ?? 0) + 
                       (counts?.counts?.interview_scheduled ?? 0) +
                       (counts?.counts?.pending_evaluation ?? 0)

  // Filter only admin applications client-side (server handles search and status)
  const filteredApplications = applications.filter((app) => {
    if (app.user?.idNumber === "ADMIN001") return false; // Exclude admin applications
    return true;
  });

  // Debug logging
  console.log('🔍 DEBUG - Total applications loaded:', applications.length);
  console.log('🔍 DEBUG - Current filter:', filter);
  console.log('🔍 DEBUG - Search term:', searchTerm);
  console.log('🔍 DEBUG - Pagination:', pagination);

  const getStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase?.() || "";
    switch (normalized) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-500">
            Pending
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-500">
            Draft
          </Badge>
        );
      case "form_verified":
        return (
          <Badge variant="outline" className="bg-teal-100 text-teal-700">
            Form Verified
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
      case "pending_evaluation":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-700">
            Pending Evaluation
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
            Under Consideration
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  const handleScheduleInterview = async (app?: any) => {
    // Use passed application or fall back to selectedApplication
    const targetApplication = app || selectedApplication;
    
    console.log('🔥 handleScheduleInterview called');
    console.log('📅 interviewDate:', interviewDate);
    console.log('⏰ interviewTime:', interviewTime);
    console.log('⏰ interviewEndTime:', interviewEndTime);
    console.log('📋 targetApplication:', targetApplication);
    
    if (!interviewDate) {
      toast({
        title: "Error",
        description: "Please select an interview date",
        variant: "destructive",
      })
      return
    }

    if (!interviewTime) {
      toast({
        title: "Error",
        description: "Please select a start time",
        variant: "destructive",
      })
      return
    }

    if (!interviewEndTime) {
      toast({
        title: "Error",
        description: "Please select an end time",
        variant: "destructive",
      })
      return
    }

    // Validate end time is after start time
    if (interviewEndTime <= interviewTime) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return
    }

    if (!targetApplication) {
      toast({
        title: "Error",
        description: "No application selected",
        variant: "destructive",
      })
      return
    }

    if (!selectedInterviewer) {
      toast({
        title: "Error",
        description: "Please select an interviewer",
        variant: "destructive",
      })
      return
    }

    try {
      // Combine date and time into full datetime strings
      const startDateTime = `${interviewDate}T${interviewTime}:00`;
      const endDateTime = `${interviewDate}T${interviewEndTime}:00`;
      console.log('Scheduling interview for application:', targetApplication._id, 'from', startDateTime, 'to', endDateTime, 'interviewer:', selectedInterviewer);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/admin/interview/schedule`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: targetApplication._id,
          startTime: startDateTime,
          endTime: endDateTime,
          interviewerId: selectedInterviewer,
          notes: 'Scheduled via OAS Staff Dashboard',
          type: schedulingType || 'OAS' // Default to OAS if not specified
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Interview operation result:', result);

      // Format date and time for display
      const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      };

      // Handle both new and existing interviews
      if (result.isExisting) {
        if (result.isRescheduled) {
          // Interview was rescheduled
          const newDateTime = formatDateTime(result.interviewDate);
          toast({
            title: "Interview Rescheduled",
            description: `Interview for ${targetApplication.firstName} ${targetApplication.lastName} has been rescheduled to ${newDateTime}. Notification sent to the applicant.`,
            duration: 5000
          })
        } else {
          // Interview already exists - show existing interview details
          const existingDateTime = formatDateTime(result.interviewDate);
          toast({
            title: "Interview Already Scheduled",
            description: `${targetApplication.firstName} ${targetApplication.lastName} already has an interview scheduled for ${existingDateTime}. A reminder notification has been sent to the applicant.`,
            duration: 7000
          })
        }
      } else {
        // New interview scheduled
        const scheduledDateTime = formatDateTime(startDateTime);
        toast({
          title: "Interview Scheduled",
          description: `Interview scheduled for ${targetApplication.firstName} ${targetApplication.lastName} on ${scheduledDateTime}. Interview ID: ${result.interviewId}`,
          duration: 5000
        })
        
        // Update the application status to interview_scheduled for new interviews
        await handleUpdateStatus('interview_scheduled');
      }

      // Close dialog and reset form
      setSelectedApplication(null)
      setInterviewDate("")
      setInterviewTime("09:00")
      setInterviewEndTime("10:00")
      setIsRescheduling(false)
      
      // Refresh the applications list to show updated status
      fetchApplications();
      
    } catch (error) {
      console.error('Error scheduling interview:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('own academic department')) {
        setConflictError({
          title: "Conflict of Interest",
          message: "The applicant cannot be interviewed by the head of their own academic department. Please select a different interviewer."
        });
      } else if (errorMessage.includes('already booked for another interview')) {
        setConflictError({
          title: "Interviewer Unavailable",
          message: "The selected interviewer is already booked for another interview at this time. Please select a different time or interviewer."
        });
      } else if (errorMessage.includes('applicant already has another interview')) {
        setConflictError({
          title: "Applicant Unavailable",
          message: "The applicant already has another interview scheduled at this time. Please select a different time."
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to schedule interview: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  }

  const handleSendReminder = async (interview?: any) => {
    const targetInterview = interview || interviewData?.interview || (interviewData?.interviews && interviewData.interviews[0]);
    if (!selectedApplication || !targetInterview) {
      toast({
        title: "Error",
        description: "No interview data available",
        variant: "destructive",
      })
      return
    }

    try {
      const userId = selectedApplication.user?._id
      if (!userId) {
        toast({
          title: "Error",
          description: "Could not find applicant user ID",
          variant: "destructive",
        })
        return
      }

      const interviewDate = new Date(targetInterview.startTime)
      const formattedDate = interviewDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const formattedTime = interviewDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: userId,
          type: 'interview_reminder',
          title: 'Interview Reminder',
          message: `This is a reminder for your upcoming interview scheduled on ${formattedDate} at ${formattedTime}. Please make sure to be available on time.`,
          priority: 'high',
          metadata: {
            interviewId: targetInterview._id,
            applicationId: selectedApplication._id,
            scheduledDate: targetInterview.startTime
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Reminder Sent",
          description: "Interview reminder has been sent to the applicant.",
        })
      } else {
        throw new Error(result.message || 'Failed to send reminder')
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast({
        title: "Error",
        description: `Failed to send reminder: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  const handleFinishInterview = async (interviewId: string, isCurrentlyFinished: boolean) => {
    try {
      const endpoint = isCurrentlyFinished ? 'revert-finish' : 'finish'
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/interview/${interviewId}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: isCurrentlyFinished ? "Interview Reverted" : "Interview Finished",
          description: isCurrentlyFinished 
            ? "Interview has been marked as not finished." 
            : "Interview has been marked as finished. Application status updated to 'Pending Evaluation'.",
        })

        // Refresh interview data - await to ensure UI updates
        if (selectedApplication) {
          await fetchInterviewData(selectedApplication._id)
        }
        
        // Refresh the applications list to reflect status change
        await fetchApplications(pagination.page, sortOrder, debouncedSearch, filter)
      } else {
        throw new Error(result.message || 'Failed to update interview status')
      }
    } catch (error) {
      console.error('Error updating interview status:', error)
      toast({
        title: "Error",
        description: `Failed to update interview status: ${error instanceof Error ? error.message : String(error)}`,
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
    const isConfirmed = await confirm({
      title: "Soft Delete Application",
      description: `Student: ${application.firstName} ${application.lastName}\nEmail: ${application.emailAddress}\nSubmission Date: ${new Date(application.submissionDate || application.createdAt).toLocaleDateString()}\n\nThis action will:\n• Mark the entire application as deleted (soft delete)\n• Hide from active applications list\n• CAN BE RESTORED if needed\n• Allow the student to submit a fresh application`,
      confirmText: "Delete Application",
      cancelText: "Cancel",
      type: "danger"
    });

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

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response text:', text);
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
        }
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Application deleted successfully:', result);

      // Remove from local state
      setApplications(prev => prev.filter(app => app._id !== application._id));

      toast({
        title: "Application Soft Deleted",
        description: `${application.firstName} ${application.lastName}'s application has been soft deleted. It can be restored from the deleted applications section if needed.`,
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
    const isConfirmed = await confirm({
      title: "Soft Delete Application Form Only",
      description: `Student: ${application.firstName} ${application.lastName}\nEmail: ${application.emailAddress}\n\nThis will:\n• ❌ Mark application form as deleted (soft delete)\n• ✅ Keep all uploaded documents intact\n• ✅ CAN BE RESTORED if needed\n• ✅ Student can resubmit form using existing documents\n\nPerfect for: Wrong answers, form errors`,
      confirmText: "Delete Form",
      cancelText: "Cancel",
      type: "warning"
    });

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
        title: "Application Form Soft Deleted",
        description: `${application.firstName} ${application.lastName}'s form soft deleted. Documents preserved and can be restored if needed.`,
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
    const isConfirmed = await confirm({
      title: "Soft Delete Documents Only",
      description: `Student: ${application.firstName} ${application.lastName}\nEmail: ${application.emailAddress}\n\nThis will:\n• ✅ Keep the application form intact\n• ❌ Mark all uploaded documents as deleted (soft delete)\n• ✅ CAN BE RESTORED if needed\n• 📄 Student can re-upload new documents\n\nPerfect for: Bad documents, wrong files, corrupted uploads`,
      confirmText: "Delete Documents",
      cancelText: "Cancel",
      type: "warning"
    });

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
        title: "Documents Soft Deleted",
        description: `${application.firstName} ${application.lastName}'s documents soft deleted. Application form preserved and documents can be restored if needed.`,
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
        // Set reviewed state from backend data
        setPersonalityTestReviewed(data.reviewed || false);
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

  const handleRevertFormVerification = async (application: any) => {
    const isConfirmed = await confirm({
      title: "Revert Application Verification",
      description: "This will revert the application form verification status back to pending. The application will need to be verified again.",
      confirmText: "Revert Verification",
      cancelText: "Cancel",
      type: "warning"
    });

    if (!isConfirmed) return;

    try {
      console.log('🔄 Reverting form verification for application:', application._id);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/oas/application/${application._id}/revert-form-verification`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('🔄 Form verification reverted:', result);

      // Update local state to reflect the change
      setApplications(prev => 
        prev.map(app => 
          app._id === application._id 
            ? { ...app, status: result.application?.status || 'pending' }
            : app
        )
      );

      // Update the selected application in the dialog
      if (selectedApplication) {
        setSelectedApplication({ ...selectedApplication, status: 'pending' });
      }

      toast({
        title: "Verification Reverted",
        description: `Application form verification has been reverted to pending status.`,
        duration: 5000
      });

      // Refresh server-side counts
      try {
        const res = await applicationService.getApplicationCounts();
        if (res?.success) setCounts(res.data);
      } catch (err) {
        console.warn('Failed to refresh counts after revert', err);
      }

    } catch (error) {
      console.error('❌ Revert form verification failed:', error);
      
      toast({
        title: "Revert Failed",
        description: `Failed to revert verification: ${error instanceof Error ? error.message : String(error)}`,
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
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-white border rounded">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-[#800000]">{totalCount}</p>
            </div>
            <div className="p-3 bg-white border rounded">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold">{pendingCount}</p>
            </div>
            <div className="p-3 bg-white border rounded">
              <p className="text-xs text-gray-500">Under Consideration</p>
              <p className="text-xl font-bold text-red-600">{underConsiderationCount}</p>
            </div>
            <div className="p-3 bg-white border rounded">
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-xl font-bold text-green-600">{approvedCount}</p>
            </div>
          </div>
          
          {/* Search and Filter Row */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, ID, or application number"
                className="pl-10 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="form_verified">Form Verified</SelectItem>
                  <SelectItem value="document_verification">Document Verification</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="pending_evaluation">Pending Evaluation</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Under Consideration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-2 text-left font-medium text-sm">Application ID</th>
                  <th className="py-3 px-4 text-left font-medium text-sm">Student Name</th>
                  <th className="py-3 px-4 text-left font-medium text-sm">Student ID</th>
                  <th className="py-3 px-4 text-left font-medium text-sm">Course</th>
                  <th className="py-3 pl-0 pr-4 text-center font-medium text-sm">Gender</th>
                  <th 
                    className="py-3 px-4 text-left font-medium text-sm cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => {
                      const newOrder = sortOrder === 'desc' ? 'asc' : 'desc'
                      setSortOrder(newOrder)
                      fetchApplications(pagination.page, newOrder, debouncedSearch, filter)
                    }}
                    title="Click to toggle sort order"
                  >
                    Submission Date {sortOrder === 'asc' ? '↑' : '↓'}
                  </th>
                  <th className="py-3 px-6 text-left font-medium text-sm">Status</th>
                  <th className="py-3 px-4 text-left font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application: any) => (
                  <tr key={application._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm">{application._id}</td>
                    <td className="py-3 px-4 text-sm whitespace-nowrap">{application.firstName} {application.lastName}</td>
                    <td className="py-3 px-4 text-sm whitespace-nowrap">{application.user?.idNumber}</td>
                    <td className="py-3 px-4 text-sm">{application.programOfStudyAndYear}</td>
                    <td className="py-3 pl-0 pr-4 text-sm text-center">{application.gender || 'Unknown'}</td>
                    <td className="py-3 px-4 text-sm">{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}</td>
                    <td className="py-3 px-4 text-sm">{getStatusBadge(application.status)}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedApplication(application);
                                // Fetch personality test data to get correct reviewed status
                                if (application?.user?._id) {
                                  fetchPersonalityTestData(application.user._id);
                                }
                              }}
                              title="View Application"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl w-[95vw] h-[95vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                              <DialogDescription>
                                Review application {application._id} submitted by {application.firstName} {application.lastName}
                              </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="details" className="w-full flex-1 flex flex-col overflow-hidden">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="personality">Personality Test</TabsTrigger>
                                <TabsTrigger 
                                  value="interview"
                                  onClick={() => fetchInterviewData(application._id)}
                                >
                                  Interview
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="details" className="space-y-4 py-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                                    <p>{application.firstName} {application.middleName} {application.lastName} {application.suffix}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Birth Date</p>
                                    <p>{application.birthDate ? new Date(application.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
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
                                
                                {/* Action Buttons - In Details Section */}
                                <div className="pt-4 border-t mt-4">
                                  <div className="flex gap-2 flex-wrap">
                                    {/* Verify/Revert Application Button */}
                                    {application.status === 'form_verified' || application.status === 'document_verification' ? (
                                      <Button
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                        onClick={() => handleRevertFormVerification(application)}
                                      >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Revert Application Verification
                                      </Button>
                                    ) : (
                                      <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleVerifyApplication(application)}
                                        disabled={application.status !== 'pending'}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Verify Application
                                      </Button>
                                    )}
                                    
                                    {/* Download Application Button */}
                                    <Button
                                      variant="outline"
                                      onClick={() => handleDownloadApplicationPDF(application)}
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      Download Application
                                    </Button>
                                    
                                    {/* Status Badge */}
                                    {application.status === 'form_verified' && (
                                      <Badge className="bg-green-100 text-green-800 self-center">
                                        ✅ Form Approved
                                      </Badge>
                                    )}
                                    {application.status === 'document_verification' && (
                                      <Badge className="bg-blue-100 text-blue-800 self-center">
                                        📄 Documents Verified
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="documents" className="py-4 overflow-y-auto pr-2">
                                <DocumentChecker 
                                  applicationId={application._id} 
                                  userId={application.user?._id || application.userId} 
                                  idNumber={application.user?.idNumber}
                                />
                              </TabsContent>

                              <TabsContent value="personality" className="py-4 overflow-y-auto pr-2">
                                {personalityTestLoading ? (
                                  <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                                    <span className="ml-2 text-sm text-gray-600">Loading personality test data...</span>
                                  </div>
                                ) : personalityTestData ? (
                                  <div className="max-w-xl mx-auto">
                                    {/* Assessment Completed Card - Compact Version */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                      {/* Checkmark Icon */}
                                      <div className="flex justify-center mb-2">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                          <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                      </div>

                                      {/* Title */}
                                      <h2 className="text-lg font-bold text-green-800 mb-1">
                                        Assessment Completed
                                      </h2>
                                      
                                      {/* Test ID */}
                                      <div className="text-xs text-gray-500 mb-2">
                                        Test ID: {personalityTestData._id}
                                      </div>
                                      
                                      {/* Risk Level & Questions - Inline */}
                                      <div className="flex items-center justify-center gap-4 mb-3 text-sm">
                                        <span className="text-gray-600">
                                          {Math.min(personalityTestData.answers?.length || 0, personalityTestData.questions?.length || 10)}/{personalityTestData.questions?.length || 10} questions
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className={`font-semibold ${
                                          personalityTestData.riskLevelIndicator === 'Very Low' 
                                            ? 'text-red-600'
                                            : personalityTestData.riskLevelIndicator === 'Low'
                                            ? 'text-orange-600'
                                            : personalityTestData.riskLevelIndicator === 'Below Average'
                                            ? 'text-yellow-600'
                                            : personalityTestData.riskLevelIndicator === 'Average'
                                            ? 'text-blue-600'
                                            : personalityTestData.riskLevelIndicator === 'Above Average'
                                            ? 'text-green-600'
                                            : 'text-gray-600'
                                        }`}>
                                          {personalityTestData.riskLevelIndicator || 'Unknown'}
                                        </span>
                                      </div>

                                      {/* Test Summary - Compact Grid */}
                                      <div className="bg-white/50 rounded-lg p-3 text-left">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <span className="text-gray-500">Completed:</span>
                                            <span className="ml-1 font-medium text-gray-700">
                                              {personalityTestData.endTime 
                                                ? new Date(personalityTestData.endTime).toLocaleDateString()
                                                : 'N/A'
                                              }
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Duration:</span>
                                            <span className="ml-1 font-medium text-gray-700">
                                              {personalityTestData.startTime && personalityTestData.endTime
                                                ? `${Math.round((new Date(personalityTestData.endTime).getTime() - new Date(personalityTestData.startTime).getTime()) / (1000 * 60))} min`
                                                : 'N/A'
                                              }
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Action Buttons - Only show one button based on review status */}
                                      <div className="mt-4 flex justify-center gap-3">
                                        {!personalityTestReviewed ? (
                                          <Button 
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={async () => {
                                              try {
                                                const userId = selectedApplication?.user?._id || selectedApplication?.userId;
                                                if (!userId) {
                                                  throw new Error('User ID not found');
                                                }
                                                
                                                const response = await fetch(
                                                  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/personality-test/user/${userId}/mark-reviewed`,
                                                  {
                                                    method: 'PATCH',
                                                    credentials: 'include',
                                                    headers: {
                                                      'Content-Type': 'application/json'
                                                    }
                                                  }
                                                );
                                                
                                                if (!response.ok) {
                                                  const errorData = await response.json();
                                                  throw new Error(errorData.message || `HTTP ${response.status}`);
                                                }
                                                
                                                setPersonalityTestReviewed(true);
                                                toast({
                                                  title: "✅ Marked as Reviewed",
                                                  description: `Personality assessment for ${selectedApplication?.firstName} ${selectedApplication?.lastName} has been reviewed by staff.`,
                                                });
                                              } catch (error) {
                                                console.error('Error marking as reviewed:', error);
                                                toast({
                                                  title: "Review Failed",
                                                  description: `Failed to mark as reviewed: ${error instanceof Error ? error.message : String(error)}`,
                                                  variant: "destructive",
                                                  duration: 5000
                                                });
                                              }
                                            }}
                                          >
                                            Mark as Reviewed
                                          </Button>
                                        ) : (
                                          <Button 
                                            variant="destructive"
                                            className="px-6 py-2"
                                            onClick={async () => {
                                              const isConfirmed = await confirm({
                                                title: "Reset Personality Test",
                                                description: `Student: ${selectedApplication?.firstName} ${selectedApplication?.lastName}\n\nThis will:\n• Delete the current personality test results\n• Allow the applicant to retake the test`,
                                                confirmText: "Reset Test",
                                                cancelText: "Cancel",
                                                type: "danger"
                                              });
                                              if (!isConfirmed) return;
                                              
                                              try {
                                                const userId = selectedApplication?.user?._id || selectedApplication?.userId;
                                                if (!userId) {
                                                  throw new Error('User ID not found');
                                                }
                                                
                                                const response = await fetch(
                                                  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/personality-test/user/${userId}`,
                                                  {
                                                    method: 'DELETE',
                                                    credentials: 'include',
                                                    headers: {
                                                      'Content-Type': 'application/json'
                                                    }
                                                  }
                                                );
                                                
                                                if (!response.ok) {
                                                  const errorData = await response.json();
                                                  throw new Error(errorData.message || `HTTP ${response.status}`);
                                                }
                                                
                                                toast({
                                                  title: "Personality Test Reset",
                                                  description: `${selectedApplication?.firstName} ${selectedApplication?.lastName}'s personality test has been deleted. They can now retake the test.`,
                                                  duration: 5000
                                                });
                                                
                                                // Refresh personality test data
                                                setPersonalityTestData(null);
                                                setPersonalityTestReviewed(false);
                                              } catch (error) {
                                                console.error('Error resetting personality test:', error);
                                                toast({
                                                  title: "Reset Failed",
                                                  description: `Failed to reset personality test: ${error instanceof Error ? error.message : String(error)}`,
                                                  variant: "destructive",
                                                  duration: 5000
                                                });
                                              }
                                            }}
                                          >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Revert Test
                                          </Button>
                                        )}
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

                              <TabsContent value="interview" className="py-4 overflow-y-auto pr-2">
                                {/* Sub-tabs for Active and Deleted Interviews */}
                                <div className="mb-4">
                                  <div className="flex border-b">
                                    <button
                                      className={`px-4 py-2 text-sm font-medium ${interviewSubTab === 'active' ? 'border-b-2 border-[#800000] text-[#800000]' : 'text-gray-500 hover:text-gray-700'}`}
                                      onClick={() => setInterviewSubTab('active')}
                                    >
                                      Active Interview
                                    </button>
                                    <button
                                      className={`px-4 py-2 text-sm font-medium ${interviewSubTab === 'deleted' ? 'border-b-2 border-[#800000] text-[#800000]' : 'text-gray-500 hover:text-gray-700'}`}
                                      onClick={() => {
                                        setInterviewSubTab('deleted')
                                        fetchDeletedInterviews()
                                      }}
                                    >
                                      Deleted Interviews
                                    </button>
                                  </div>
                                </div>

                                {interviewSubTab === 'active' ? (
                                  <>
                                    {interviewLoading ? (
                                      <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                                        <span className="ml-2 text-sm text-gray-600">Loading interview data...</span>
                                      </div>
                                    ) : (
                                      <div className="space-y-6">
                                        {/* OAS Staff Interview Card */}
                                        <div className="border rounded-lg p-4 bg-white shadow-sm">
                                          <h3 className="text-lg font-semibold mb-4 flex items-center">
                                            <Users className="mr-2 h-5 w-5 text-blue-600" />
                                            OAS Staff Interview
                                          </h3>
                                          {interviewData?.interviews?.find((i: any) => i.type === 'OAS') ? (
                                            (() => {
                                              const interview = interviewData.interviews.find((i: any) => i.type === 'OAS');
                                              return (
                                                <div className="space-y-4">
                                                  <div className={`${interview.is_finished ? 'bg-green-50 border-green-400' : 'bg-blue-50 border-blue-400'} border-l-4 p-4`}>
                                                    <div className="flex items-start">
                                                      <div className="flex-shrink-0">
                                                        {interview.is_finished ? (
                                                          <CheckCircle className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                          <Calendar className="h-5 w-5 text-blue-400" />
                                                        )}
                                                      </div>
                                                      <div className="ml-3 flex-1">
                                                        <p className={`text-sm ${interview.is_finished ? 'text-green-700' : 'text-blue-700'} font-semibold mb-1`}>
                                                          {interview.is_finished ? 'Interview Completed' : 'Interview Scheduled'}
                                                        </p>
                                                        <div className="space-y-1">
                                                          <p className={`text-sm font-medium ${interview.is_finished ? 'text-green-800' : 'text-blue-800'}`}>
                                                            <strong>Interview ID:</strong> {interview.interviewId}
                                                          </p>
                                                          <p className={`text-sm font-medium ${interview.is_finished ? 'text-green-800' : 'text-blue-800'}`}>
                                                            <strong>Date:</strong> {new Date(interview.startTime).toLocaleDateString('en-US', {
                                                              weekday: 'long',
                                                              year: 'numeric',
                                                              month: 'long',
                                                              day: 'numeric'
                                                            })}
                                                          </p>
                                                          <p className={`text-sm font-medium ${interview.is_finished ? 'text-green-800' : 'text-blue-800'}`}>
                                                            <strong>Time:</strong> {new Date(interview.startTime).toLocaleTimeString('en-US', {
                                                              hour: 'numeric',
                                                              minute: '2-digit',
                                                              hour12: true
                                                            })}
                                                          </p>
                                                          {interview.interviewer && (
                                                            <p className={`text-sm font-medium ${interview.is_finished ? 'text-green-800' : 'text-blue-800'}`}>
                                                              <strong>Interviewer:</strong> {interview.interviewer.name || interview.interviewer.email}
                                                            </p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  
                                                  {/* Actions for OAS Interview */}
                                                  <div className="flex gap-3 flex-wrap">
                                                    <Button
                                                      variant="outline"
                                                      onClick={() => handleSendReminder(interview)}
                                                    >
                                                      <MessageSquare className="mr-2 h-4 w-4" />
                                                      Send Reminder
                                                    </Button>
                                                    
                                                    <Button
                                                      variant={interview.is_finished ? "outline" : "default"}
                                                      className={interview.is_finished 
                                                        ? "border-orange-300 text-orange-600 hover:bg-orange-50" 
                                                        : "bg-green-600 hover:bg-green-700 text-white"
                                                      }
                                                      onClick={() => handleFinishInterview(interview._id, interview.is_finished)}
                                                    >
                                                      <CheckCircle className="mr-2 h-4 w-4" />
                                                      {interview.is_finished ? "Revert Interview" : "Finish Interview"}
                                                    </Button>

                                                      <Button
                                                        variant="outline"
                                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                                        onClick={async () => {
                                                          const confirmed = await confirm({
                                                            title: "Delete Interview",
                                                            description: `Are you sure you want to delete this interview?`,
                                                            confirmText: "Delete",
                                                            cancelText: "Cancel",
                                                            type: "danger"
                                                          });
                                                          if (confirmed) {
                                                            handleDeleteInterview(interview._id);
                                                          }
                                                        }}
                                                      >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                      </Button>
                                                  </div>
                                                </div>
                                              );
                                            })()
                                          ) : (
                                            <div className="space-y-4">
                                              <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                                                <p className="text-sm text-gray-700">No OAS Staff interview scheduled yet.</p>
                                              </div>
                                              <Button
                                                className="bg-[#800000] hover:bg-[#600000]"
                                                onClick={() => {
                                                  setSchedulingType('OAS');
                                                  setInterviewDate('');
                                                  setInterviewTime('09:00');
                                                  setInterviewEndTime('10:00');
                                                  setSelectedInterviewer('');
                                                }}
                                              >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Schedule OAS Interview
                                              </Button>
                                            </div>
                                          )}
                                        </div>

                                        {/* Department Head Interview Card */}
                                        <div className="border rounded-lg p-4 bg-white shadow-sm">
                                          <h3 className="text-lg font-semibold mb-4 flex items-center">
                                            <Award className="mr-2 h-5 w-5 text-purple-600" />
                                            Department Head Interview
                                          </h3>
                                          {interviewData?.interviews?.find((i: any) => i.type === 'DepartmentHead') ? (
                                            (() => {
                                              const interview = interviewData.interviews.find((i: any) => i.type === 'DepartmentHead');
                                              return (
                                                <div className="space-y-4">
                                                  <div className={`${interview.is_finished ? 'bg-green-50 border-green-400' : 'bg-purple-50 border-purple-400'} border-l-4 p-4`}>
                                                    <div className="flex items-start">
                                                      <div className="flex-shrink-0">
                                                        {interview.is_finished ? (
                                                          <CheckCircle className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                          <Calendar className="h-5 w-5 text-purple-400" />
                                                        )}
                                                      </div>
                                                      <div className="ml-3 flex-1">
                                                        <p className={`text-sm ${interview.is_finished ? 'text-green-700' : 'text-purple-700'} font-semibold mb-1`}>
                                                          {interview.is_finished ? 'Interview Completed' : 'Interview Scheduled'}
                                                        </p>
                                                        <div className="space-y-1">
                                                          <p className={`text-sm font-medium ${interview.is_finished ? 'text-green-800' : 'text-purple-800'}`}>
                                                            <strong>Interview ID:</strong> {interview.interviewId}
                                                          </p>
                                                          <p className={`text-sm font-medium ${interview.is_finished ? 'text-green-800' : 'text-purple-800'}`}>
                                                            <strong>Date:</strong> {new Date(interview.startTime).toLocaleDateString('en-US', {
                                                              weekday: 'long',
                                                              year: 'numeric',
                                                              month: 'long',
                                                              day: 'numeric'
                                                            })}
                                                          </p>
                                                          <p className={`text-sm font-medium ${interview.is_finished ? 'text-green-800' : 'text-purple-800'}`}>
                                                            <strong>Time:</strong> {new Date(interview.startTime).toLocaleTimeString('en-US', {
                                                              hour: 'numeric',
                                                              minute: '2-digit',
                                                              hour12: true
                                                            })}
                                                          </p>
                                                          {interview.interviewer && (
                                                            <p className={`text-sm font-medium ${interview.is_finished ? 'text-green-800' : 'text-purple-800'}`}>
                                                              <strong>Interviewer:</strong> {interview.interviewer.name || interview.interviewer.email}
                                                            </p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  
                                                  {/* Actions for Dept Head Interview */}
                                                  <div className="flex gap-3 flex-wrap">
                                                    <Button
                                                      variant="outline"
                                                      onClick={() => handleSendReminder(interview)}
                                                    >
                                                      <MessageSquare className="mr-2 h-4 w-4" />
                                                      Send Reminder
                                                    </Button>
                                                    
                                                    <Button
                                                      variant={interview.is_finished ? "outline" : "default"}
                                                      className={interview.is_finished 
                                                        ? "border-orange-300 text-orange-600 hover:bg-orange-50" 
                                                        : "bg-green-600 hover:bg-green-700 text-white"
                                                      }
                                                      onClick={() => handleFinishInterview(interview._id, interview.is_finished)}
                                                    >
                                                      <CheckCircle className="mr-2 h-4 w-4" />
                                                      {interview.is_finished ? "Revert Interview" : "Finish Interview"}
                                                    </Button>

                                                      <Button
                                                        variant="outline"
                                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                                        onClick={async () => {
                                                          const confirmed = await confirm({
                                                            title: "Delete Interview",
                                                            description: `Are you sure you want to delete this interview?`,
                                                            confirmText: "Delete",
                                                            cancelText: "Cancel",
                                                            type: "danger"
                                                          });
                                                          if (confirmed) {
                                                            handleDeleteInterview(interview._id);
                                                          }
                                                        }}
                                                      >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                      </Button>
                                                  </div>
                                                </div>
                                              );
                                            })()
                                          ) : (
                                            <div className="space-y-4">
                                              <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                                                <p className="text-sm text-gray-700">No Department Head interview scheduled yet.</p>
                                              </div>
                                              <Button
                                                className="bg-[#800000] hover:bg-[#600000]"
                                                onClick={() => {
                                                  setSchedulingType('DepartmentHead');
                                                  setInterviewDate('');
                                                  setInterviewTime('09:00');
                                                  setInterviewEndTime('10:00');
                                                  setSelectedInterviewer('');
                                                }}
                                              >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Schedule Dept Head Interview
                                              </Button>
                                            </div>
                                          )}
                                        </div>

                                        {/* Scheduling Modal/Form */}
                                        {schedulingType && (
                                          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                            <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
                                              <h3 className="text-lg font-semibold">
                                                Schedule {schedulingType === 'OAS' ? 'OAS Staff' : 'Department Head'} Interview
                                              </h3>
                                              
                                              <div className="space-y-4">
                                                <div className="space-y-2">
                                                  <Label htmlFor="interview-interviewer">Interviewer</Label>
                                                  <Select
                                                    value={selectedInterviewer}
                                                    onValueChange={setSelectedInterviewer}
                                                  >
                                                    <SelectTrigger id="interview-interviewer">
                                                      <SelectValue placeholder="Select an interviewer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {interviewers
                                                        .filter((i: any) => {
                                                          if (schedulingType === 'OAS') return i.role?.name === 'oas_staff';
                                                          if (schedulingType === 'DepartmentHead') return i.role?.name === 'department_head';
                                                          return true;
                                                        })
                                                        .map((interviewer: any) => (
                                                          <SelectItem key={interviewer._id} value={interviewer._id}>
                                                            {interviewer.name} ({interviewer.role?.name === 'oas_staff' ? 'OAS Staff' : (interviewer.department?.name || 'Department Head')})
                                                          </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                  <Label htmlFor="interview-date">Date</Label>
                                                  <Input
                                                    id="interview-date"
                                                    type="date"
                                                    value={interviewDate}
                                                    onChange={(e) => setInterviewDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                  />
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                  <div className="space-y-2">
                                                    <Label htmlFor="interview-start-time">Start Time</Label>
                                                    <Input
                                                      id="interview-start-time"
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
                                                    <Label htmlFor="interview-end-time">End Time</Label>
                                                    <Input
                                                      id="interview-end-time"
                                                      type="time"
                                                      value={interviewEndTime}
                                                      onChange={(e) => setInterviewEndTime(e.target.value)}
                                                    />
                                                  </div>
                                                </div>

                                                <div className="flex justify-end gap-2 pt-4">
                                                  <Button
                                                    variant="outline"
                                                    onClick={() => setSchedulingType(null)}
                                                  >
                                                    Cancel
                                                  </Button>
                                                  <Button
                                                    className="bg-[#800000] hover:bg-[#600000]"
                                                    onClick={async () => {
                                                      setInterviewLoading(true);
                                                      await handleScheduleInterview(selectedApplication);
                                                      setSchedulingType(null);
                                                      await new Promise(resolve => setTimeout(resolve, 500));
                                                      await fetchInterviewData(selectedApplication._id);
                                                    }}
                                                    disabled={!selectedInterviewer || !interviewDate}
                                                  >
                                                    Confirm Schedule
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  /* Deleted Interviews Tab */
                                  <div className="space-y-4">
                                    {deletedInterviewsLoading ? (
                                      <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                                        <span className="ml-2 text-sm text-gray-600">Loading deleted interviews...</span>
                                      </div>
                                    ) : deletedInterviews.length === 0 ? (
                                      <div className="text-center py-8 text-gray-500">
                                        <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        <p>No deleted interviews found.</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        {deletedInterviews.map((interview: any) => (
                                          <div key={interview._id} className="bg-gray-50 border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                              <div className="space-y-1">
                                                <p className="text-sm font-medium">
                                                  Interview ID: INT-{new Date(interview.createdAt).getFullYear()}-{String(interview._id).slice(-6).toUpperCase()}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                  <strong>Application:</strong> {interview.applicationId?.firstName} {interview.applicationId?.lastName}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                  <strong>Type:</strong> <span className={interview.type === 'OAS' ? 'text-blue-600 font-medium' : 'text-purple-600 font-medium'}>
                                                    {interview.type === 'OAS' ? 'OAS Staff' : 'Department Head'}
                                                  </span>
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                  <strong>Scheduled:</strong> {new Date(interview.startTime).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                  })} at {new Date(interview.startTime).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                  })}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                  Deleted: {new Date(interview.updatedAt).toLocaleDateString()}
                                                </p>
                                              </div>
                                              <div className="flex gap-2">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="border-green-300 text-green-600 hover:bg-green-50"
                                                  onClick={() => handleRestoreInterview(interview._id)}
                                                >
                                                  <RefreshCw className="mr-1 h-3 w-3" />
                                                  Restore
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                                  onClick={async () => {
                                                    const confirmed = await confirm({
                                                      title: "Permanently Delete Interview",
                                                      description: "This action cannot be undone. The interview will be permanently removed.",
                                                      confirmText: "Delete Permanently",
                                                      cancelText: "Cancel",
                                                      type: "danger"
                                                    });
                                                    if (confirmed) {
                                                      handlePermanentDeleteInterview(interview._id);
                                                    }
                                                  }}
                                                >
                                                  <Trash2 className="mr-1 h-3 w-3" />
                                                  Delete
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedApplication(null)
                                    setIsRescheduling(false)
                                    setInterviewData(null)
                                  }}
                                >
                                  Close
                                </Button>
                              </DialogClose>
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

                        {user?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteApplication(application)}
                          title="Delete Application"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredApplications.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-500">
                      No applications found matching your criteria
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-[#800000]" />
                        <span className="text-gray-500">Loading applications...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 pt-4 border-t">
            <span className="text-sm text-gray-500">
              Showing {filteredApplications.length} of {pagination.totalDocs} applications
              {pagination.totalPages > 1 && ` (Page ${pagination.page} of ${pagination.totalPages})`}
            </span>
            
            <div className="flex items-center gap-2">
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        className={pageNum === pagination.page ? "bg-[#800000] text-white" : ""}
                        onClick={() => goToPage(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchApplications(1, sortOrder, debouncedSearch, filter)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
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
      
      {/* Conflict Dialog */}
      <Dialog open={!!conflictError} onOpenChange={(open) => !open && setConflictError(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              {conflictError?.title}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-gray-700">
              {conflictError?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConflictError(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      {ConfirmDialog}
    </div>
  )
}

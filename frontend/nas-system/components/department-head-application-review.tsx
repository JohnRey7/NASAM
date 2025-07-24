"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
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
  User,
  Brain
} from "lucide-react"
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
import { departmentHeadService } from "@/services/departmentHeadService"

function DocumentChecker({ applicationId }: { applicationId: string }) {
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
      const data = await departmentHeadService.getApplicationDocuments(applicationId);
      if (data.success) {
        setDocuments(data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error instanceof Error ? error.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (docType: string, filename: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/documents/download/${filename}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
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

  const getDocumentIcon = (uploaded: boolean) => {
    return uploaded ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>Error loading documents: {error}</p>
      </div>
    );
  }

  const documentTypes = [
    { key: 'gradeSlip', label: 'Grade Slip', required: true },
    { key: 'certificateOfEnrollment', label: 'Certificate of Enrollment', required: true },
    { key: 'applicationLetter', label: 'Application Letter', required: true },
    { key: 'parentConsent', label: 'Parent Consent', required: true },
    { key: 'barangayClearance', label: 'Barangay Clearance', required: true },
    { key: 'incomeCertificate', label: 'Income Certificate', required: true },
    { key: 'birthCertificate', label: 'Birth Certificate', required: true },
    { key: 'validId', label: 'Valid ID', required: true },
    { key: 'twoByTwoId', label: '2x2 ID Photo', required: true },
    { key: 'medicalCertificate', label: 'Medical Certificate', required: false },
    { key: 'socialCaseStudyReport', label: 'Social Case Study Report', required: false }
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {documentTypes.map((docType) => {
          const docData = documents?.documents?.[docType.key];
          const isUploaded = !!docData;
          
          return (
            <div key={docType.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getDocumentIcon(isUploaded)}
                <div>
                  <p className="font-medium">{docType.label}</p>
                  <p className="text-sm text-gray-500">
                    {docType.required ? 'Required' : 'Optional'} • {isUploaded ? 'Uploaded' : 'Not uploaded'}
                  </p>
                  {isUploaded && (
                    <p className="text-xs text-gray-400">{docData.filename}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isUploaded && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(docType.label, docData.filename)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DepartmentHeadApplicationReview({ applications = [] }: { applications: any[] }) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [personalityTestData, setPersonalityTestData] = useState<any>(null)
  const [interviewDate, setInterviewDate] = useState("")
  const [evaluationData, setEvaluationData] = useState({
    attendanceAndPunctuality: { rating: 0, remarks: '' },
    qualityOfWorkOutput: { rating: 0, remarks: '' },
    quantityOfWorkOutput: { rating: 0, remarks: '' },
    attitudeAndWorkBehavior: { rating: 0, remarks: '' },
    remarksAndRecommendationByImmediateSupervisor: '',
    remarksCommentsByTheNAS: '',
    overallRating: 0
  })

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.idNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'under_review': { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      'document_verification': { color: 'bg-purple-100 text-purple-800', icon: FileText },
      'approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'interview_scheduled': { color: 'bg-indigo-100 text-indigo-800', icon: Calendar },
      'evaluation_pending': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} hover:${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
      </Badge>
    )
  }

  const handleDownloadApplicationPDF = async (application: any) => {
    try {
      const pdfBlob = await departmentHeadService.downloadApplicationPDF(application.userId || application._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${application.firstName}_${application.lastName}_Application.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Downloaded",
        description: `Application form for ${application.firstName} ${application.lastName} has been downloaded.`,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the application PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchPersonalityTestData = async (userId: string) => {
    try {
      const data = await departmentHeadService.getPersonalityTestData(userId);
      setPersonalityTestData(data);
    } catch (error) {
      console.error('Error fetching personality test data:', error);
      setPersonalityTestData(null);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewDate) {
      toast({
        title: "Error",
        description: "Please select an interview date.",
        variant: "destructive"
      });
      return;
    }

    try {
      await departmentHeadService.scheduleInterview({
        applicantId: selectedApplication.userId || selectedApplication._id,
        date: interviewDate,
        time: "09:00", // Default time
        notes: "Interview scheduled by Department Head"
      });

      toast({
        title: "Interview Scheduled",
        description: `Interview has been scheduled for ${selectedApplication.firstName} ${selectedApplication.lastName}.`,
      });

      setInterviewDate("");
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule the interview. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitEvaluation = async () => {
    try {
      await departmentHeadService.submitEvaluation({
        evaluateeUser: selectedApplication.userId || selectedApplication._id,
        attendanceAndPunctuality: evaluationData.attendanceAndPunctuality,
        qualityOfWorkOutput: evaluationData.qualityOfWorkOutput,
        quantityOfWorkOutput: evaluationData.quantityOfWorkOutput,
        attitudeAndWorkBehavior: evaluationData.attitudeAndWorkBehavior,
        remarksAndRecommendationByImmediateSupervisor: evaluationData.remarksAndRecommendationByImmediateSupervisor,
        remarksCommentsByTheNAS: evaluationData.remarksCommentsByTheNAS,
        overallRating: evaluationData.overallRating
      });

      toast({
        title: "Evaluation Submitted",
        description: `Evaluation for ${selectedApplication.firstName} ${selectedApplication.lastName} has been submitted.`,
      });

      setSelectedApplication(null);
      setEvaluationData({
        attendanceAndPunctuality: { rating: 0, remarks: '' },
        qualityOfWorkOutput: { rating: 0, remarks: '' },
        quantityOfWorkOutput: { rating: 0, remarks: '' },
        attitudeAndWorkBehavior: { rating: 0, remarks: '' },
        remarksAndRecommendationByImmediateSupervisor: '',
        remarksCommentsByTheNAS: '',
        overallRating: 0
      });
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit the evaluation. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#800000]">Application Review - Department Head</CardTitle>
          <CardDescription>
            Review applications assigned to your department. You can view details, download PDFs, and provide evaluations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or ID number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="document_verification">Document Verification</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="evaluation_pending">Evaluation Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Student Name</th>
                  <th className="text-left py-3 px-4 font-medium">ID Number</th>
                  <th className="text-left py-3 px-4 font-medium">Program</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Submitted</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => (
                  <tr key={application._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {application.firstName} {application.lastName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {application.idNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {application.programOfStudyAndYear || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button 
                              className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50 hover:bg-gray-100 h-10 w-10 h-8 w-8"
                              type="button" 
                              aria-haspopup="dialog" 
                              aria-expanded="false" 
                              data-state="closed"
                              onClick={() => {
                                setSelectedApplication(application);
                                fetchPersonalityTestData(application.userId || application._id);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye h-4 w-4">
                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold text-[#800000]">
                                {application.firstName} {application.lastName} - Application Review
                              </DialogTitle>
                            </DialogHeader>

                            <Tabs defaultValue="application" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="application" className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Application
                                </TabsTrigger>
                                <TabsTrigger value="documents" className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Documents
                                </TabsTrigger>
                                <TabsTrigger value="personality" className="flex items-center gap-2">
                                  <Brain className="h-4 w-4" />
                                  Personality Test
                                </TabsTrigger>
                                <TabsTrigger value="evaluation" className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  Evaluation
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="application" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
                                      <div className="bg-gray-50 p-4 rounded-md space-y-2">
                                        <p><strong>Name:</strong> {application.firstName} {application.lastName}</p>
                                        <p><strong>Email:</strong> {application.email || 'N/A'}</p>
                                        <p><strong>Phone:</strong> {application.phoneNumber || 'N/A'}</p>
                                        <p><strong>Address:</strong> {application.address || 'N/A'}</p>
                                        <p><strong>Date of Birth:</strong> {application.dateOfBirth ? new Date(application.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Academic Information</h4>
                                      <div className="bg-gray-50 p-4 rounded-md space-y-2">
                                        <p><strong>Program:</strong> {application.programOfStudyAndYear || 'N/A'}</p>
                                        <p><strong>GPA:</strong> {application.gpa || 'N/A'}</p>
                                        <p><strong>Year Level:</strong> {application.yearLevel || 'N/A'}</p>
                                        <p><strong>Status:</strong> {getStatusBadge(application.status)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="documents" className="space-y-4">
                                <DocumentChecker applicationId={application._id} />
                              </TabsContent>

                              <TabsContent value="personality" className="space-y-4">
                                {personalityTestData ? (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-blue-50 p-4 rounded-md">
                                        <h4 className="font-semibold text-blue-800 mb-2">Test Results</h4>
                                        <div className="space-y-2">
                                          <p><strong>Total Score:</strong> {personalityTestData.totalScore || 'N/A'}</p>
                                          <p><strong>Personality Type:</strong> {personalityTestData.personalityType || 'N/A'}</p>
                                          <p><strong>Status:</strong> <Badge>{personalityTestData.status || 'Completed'}</Badge></p>
                                        </div>
                                      </div>
                                      <div className="bg-green-50 p-4 rounded-md">
                                        <h4 className="font-semibold text-green-800 mb-2">Assessment Details</h4>
                                        <p><strong>Date Taken:</strong> {personalityTestData.createdAt ? new Date(personalityTestData.createdAt).toLocaleDateString() : 'N/A'}</p>
                                        <p><strong>Duration:</strong> {personalityTestData.duration || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No personality test data available</p>
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="evaluation" className="space-y-4">
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-4">Student Evaluation Form</h4>
                                    <div className="space-y-4">
                                      {/* Evaluation criteria */}
                                      {[
                                        { key: 'attendanceAndPunctuality', label: 'Attendance and Punctuality' },
                                        { key: 'qualityOfWorkOutput', label: 'Quality of Work Output' },
                                        { key: 'quantityOfWorkOutput', label: 'Quantity of Work Output' },
                                        { key: 'attitudeAndWorkBehavior', label: 'Attitude and Work Behavior' }
                                      ].map((criteria) => (
                                        <div key={criteria.key} className="border p-4 rounded-md">
                                          <Label className="font-medium">{criteria.label}</Label>
                                          <div className="mt-2 space-y-2">
                                            <Select 
                                              value={(evaluationData[criteria.key as keyof typeof evaluationData] as any)?.rating?.toString() || "0"}
                                              onValueChange={(value) => setEvaluationData(prev => ({
                                                ...prev,
                                                [criteria.key]: { 
                                                  ...(prev[criteria.key as keyof typeof prev] as any), 
                                                  rating: parseInt(value) 
                                                }
                                              }))}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select rating" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="1">1 - Poor</SelectItem>
                                                <SelectItem value="2">2 - Fair</SelectItem>
                                                <SelectItem value="3">3 - Good</SelectItem>
                                                <SelectItem value="4">4 - Very Good</SelectItem>
                                                <SelectItem value="5">5 - Excellent</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <Textarea
                                              placeholder="Remarks..."
                                              value={(evaluationData[criteria.key as keyof typeof evaluationData] as any)?.remarks || ''}
                                              onChange={(e) => setEvaluationData(prev => ({
                                                ...prev,
                                                [criteria.key]: { 
                                                  ...(prev[criteria.key as keyof typeof prev] as any), 
                                                  remarks: e.target.value 
                                                }
                                              }))}
                                            />
                                          </div>
                                        </div>
                                      ))}

                                      <div className="border p-4 rounded-md">
                                        <Label className="font-medium">Remarks and Recommendation by Department Head</Label>
                                        <Textarea
                                          className="mt-2"
                                          placeholder="Enter your remarks and recommendations..."
                                          value={evaluationData.remarksAndRecommendationByImmediateSupervisor}
                                          onChange={(e) => setEvaluationData(prev => ({
                                            ...prev,
                                            remarksAndRecommendationByImmediateSupervisor: e.target.value
                                          }))}
                                        />
                                      </div>

                                      <div className="border p-4 rounded-md">
                                        <Label className="font-medium">Overall Rating</Label>
                                        <Select 
                                          value={evaluationData.overallRating?.toString() || "0"}
                                          onValueChange={(value) => setEvaluationData(prev => ({
                                            ...prev,
                                            overallRating: parseInt(value)
                                          }))}
                                        >
                                          <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select overall rating" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="1">1 - Poor</SelectItem>
                                            <SelectItem value="2">2 - Fair</SelectItem>
                                            <SelectItem value="3">3 - Good</SelectItem>
                                            <SelectItem value="4">4 - Very Good</SelectItem>
                                            <SelectItem value="5">5 - Excellent</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <Button
                                        className="bg-[#800000] hover:bg-[#600000] w-full"
                                        onClick={handleSubmitEvaluation}
                                      >
                                        Submit Evaluation
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>

                            <DialogFooter>
                              <div className="flex gap-2 ml-auto">
                                <Button
                                  variant="outline"
                                  onClick={() => handleDownloadApplicationPDF(application)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </Button>
                                <DialogClose asChild>
                                  <Button variant="outline">
                                    Close
                                  </Button>
                                </DialogClose>
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <button 
                          className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50 hover:bg-gray-100 h-10 w-10 h-8 w-8"
                          onClick={() => handleDownloadApplicationPDF(application)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square h-4 w-4">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No applications found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, CheckCircle, Eye, MessageSquare, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { departmentHeadService } from "@/services/departmentHeadService";
import { useToast } from "@/components/ui/use-toast";

interface InterviewData {
  _id: string;
  interviewId: string;
  applicantName: string;
  course: string;
  schedule: string;
  status: 'not yet scheduled' | 'pending' | 'complete';
}

export default function DepartmentHeadDashboardPage() {
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Function to fetch application details
  const fetchApplicationDetails = async (applicantId: string) => {
    try {
      console.log('🔍 Fetching application details for:', applicantId);
      
      // First, get the assigned applicants to find the real application data
      const applicants = await departmentHeadService.getAssignedApplicants();
      const applicant = applicants.find((app: any) => (app.id || app._id) === applicantId);
      
      if (applicant) {
        console.log('📋 Found applicant data:', applicant);
        console.log('🔍 All applicant keys:', Object.keys(applicant));
        
        // Set the application details with real data from the backend
        setApplicationDetails({
          _id: applicant._id || applicant.id,
          userId: applicant.userId || applicant._id || applicant.id,
          applicationId: applicant.applicationId || applicant._id,
          firstName: applicant.firstName || applicant.name?.split(' ')[0] || '',
          lastName: applicant.lastName || applicant.name?.split(' ').slice(1).join(' ') || '',
          idNumber: applicant.idNumber || applicant.user?.idNumber || applicant.studentId || 'N/A',
          email: applicant.email || applicant.user?.email || applicant.emailAddress || 'N/A',
          contactNumber: applicant.contactNumber || applicant.phoneNumber || applicant.phone || applicant.mobileNumber || 'N/A',
          dateOfBirth: applicant.dateOfBirth || applicant.birthDate || applicant.dob || 'N/A',
          gender: applicant.gender || applicant.sex || 'N/A',
          programOfStudyAndYear: applicant.programOfStudyAndYear || applicant.program || applicant.course || 'N/A',
          gpa: applicant.gpa || applicant.gradePointAverage || applicant.grades || 'N/A',
          yearLevel: applicant.yearLevel || applicant.year || applicant.level || 'N/A',
          school: applicant.school || applicant.university || 'CIT-University',
          fatherName: applicant.fatherName || applicant.father?.name || applicant.fathersName || 'N/A',
          motherName: applicant.motherName || applicant.mother?.name || applicant.mothersName || 'N/A',
          familyIncome: applicant.familyIncome || applicant.monthlyFamilyIncome || applicant.income || 'N/A',
          numberOfSiblings: applicant.numberOfSiblings || applicant.siblings || 'N/A',
          address: applicant.address || applicant.homeAddress || applicant.completeAddress || applicant.location || 'N/A'
        });
      } else {
        console.warn('⚠️ Applicant not found in assigned applicants');
        // Fallback to interview data
        const interview = interviews.find(i => i._id === applicantId);
        if (interview) {
          setApplicationDetails({
            _id: interview._id,
            userId: interview._id,
            firstName: interview.applicantName.split(' ')[0] || '',
            lastName: interview.applicantName.split(' ').slice(1).join(' ') || '',
            idNumber: 'N/A',
            email: 'N/A',
            contactNumber: 'N/A',
            dateOfBirth: 'N/A',
            gender: 'N/A',
            programOfStudyAndYear: interview.course,
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
          `http://localhost:3000/api/oas/application-by-id/${id}/pdf`,
          `http://localhost:3000/api/applications/${id}/pdf`,
          `http://localhost:3000/api/department-head/application/${id}/pdf`,
          `http://localhost:3000/api/application/${id}/pdf`
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
            status: 'pending' as const
          };
        }
        return interview;
      });

      setInterviews(updatedInterviews);

      // Update stats after scheduling (count both scheduled and pending as scheduled interviews)
      setStats({
        scheduledInterviews: updatedInterviews.filter(i => i.status === 'pending').length,
        completedInterviews: updatedInterviews.filter(i => i.status === 'complete').length,
        pendingRecommendations: 0 // For now, set to 0 as there's no separate status for pending recommendations
      });

      console.log('📊 Updated stats after scheduling:', {
        notYetScheduled: updatedInterviews.filter(i => i.status === 'not yet scheduled').length,
        complete: updatedInterviews.filter(i => i.status === 'complete').length,
        pending: updatedInterviews.filter(i => i.status === 'pending').length
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

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('🔍 Department Head Dashboard: Making API call using departmentHeadService');
        
        // Fetch applicants assigned to this department head using the service
        const applicants = await departmentHeadService.getAssignedApplicants();
        console.log('🔍 Department Head Dashboard: API response data:', applicants);
        
        // Transform applicants data to interview format and fetch interview data for each
        const interviewsData: InterviewData[] = await Promise.all(
          applicants.map(async (applicant: any, index: number) => {
            let interviewData = null;
            let schedule = 'To be scheduled';
            let status: 'not yet scheduled' | 'pending' | 'complete' = 'not yet scheduled';
            
            // Try to fetch interview data for this applicant
            try {
              const response = await fetch(`http://localhost:3000/api/interview/user/${applicant._id || applicant.id}`, {
                credentials: 'include'
              });
              
              if (response.ok) {
                const interviewResponse = await response.json();
                interviewData = interviewResponse.interview;
                console.log(`📅 Found interview data for ${applicant.name}:`, interviewData);
                
                if (interviewData && interviewData.startTime) {
                  schedule = new Date(interviewData.startTime).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  status = 'pending';
                }
              } else {
                console.log(`📅 No interview found for ${applicant.name}`);
              }
            } catch (error) {
              console.log(`📅 Error fetching interview for ${applicant.name}:`, error);
            }
            
            return {
              _id: applicant.id || applicant._id,
              interviewId: `INT-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
              applicantName: applicant.name || `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim(),
              course: applicant.programOfStudyAndYear || 'Not specified',
              schedule,
              status
            };
          })
        );
        
        setInterviews(interviewsData);
        setStats({
          scheduledInterviews: interviewsData.filter(i => i.status === 'pending').length,
          completedInterviews: interviewsData.filter(i => i.status === 'complete').length,
          pendingRecommendations: 0 // For now, set to 0 as there's no separate status for pending recommendations
        });
        
        console.log('📊 Interview stats:', {
          total: interviewsData.length,
          notYetScheduled: interviewsData.filter(i => i.status === 'not yet scheduled').length,
          complete: interviewsData.filter(i => i.status === 'complete').length,
          pending: interviewsData.filter(i => i.status === 'pending').length
        });
      } catch (error) {
        console.error('Error fetching department applicants:', error);
        toast({
          title: "Error",
          description: "Failed to load applicants data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  return (
    <DashboardLayout allowedRoles={["department_head"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#800000]">Department Head Dashboard</h1>
          <p className="text-gray-600 mt-2">Review and evaluate applications assigned to your department.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.scheduledInterviews}</p>
                  <p className="text-xs text-blue-600 mt-1">scheduled interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedInterviews}</p>
                  <p className="text-xs text-green-600 mt-1">completed interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingRecommendations}</p>
                  <p className="text-xs text-orange-600 mt-1">pending recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by applicant name or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Interviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Applicants</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <th className="text-left p-4 font-medium">Interview ID</th>
                      <th className="text-left p-4 font-medium">Applicant Name</th>
                      <th className="text-left p-4 font-medium">Course</th>
                      <th className="text-left p-4 font-medium">Schedule</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews
                      .filter(interview => 
                        interview.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        interview.course.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((interview) => (
                        <tr key={interview._id} className="border-b hover:bg-gray-50">
                          <td className="p-4">{interview.interviewId}</td>
                          <td className="p-4 font-medium">{interview.applicantName}</td>
                          <td className="p-4">{interview.course}</td>
                          <td className="p-4">{interview.schedule}</td>
                          <td className="p-4">
                            <Badge 
                              variant={
                                interview.status === 'complete' ? 'default' : 
                                interview.status === 'pending' ? 'secondary' : 
                                'outline'
                              }
                              className={
                                interview.status === 'complete' ? 'bg-green-100 text-green-800' :
                                interview.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {interview.status === 'not yet scheduled' ? 'not yet scheduled' :
                               interview.status === 'pending' ? 'pending interview' : 
                               interview.status === 'complete' ? 'complete' : 
                               interview.status}
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
                                    onClick={() => {
                                      setSelectedApplication(interview);
                                      // Fetch application details when eye is clicked
                                      fetchApplicationDetails(interview._id);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Application Details - {selectedApplication?.applicantName}</DialogTitle>
                                  </DialogHeader>
                                  
                                  <Tabs defaultValue="details" className="w-full">
                                    <TabsList className="grid w-full grid-cols-5">
                                      <TabsTrigger value="details">Application Details</TabsTrigger>
                                      <TabsTrigger value="documents">Documents</TabsTrigger>
                                      <TabsTrigger value="personality">Personality Test</TabsTrigger>
                                      <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                                      <TabsTrigger value="reschedule">Reschedule</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="details" className="space-y-4">
                                      {applicationDetails ? (
                                        <div className="space-y-6">
                                          {/* Action Buttons */}
                                          <div className="flex gap-2 mb-4">
                                            <Button 
                                              onClick={() => handleDownloadPDF(selectedApplication)}
                                              className="bg-[#800000] hover:bg-[#600000]"
                                            >
                                              Download PDF
                                            </Button>
                                          </div>

                                          {/* Personal Information */}
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-lg mb-3 text-[#800000]">Personal Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <Label className="font-medium">Full Name</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.firstName} {applicationDetails.lastName}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">ID Number</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.idNumber}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">Email</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.email}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">Contact Number</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.contactNumber || 'N/A'}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">Date of Birth</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.dateOfBirth || 'N/A'}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">Gender</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.gender || 'N/A'}</p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Academic Information */}
                                          <div className="bg-blue-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-lg mb-3 text-blue-800">Academic Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <Label className="font-medium">Program of Study</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.programOfStudyAndYear}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">GPA</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.gpa || 'N/A'}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">Year Level</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.yearLevel || 'N/A'}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">School</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.school || 'CIT-University'}</p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Family Information */}
                                          <div className="bg-green-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-lg mb-3 text-green-800">Family Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <Label className="font-medium">Father's Name</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.fatherName || 'N/A'}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">Mother's Name</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.motherName || 'N/A'}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">Family Income</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.familyIncome || 'N/A'}</p>
                                              </div>
                                              <div>
                                                <Label className="font-medium">Number of Siblings</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.numberOfSiblings || 'N/A'}</p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Address Information */}
                                          <div className="bg-purple-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-lg mb-3 text-purple-800">Address Information</h3>
                                            <div className="space-y-2">
                                              <div>
                                                <Label className="font-medium">Complete Address</Label>
                                                <p className="text-sm text-gray-600">{applicationDetails.address || 'N/A'}</p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center py-8">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                                          <span className="ml-2 text-sm text-gray-600">Loading application details...</span>
                                        </div>
                                      )}
                                    </TabsContent>

                                    <TabsContent value="documents" className="space-y-4">
                                      <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-[#800000]">Document Submission Status</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {[
                                            { key: 'studentPicture', label: 'Student Picture', required: true },
                                            { key: 'nbiClearance', label: 'NBI Clearance', required: true },
                                            { key: 'gradeReport', label: 'Grade Report', required: true },
                                            { key: 'incomeTaxReturn', label: 'Income Tax Return', required: true },
                                            { key: 'goodMoralCertificate', label: 'Good Moral Certificate', required: true },
                                            { key: 'physicalCheckup', label: 'Physical Checkup', required: true },
                                            { key: 'homeLocationSketch', label: 'Home Location Sketch', required: true }
                                          ].map(({ key, label, required }) => (
                                            <div key={key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                              <div className="flex items-center space-x-3">
                                                <div className="flex items-center space-x-2">
                                                  {Math.random() > 0.3 ? ( // Simulate document status
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                  ) : (
                                                    <div className="h-5 w-5 rounded-full border-2 border-red-300"></div>
                                                  )}
                                                  <span className="text-sm font-medium">{label}</span>
                                                  {required && <span className="text-red-500 text-xs">*</span>}
                                                </div>
                                              </div>
                                              <Badge 
                                                variant={Math.random() > 0.3 ? "default" : "secondary"}
                                                className={Math.random() > 0.3 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                              >
                                                {Math.random() > 0.3 ? "Submitted" : "Missing"}
                                              </Badge>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="personality" className="space-y-4">
                                      <div className="space-y-4">
                                        {/* Assessment Completed Header */}
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                          <div className="flex justify-center mb-4">
                                            <CheckCircle className="h-12 w-12 text-green-600" />
                                          </div>
                                          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment Completed</h2>
                                          <p className="text-green-700 mb-4">Applicant is done taking the personality test.</p>
                                          <p className="text-sm text-gray-600 mb-4">
                                            Thank you for completing the personality assessment. Your responses have been recorded and will be reviewed by the scholarship committee.
                                          </p>
                                          <p className="text-sm text-gray-500">You answered 0 out of 0 questions.</p>
                                        </div>

                                        {/* Test Results */}
                                        <div className="bg-white border rounded-lg p-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level: <span className="text-green-600">Low</span></h3>
                                              <div className="mb-4">
                                                <Label className="font-medium text-gray-700">Guidance:</Label>
                                                <p className="text-sm text-gray-600 mt-1">
                                                  Excellent! Your responses demonstrate strong personal qualities that align well with our scholarship values.
                                                </p>
                                              </div>
                                            </div>
                                            <div>
                                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Summary</h3>
                                              <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Completion Date:</span>
                                                  <span className="font-medium">7/20/2025</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Time Taken:</span>
                                                  <span className="font-medium">15 minutes</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Test ID:</span>
                                                  <span className="font-medium">cddadefd</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Status:</span>
                                                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="evaluation" className="space-y-4">
                                      <div className="space-y-4">
                                        <h3 className="font-medium">Submit Evaluation</h3>
                                        {/* Evaluation form content */}
                                        <div className="space-y-4">
                                          <div>
                                            <Label>Overall Rating</Label>
                                            <Select>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select rating" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="5">Excellent (5)</SelectItem>
                                                <SelectItem value="4">Good (4)</SelectItem>
                                                <SelectItem value="3">Average (3)</SelectItem>
                                                <SelectItem value="2">Below Average (2)</SelectItem>
                                                <SelectItem value="1">Poor (1)</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div>
                                            <Label>Remarks</Label>
                                            <Textarea placeholder="Enter your evaluation remarks..." />
                                          </div>
                                          <Button>Submit Evaluation</Button>
                                        </div>
                                      </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="reschedule" className="space-y-4">
                                      <div className="space-y-4">
                                        <h3 className="font-medium text-lg text-[#800000]">Schedule Interview</h3>
                                        
                                        {/* Current Status */}
                                        <div className={`border rounded-lg p-4 ${
                                          selectedApplication?.schedule === 'To be scheduled' 
                                            ? 'bg-yellow-50 border-yellow-200' 
                                            : 'bg-blue-50 border-blue-200'
                                        }`}>
                                          <div className="flex items-center space-x-2">
                                            <Clock className={`h-5 w-5 ${
                                              selectedApplication?.schedule === 'To be scheduled' 
                                                ? 'text-yellow-600' 
                                                : 'text-blue-600'
                                            }`} />
                                            <span className={`font-medium ${
                                              selectedApplication?.schedule === 'To be scheduled' 
                                                ? 'text-yellow-800' 
                                                : 'text-blue-800'
                                            }`}>
                                              {selectedApplication?.schedule === 'To be scheduled' ? 'Pending:' : 'Scheduled:'}
                                            </span>
                                            <span className={`${
                                              selectedApplication?.schedule === 'To be scheduled' 
                                                ? 'text-yellow-700' 
                                                : 'text-blue-700'
                                            }`}>
                                              {selectedApplication?.schedule === 'To be scheduled' 
                                                ? 'No interview has been scheduled yet.' 
                                                : `Interview scheduled for ${selectedApplication?.schedule}`
                                              }
                                            </span>
                                          </div>
                                        </div>

                                        {/* Schedule form */}
                                        <div className="space-y-4">
                                          <div>
                                            <Label className="font-medium">Schedule Interview Date</Label>
                                            <Input 
                                              type="datetime-local" 
                                              value={interviewSchedule}
                                              onChange={(e) => setInterviewSchedule(e.target.value)}
                                              className="mt-1"
                                              placeholder="mm/dd/yyyy"
                                            />
                                          </div>
                                          <div>
                                            <Label className="font-medium">Reason (Optional)</Label>
                                            <Textarea 
                                              placeholder="Reason for scheduling/rescheduling..."
                                              value={scheduleReason}
                                              onChange={(e) => setScheduleReason(e.target.value)}
                                              className="mt-1"
                                            />
                                          </div>
                                          <Button 
                                            onClick={handleScheduleInterview}
                                            className="bg-[#800000] hover:bg-[#600000]"
                                          >
                                            Schedule Interview
                                          </Button>
                                        </div>
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                </DialogContent>
                              </Dialog>
                              
                              {/* Remarks Button - Send Message/Remarks */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Send Remarks - {interview.applicantName}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Message/Remarks</Label>
                                      <Textarea placeholder="Enter your message or remarks..." />
                                    </div>
                                    <Button>Send Message</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

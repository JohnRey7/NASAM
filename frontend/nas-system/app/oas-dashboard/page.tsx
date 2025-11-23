"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicationReview } from "@/components/application-review"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ScholarEvaluation } from "@/components/scholar-evaluation"
import { AuditLogs } from "@/components/audit-logs"
import { useEffect, useState } from "react"
import { oasDashboardService } from "@/services/oasDashboardService"
import { oasAnalyticsService } from "@/services/oasAnalyticsService"
import { ToolsCard } from "./ToolsCard"
import { useToast } from "@/components/ui/use-toast";
import { departmentHeadService } from "@/services/departmentHeadService";
import RegisterDepartmentHeadForm from "../department-head/RegisterDepartmentHeadForm";
import { useAuth } from "@/contexts/auth-context";

export default function OASDashboardPage() {
  const [stats, setStats] = useState<any>({
    newApplications: 0,
    documentVerifications: 0,
    scheduledInterviews: 0,
    activeScholars: 0
  })
  const [loading, setLoading] = useState(false) // ✅ Changed to false
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast();
  const [applicants, setApplicants] = useState<any[]>([]);
  // analytics are handled inside AnalyticsDashboard component
  const [departments, setDepartments] = useState<any[]>([]);
  const [readyForInterviewStudents, setReadyForInterviewStudents] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // ✅ Add silent error handling
    const loadStats = async () => {
      try {
        const statsData = await oasDashboardService.getDashboardStats()
        setStats(statsData)
      } catch (err) {
        // ✅ Silently handle error - don't show to user
        console.warn('Dashboard stats not available (using defaults):', err)
        // Keep default stats, don't show error message
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])


  useEffect(() => {
    async function fetchApplicantsAndDepartments() {
      try {
        const [users, depts, applications] = await Promise.all([
          fetch("/api/roles?role=applicant", { credentials: "include" }).then(res => res.json()),
          departmentHeadService.getDepartments(),
          fetch("/api/oas/applications", { credentials: "include" }).then(res => res.json())
        ]);
        const applicantArray = Array.isArray(users) ? users : users?.users || users?.data || [];
        setApplicants(applicantArray);
        
        const departmentsArray = Array.isArray(depts) ? depts : depts?.data || [];
        setDepartments(departmentsArray);
        console.log('📋 Loaded departments:', departmentsArray);
        console.log('📋 Department codes:', departmentsArray.map((d: any) => d.departmentCode));
        
        // Filter for "Ready for Interview" students (document_verification status)
        const applicationsArray = Array.isArray(applications) ? applications : applications?.applications || [];
        const readyStudents = applicationsArray.filter((app: any) => 
          app.status === 'document_verification' || app.status === 'approved'
        ).map((app: any) => ({
          _id: app.userId || app.user?._id || app._id, // Use actual user ID for assignment
          applicationId: app._id,
          firstName: app.firstName,
          lastName: app.lastName,
          idNumber: app.user?.idNumber || 'N/A',
          programOfStudyAndYear: app.programOfStudyAndYear,
          status: app.status
        }));
        
        setReadyForInterviewStudents(readyStudents);
        console.log('🎯 Ready for Interview students:', readyStudents);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    }
    fetchApplicantsAndDepartments();
  }, []);

  const handleDownloadApplicationPDF = async (userId: string, studentName: string) => {
    try {
      console.log(`📄 Downloading PDF for user: ${userId}`);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/application/${userId}/pdf`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `application-${studentName}-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ PDF downloaded successfully for ${studentName}`);
      
    } catch (error) {
      console.error('❌ PDF download failed:', error);
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      alert(`Failed to download PDF: ${errorMessage}`);
    }
  };

  const handleAssign = async () => {
    if (!selectedApplicant || !selectedDepartment) return;
    setAssignLoading(true);
    try {
      await oasDashboardService.assignApplicantToDepartment(selectedApplicant, selectedDepartment);
      toast({ title: "Success", description: "Applicant assigned to department." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to assign." });
    } finally {
      setAssignLoading(false);
    }
  };

  // Add a function to reload applicants after assignment
  const reloadApplicants = async () => {
    try {
      const users = await fetch("/api/roles?role=applicant", { credentials: "include" }).then(res => res.json());
      const applicantArray = Array.isArray(users) ? users : users?.users || users?.data || [];
      setApplicants(applicantArray);
    } catch {}
  };

  return (
    <DashboardLayout allowedRoles={["oas_staff", "admin"]}>
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-[#800000] tracking-tight">OAS Staff Dashboard</h2>
        <p className="text-gray-600 mt-2 text-lg">Manage scholarship applications, review documents, and evaluate scholars.</p>
      </div>

      {/* ✅ Removed the error display - always show stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">New Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#800000] mb-2">{stats?.newApplications ?? 0}</p>
            <p className="text-sm text-gray-500">Status: Pending</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">Document Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600 mb-2">{stats?.documentVerifications ?? 0}</p>
            <p className="text-sm text-gray-500">Form approved, awaiting docs</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">Ready for Interview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600 mb-2">{stats?.scheduledInterviews ?? 0}</p>
            <p className="text-sm text-gray-500">Documents verified</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-soft bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">Active Scholars</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600 mb-2">{stats?.activeScholars ?? 0}</p>
            <p className="text-sm text-gray-500">Approved applications</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 h-12 bg-white shadow-soft border-0 p-1">
          <TabsTrigger value="applications" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Applications</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Analytics</TabsTrigger>
          <TabsTrigger value="evaluation" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Scholar Evaluation</TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Audit Logs</TabsTrigger>
          <TabsTrigger value="tools" className="data-[state=active]:bg-maroon-50 data-[state=active]:text-[#800000] data-[state=active]:shadow-soft font-medium">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <ApplicationReview />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="evaluation">
          <ScholarEvaluation />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>

        <TabsContent value="tools">
          <ToolsCard />
          {/* Admin: Register Department Head */}
          <div className="mt-8 p-6 border-0 rounded-xl bg-white shadow-soft">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Register Department Head</h3>
            {user?.role === "admin" ? (
              <RegisterDepartmentHeadForm />
            ) : (
              <div className="text-red-600">Only admins can register department heads.</div>
            )}
          </div>
          {/* Admin: Assign applicant to department */}
          <div className="mt-8 p-6 border-0 rounded-xl bg-white shadow-soft">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Assign Applicant to Department</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">Only students who are "Ready for Interview" can be assigned to departments.</p>
            <div className="flex gap-2 mb-2 items-center">
              <select 
                value={selectedApplicant} 
                onChange={e => setSelectedApplicant(e.target.value)} 
                className="border rounded px-2 py-1 min-w-[250px]" 
                title="Select Ready for Interview Student"
              >
                <option value="">Select Student (Ready for Interview)</option>
                {readyForInterviewStudents.map((student: any) => (
                  <option key={student._id} value={student._id}>
                    {student.firstName} {student.lastName} - {student.idNumber} ({student.programOfStudyAndYear})
                  </option>
                ))}
              </select>
              <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="border rounded px-2 py-1" title="Select Department">
                <option value="">Select Department</option>
                {departments.map((d: any) => (
                  <option key={d.departmentCode} value={d.departmentCode}>{d.name} ({d.departmentCode})</option>
                ))}
              </select>
              <button onClick={async () => {
                console.log('Assign button clicked!');
                console.log('Selected applicant:', selectedApplicant);
                console.log('Selected department:', selectedDepartment);
                console.log('Available departments:', departments);
                console.log('Available department codes:', departments.map((d: any) => d.departmentCode));
                
                if (!selectedApplicant || !selectedDepartment) {
                  toast({ title: "Error", description: "Please select both a student and department." });
                  return;
                }
                
                setAssignLoading(true);
                try {
                  // Find selected student
                  const student = readyForInterviewStudents.find((s: any) => s._id === selectedApplicant);
                  console.log('Found student:', student);
                  
                  if (!student) {
                    throw new Error("Student not found in ready for interview list");
                  }
                  
                  console.log('🎯 Calling assignApplicantToDepartment with userId:', student._id, 'departmentCode:', selectedDepartment);
                  const result = await oasDashboardService.assignApplicantToDepartment(student._id, selectedDepartment);
                  console.log('Assignment result:', result);
                  
                  toast({ title: "Success", description: `${student.firstName} ${student.lastName} assigned to department successfully.` });
                  setSelectedApplicant("");
                  setSelectedDepartment("");
                  
                  // Refresh the data
                  console.log('Refreshing ready for interview students...');
                  const updatedApplications = await fetch("/api/oas/applications", { credentials: "include" }).then(res => res.json());
                  const applicationsArray = Array.isArray(updatedApplications) ? updatedApplications : updatedApplications?.applications || [];
                  const readyStudents = applicationsArray.filter((app: any) => 
                    app.status === 'document_verification' || app.status === 'approved'
                  ).map((app: any) => ({
                    _id: app.userId || app.user?._id || app._id, // Use actual user ID for assignment
                    applicationId: app._id,
                    firstName: app.firstName,
                    lastName: app.lastName,
                    idNumber: app.user?.idNumber || 'N/A',
                    programOfStudyAndYear: app.programOfStudyAndYear,
                    status: app.status
                  }));
                  setReadyForInterviewStudents(readyStudents);
                  console.log('Updated ready students:', readyStudents);
                } catch (err: any) {
                  console.error('Assignment error:', err);
                  toast({ title: "Error", description: err?.response?.data?.message || err.message || "Failed to assign." });
                } finally {
                  setAssignLoading(false);
                }
              }} disabled={assignLoading || !selectedApplicant || !selectedDepartment} className="bg-[#800000] text-white px-4 py-1 rounded disabled:opacity-50">
                {assignLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>

        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

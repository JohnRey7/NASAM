import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Bell, BookOpen, Users, List, UserPlus, ClipboardCheck, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import RegisterDepartmentHeadForm from "../department-head/RegisterDepartmentHeadForm";
import DepartmentManagementInline from "@/components/DepartmentManagementInline";
import CourseManagement from "@/components/CourseManagement";
import SendNotificationInline from "@/components/SendNotificationInline";
import { AdminEvaluationControl } from "@/components/admin-evaluation-control";
import { AdminEvaluationTable } from "@/components/admin-evaluation-table";
import { AuditLogs } from "@/components/audit-logs";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function ToolsCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [departmentManagementOpen, setDepartmentManagementOpen] = useState(false);
  const [scholarEvaluationsOpen, setScholarEvaluationsOpen] = useState(false);
  
  // New state for inline components
  const [courseManagementOpen, setCourseManagementOpen] = useState(false);
  const [viewLogsOpen, setViewLogsOpen] = useState(false);
  const [sendNotificationOpen, setSendNotificationOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const { toast } = useToast();

  // Close other panels helper
  const closeOtherPanels = (except: string) => {
    if (except !== 'course') setCourseManagementOpen(false);
    if (except !== 'department') setDepartmentManagementOpen(false);
    if (except !== 'logs') setViewLogsOpen(false);
    if (except !== 'notification') setSendNotificationOpen(false);
    if (except !== 'evaluation') setScholarEvaluationsOpen(false);
  };

  // Export all applications to CSV
  const handleExportApplications = async () => {
    setExportLoading(true);
    try {
      console.log('📄 Exporting applications to CSV...');
      console.log('📄 API URL:', `${API_URL}/oas/application/export/all`);
      
      const response = await axios.get(`${API_URL}/oas/application/export/all`, {
        withCredentials: true,
        responseType: 'blob',
        timeout: 60000, // 60 second timeout
        headers: {
          'Accept': 'text/csv, application/json',
        }
      });
      
      console.log('📄 Response status:', response.status);
      console.log('📄 Response headers:', response.headers);

      // Check if we got an error response (JSON instead of CSV)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // Read the blob as text to get the error message
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData?.message || 'Export failed');
      }

      // Get the blob
      const blob = response.data;
      console.log('📄 Blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Applications exported successfully as ${filename}`,
      });
      
      console.log('✅ Export completed successfully');
    } catch (error: any) {
      console.error('❌ Export failed:', error);
      
      let errorMessage = "Failed to export applications. Please try again.";
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = "Export request timed out. The server may be slow or unresponsive.";
        } else if (error.response?.status === 404) {
          errorMessage = "No applications found to export.";
        } else if (error.response?.status === 403) {
          errorMessage = "You don't have permission to export applications.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleExportApplications}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              {exportLoading ? 'Exporting...' : 'Export Applications'}
            </Button>
            <Button 
              variant={sendNotificationOpen ? "default" : "outline"} 
              className={`flex items-center gap-2 ${sendNotificationOpen ? 'bg-[#800000] text-white' : ''}`}
              onClick={() => {
                const newState = !sendNotificationOpen;
                if (newState) closeOtherPanels('notification');
                setSendNotificationOpen(newState);
              }}
            >
              <Bell className="h-5 w-5" /> Send Notification
            </Button>
            <Button 
              variant={courseManagementOpen ? "default" : "outline"} 
              className={`flex items-center gap-2 ${courseManagementOpen ? 'bg-[#800000] text-white' : ''}`}
              onClick={() => {
                const newState = !courseManagementOpen;
                if (newState) closeOtherPanels('course');
                setCourseManagementOpen(newState);
              }}
            >
              <BookOpen className="h-5 w-5" /> Manage Courses
            </Button>
            <Button 
              variant={departmentManagementOpen ? "default" : "outline"} 
              className={`flex items-center gap-2 ${departmentManagementOpen ? 'bg-[#800000] text-white' : ''}`}
              onClick={() => {
                const newState = !departmentManagementOpen;
                if (newState) closeOtherPanels('department');
                setDepartmentManagementOpen(newState);
              }}
            >
              <Users className="h-5 w-5" /> Manage Departments
            </Button>
            <Button 
              variant={viewLogsOpen ? "default" : "outline"} 
              className={`flex items-center gap-2 ${viewLogsOpen ? 'bg-[#800000] text-white' : ''}`}
              onClick={() => {
                const newState = !viewLogsOpen;
                if (newState) closeOtherPanels('logs');
                setViewLogsOpen(newState);
              }}
            >
              <List className="h-5 w-5" /> View Logs
            </Button>
            <Button variant="default" className="flex items-center gap-2 bg-[#800000] text-white" onClick={() => setDialogOpen(true)}>
              <UserPlus className="h-5 w-5" /> Create Department Head
            </Button>
            <Button 
              variant={scholarEvaluationsOpen ? "default" : "outline"} 
              className={`flex items-center gap-2 ${scholarEvaluationsOpen ? 'bg-green-600 text-white' : 'border-green-600 text-green-700 hover:bg-green-50'}`}
              onClick={() => {
                const newState = !scholarEvaluationsOpen;
                if (newState) closeOtherPanels('evaluation');
                setScholarEvaluationsOpen(newState);
              }}
            >
              <ClipboardCheck className="h-5 w-5" /> Scholar Evaluations
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2">Select a tool to perform administrative actions.</div>
        </CardContent>
      </Card>

      {/* Course Management - Inline below the card */}
      <CourseManagement 
        isExpanded={courseManagementOpen} 
        onToggle={() => setCourseManagementOpen(false)} 
      />

      {/* Department Management - Inline below the card */}
      <DepartmentManagementInline 
        isExpanded={departmentManagementOpen} 
        onToggle={() => setDepartmentManagementOpen(false)} 
      />

      {/* Send Notification - Inline below the card */}
      <SendNotificationInline 
        isExpanded={sendNotificationOpen} 
        onToggle={() => setSendNotificationOpen(false)} 
      />

      {/* View Logs - Inline below the card */}
      {viewLogsOpen && (
        <div className="mt-6 border-0 rounded-xl bg-white shadow-soft">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">System Audit Logs</h3>
              <Button variant="outline" size="sm" onClick={() => setViewLogsOpen(false)}>
                Close
              </Button>
            </div>
            <AuditLogs />
          </div>
        </div>
      )}

      {/* Scholar Evaluations - Inline below the card */}
      {scholarEvaluationsOpen && (
        <div className="mt-6 border-0 rounded-xl bg-white shadow-soft">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-green-600" />
                  Scholar Evaluation Management
                </h3>
                <p className="text-sm text-gray-500">Manage evaluation periods and view all scholar evaluations</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setScholarEvaluationsOpen(false)}>
                Close
              </Button>
            </div>
            <div className="space-y-6">
              <AdminEvaluationControl />
              <div className="border-t pt-6">
                <AdminEvaluationTable />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Department Head Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department Head Account</DialogTitle>
            <DialogDescription>Fill in the details to create a new Department Head account.</DialogDescription>
          </DialogHeader>
          {/* Use the full-featured registration form here */}
          <RegisterDepartmentHeadForm />
        </DialogContent>
      </Dialog>
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>Department Head account created successfully.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={() => setSuccessDialog(false)}>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={errorDialog} onOpenChange={setErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{errorMsg}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={() => setErrorDialog(false)}>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Bell, BookOpen, Users, List, UserPlus, ClipboardCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import RegisterDepartmentHeadForm from "../department-head/RegisterDepartmentHeadForm";
import DepartmentManagement from "@/components/DepartmentManagement";
import { AdminEvaluationControl } from "@/components/admin-evaluation-control";
import { AdminEvaluationView } from "@/components/admin-evaluation-view";

export function ToolsCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [departmentManagementOpen, setDepartmentManagementOpen] = useState(false);
  const [evaluationControlOpen, setEvaluationControlOpen] = useState(false);
  const [evaluationViewOpen, setEvaluationViewOpen] = useState(false);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setForm({ ...form, [e.target.name]: e.target.value });
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setErrorMsg("");
  //   try {
  //     // TODO: Replace with real API call
  //     // await createDepartmentHead(form)
  //     await new Promise(res => setTimeout(res, 1000)); // Simulate API
  //     setDialogOpen(false);
  //     setSuccessDialog(true);
  //     setForm({ name: "", idNumber: "", email: "", password: "" });
  //   } catch (err: any) {
  //     setErrorMsg("Failed to create Department Head. Please try again.");
  //     setErrorDialog(true);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>OAS Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Export Applications
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Send Notification
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Manage Courses
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setDepartmentManagementOpen(true)}>
            <Users className="h-5 w-5" /> Manage Departments
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <List className="h-5 w-5" /> View Logs
          </Button>
          <Button variant="default" className="flex items-center gap-2 bg-[#800000] text-white" onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-5 w-5" /> Create Department Head
          </Button>
          <Button variant="outline" className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50" onClick={() => setEvaluationControlOpen(true)}>
            <ClipboardCheck className="h-5 w-5" /> Scholar Evaluations
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-2">Select a tool to perform quick OAS actions. (Some actions are stubs for now.)</div>
      </CardContent>
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
      
      {/* Department Management Dialog */}
      <DepartmentManagement 
        open={departmentManagementOpen} 
        onOpenChange={setDepartmentManagementOpen} 
      />

      {/* Scholar Evaluation Management Dialog */}
      <Dialog open={evaluationControlOpen} onOpenChange={setEvaluationControlOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Scholar Evaluation Management</DialogTitle>
            <DialogDescription>Manage evaluation periods and view all scholar evaluations</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto max-h-[70vh]">
            <AdminEvaluationControl />
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">All Evaluations</h3>
              <AdminEvaluationView />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 
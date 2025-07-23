import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Bell, BookOpen, Users, List, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import RegisterDepartmentHeadForm from "../department-head/RegisterDepartmentHeadForm";

export function ToolsCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState(false);
  // Remove local form state for department head creation
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
          <Button variant="outline" className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Manage Departments
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <List className="h-5 w-5" /> View Logs
          </Button>
          <Button variant="default" className="flex items-center gap-2 bg-[#800000] text-white" onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-5 w-5" /> Create Department Head
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
    </Card>
  );
} 
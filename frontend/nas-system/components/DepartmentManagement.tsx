'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import departmentService, { Department, CreateDepartmentData, UpdateDepartmentData } from "@/services/departmentService";

interface DepartmentManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DepartmentManagement({ open, onOpenChange }: DepartmentManagementProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Form states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  const [formData, setFormData] = useState<CreateDepartmentData>({
    departmentCode: '',
    name: ''
  });
  
  const { toast } = useToast();

  // Load departments
  const loadDepartments = async (page = 1, search = '') => {
    console.log('🏢 Loading departments...', { page, search });
    setLoading(true);
    try {
      const response = await departmentService.getAllDepartments(page, 10, search);
      console.log('🏢 Department response received:', response);
      console.log('🏢 Setting departments:', response.data);
      
      setDepartments(response.data);
      setCurrentPage(response.page);
      setTotalPages(response.pages);
      setTotal(response.total);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load departments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load departments when dialog opens
  useEffect(() => {
    if (open) {
      loadDepartments();
    }
  }, [open]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadDepartments(1, searchTerm);
  };

  // Handle create department
  const handleCreate = async () => {
    if (!formData.departmentCode.trim() || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await departmentService.createDepartment(formData);
      toast({
        title: "Success",
        description: "Department created successfully"
      });
      setShowCreateDialog(false);
      setFormData({ departmentCode: '', name: '' });
      loadDepartments(currentPage, searchTerm);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create department",
        variant: "destructive"
      });
    }
  };

  // Handle edit department
  const handleEdit = async () => {
    if (!selectedDepartment || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const updateData: UpdateDepartmentData = {
        name: formData.name
      };
      
      // Only include departmentCode if it's different
      if (formData.departmentCode !== selectedDepartment.departmentCode) {
        updateData.departmentCode = formData.departmentCode;
      }

      await departmentService.updateDepartment(selectedDepartment.departmentCode, updateData);
      toast({
        title: "Success",
        description: "Department updated successfully"
      });
      setShowEditDialog(false);
      setSelectedDepartment(null);
      setFormData({ departmentCode: '', name: '' });
      loadDepartments(currentPage, searchTerm);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update department",
        variant: "destructive"
      });
    }
  };

  // Handle delete department
  const handleDelete = async () => {
    if (!selectedDepartment) return;

    try {
      await departmentService.deleteDepartment(selectedDepartment.departmentCode);
      toast({
        title: "Success",
        description: "Department deleted successfully"
      });
      setShowDeleteDialog(false);
      setSelectedDepartment(null);
      loadDepartments(currentPage, searchTerm);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete department",
        variant: "destructive"
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      departmentCode: department.departmentCode,
      name: department.name
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (department: Department) => {
    setSelectedDepartment(department);
    setShowDeleteDialog(true);
  };

  return (
    <>
      {/* Main Department Management Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Department Management</DialogTitle>
            <DialogDescription>
              Manage departments in the system. Create, edit, or delete departments as needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Create Section */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="max-w-sm"
                />
                <Button onClick={handleSearch} variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-[#800000] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Department
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <Card className="flex-1">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{total}</div>
                  <div className="text-sm text-gray-500">Total Departments</div>
                </CardContent>
              </Card>
            </div>

            {/* Departments Table */}
            <Card>
              <CardHeader>
                <CardTitle>Departments</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading departments...</div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No departments found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map((department) => (
                        <TableRow key={department._id}>
                          <TableCell>
                            <Badge variant="secondary">{department.departmentCode}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{department.name}</TableCell>
                          <TableCell>{new Date(department.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(department.updatedAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(department)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(department)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadDepartments(currentPage - 1, searchTerm)}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadDepartments(currentPage + 1, searchTerm)}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Department Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
            <DialogDescription>
              Enter the details for the new department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="departmentCode">Department Code *</Label>
              <Input
                id="departmentCode"
                value={formData.departmentCode}
                onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value.toUpperCase() })}
                placeholder="e.g., CCS, CBA, COE"
                maxLength={10}
              />
            </div>
            <div>
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., College of Computer Studies"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-[#800000] text-white">
              Create Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the department details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editDepartmentCode">Department Code *</Label>
              <Input
                id="editDepartmentCode"
                value={formData.departmentCode}
                onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value.toUpperCase() })}
                placeholder="e.g., CCS, CBA, COE"
                maxLength={10}
              />
            </div>
            <div>
              <Label htmlFor="editName">Department Name *</Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., College of Computer Studies"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-[#800000] text-white">
              Update Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the department "{selectedDepartment?.name}" ({selectedDepartment?.departmentCode})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Delete Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

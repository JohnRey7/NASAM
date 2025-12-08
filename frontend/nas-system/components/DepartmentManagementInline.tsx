'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, Search, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import userService from "@/services/userService";
import roleService from "@/services/roleService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Department {
  _id: string;
  departmentCode: string;
  name: string;
  head?: {
    _id: string;
    name: string;
    email: string;
  };
  is_deleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateDepartmentData {
  departmentCode: string;
  name: string;
  headId?: string;
}

interface UpdateDepartmentData {
  departmentCode?: string;
  name?: string;
  headId?: string;
}

interface DepartmentManagementInlineProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function DepartmentManagementInline({ isExpanded, onToggle }: DepartmentManagementInlineProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deletedDepartments, setDeletedDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletedTotal, setDeletedTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('active');
  const [departmentHeads, setDepartmentHeads] = useState<any[]>([]);
  
  // Form states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  const [formData, setFormData] = useState<CreateDepartmentData>({
    departmentCode: '',
    name: '',
    headId: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartmentHeads();
  }, []);

  const fetchDepartmentHeads = async () => {
    try {
      // First get the role ID for department_head
      const rolesResponse = await roleService.getAllRoles();
      const headRole = rolesResponse.roles.find((r: any) => r.name === 'department_head');
      
      if (headRole) {
        const usersResponse = await userService.getAllUsers({ roleId: headRole._id });
        setDepartmentHeads(usersResponse.users || []);
      }
    } catch (error) {
      console.error("Error fetching department heads:", error);
    }
  };

  // Load departments
  const loadDepartments = async (page = 1, search = '') => {
    console.log('🏢 Loading departments...', { page, search });
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/departments`, {
        params: { page, limit: 25, search },
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('🏢 Department response:', response.data);
      
      // Handle different response structures
      const data = response.data;
      if (Array.isArray(data)) {
        setDepartments(data);
        setTotal(data.length);
        setTotalPages(1);
        setCurrentPage(1);
      } else if (data.departments) {
        setDepartments(data.departments || []);
        setTotal(data.pagination?.totalDepartments || data.total || data.departments.length);
        setCurrentPage(data.pagination?.currentPage || data.page || page);
        setTotalPages(data.pagination?.totalPages || data.pages || 1);
      } else if (data.data) {
        setDepartments(data.data || []);
        setTotal(data.total || data.data.length);
        setCurrentPage(data.page || page);
        setTotalPages(data.pages || 1);
      } else {
        setDepartments([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('Error loading departments:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load departments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load deleted departments
  const loadDeletedDepartments = async () => {
    console.log('🏢 Loading deleted departments...');
    try {
      const response = await axios.get(`${API_URL}/departments/deleted`, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('🏢 Deleted departments response:', response.data);
      
      const data = response.data;
      if (Array.isArray(data)) {
        setDeletedDepartments(data);
        setDeletedTotal(data.length);
      } else if (data.departments) {
        setDeletedDepartments(data.departments || []);
        setDeletedTotal(data.pagination?.totalDepartments || data.departments.length);
      } else if (data.data) {
        setDeletedDepartments(data.data || []);
        setDeletedTotal(data.total || data.data.length);
      } else {
        setDeletedDepartments([]);
        setDeletedTotal(0);
      }
    } catch (error: any) {
      console.error('Error loading deleted departments:', error);
      // Silently fail for deleted departments if endpoint doesn't exist
      setDeletedDepartments([]);
      setDeletedTotal(0);
    }
  };

  // Load departments when component expands
  useEffect(() => {
    if (isExpanded) {
      loadDepartments();
      loadDeletedDepartments();
    }
  }, [isExpanded]);

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
      const payload = {
        ...formData,
        headId: formData.headId === 'none' ? '' : formData.headId
      };

      await axios.post(`${API_URL}/departments`, payload, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      toast({
        title: "Success",
        description: `Department "${formData.name}" created successfully`
      });
      setShowCreateDialog(false);
      setFormData({ departmentCode: '', name: '', headId: '' });
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
        name: formData.name,
        headId: formData.headId === 'none' ? '' : formData.headId
      };
      
      // Only include departmentCode if it's different
      if (formData.departmentCode !== selectedDepartment.departmentCode) {
        updateData.departmentCode = formData.departmentCode;
      }

      await axios.patch(`${API_URL}/departments/${selectedDepartment.departmentCode}`, updateData, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      toast({
        title: "Success",
        description: `Department "${formData.name}" updated successfully`
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

  // Handle soft delete department
  const handleDelete = async () => {
    if (!selectedDepartment) return;

    try {
      await axios.delete(`${API_URL}/departments/${selectedDepartment.departmentCode}/soft`, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      toast({
        title: "Success",
        description: `Department "${selectedDepartment.name}" deleted successfully`
      });
      setShowDeleteDialog(false);
      setSelectedDepartment(null);
      loadDepartments(currentPage, searchTerm);
      loadDeletedDepartments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete department",
        variant: "destructive"
      });
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async () => {
    if (!selectedDepartment) return;

    try {
      await axios.delete(`${API_URL}/departments/${selectedDepartment.departmentCode}/permanent`, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      toast({
        title: "Success",
        description: `Department "${selectedDepartment.name}" permanently deleted`
      });
      setShowPermanentDeleteDialog(false);
      setSelectedDepartment(null);
      loadDeletedDepartments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to permanently delete department",
        variant: "destructive"
      });
    }
  };

  // Handle restore department
  const handleRestore = async () => {
    if (!selectedDepartment) return;

    try {
      await axios.put(`${API_URL}/departments/${selectedDepartment.departmentCode}/restore`, {}, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      toast({
        title: "Success",
        description: `Department "${selectedDepartment.name}" restored successfully`
      });
      setShowRestoreDialog(false);
      setSelectedDepartment(null);
      loadDepartments(currentPage, searchTerm);
      loadDeletedDepartments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to restore department",
        variant: "destructive"
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      departmentCode: department.departmentCode,
      name: department.name,
      headId: department.head?._id || 'none'
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (department: Department) => {
    setSelectedDepartment(department);
    setShowDeleteDialog(true);
  };

  // Open permanent delete dialog
  const openPermanentDeleteDialog = (department: Department) => {
    setSelectedDepartment(department);
    setShowPermanentDeleteDialog(true);
  };

  // Open restore dialog
  const openRestoreDialog = (department: Department) => {
    setSelectedDepartment(department);
    setShowRestoreDialog(true);
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="mt-6 border-0 rounded-xl bg-white shadow-soft">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-lg text-gray-800">Department Management</h3>
            <p className="text-sm text-gray-500">Manage departments in the system. Create, edit, or delete departments as needed.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onToggle}>
            Close
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Departments ({total})</TabsTrigger>
            <TabsTrigger value="deleted">Deleted Departments ({deletedTotal})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-4">
              {/* Search and Create Section */}
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    placeholder="Search departments by code or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="max-w-sm"
                  />
                  <Button onClick={handleSearch} variant="outline" size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-[#800000] text-white hover:bg-[#600000]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </div>

              {/* Departments Table */}
              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="text-center py-8">Loading departments...</div>
                  ) : departments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No departments found</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department Code</TableHead>
                          <TableHead>Department Name</TableHead>
                          <TableHead>Department Head</TableHead>
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
                            <TableCell>
                              {department.head ? (
                                <span className="text-green-600">
                                  {department.head.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell>{new Date(department.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(department.updatedAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(department)}
                                  title="Edit department"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog(department)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete department"
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
                    <div className="flex justify-center gap-2 p-4 border-t">
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
          </TabsContent>

          <TabsContent value="deleted">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Deleted Departments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="text-center py-8">Loading deleted departments...</div>
                  ) : deletedDepartments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No deleted departments found</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department Code</TableHead>
                          <TableHead>Department Name</TableHead>
                          <TableHead>Deleted On</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deletedDepartments.map((department) => (
                          <TableRow key={department._id} className="bg-gray-50">
                            <TableCell>
                              <Badge variant="outline" className="text-gray-500">{department.departmentCode}</Badge>
                            </TableCell>
                            <TableCell className="font-medium text-gray-500">{department.name}</TableCell>
                            <TableCell className="text-gray-500">{new Date(department.updatedAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRestoreDialog(department)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Restore department"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPermanentDeleteDialog(department)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Permanently delete"
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Department Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
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
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">A unique identifier for the department</p>
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
            <div>
              <Label htmlFor="head">Department Head</Label>
              <Select
                value={formData.headId}
                onValueChange={(value) => setFormData({ ...formData, headId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departmentHeads.map((head) => (
                    <SelectItem key={head._id} value={head._id}>
                      {head.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Optional: Assign a department head</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-[#800000] text-white hover:bg-[#600000]">
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
                maxLength={20}
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
            <div>
              <Label htmlFor="edit-head">Department Head</Label>
              <Select
                value={formData.headId}
                onValueChange={(value) => setFormData({ ...formData, headId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departmentHeads.map((head) => (
                    <SelectItem key={head._id} value={head._id}>
                      {head.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-[#800000] text-white hover:bg-[#600000]">
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
              This can be recovered from the "Deleted Departments" tab.
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

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={showPermanentDeleteDialog} onOpenChange={setShowPermanentDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Permanently Delete Department</DialogTitle>
            <DialogDescription>
              <span className="font-bold text-red-600">Warning:</span> This action cannot be undone. 
              The department "{selectedDepartment?.name}" ({selectedDepartment?.departmentCode}) will be permanently removed from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermanentDeleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePermanentDelete} variant="destructive">
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore the department "{selectedDepartment?.name}" ({selectedDepartment?.departmentCode})?
              It will become active again and visible in the department list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} className="bg-green-600 text-white hover:bg-green-700">
              Restore Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

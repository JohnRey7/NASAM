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
import { Pencil, Trash2, Plus, Search, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import courseService, { Course, CreateCourseData, UpdateCourseData } from "@/services/courseService";

interface CourseManagementProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function CourseManagement({ isExpanded, onToggle }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [deletedCourses, setDeletedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletedTotal, setDeletedTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('active');
  
  // Form states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  const [formData, setFormData] = useState<CreateCourseData>({
    courseId: '',
    name: ''
  });
  
  const { toast } = useToast();

  // Load courses
  const loadCourses = async (page = 1, search = '') => {
    console.log('📚 Loading courses...', { page, search });
    setLoading(true);
    try {
      const response = await courseService.getAllCourses(page, 25, search);
      console.log('📚 Course response received:', response);
      
      setCourses(response.courses || []);
      setCurrentPage(response.page);
      setTotalPages(response.pages);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load deleted courses
  const loadDeletedCourses = async (page = 1) => {
    console.log('📚 Loading deleted courses...');
    setLoading(true);
    try {
      const response = await courseService.getDeletedCourses(page, 25);
      console.log('📚 Deleted courses response:', response);
      
      setDeletedCourses(response.courses || []);
      setDeletedTotal(response.total);
    } catch (error: any) {
      console.error('Error loading deleted courses:', error);
      // Silently fail for deleted courses if endpoint doesn't exist
    } finally {
      setLoading(false);
    }
  };

  // Load courses when component expands
  useEffect(() => {
    if (isExpanded) {
      loadCourses();
      loadDeletedCourses();
    }
  }, [isExpanded]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadCourses(1, searchTerm);
  };

  // Handle create course
  const handleCreate = async () => {
    if (!formData.courseId.trim() || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await courseService.createCourse(formData);
      toast({
        title: "Success",
        description: `Course "${formData.name}" created successfully`
      });
      setShowCreateDialog(false);
      setFormData({ courseId: '', name: '' });
      loadCourses(currentPage, searchTerm);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create course",
        variant: "destructive"
      });
    }
  };

  // Handle edit course
  const handleEdit = async () => {
    if (!selectedCourse || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const updateData: UpdateCourseData = {
        name: formData.name
      };
      
      // Only include courseId if it's different
      if (formData.courseId !== selectedCourse.courseId) {
        updateData.courseId = formData.courseId;
      }

      await courseService.updateCourse(selectedCourse.courseId, updateData);
      toast({
        title: "Success",
        description: `Course "${formData.name}" updated successfully`
      });
      setShowEditDialog(false);
      setSelectedCourse(null);
      setFormData({ courseId: '', name: '' });
      loadCourses(currentPage, searchTerm);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update course",
        variant: "destructive"
      });
    }
  };

  // Handle soft delete course
  const handleDelete = async () => {
    if (!selectedCourse) return;

    try {
      await courseService.softDeleteCourse(selectedCourse.courseId);
      toast({
        title: "Success",
        description: `Course "${selectedCourse.name}" deleted successfully`
      });
      setShowDeleteDialog(false);
      setSelectedCourse(null);
      loadCourses(currentPage, searchTerm);
      loadDeletedCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async () => {
    if (!selectedCourse) return;

    try {
      await courseService.permanentDeleteCourse(selectedCourse.courseId);
      toast({
        title: "Success",
        description: `Course "${selectedCourse.name}" permanently deleted`
      });
      setShowPermanentDeleteDialog(false);
      setSelectedCourse(null);
      loadDeletedCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to permanently delete course",
        variant: "destructive"
      });
    }
  };

  // Handle restore course
  const handleRestore = async () => {
    if (!selectedCourse) return;

    try {
      await courseService.restoreCourse(selectedCourse.courseId);
      toast({
        title: "Success",
        description: `Course "${selectedCourse.name}" restored successfully`
      });
      setShowRestoreDialog(false);
      setSelectedCourse(null);
      loadCourses(currentPage, searchTerm);
      loadDeletedCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to restore course",
        variant: "destructive"
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      courseId: course.courseId,
      name: course.name
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (course: Course) => {
    setSelectedCourse(course);
    setShowDeleteDialog(true);
  };

  // Open permanent delete dialog
  const openPermanentDeleteDialog = (course: Course) => {
    setSelectedCourse(course);
    setShowPermanentDeleteDialog(true);
  };

  // Open restore dialog
  const openRestoreDialog = (course: Course) => {
    setSelectedCourse(course);
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
            <h3 className="font-bold text-lg text-gray-800">Course Management</h3>
            <p className="text-sm text-gray-500">Manage courses in the system. Create, edit, or delete courses as needed.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onToggle}>
            Close
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Courses ({total})</TabsTrigger>
            <TabsTrigger value="deleted">Deleted Courses ({deletedTotal})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-4">
              {/* Search and Create Section */}
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    placeholder="Search courses by ID or name..."
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
                  Add Course
                </Button>
              </div>

              {/* Courses Table */}
              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="text-center py-8">Loading courses...</div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No courses found</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course Code</TableHead>
                          <TableHead>Course Name</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses.map((course) => (
                          <TableRow key={course._id}>
                            <TableCell>
                              <Badge variant="secondary">{course.courseId}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{course.name}</TableCell>
                            <TableCell>{new Date(course.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(course.updatedAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(course)}
                                  title="Edit course"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog(course)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete course"
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
                        onClick={() => loadCourses(currentPage - 1, searchTerm)}
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
                        onClick={() => loadCourses(currentPage + 1, searchTerm)}
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
                    Deleted Courses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="text-center py-8">Loading deleted courses...</div>
                  ) : deletedCourses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No deleted courses found</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course Code</TableHead>
                          <TableHead>Course Name</TableHead>
                          <TableHead>Deleted On</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deletedCourses.map((course) => (
                          <TableRow key={course._id} className="bg-gray-50">
                            <TableCell>
                              <Badge variant="outline" className="text-gray-500">{course.courseId}</Badge>
                            </TableCell>
                            <TableCell className="font-medium text-gray-500">{course.name}</TableCell>
                            <TableCell className="text-gray-500">{new Date(course.updatedAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRestoreDialog(course)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Restore course"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPermanentDeleteDialog(course)}
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

      {/* Create Course Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Enter the details for the new course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="courseId">Course Code *</Label>
              <Input
                id="courseId"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value.toUpperCase() })}
                placeholder="e.g., BSCS, BSIT, BSCE"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">A unique identifier for the course</p>
            </div>
            <div>
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bachelor of Science in Computer Science"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-[#800000] text-white hover:bg-[#600000]">
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update the course details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCourseId">Course Code *</Label>
              <Input
                id="editCourseId"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value.toUpperCase() })}
                placeholder="e.g., BSCS, BSIT, BSCE"
                maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="editName">Course Name *</Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bachelor of Science in Computer Science"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-[#800000] text-white hover:bg-[#600000]">
              Update Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the course "{selectedCourse?.name}" ({selectedCourse?.courseId})?
              This can be recovered from the "Deleted Courses" tab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={showPermanentDeleteDialog} onOpenChange={setShowPermanentDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Permanently Delete Course</DialogTitle>
            <DialogDescription>
              <span className="font-bold text-red-600">Warning:</span> This action cannot be undone. 
              The course "{selectedCourse?.name}" ({selectedCourse?.courseId}) will be permanently removed from the system.
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
            <DialogTitle>Restore Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore the course "{selectedCourse?.name}" ({selectedCourse?.courseId})?
              It will become active again and visible in the course list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} className="bg-green-600 text-white hover:bg-green-700">
              Restore Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

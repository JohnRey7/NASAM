"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { AdminEvaluationFormDialog } from "@/components/admin-evaluation-form-dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Helper function to convert MongoDB Decimal128 to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  // Handle MongoDB Decimal128 format: { $numberDecimal: "value" }
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal) || 0;
  }
  return 0;
};

interface Evaluation {
  _id: string;
  evaluateeUser: {
    _id: string;
    name: string;
    idNumber: string;
    email: string;
  };
  overallRating: any; // Can be number or Decimal128
  evaluationStatus: string;
  semester: string;
  schoolYear: string;
  createdAt: string;
  is_deleted: boolean;
}

interface PaginationData {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

export function AdminEvaluationTable() {
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pages: 1,
    total: 0,
    limit: 50
  });
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();

  // Fetch evaluations
  const fetchEvaluations = async (page: number = 1, search: string = "") => {
    setLoading(true);
    try {
      const includeDeleted = activeTab === "deleted";
      const response = await axios.get(`${API_URL}/admin/evaluation`, {
        params: {
          page,
          limit: 50,
          search,
          includeDeleted
        },
        withCredentials: true
      });

      const data = response.data;
      setEvaluations(data.data || []);
      setPagination({
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
        limit: 50
      });
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      toast({
        title: "Error",
        description: "Failed to load evaluations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load evaluations when tab or search changes
  useEffect(() => {
    fetchEvaluations(1, searchTerm);
  }, [activeTab]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvaluations(1, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle soft delete
  const handleSoftDelete = async (evaluation: Evaluation) => {
    setActionLoading(true);
    try {
      await axios.delete(
        `${API_URL}/admin/evaluation/${evaluation.evaluateeUser._id}/user/soft`,
        { withCredentials: true }
      );
      
      toast({
        title: "Success",
        description: "Evaluation moved to deleted"
      });
      
      fetchEvaluations(pagination.page, searchTerm);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting evaluation:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete evaluation",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async (evaluation: Evaluation) => {
    setActionLoading(true);
    try {
      await axios.delete(
        `${API_URL}/admin/evaluation/${evaluation.evaluateeUser._id}/permanent`,
        { withCredentials: true }
      );
      
      toast({
        title: "Success",
        description: "Evaluation permanently deleted"
      });
      
      fetchEvaluations(pagination.page, searchTerm);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error permanently deleting evaluation:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to permanently delete evaluation",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle restore
  const handleRestore = async (evaluation: Evaluation) => {
    setActionLoading(true);
    try {
      await axios.post(
        `${API_URL}/admin/evaluation/${evaluation.evaluateeUser._id}/delete/restore`,
        {},
        { withCredentials: true }
      );
      
      toast({
        title: "Success",
        description: "Evaluation restored successfully"
      });
      
      fetchEvaluations(pagination.page, searchTerm);
    } catch (error: any) {
      console.error("Error restoring evaluation:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to restore evaluation",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format school year
  const formatSchoolYear = (sy: string) => {
    if (sy.length === 4) {
      return `20${sy.substring(0, 2)}-20${sy.substring(2, 4)}`;
    }
    return sy;
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "deleted")}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="active">Active Evaluations</TabsTrigger>
            <TabsTrigger value="deleted">Deleted Evaluations</TabsTrigger>
          </TabsList>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by student name, ID number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Active Evaluations Tab */}
        <TabsContent value="active" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Evaluations ({pagination.total})</span>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Overall Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : evaluations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No evaluations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      evaluations.map((evaluation) => (
                        <TableRow key={evaluation._id}>
                          <TableCell className="font-medium">
                            {evaluation.evaluateeUser?.name || 'N/A'}
                          </TableCell>
                          <TableCell>{evaluation.evaluateeUser?.idNumber || 'N/A'}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {evaluation.evaluateeUser?.email || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={toNumber(evaluation.overallRating) >= 3 ? "default" : "destructive"}>
                              {toNumber(evaluation.overallRating).toFixed(2)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={evaluation.evaluationStatus === 'passed' ? "default" : "destructive"}
                              className={evaluation.evaluationStatus === 'passed' ? "bg-green-100 text-green-800" : ""}
                            >
                              {evaluation.evaluationStatus || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {evaluation.semester}<br />
                            <span className="text-gray-500">S.Y. {formatSchoolYear(evaluation.schoolYear)}</span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(evaluation.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvaluation(evaluation);
                                  setViewDialogOpen(true);
                                }}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedEvaluation(evaluation);
                                  setEditDialogOpen(true);
                                }}
                                title="Edit Evaluation"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedEvaluation(evaluation);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Delete Evaluation"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {evaluations.length} of {pagination.total} evaluations
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchEvaluations(pagination.page - 1, searchTerm)}
                      disabled={pagination.page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchEvaluations(pagination.page + 1, searchTerm)}
                      disabled={pagination.page >= pagination.pages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deleted Evaluations Tab */}
        <TabsContent value="deleted" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Deleted Evaluations ({pagination.total})</span>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Overall Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : evaluations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No deleted evaluations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      evaluations.map((evaluation) => (
                        <TableRow key={evaluation._id} className="opacity-60">
                          <TableCell className="font-medium">
                            {evaluation.evaluateeUser?.name || 'N/A'}
                          </TableCell>
                          <TableCell>{evaluation.evaluateeUser?.idNumber || 'N/A'}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {evaluation.evaluateeUser?.email || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {toNumber(evaluation.overallRating).toFixed(2)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {evaluation.evaluationStatus || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {evaluation.semester}<br />
                            <span className="text-gray-500">S.Y. {formatSchoolYear(evaluation.schoolYear)}</span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(evaluation.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvaluation(evaluation);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleRestore(evaluation)}
                                disabled={actionLoading}
                              >
                                {actionLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedEvaluation(evaluation);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {evaluations.length} of {pagination.total} evaluations
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchEvaluations(pagination.page - 1, searchTerm)}
                      disabled={pagination.page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchEvaluations(pagination.page + 1, searchTerm)}
                      disabled={pagination.page >= pagination.pages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Evaluation Details</DialogTitle>
            <DialogDescription>
              View evaluation for {selectedEvaluation?.evaluateeUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Student Name</p>
                  <p className="text-sm">{selectedEvaluation.evaluateeUser?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ID Number</p>
                  <p className="text-sm">{selectedEvaluation.evaluateeUser?.idNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{selectedEvaluation.evaluateeUser?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Overall Rating</p>
                  <p className="text-sm font-bold">{toNumber(selectedEvaluation.overallRating).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge variant={selectedEvaluation.evaluationStatus === 'passed' ? "default" : "destructive"}>
                    {selectedEvaluation.evaluationStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Period</p>
                  <p className="text-sm">
                    {selectedEvaluation.semester}, S.Y. {formatSchoolYear(selectedEvaluation.schoolYear)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date Created</p>
                  <p className="text-sm">{formatDate(selectedEvaluation.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Evaluation Form Dialog */}
      {selectedEvaluation && (
        <AdminEvaluationFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          userId={selectedEvaluation.evaluateeUser._id}
          userName={selectedEvaluation.evaluateeUser.name}
          onSuccess={() => {
            fetchEvaluations(pagination.page, searchTerm);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTab === "active" ? "Delete Evaluation" : "Permanently Delete Evaluation"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "active" 
                ? "Are you sure you want to delete this evaluation? It will be moved to the deleted tab and can be restored later."
                : "Are you sure you want to permanently delete this evaluation? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedEvaluation) {
                  if (activeTab === "active") {
                    handleSoftDelete(selectedEvaluation);
                  } else {
                    handlePermanentDelete(selectedEvaluation);
                  }
                }
              }}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

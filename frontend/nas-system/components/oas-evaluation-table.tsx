"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface EvaluateeUser {
  _id: string;
  name: string;
  email: string;
  idNumber: string;
}

interface Evaluation {
  _id: string;
  evaluateeUser: EvaluateeUser;
  overallRating: any; // Can be number or Decimal128
  evaluationStatus: string;
  semester: string;
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
}

export function OasEvaluationTable() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 50
  });
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { toast } = useToast();

  // Fetch evaluations
  const fetchEvaluations = async (page: number = 1, search: string = "") => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/oas/evaluations`, {
        params: {
          page,
          limit: 50,
          search
        },
        withCredentials: true
      });

      setEvaluations(response.data.evaluations || []);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total,
        limit: response.data.limit
      });
    } catch (error: any) {
      console.error("Error fetching evaluations:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch evaluations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch on mount and when search/page changes
  useEffect(() => {
    fetchEvaluations(1, debouncedSearch);
  }, [debouncedSearch]);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scholar Evaluations</CardTitle>
          <CardDescription>
            View and manage scholar evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, ID number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Evaluations Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#800000]" />
              <span className="ml-3 text-gray-600">Loading evaluations...</span>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No evaluations found</p>
              <p className="text-sm mt-2">Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scholar Name</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Overall Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>School Year</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.map((evaluation) => (
                      <TableRow key={evaluation._id}>
                        <TableCell className="font-medium">
                          {evaluation.evaluateeUser?.name || 'N/A'}
                        </TableCell>
                        <TableCell>{evaluation.evaluateeUser?.idNumber || 'N/A'}</TableCell>
                        <TableCell>{evaluation.evaluateeUser?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={toNumber(evaluation.overallRating) >= 3 ? "default" : "destructive"}>
                            {toNumber(evaluation.overallRating).toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={evaluation.evaluationStatus === 'passed' ? "default" : "destructive"}>
                            {evaluation.evaluationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{evaluation.semester}</TableCell>
                        <TableCell>{formatSchoolYear(evaluation.schoolYear)}</TableCell>
                        <TableCell>{formatDate(evaluation.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setSelectedEvaluation(evaluation);
                                setEditDialogOpen(true);
                              }}
                              title="Edit Evaluation"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {evaluations.length} of {pagination.total} evaluations
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEvaluations(pagination.page - 1, debouncedSearch)}
                    disabled={pagination.page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEvaluations(pagination.page + 1, debouncedSearch)}
                    disabled={pagination.page === pagination.pages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Evaluation Details</DialogTitle>
            <DialogDescription>
              Viewing evaluation for {selectedEvaluation?.evaluateeUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Scholar Name</p>
                  <p className="text-sm font-bold">{selectedEvaluation.evaluateeUser?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ID Number</p>
                  <p className="text-sm font-bold">{selectedEvaluation.evaluateeUser?.idNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm font-bold">{selectedEvaluation.evaluateeUser?.email}</p>
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
                  <p className="text-sm font-medium text-gray-500">Semester</p>
                  <p className="text-sm font-bold">{selectedEvaluation.semester}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">School Year</p>
                  <p className="text-sm font-bold">{formatSchoolYear(selectedEvaluation.schoolYear)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date Created</p>
                  <p className="text-sm font-bold">{formatDate(selectedEvaluation.createdAt)}</p>
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
          apiPrefix="oas"
          onSuccess={() => {
            fetchEvaluations(pagination.page, searchTerm);
          }}
        />
      )}
    </div>
  );
}

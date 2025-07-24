"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { departmentHeadService } from "@/services/departmentHeadService";
import { useToast } from "@/components/ui/use-toast";
import { DepartmentHeadApplicationReview } from "@/components/department-head-application-review";

export default function DepartmentHeadDashboardPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    evaluationsPending: 0,
    completed: 0
  });
  const { toast } = useToast();

  // Fetch applications assigned to this department head
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('🔍 Department Head Dashboard: Fetching assigned applicants');
        
        const applicants = await departmentHeadService.getAssignedApplicants();
        console.log('🔍 Department Head Dashboard: API response data:', applicants);
        
        // Transform applicants data to application format for the review component
        const applicationsData = applicants.map((applicant: any) => ({
          _id: applicant.id || applicant._id,
          userId: applicant.id || applicant._id,
          firstName: applicant.firstName || applicant.name?.split(' ')[0] || '',
          lastName: applicant.lastName || applicant.name?.split(' ').slice(1).join(' ') || '',
          idNumber: applicant.idNumber || 'N/A',
          email: applicant.email || 'N/A',
          programOfStudyAndYear: applicant.programOfStudyAndYear || 'Not specified',
          status: applicant.status || 'pending',
          createdAt: applicant.createdAt || new Date().toISOString()
        }));
        
        setApplications(applicationsData);
        
        // Calculate stats
        setStats({
          totalApplications: applicationsData.length,
          pendingReview: applicationsData.filter((app: any) => app.status === 'pending' || app.status === 'under_review').length,
          evaluationsPending: applicationsData.filter((app: any) => app.status === 'evaluation_pending').length,
          completed: applicationsData.filter((app: any) => app.status === 'approved' || app.status === 'completed').length
        });
      } catch (error) {
        console.error('Error fetching department applicants:', error);
        toast({ title: "Error", description: "Failed to load applicants data", variant: "destructive" });
        setApplications([]);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                  <p className="text-xs text-blue-600 mt-1">total applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
                  <p className="text-xs text-orange-600 mt-1">pending review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.evaluationsPending}</p>
                  <p className="text-xs text-purple-600 mt-1">evaluations pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  <p className="text-xs text-green-600 mt-1">completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Review Section */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000] mx-auto mb-2"></div>
                <p>Loading applications...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DepartmentHeadApplicationReview applications={applications} />
        )}
      </div>
    </DashboardLayout>
  );
}

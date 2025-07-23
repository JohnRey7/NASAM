import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState } from "react";
import { DepartmentHeadEvaluationForm } from "./DepartmentHeadEvaluationForm";
import { DepartmentHeadInterviewScheduler } from "./DepartmentHeadInterviewScheduler";
import { DepartmentHeadRecommendationForm } from "./DepartmentHeadRecommendationForm";
import { ApplicantSelector } from "./ApplicantSelector";

export default function DepartmentHeadDashboardPage() {
  const [selectedApplicantId, setSelectedApplicantId] = useState("");

  return (
    <DashboardLayout allowedRoles={["department_head"]}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#800000]">Department Head Dashboard</h2>
        <p className="text-gray-600">Manage interview evaluations, schedule interviews, and submit recommendations for applicants.</p>
      </div>
      <ApplicantSelector
        selectedApplicantId={selectedApplicantId}
        onSelect={setSelectedApplicantId}
      />
      {selectedApplicantId ? (
        <Tabs defaultValue="evaluation" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="evaluation">Appearance & Impression Assessment</TabsTrigger>
            <TabsTrigger value="interview">Interview Scheduling</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
          </TabsList>
          <TabsContent value="evaluation">
            <DepartmentHeadEvaluationForm applicantId={selectedApplicantId} />
          </TabsContent>
          <TabsContent value="interview">
            <DepartmentHeadInterviewScheduler applicantId={selectedApplicantId} />
          </TabsContent>
          <TabsContent value="recommendation">
            <DepartmentHeadRecommendationForm applicantId={selectedApplicantId} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center text-gray-500">Select an applicant to begin evaluation and scheduling.</div>
      )}
    </DashboardLayout>
  );
} 
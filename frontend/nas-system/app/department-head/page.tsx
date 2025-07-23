"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState, useEffect } from "react";
import { DepartmentHeadEvaluationForm } from "./DepartmentHeadEvaluationForm";
import { DepartmentHeadInterviewScheduler } from "./DepartmentHeadInterviewScheduler";
import { DepartmentHeadRecommendationForm } from "./DepartmentHeadRecommendationForm";
import { ApplicantSelector } from "./ApplicantSelector";
import { departmentHeadService } from "@/services/departmentHeadService";

export default function DepartmentHeadDashboardPage() {
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    async function fetchReviews() {
      setLoadingReviews(true);
      setReviewError("");
      try {
        const data = await departmentHeadService.getReviews();
        setReviews(data);
      } catch (err) {
        setReviewError("Failed to load reviews.");
      } finally {
        setLoadingReviews(false);
      }
    }
    fetchReviews();
  }, []);

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
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="evaluation">Appearance & Impression Assessment</TabsTrigger>
            <TabsTrigger value="interview">Interview Scheduling</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
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
          <TabsContent value="reviews">
            {loadingReviews ? (
              <div>Loading reviews...</div>
            ) : reviewError ? (
              <div className="text-red-500">{reviewError}</div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-2">Reviews</h3>
                {reviews && reviews.length > 0 ? (
                  <ul className="space-y-2">
                    {reviews.map((review: any) => (
                      <li key={review._id} className="border p-2 rounded">
                        <div><strong>Interview ID:</strong> {review.interviewId || review._id}</div>
                        <div><strong>Status:</strong> {review.status || "N/A"}</div>
                        {/* Add more review details as needed */}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>No reviews found.</div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center text-gray-500">Select an applicant to begin evaluation and scheduling.</div>
      )}
    </DashboardLayout>
  );
} 
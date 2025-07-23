import React, { useEffect, useState } from "react";
import { departmentHeadService } from "@/services/departmentHeadService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Applicant {
  id: string;
  name: string;
  [key: string]: any;
}

export function ApplicantSelector({ onSelect, selectedApplicantId }: { onSelect: (id: string) => void; selectedApplicantId: string; }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchApplicants() {
      setLoading(true);
      setError("");
      try {
        const data = await departmentHeadService.getAssignedApplicants();
        setApplicants(data);
      } catch (err) {
        setError("Failed to load applicants.");
      } finally {
        setLoading(false);
      }
    }
    fetchApplicants();
  }, []);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Select Applicant</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div>Loading applicants...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && (
          <div className="flex flex-wrap gap-2">
            {applicants.map(applicant => (
              <Button
                key={applicant.id}
                variant={selectedApplicantId === applicant.id ? "default" : "outline"}
                className={selectedApplicantId === applicant.id ? "bg-[#800000] text-white" : ""}
                onClick={() => onSelect(applicant.id)}
              >
                {applicant.name}
              </Button>
            ))}
            {applicants.length === 0 && <div>No applicants assigned.</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
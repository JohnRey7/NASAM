import React, { useState } from "react";
import { departmentHeadService } from "@/services/departmentHeadService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DepartmentHeadRecommendationForm({ applicantId }: { applicantId: string }) {
  const [recommendation, setRecommendation] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [locked, setLocked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMsg, setDialogMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await departmentHeadService.submitRecommendation({
        applicantId,
        recommendation: recommendation as 'recommended' | 'not_recommended',
        justification,
      });
      setDialogMsg("Recommendation submitted and locked.");
      setLocked(true);
    } catch (err) {
      setDialogMsg("Failed to submit recommendation. Please try again.");
    } finally {
      setDialogOpen(true);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <Label>Recommendation</Label>
          <Select value={recommendation} onValueChange={setRecommendation} disabled={locked} required>
            <SelectTrigger>
              <SelectValue placeholder="Select recommendation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="not_recommended">Not Recommended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Justification/Comments</Label>
          <Textarea value={justification} onChange={e => setJustification(e.target.value)} placeholder="Enter justification or comments..." disabled={locked} />
        </div>
        <Button type="submit" disabled={locked || loading} className="w-full bg-[#800000] text-white hover:bg-[#600000]">{locked ? "Locked" : loading ? "Submitting..." : "Submit & Lock"}</Button>
      </form>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recommendation Submission</DialogTitle>
            <DialogDescription>{dialogMsg}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
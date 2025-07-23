import React, { useState } from "react";
import { departmentHeadService } from "@/services/departmentHeadService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

export function DepartmentHeadEvaluationForm({ applicantId }: { applicantId: string }) {
  const [appearance, setAppearance] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [impression, setImpression] = useState(3);
  const [comments, setComments] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMsg, setDialogMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await departmentHeadService.submitEvaluation({
        applicantId,
        appearance,
        confidence,
        communication,
        impression,
        comments,
      });
      setDialogMsg("Evaluation submitted successfully.");
    } catch (err) {
      setDialogMsg("Failed to submit evaluation. Please try again.");
    } finally {
      setDialogOpen(true);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <Label>Appearance</Label>
          <Slider min={1} max={5} step={1} value={[appearance]} onValueChange={([v]) => setAppearance(v)} />
          <div className="text-sm text-gray-500">{appearance}/5</div>
        </div>
        <div>
          <Label>Confidence</Label>
          <Slider min={1} max={5} step={1} value={[confidence]} onValueChange={([v]) => setConfidence(v)} />
          <div className="text-sm text-gray-500">{confidence}/5</div>
        </div>
        <div>
          <Label>Communication Clarity</Label>
          <Slider min={1} max={5} step={1} value={[communication]} onValueChange={([v]) => setCommunication(v)} />
          <div className="text-sm text-gray-500">{communication}/5</div>
        </div>
        <div>
          <Label>Overall Impression</Label>
          <Slider min={1} max={5} step={1} value={[impression]} onValueChange={([v]) => setImpression(v)} />
          <div className="text-sm text-gray-500">{impression}/5</div>
        </div>
        <div>
          <Label>Comments/Observations</Label>
          <Textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Enter notes or observations..." />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-[#800000] text-white hover:bg-[#600000]">{loading ? "Submitting..." : "Submit Score"}</Button>
      </form>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evaluation Submission</DialogTitle>
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
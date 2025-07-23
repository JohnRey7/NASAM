import React, { useState } from "react";
import { departmentHeadService } from "@/services/departmentHeadService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DepartmentHeadInterviewScheduler({ applicantId }: { applicantId: string }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMsg, setDialogMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await departmentHeadService.scheduleInterview({
        applicantId,
        date,
        time,
        notes,
      });
      setDialogMsg("Interview scheduled and feedback submitted successfully.");
    } catch (err) {
      setDialogMsg("Failed to schedule interview. Please try again.");
    } finally {
      setDialogOpen(true);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <Label>Time</Label>
          <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
        </div>
        <div>
          <Label>Notes/Feedback</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter interview notes or feedback..." />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-[#800000] text-white hover:bg-[#600000]">{loading ? "Submitting..." : "Schedule Interview"}</Button>
      </form>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Scheduling</DialogTitle>
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
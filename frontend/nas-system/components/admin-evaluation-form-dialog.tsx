"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Helper function to convert MongoDB Decimal128 to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal) || 0;
  }
  return 0;
};

// Star Rating Component
function StarRating({ 
  label, 
  value, 
  onChange,
  description 
}: { 
  label: string
  value: number
  onChange: (value: number) => void
  description?: string
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const handleClick = (starIndex: number, isHalf: boolean) => {
    const newValue = isHalf ? starIndex + 0.5 : starIndex + 1;
    onChange(newValue);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(isHalf ? starIndex + 0.5 : starIndex + 1);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-medium text-[#800000]">{value} / 5</span>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <div 
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const starValue = starIndex + 1;
          const isFilled = displayValue >= starValue;
          const isHalf = !isFilled && displayValue >= starIndex + 0.5;
          
          return (
            <div
              key={starIndex}
              className="relative"
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
            >
              <svg
                className={`w-8 h-8 cursor-pointer transition-all hover:scale-110 ${
                  isFilled ? 'text-yellow-400' : isHalf ? 'text-yellow-400' : 'text-gray-300'
                }`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const clickedHalf = x < rect.width / 2;
                  handleClick(starIndex, clickedHalf);
                }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                {isHalf ? (
                  <>
                    <defs>
                      <linearGradient id={`halfGrad-${starIndex}`}>
                        <stop offset="50%" stopColor="#facc15" />
                        <stop offset="50%" stopColor="#d1d5db" />
                      </linearGradient>
                    </defs>
                    <path
                      fill={`url(#halfGrad-${starIndex})`}
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    />
                  </>
                ) : (
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                )}
              </svg>
            </div>
          );
        })}
        <span className="ml-2 text-sm text-gray-500">
          {displayValue === 0 && "Not rated"}
          {displayValue === 0.5 && "Very Poor"}
          {displayValue === 1 && "Poor"}
          {displayValue === 1.5 && "Below Average"}
          {displayValue === 2 && "Fair"}
          {displayValue === 2.5 && "Average"}
          {displayValue === 3 && "Good"}
          {displayValue === 3.5 && "Very Good"}
          {displayValue === 4 && "Excellent"}
          {displayValue === 4.5 && "Outstanding"}
          {displayValue === 5 && "Exceptional"}
        </span>
      </div>
    </div>
  );
}

// Number Input Component for Time Keeping
function NumberInput({ 
  label, 
  value, 
  onChange, 
  min = 0,
  description 
}: { 
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  description?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <Input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full"
      />
    </div>
  );
}

interface AdminEvaluationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export function AdminEvaluationFormDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess
}: AdminEvaluationFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("attendance");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    attendanceAndPunctuality: {
      regularAttendance: 0,
      promptnessInReportingForDuty: 0
    },
    qualityOfWorkOutput: {
      accuracyAndThoroughnessOfWork: 0,
      organizationAndOrPresentationNeatnessOfWork: 0,
      effectiveness: 0
    },
    quantityOfWorkOutput: {
      accomplishesMoreWorkOnTheGivenTime: 0,
      timelinessInAccomplishingTaskDuties: 0
    },
    attitudeAndWorkBehavior: {
      senseOfResponsibilityAndUrgency: 0,
      dependabilityAndReliability: 0,
      industryAndResourcefulness: 0,
      alertnessAndInitiative: 0,
      sociabilityAndPleasantDisposition: 0
    },
    timeKeepingRecord: {
      excusedAbsences: 0,
      unexcusedAbsences: 0,
      lateGreaterThanTenMinutes: 0,
      lateGreaterThanOneHour: 0,
      failureToPunch: 0,
      underTime: 0
    },
    remarksAndRecommendationByImmediateSupervisor: "",
    remarksCommentsByTheNAS: "",
    semester: "",
    schoolYear: ""
  });

  // Fetch existing evaluation when dialog opens
  useEffect(() => {
    if (open && userId) {
      fetchEvaluation();
    }
  }, [open, userId]);

  const fetchEvaluation = async () => {
    setLoading(true);
    try {
      console.log('Fetching evaluation for userId:', userId);
      console.log('API URL:', `${API_URL}/admin/evaluation/${userId}/user`);
      
      const response = await axios.get(
        `${API_URL}/admin/evaluation/${userId}/user`,
        { withCredentials: true }
      );

      console.log('Evaluation response:', response.data);
      const data = response.data;
      
      // Populate form with existing data
      setFormData({
        attendanceAndPunctuality: {
          regularAttendance: toNumber(data.attendanceAndPunctuality?.regularAttendance),
          promptnessInReportingForDuty: toNumber(data.attendanceAndPunctuality?.promptnessInReportingForDuty)
        },
        qualityOfWorkOutput: {
          accuracyAndThoroughnessOfWork: toNumber(data.qualityOfWorkOutput?.accuracyAndThoroughnessOfWork),
          organizationAndOrPresentationNeatnessOfWork: toNumber(data.qualityOfWorkOutput?.organizationAndOrPresentationNeatnessOfWork),
          effectiveness: toNumber(data.qualityOfWorkOutput?.effectiveness)
        },
        quantityOfWorkOutput: {
          accomplishesMoreWorkOnTheGivenTime: toNumber(data.quantityOfWorkOutput?.accomplishesMoreWorkOnTheGivenTime),
          timelinessInAccomplishingTaskDuties: toNumber(data.quantityOfWorkOutput?.timelinessInAccomplishingTaskDuties)
        },
        attitudeAndWorkBehavior: {
          senseOfResponsibilityAndUrgency: toNumber(data.attitudeAndWorkBehavior?.senseOfResponsibilityAndUrgency),
          dependabilityAndReliability: toNumber(data.attitudeAndWorkBehavior?.dependabilityAndReliability),
          industryAndResourcefulness: toNumber(data.attitudeAndWorkBehavior?.industryAndResourcefulness),
          alertnessAndInitiative: toNumber(data.attitudeAndWorkBehavior?.alertnessAndInitiative),
          sociabilityAndPleasantDisposition: toNumber(data.attitudeAndWorkBehavior?.sociabilityAndPleasantDisposition)
        },
        timeKeepingRecord: {
          excusedAbsences: toNumber(data.timeKeepingRecord?.excusedAbsences),
          unexcusedAbsences: toNumber(data.timeKeepingRecord?.unexcusedAbsences),
          lateGreaterThanTenMinutes: toNumber(data.timeKeepingRecord?.lateGreaterThanTenMinutes),
          lateGreaterThanOneHour: toNumber(data.timeKeepingRecord?.lateGreaterThanOneHour),
          failureToPunch: toNumber(data.timeKeepingRecord?.failureToPunch),
          underTime: toNumber(data.timeKeepingRecord?.underTime)
        },
        remarksAndRecommendationByImmediateSupervisor: data.remarksAndRecommendationByImmediateSupervisor || "",
        remarksCommentsByTheNAS: data.remarksCommentsByTheNAS || "",
        semester: data.semester || "",
        schoolYear: data.schoolYear || ""
      });
      
      console.log('Form data set successfully');
    } catch (error: any) {
      console.error("Error fetching evaluation:", error);
      console.error("Error details:", error.response?.data);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load evaluation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallRating = (): number => {
    const ratings = [
      formData.attendanceAndPunctuality.regularAttendance,
      formData.attendanceAndPunctuality.promptnessInReportingForDuty,
      formData.qualityOfWorkOutput.accuracyAndThoroughnessOfWork,
      formData.qualityOfWorkOutput.organizationAndOrPresentationNeatnessOfWork,
      formData.qualityOfWorkOutput.effectiveness,
      formData.quantityOfWorkOutput.accomplishesMoreWorkOnTheGivenTime,
      formData.quantityOfWorkOutput.timelinessInAccomplishingTaskDuties,
      formData.attitudeAndWorkBehavior.senseOfResponsibilityAndUrgency,
      formData.attitudeAndWorkBehavior.dependabilityAndReliability,
      formData.attitudeAndWorkBehavior.industryAndResourcefulness,
      formData.attitudeAndWorkBehavior.alertnessAndInitiative,
      formData.attitudeAndWorkBehavior.sociabilityAndPleasantDisposition
    ];
    const sum = ratings.reduce((a, b) => a + b, 0);
    return parseFloat((sum / ratings.length).toFixed(2));
  };

  const handleSubmit = async () => {
    if (!formData.semester || !formData.schoolYear) {
      toast({
        title: "Error",
        description: "Please fill in semester and school year",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const overallRating = calculateOverallRating();
      
      // Automatically determine evaluation status based on rating
      // 3.0 and above = passed, below 3.0 = failed
      const evaluationStatus = overallRating >= 3.0 ? 'passed' : 'failed';
      
      const payload = {
        ...formData,
        overallRating,
        evaluationStatus
      };

      await axios.put(
        `${API_URL}/admin/evaluation/${userId}/user`,
        payload,
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Evaluation updated successfully"
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating evaluation:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update evaluation",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Evaluation - {userName}</DialogTitle>
          <DialogDescription>
            Update the evaluation form with star ratings
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#800000]" />
            <span className="ml-3 text-gray-600">Loading evaluation...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="quantity">Quantity</TabsTrigger>
                <TabsTrigger value="attitude">Attitude</TabsTrigger>
                <TabsTrigger value="timekeeping">Timekeeping</TabsTrigger>
              </TabsList>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-[#800000]">Attendance and Punctuality</h3>
                  <StarRating
                    label="Regular Attendance"
                    value={formData.attendanceAndPunctuality.regularAttendance}
                    onChange={(value) => setFormData({
                      ...formData,
                      attendanceAndPunctuality: {
                        ...formData.attendanceAndPunctuality,
                        regularAttendance: value
                      }
                    })}
                  />
                  <StarRating
                    label="Promptness in Reporting for Duty"
                    value={formData.attendanceAndPunctuality.promptnessInReportingForDuty}
                    onChange={(value) => setFormData({
                      ...formData,
                      attendanceAndPunctuality: {
                        ...formData.attendanceAndPunctuality,
                        promptnessInReportingForDuty: value
                      }
                    })}
                  />
                </div>
              </TabsContent>

              {/* Quality Tab */}
              <TabsContent value="quality" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-[#800000]">Quality of Work Output</h3>
                  <StarRating
                    label="Accuracy and Thoroughness of Work"
                    value={formData.qualityOfWorkOutput.accuracyAndThoroughnessOfWork}
                    onChange={(value) => setFormData({
                      ...formData,
                      qualityOfWorkOutput: {
                        ...formData.qualityOfWorkOutput,
                        accuracyAndThoroughnessOfWork: value
                      }
                    })}
                  />
                  <StarRating
                    label="Organization and/or Presentation Neatness of Work"
                    value={formData.qualityOfWorkOutput.organizationAndOrPresentationNeatnessOfWork}
                    onChange={(value) => setFormData({
                      ...formData,
                      qualityOfWorkOutput: {
                        ...formData.qualityOfWorkOutput,
                        organizationAndOrPresentationNeatnessOfWork: value
                      }
                    })}
                  />
                  <StarRating
                    label="Effectiveness"
                    value={formData.qualityOfWorkOutput.effectiveness}
                    onChange={(value) => setFormData({
                      ...formData,
                      qualityOfWorkOutput: {
                        ...formData.qualityOfWorkOutput,
                        effectiveness: value
                      }
                    })}
                  />
                </div>
              </TabsContent>

              {/* Quantity Tab */}
              <TabsContent value="quantity" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-[#800000]">Quantity of Work Output</h3>
                  <StarRating
                    label="Accomplishes More Work on the Given Time"
                    value={formData.quantityOfWorkOutput.accomplishesMoreWorkOnTheGivenTime}
                    onChange={(value) => setFormData({
                      ...formData,
                      quantityOfWorkOutput: {
                        ...formData.quantityOfWorkOutput,
                        accomplishesMoreWorkOnTheGivenTime: value
                      }
                    })}
                  />
                  <StarRating
                    label="Timeliness in Accomplishing Task/Duties"
                    value={formData.quantityOfWorkOutput.timelinessInAccomplishingTaskDuties}
                    onChange={(value) => setFormData({
                      ...formData,
                      quantityOfWorkOutput: {
                        ...formData.quantityOfWorkOutput,
                        timelinessInAccomplishingTaskDuties: value
                      }
                    })}
                  />
                </div>
              </TabsContent>

              {/* Attitude Tab */}
              <TabsContent value="attitude" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-[#800000]">Attitude and Work Behavior</h3>
                  <StarRating
                    label="Sense of Responsibility and Urgency"
                    value={formData.attitudeAndWorkBehavior.senseOfResponsibilityAndUrgency}
                    onChange={(value) => setFormData({
                      ...formData,
                      attitudeAndWorkBehavior: {
                        ...formData.attitudeAndWorkBehavior,
                        senseOfResponsibilityAndUrgency: value
                      }
                    })}
                  />
                  <StarRating
                    label="Dependability and Reliability"
                    value={formData.attitudeAndWorkBehavior.dependabilityAndReliability}
                    onChange={(value) => setFormData({
                      ...formData,
                      attitudeAndWorkBehavior: {
                        ...formData.attitudeAndWorkBehavior,
                        dependabilityAndReliability: value
                      }
                    })}
                  />
                  <StarRating
                    label="Industry and Resourcefulness"
                    value={formData.attitudeAndWorkBehavior.industryAndResourcefulness}
                    onChange={(value) => setFormData({
                      ...formData,
                      attitudeAndWorkBehavior: {
                        ...formData.attitudeAndWorkBehavior,
                        industryAndResourcefulness: value
                      }
                    })}
                  />
                  <StarRating
                    label="Alertness and Initiative"
                    value={formData.attitudeAndWorkBehavior.alertnessAndInitiative}
                    onChange={(value) => setFormData({
                      ...formData,
                      attitudeAndWorkBehavior: {
                        ...formData.attitudeAndWorkBehavior,
                        alertnessAndInitiative: value
                      }
                    })}
                  />
                  <StarRating
                    label="Sociability and Pleasant Disposition"
                    value={formData.attitudeAndWorkBehavior.sociabilityAndPleasantDisposition}
                    onChange={(value) => setFormData({
                      ...formData,
                      attitudeAndWorkBehavior: {
                        ...formData.attitudeAndWorkBehavior,
                        sociabilityAndPleasantDisposition: value
                      }
                    })}
                  />
                </div>
              </TabsContent>

              {/* Timekeeping Tab */}
              <TabsContent value="timekeeping" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-[#800000]">Time Keeping Record</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      label="Excused Absences"
                      value={formData.timeKeepingRecord.excusedAbsences}
                      onChange={(value) => setFormData({
                        ...formData,
                        timeKeepingRecord: {
                          ...formData.timeKeepingRecord,
                          excusedAbsences: value
                        }
                      })}
                    />
                    <NumberInput
                      label="Unexcused Absences"
                      value={formData.timeKeepingRecord.unexcusedAbsences}
                      onChange={(value) => setFormData({
                        ...formData,
                        timeKeepingRecord: {
                          ...formData.timeKeepingRecord,
                          unexcusedAbsences: value
                        }
                      })}
                    />
                    <NumberInput
                      label="Late (>10 minutes)"
                      value={formData.timeKeepingRecord.lateGreaterThanTenMinutes}
                      onChange={(value) => setFormData({
                        ...formData,
                        timeKeepingRecord: {
                          ...formData.timeKeepingRecord,
                          lateGreaterThanTenMinutes: value
                        }
                      })}
                    />
                    <NumberInput
                      label="Late (>1 hour)"
                      value={formData.timeKeepingRecord.lateGreaterThanOneHour}
                      onChange={(value) => setFormData({
                        ...formData,
                        timeKeepingRecord: {
                          ...formData.timeKeepingRecord,
                          lateGreaterThanOneHour: value
                        }
                      })}
                    />
                    <NumberInput
                      label="Failure to Punch"
                      value={formData.timeKeepingRecord.failureToPunch}
                      onChange={(value) => setFormData({
                        ...formData,
                        timeKeepingRecord: {
                          ...formData.timeKeepingRecord,
                          failureToPunch: value
                        }
                      })}
                    />
                    <NumberInput
                      label="Under Time"
                      value={formData.timeKeepingRecord.underTime}
                      onChange={(value) => setFormData({
                        ...formData,
                        timeKeepingRecord: {
                          ...formData.timeKeepingRecord,
                          underTime: value
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Remarks by Immediate Supervisor</Label>
                      <Textarea
                        value={formData.remarksAndRecommendationByImmediateSupervisor}
                        onChange={(e) => setFormData({
                          ...formData,
                          remarksAndRecommendationByImmediateSupervisor: e.target.value
                        })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Remarks/Comments by the NAS</Label>
                      <Textarea
                        value={formData.remarksCommentsByTheNAS}
                        onChange={(e) => setFormData({
                          ...formData,
                          remarksCommentsByTheNAS: e.target.value
                        })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Semester</Label>
                        <Select
                          value={formData.semester}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            semester: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="First Semester">First Semester</SelectItem>
                            <SelectItem value="Second Semester">Second Semester</SelectItem>
                            <SelectItem value="Third Semester">Third Semester</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>School Year (e.g., 2425)</Label>
                        <Input
                          type="text"
                          maxLength={4}
                          value={formData.schoolYear}
                          onChange={(e) => setFormData({
                            ...formData,
                            schoolYear: e.target.value
                          })}
                          placeholder="2425"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Overall Rating Display */}
            <div className="mt-6 p-4 bg-[#800000]/10 rounded-lg border border-[#800000]/20">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-[#800000]">Overall Rating:</span>
                <span className="text-2xl font-bold text-[#800000]">{calculateOverallRating().toFixed(2)} / 5.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-lg font-semibold ${calculateOverallRating() >= 3.0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateOverallRating() >= 3.0 ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                * Rating of 3.0 and above is considered PASSED
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="bg-[#800000] hover:bg-[#600000]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Evaluation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

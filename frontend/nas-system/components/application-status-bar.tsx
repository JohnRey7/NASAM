import React from "react";

const STAGES = [
  { key: "Submitted", label: "Submitted" },
  { key: "OAS Approved", label: "OAS Review" },
  { key: "Personality Testing", label: "Personality Test" },
  { key: "Department Head Interview", label: "Interview" },
  { key: "Final Approval", label: "Approval" },
];

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-400",
  Submitted: "bg-blue-500",
  "OAS Approved": "bg-yellow-400",
  "Personality Testing": "bg-gray-500",
  "Department Head Interview": "bg-gray-500",
  "Final Approval": "bg-green-500",
};

function getStageColor(currentStatus: string, stageKey: string) {
  const order = STAGES.map((s) => s.key);
  const currentIdx = order.indexOf(currentStatus);
  const stageIdx = order.indexOf(stageKey);

  if (currentStatus === "Draft") return "bg-gray-400";
  if (stageIdx < currentIdx) return "bg-blue-500";
  if (stageIdx === currentIdx) return STATUS_COLORS[currentStatus] || "bg-gray-400";
  return "bg-gray-200";
}

export default function ApplicationStatusBar({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2 my-4">
      {STAGES.map((stage, idx) => (
        <div key={stage.key} className="flex flex-col items-center flex-1">
          <div className={`h-3 w-full rounded ${getStageColor(status, stage.key)}`}></div>
          <span className="text-xs mt-1 text-center">{stage.label}</span>
        </div>
      ))}
    </div>
  );
}
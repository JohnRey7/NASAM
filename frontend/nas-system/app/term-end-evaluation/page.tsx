import { TermEndEvaluation } from "@/components/term-end-evaluation"
import { DashboardLayout } from "@/components/sidebar"

export default function TermEndEvaluationPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Term-End Evaluation</h1>
          <p className="text-muted-foreground">
            Complete your term-end evaluation to fulfill your scholarship requirements
          </p>
        </div>
        <div className="grid gap-6">
          <TermEndEvaluation />
        </div>
      </div>
    </DashboardLayout>
  )
}

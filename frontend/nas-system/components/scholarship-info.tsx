import { CheckCircle } from "lucide-react"

export function ScholarshipInfo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#800000]">Non-Academic Scholarship Program</h2>
        <p className="mt-2 text-gray-600">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Key Benefits</h3>
        <ul className="space-y-2">
          {[
            "STILLL IN BETAAA"
          ].map((benefit, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-[#800000] mr-2 shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-[#800000]/10 p-4 rounded-lg border border-[#800000]/20">
        <h3 className="font-semibold text-[#800000]">Application Period</h3>
        <p className="mt-1">Applications for the NA.</p>
      </div>
    </div>
  )
}

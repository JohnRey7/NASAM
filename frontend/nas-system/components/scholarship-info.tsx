import { CheckCircle } from "lucide-react"

export function ScholarshipInfo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#800000]">Non-Academic Scholarship Program</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          The CIT-U Non-Academic Scholarship Program is designed to support students who demonstrate 
          exceptional talent and dedication in non-academic fields such as sports, arts, culture, and 
          community service. This scholarship aims to recognize and nurture well-rounded individuals 
          who contribute to the university's vibrant campus life while maintaining satisfactory academic standing.
        </p>
        <p className="mt-3 text-gray-700 leading-relaxed">
          Eligible students can receive financial assistance to help cover tuition fees and other educational 
          expenses, allowing them to focus on both their academic pursuits and their passion for excellence 
          in their chosen non-academic field.
        </p>
      </div>

      <div className="bg-[#800000]/10 p-4 rounded-lg border border-[#800000]/20">
        <h3 className="font-semibold text-[#800000]">Application Period</h3>
        <p className="mt-1 text-gray-700">Applications for the NA.</p>
      </div>
    </div>
  )
}

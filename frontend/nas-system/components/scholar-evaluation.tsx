"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Search, User, XCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Scholar {
  id: string
  name: string
  course: string
  year: string
  scholarId: string
  department: string
  status: "active" | "probation" | "terminated"
  gpa: number
  absences: number
  conductViolations: number
  lastEvaluation: string
}

// Sample scholars data
const scholars: Scholar[] = [
  {
    id: "1",
    name: "Juan Dela Cruz",
    course: "BS Information Technology",
    year: "2nd Year",
    scholarId: "NAS-2023-0001",
    department: "Computer Science",
    status: "active",
    gpa: 3.8,
    absences: 2,
    conductViolations: 0,
    lastEvaluation: "2023-03-15",
  },
  {
    id: "2",
    name: "Maria Santos",
    course: "BS Computer Science",
    year: "3rd Year",
    scholarId: "NAS-2023-0002",
    department: "Computer Science",
    status: "active",
    gpa: 3.5,
    absences: 5,
    conductViolations: 0,
    lastEvaluation: "2023-03-15",
  },
  {
    id: "3",
    name: "Pedro Reyes",
    course: "BS Civil Engineering",
    year: "2nd Year",
    scholarId: "NAS-2023-0003",
    department: "Engineering",
    status: "probation",
    gpa: 2.7,
    absences: 8,
    conductViolations: 1,
    lastEvaluation: "2023-03-10",
  },
  {
    id: "4",
    name: "Ana Gonzales",
    course: "BS Architecture",
    year: "4th Year",
    scholarId: "NAS-2023-0004",
    department: "Architecture",
    status: "active",
    gpa: 3.9,
    absences: 0,
    conductViolations: 0,
    lastEvaluation: "2023-03-12",
  },
  {
    id: "5",
    name: "Carlos Tan",
    course: "BS Mechanical Engineering",
    year: "3rd Year",
    scholarId: "NAS-2023-0005",
    department: "Engineering",
    status: "terminated",
    gpa: 2.1,
    absences: 12,
    conductViolations: 2,
    lastEvaluation: "2023-03-05",
  },
]

export function ScholarEvaluation() {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null)
  const [evaluationTab, setEvaluationTab] = useState("academic")
  const [academicRating, setAcademicRating] = useState("")
  const [conductRating, setConductRating] = useState("")
  const [evaluationComments, setEvaluationComments] = useState("")
  const { toast } = useToast()

  const handleSelectScholar = (scholar: Scholar) => {
    setSelectedScholar(scholar)
    setEvaluationTab("academic")
    setAcademicRating("")
    setConductRating("")
    setEvaluationComments("")
  }

  const handleSubmitEvaluation = () => {
    if (!selectedScholar || !academicRating || !conductRating || !evaluationComments) return

    toast({
      title: "Evaluation Submitted",
      description: `Your evaluation for ${selectedScholar.name} has been submitted successfully.`,
    })

    // In a real app, this would update the database
  }

  const getStatusBadge = (status: Scholar["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        )
      case "probation":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Probation
          </Badge>
        )
      case "terminated":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Terminated
          </Badge>
        )
    }
  }

  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-green-600"
    if (gpa >= 3.0) return "text-blue-600"
    if (gpa >= 2.5) return "text-yellow-600"
    return "text-red-600"
  }

  const filteredScholars = scholars.filter((scholar) => {
    const matchesSearch =
      scholar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholar.scholarId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || scholar.department === departmentFilter
    const matchesStatus = statusFilter === "all" || scholar.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Scholar List */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
            <CardTitle className="text-[#800000]">NAS Scholars</CardTitle>
            <CardDescription>Term-end evaluation of non-academic scholars</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name or ID"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="department-filter" className="text-xs">
                    Department
                  </Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger id="department-filter" className="h-8 text-xs">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Architecture">Architecture</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter" className="text-xs">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="h-8 text-xs">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500">
              {filteredScholars.length} {filteredScholars.length === 1 ? "scholar" : "scholars"} found
            </p>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <ul className="divide-y">
              {filteredScholars.map((scholar) => (
                <li
                  key={scholar.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedScholar?.id === scholar.id ? "bg-gray-50" : ""
                  }`}
                  onClick={() => handleSelectScholar(scholar)}
                >
                  <div className="flex items-start">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt={scholar.name} />
                      <AvatarFallback>
                        {scholar.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{scholar.name}</p>
                      <p className="text-xs text-gray-500 truncate">{scholar.course}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(scholar.status)}
                        <span className={`text-xs font-medium ${getGpaColor(scholar.gpa)}`}>GPA: {scholar.gpa}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {filteredScholars.length === 0 && (
                <li className="p-8 text-center text-gray-500">
                  <User className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  No scholars found matching your filters
                </li>
              )}
            </ul>
          </div>
        </Card>
      </div>

      {/* Scholar Details and Evaluation */}
      <div className="md:col-span-2">
        {selectedScholar ? (
          <Card>
            <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-[#800000]">{selectedScholar.name}</CardTitle>
                  <CardDescription>
                    {selectedScholar.course} - {selectedScholar.year}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end">
                  {getStatusBadge(selectedScholar.status)}
                  <span className="text-xs text-gray-500 mt-1">ID: {selectedScholar.scholarId}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={evaluationTab} onValueChange={setEvaluationTab}>
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="academic">Academic</TabsTrigger>
                  <TabsTrigger value="conduct">Conduct</TabsTrigger>
                  <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                </TabsList>

                <TabsContent value="academic" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">GPA History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-40 relative">
                          {/* Line chart would go here - using placeholder */}
                          <svg viewBox="0 0 300 100" className="w-full h-full">
                            <polyline
                              points="0,50 60,40 120,30 180,35 240,20 300,25"
                              fill="none"
                              stroke="#800000"
                              strokeWidth="3"
                            />
                          </svg>

                          <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-500">
                            <span>1st Sem</span>
                            <span>2nd Sem</span>
                            <span>Summer</span>
                            <span>1st Sem</span>
                            <span>2nd Sem</span>
                            <span>Current</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Academic Standing</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Current GPA</span>
                              <span className={`text-sm font-medium ${getGpaColor(selectedScholar.gpa)}`}>
                                {selectedScholar.gpa}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${
                                  selectedScholar.gpa >= 3.5
                                    ? "bg-green-600"
                                    : selectedScholar.gpa >= 3.0
                                      ? "bg-blue-600"
                                      : selectedScholar.gpa >= 2.5
                                        ? "bg-yellow-600"
                                        : "bg-red-600"
                                }`}
                                style={{ width: `${(selectedScholar.gpa / 4) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 border rounded-lg">
                              <p className="text-xs text-gray-500">Required GPA</p>
                              <p className="text-lg font-medium">3.0</p>
                            </div>
                            <div className="p-3 border rounded-lg">
                              <p className="text-xs text-gray-500">GPA Trend</p>
                              <p className="text-lg font-medium flex items-center">
                                {selectedScholar.gpa >= 3.0 ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                {selectedScholar.gpa >= 3.0 ? "Satisfactory" : "Below Requirement"}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 border rounded-lg">
                            <p className="text-xs text-gray-500">Academic Warning Status</p>
                            <p className="text-lg font-medium">
                              {selectedScholar.gpa < 2.5 ? (
                                <span className="text-red-500">Academic Warning</span>
                              ) : selectedScholar.gpa < 3.0 ? (
                                <span className="text-yellow-500">Academic Concern</span>
                              ) : (
                                <span className="text-green-500">Good Standing</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Course Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Course
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Grade
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Units
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              <tr>
                                <td className="px-4 py-2 text-sm">Programming 2</td>
                                <td className="px-4 py-2 text-sm font-medium text-green-600">3.5</td>
                                <td className="px-4 py-2 text-sm">3</td>
                                <td className="px-4 py-2 text-sm">
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                    Passed
                                  </Badge>
                                </td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 text-sm">Data Structures</td>
                                <td className="px-4 py-2 text-sm font-medium text-green-600">4.0</td>
                                <td className="px-4 py-2 text-sm">3</td>
                                <td className="px-4 py-2 text-sm">
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                    Passed
                                  </Badge>
                                </td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 text-sm">Calculus 2</td>
                                <td className="px-4 py-2 text-sm font-medium text-yellow-600">2.5</td>
                                <td className="px-4 py-2 text-sm">3</td>
                                <td className="px-4 py-2 text-sm">
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                    Passed (Low)
                                  </Badge>
                                </td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 text-sm">Physics 1</td>
                                <td className="px-4 py-2 text-sm font-medium text-blue-600">3.0</td>
                                <td className="px-4 py-2 text-sm">4</td>
                                <td className="px-4 py-2 text-sm">
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                    Passed
                                  </Badge>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="conduct" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Attendance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold">{selectedScholar.absences}</p>
                              <p className="text-sm text-gray-500">Total Absences</p>
                            </div>
                            <div
                              className={`h-16 w-16 rounded-full flex items-center justify-center ${
                                selectedScholar.absences <= 3
                                  ? "bg-green-100"
                                  : selectedScholar.absences <= 6
                                    ? "bg-yellow-100"
                                    : "bg-red-100"
                              }`}
                            >
                              {selectedScholar.absences <= 3 ? (
                                <CheckCircle className="h-8 w-8 text-green-600" />
                              ) : selectedScholar.absences <= 6 ? (
                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                              ) : (
                                <XCircle className="h-8 w-8 text-red-600" />
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Absence Threshold</span>
                              <span className="text-sm text-gray-500">{selectedScholar.absences}/8 Maximum</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${
                                  selectedScholar.absences <= 3
                                    ? "bg-green-600"
                                    : selectedScholar.absences <= 6
                                      ? "bg-yellow-600"
                                      : "bg-red-600"
                                }`}
                                style={{ width: `${(selectedScholar.absences / 8) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="p-3 border rounded-lg">
                            <p className="text-xs text-gray-500">Attendance Status</p>
                            <p className="text-lg font-medium">
                              {selectedScholar.absences <= 3 ? (
                                <span className="text-green-500">Excellent</span>
                              ) : selectedScholar.absences <= 6 ? (
                                <span className="text-yellow-500">Satisfactory</span>
                              ) : (
                                <span className="text-red-500">Needs Improvement</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Conduct Record</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold">{selectedScholar.conductViolations}</p>
                              <p className="text-sm text-gray-500">Conduct Violations</p>
                            </div>
                            <div
                              className={`h-16 w-16 rounded-full flex items-center justify-center ${
                                selectedScholar.conductViolations === 0
                                  ? "bg-green-100"
                                  : selectedScholar.conductViolations === 1
                                    ? "bg-yellow-100"
                                    : "bg-red-100"
                              }`}
                            >
                              {selectedScholar.conductViolations === 0 ? (
                                <CheckCircle className="h-8 w-8 text-green-600" />
                              ) : selectedScholar.conductViolations === 1 ? (
                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                              ) : (
                                <XCircle className="h-8 w-8 text-red-600" />
                              )}
                            </div>
                          </div>

                          <div className="p-3 border rounded-lg">
                            <p className="text-xs text-gray-500">Conduct Status</p>
                            <p className="text-lg font-medium">
                              {selectedScholar.conductViolations === 0 ? (
                                <span className="text-green-500">Excellent</span>
                              ) : selectedScholar.conductViolations === 1 ? (
                                <span className="text-yellow-500">Warning Issued</span>
                              ) : (
                                <span className="text-red-500">Probation</span>
                              )}
                            </p>
                          </div>

                          {selectedScholar.conductViolations > 0 && (
                            <div className="p-3 border rounded-lg bg-red-50">
                              <p className="text-xs font-medium text-red-800">Violation Record</p>
                              <ul className="mt-2 space-y-2 text-sm">
                                {selectedScholar.conductViolations >= 1 && (
                                  <li className="flex items-start">
                                    <span className="h-5 w-5 rounded-full bg-red-200 flex items-center justify-center mr-2 shrink-0">
                                      <span className="text-xs text-red-800">1</span>
                                    </span>
                                    <div>
                                      <p className="font-medium">Minor Violation - Late Submission</p>
                                      <p className="text-xs text-gray-600">2023-02-15</p>
                                    </div>
                                  </li>
                                )}
                                {selectedScholar.conductViolations >= 2 && (
                                  <li className="flex items-start">
                                    <span className="h-5 w-5 rounded-full bg-red-200 flex items-center justify-center mr-2 shrink-0">
                                      <span className="text-xs text-red-800">2</span>
                                    </span>
                                    <div>
                                      <p className="font-medium">Major Violation - Academic Dishonesty</p>
                                      <p className="text-xs text-gray-600">2023-03-10</p>
                                    </div>
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Participation & Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 border rounded-lg">
                            <p className="text-xs text-gray-500">Community Service</p>
                            <p className="text-lg font-medium">12 Hours</p>
                            <Badge variant="outline" className="mt-1 bg-green-100 text-green-800 border-green-200">
                              Completed
                            </Badge>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <p className="text-xs text-gray-500">School Events</p>
                            <p className="text-lg font-medium">3 Events</p>
                            <Badge variant="outline" className="mt-1 bg-green-100 text-green-800 border-green-200">
                              Participated
                            </Badge>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <p className="text-xs text-gray-500">Department Activities</p>
                            <p className="text-lg font-medium">2 Activities</p>
                            <Badge variant="outline" className="mt-1 bg-green-100 text-green-800 border-green-200">
                              Contributed
                            </Badge>
                          </div>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <p className="text-xs text-gray-500">Faculty Feedback</p>
                          <div className="mt-2 space-y-2">
                            <div className="p-2 bg-gray-50 rounded-md">
                              <p className="text-sm italic">
                                "Juan is a dedicated student who actively participates in class discussions and shows
                                initiative in group projects."
                              </p>
                              <p className="text-xs text-gray-500 mt-1">- Prof. Garcia, Programming Instructor</p>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-md">
                              <p className="text-sm italic">
                                "Consistently submits assignments on time and demonstrates a strong work ethic."
                              </p>
                              <p className="text-xs text-gray-500 mt-1">- Prof. Santos, Data Structures</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="evaluation" className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="font-medium mb-2">Term-End Evaluation</h3>
                    <p className="text-sm text-gray-600">
                      Please complete the evaluation form below to assess the scholar's performance for this term. Your
                      evaluation will be used to determine the scholar's status for the next term.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="academic-rating">Academic Performance Rating</Label>
                      <RadioGroup value={academicRating} onValueChange={setAcademicRating} className="space-y-3">
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                          <RadioGroupItem value="excellent" id="academic-excellent" />
                          <Label htmlFor="academic-excellent" className="flex-1 cursor-pointer">
                            <span className="font-medium">Excellent</span> - Consistently exceeds academic requirements
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                          <RadioGroupItem value="good" id="academic-good" />
                          <Label htmlFor="academic-good" className="flex-1 cursor-pointer">
                            <span className="font-medium">Good</span> - Meets all academic requirements
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                          <RadioGroupItem value="satisfactory" id="academic-satisfactory" />
                          <Label htmlFor="academic-satisfactory" className="flex-1 cursor-pointer">
                            <span className="font-medium">Satisfactory</span> - Meets minimum academic requirements
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                          <RadioGroupItem value="needs-improvement" id="academic-needs-improvement" />
                          <Label htmlFor="academic-needs-improvement" className="flex-1 cursor-pointer">
                            <span className="font-medium">Needs Improvement</span> - Below academic requirements
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                          <RadioGroupItem value="unsatisfactory" id="academic-unsatisfactory" />
                          <Label htmlFor="academic-unsatisfactory" className="flex-1 cursor-pointer">
                            <span className="font-medium">Unsatisfactory</span> - Significantly below requirements
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="conduct-rating">Conduct and Behavior Rating</Label>
                      <RadioGroup value={conductRating} onValueChange={setConductRating} className="space-y-3">
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                          <RadioGroupItem value="excellent" id="conduct-excellent" />
                          <Label htmlFor="conduct-excellent" className="flex-1 cursor-pointer">
                            <span className="font-medium">Excellent</span> - Exemplary behavior and participation
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                          <RadioGroupItem value="good" id="conduct-good" />
                          <Label htmlFor="conduct-good" className="flex-1 cursor-pointer">
                            <span className="font-medium">Good</span> - Consistently good behavior
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                          <RadioGroupItem value="satisfactory" id="conduct-satisfactory" />
                          <Label htmlFor="conduct-satisfactory" className="flex-1 cursor-pointer">
                            <span className="font-medium">Satisfactory</span> - Acceptable behavior
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                          <RadioGroupItem value="needs-improvement" id="conduct-needs-improvement" />
                          <Label htmlFor="conduct-needs-improvement" className="flex-1 cursor-pointer">
                            <span className="font-medium">Needs Improvement</span> - Minor behavioral issues
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                          <RadioGroupItem value="unsatisfactory" id="conduct-unsatisfactory" />
                          <Label htmlFor="conduct-unsatisfactory" className="flex-1 cursor-pointer">
                            <span className="font-medium">Unsatisfactory</span> - Significant behavioral issues
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="evaluation-comments">Comments and Recommendations</Label>
                      <Textarea
                        id="evaluation-comments"
                        value={evaluationComments}
                        onChange={(e) => setEvaluationComments(e.target.value)}
                        placeholder="Provide detailed comments and recommendations for the scholar"
                        rows={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Recommended Status for Next Term</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="border p-3 rounded-md hover:bg-green-50 cursor-pointer">
                          <div className="flex items-center justify-center mb-2">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                          <p className="text-center font-medium">Continue Scholarship</p>
                        </div>
                        <div className="border p-3 rounded-md hover:bg-yellow-50 cursor-pointer">
                          <div className="flex items-center justify-center mb-2">
                            <AlertCircle className="h-8 w-8 text-yellow-500" />
                          </div>
                          <p className="text-center font-medium">Probation</p>
                        </div>
                        <div className="border p-3 rounded-md hover:bg-red-50 cursor-pointer">
                          <div className="flex items-center justify-center mb-2">
                            <XCircle className="h-8 w-8 text-red-500" />
                          </div>
                          <p className="text-center font-medium">Terminate Scholarship</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitEvaluation}
                    className="w-full bg-[#800000] hover:bg-[#600000]"
                    disabled={!academicRating || !conductRating || !evaluationComments}
                  >
                    Submit Evaluation
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Scholar Selected</h3>
              <p className="text-gray-500 text-center max-w-md">
                Please select a scholar from the list to view their details and complete the term-end evaluation.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

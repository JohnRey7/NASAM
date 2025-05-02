"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Download, FileText, Users, TrendingUp, Award } from "lucide-react"

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("current")

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#800000]">Analytics Dashboard</h2>
          <p className="text-gray-600">View scholarship application statistics and trends</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Semester</SelectItem>
              <SelectItem value="previous">Previous Semester</SelectItem>
              <SelectItem value="year">Academic Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-3xl font-bold">247</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500 font-medium">12% increase</span>
              <span className="text-xs text-gray-500 ml-1">from last semester</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved Scholars</p>
                <p className="text-3xl font-bold">86</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500 font-medium">5% increase</span>
              <span className="text-xs text-gray-500 ml-1">from last semester</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Interviews</p>
                <p className="text-3xl font-bold">32</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-xs text-gray-500">Updated 2 hours ago</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Panelists</p>
                <p className="text-3xl font-bold">15</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-xs text-gray-500">From 3 departments</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="performance">Scholar Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Application Status Distribution</CardTitle>
                <CardDescription>Breakdown of current application statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-full max-w-md">
                    {/* Pie chart would go here - using placeholder */}
                    <div className="relative h-64 w-64 mx-auto">
                      <div
                        className="absolute inset-0 rounded-full border-8 border-blue-500"
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                      ></div>
                      <div
                        className="absolute inset-0 rounded-full border-8 border-green-500"
                        style={{ clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)" }}
                      ></div>
                      <div
                        className="absolute inset-0 rounded-full border-8 border-yellow-500"
                        style={{ clipPath: "polygon(50% 50%, 50% 100%, 0 100%, 0 50%)" }}
                      ></div>
                      <div
                        className="absolute inset-0 rounded-full border-8 border-red-500"
                        style={{ clipPath: "polygon(50% 50%, 0 50%, 0 0, 50% 0)" }}
                      ></div>
                      <div
                        className="absolute inset-0 rounded-full border-8 border-purple-500"
                        style={{ clipPath: "polygon(50% 50%, 50% 0, 100% 0, 100% 50%)" }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-xs">Pending (35%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs">Approved (25%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-xs">Under Review (20%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-xs">Rejected (10%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-xs">Incomplete (10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Monthly Applications</CardTitle>
                <CardDescription>Number of applications received per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {/* Bar chart would go here - using placeholder */}
                  <div className="w-full h-64 flex items-end justify-between gap-2 px-4">
                    {[35, 42, 58, 75, 62, 48].map((value, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className="w-12 bg-[#800000] rounded-t-sm" style={{ height: `${value * 0.8}px` }}></div>
                        <span className="text-xs mt-1">{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Applications by Department</CardTitle>
                <CardDescription>Distribution of applications across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {/* Horizontal bar chart would go here - using placeholder */}
                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Computer Science</span>
                        <span className="text-sm font-medium">78</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Engineering</span>
                        <span className="text-sm font-medium">65</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "70%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Business</span>
                        <span className="text-sm font-medium">42</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Architecture</span>
                        <span className="text-sm font-medium">36</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: "38%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tourism & Hospitality</span>
                        <span className="text-sm font-medium">26</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-red-600 h-2.5 rounded-full" style={{ width: "28%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Approval Rate by Department</CardTitle>
                <CardDescription>Percentage of approved applications by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {/* Donut chart would go here - using placeholder */}
                  <div className="w-full max-w-md">
                    <div className="relative h-64 w-64 mx-auto rounded-full border-8 border-gray-200">
                      <div
                        className="absolute inset-0 rounded-full border-8 border-blue-500"
                        style={{
                          clipPath:
                            "polygon(50% 50%, 50% 0, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0 50%, 15% 15%, 50% 0)",
                        }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-xs">Computer Science (42%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs">Engineering (38%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-xs">Business (35%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-xs">Architecture (32%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-xs">Tourism (30%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Scholar GPA Distribution</CardTitle>
                <CardDescription>Distribution of scholars by GPA range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {/* Bell curve chart would go here - using placeholder */}
                  <div className="w-full h-64 flex items-end justify-between gap-2 px-4">
                    {[10, 25, 45, 65, 85, 65, 45, 25, 10].map((value, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className="w-8 bg-[#800000] rounded-t-sm" style={{ height: `${value}px` }}></div>
                        <span className="text-xs mt-1">
                          {["1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0"][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Scholar Retention Rate</CardTitle>
                <CardDescription>Percentage of scholars maintaining eligibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {/* Line chart would go here - using placeholder */}
                  <div className="w-full h-64 relative">
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
                    <div className="absolute left-0 top-0 h-full w-px bg-gray-300"></div>

                    <svg viewBox="0 0 300 200" className="w-full h-full">
                      <polyline
                        points="0,150 50,140 100,120 150,100 200,90 250,85 300,80"
                        fill="none"
                        stroke="#800000"
                        strokeWidth="3"
                      />
                    </svg>

                    <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-500">
                      <span>2018</span>
                      <span>2019</span>
                      <span>2020</span>
                      <span>2021</span>
                      <span>2022</span>
                      <span>2023</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

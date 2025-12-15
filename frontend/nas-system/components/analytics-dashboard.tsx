"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, FileText, FileSpreadsheet } from "lucide-react"
import { oasAnalyticsService } from "@/services/oasAnalyticsService"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#EF4444', '#7C3AED', '#06B6D4', '#F97316']

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("current")
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await oasAnalyticsService.getAnalytics()
        const data = res?.data || res
        if (mounted) setAnalytics(data)
      } catch (err) {
        console.warn('Failed to load analytics', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [dateRange])

  const statusData = analytics?.statusCounts ? Object.entries(analytics.statusCounts).map(([k, v]) => ({ name: k, value: v })) : []
  const programData = analytics?.programs ? analytics.programs.map((p: any) => ({ name: p.program, value: p.count })) : []
  const gpaData = analytics?.gpaDistribution ? analytics.gpaDistribution.map((g: any) => ({ name: g.range, value: g.count })) : []

  const genderData = (() => {
    const buckets = analytics?.genderCounts || {}
    // classify counts into Male / Female / Unknown (case-insensitive)
    let male = 0
    let female = 0
    let unknown = 0
    Object.entries(buckets).forEach(([k, v]) => {
      const lk = String(k || '').toLowerCase()
      const n = Number(v) || 0
      if (lk === 'male') male += n
      else if (lk === 'female') female += n
      else unknown += n
    })
    return [
      { name: 'Male', value: male },
      { name: 'Female', value: female },
      { name: 'Unknown', value: unknown }
    ]
  })()

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true)
    try {
      await oasAnalyticsService.exportAnalytics(format)
      toast({
        title: "Export Successful",
        description: `Analytics report downloaded as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export analytics report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setExporting(false)
    }
  }

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" disabled={exporting}>
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export Report'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Applicants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">{analytics?.totalApplicants ?? (loading ? 'Loading...' : 0)}</p>
            <p className="text-sm text-gray-500">Total applications submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#800000]">{analytics?.averageGPA ? Number(analytics.averageGPA).toFixed(2) : (loading ? 'Loading...' : '-')}</p>
            <p className="text-sm text-gray-500">Based on {analytics?.gpaCount ?? 0} applicants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Income Brackets</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 200 }}>
              {analytics?.incomeCounts ? (
                <ResponsiveContainer>
                  <BarChart data={Object.entries(analytics.incomeCounts).map(([k, v]) => ({ 
                    name: k.replace('<', '< ').replace('>', '> '), 
                    count: v 
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-500">
                  {loading ? 'Loading...' : 'No data'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="performance">GPA</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="gender">Gender</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Application Status Distribution</CardTitle>
              <CardDescription>Breakdown of current application statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={100} fill="#8884d8" label>
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Applications by Program</CardTitle>
              <CardDescription>Top programs by application count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div style={{ width: '100%', height: 360 }}>
                  <ResponsiveContainer>
                    <BarChart data={programData.slice(0, 12)} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#800000" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 bg-white border rounded">
                  <h4 className="text-sm font-semibold mb-2">Top Programs</h4>
                  <ul className="space-y-2 text-sm text-gray-700 max-h-80 overflow-auto">
                    {programData.slice(0, 10).map((p: any, idx: number) => (
                      <li key={p.name} className="flex justify-between items-center">
                        <div className="truncate pr-2">{idx + 1}. {p.name}</div>
                        <div className="font-medium">{p.value}</div>
                      </li>
                    ))}
                    {programData.length === 0 && <li className="text-gray-500">No program data</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gender">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Applicants by Gender</CardTitle>
              <CardDescription>Distribution of applicants by reported gender</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={genderData} dataKey="value" nameKey="name" outerRadius={100} label>
                      {genderData.map((_, index) => (
                        <Cell key={`cell-gender-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">GPA Distribution</CardTitle>
              <CardDescription>Distribution of applicant average GPAs</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer>
                  <BarChart data={gpaData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#16A34A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Income Brackets</CardTitle>
              <CardDescription>Distribution of applicants by reported annual family income</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={analytics?.incomeCounts ? Object.entries(analytics.incomeCounts).map(([k, v]) => ({ name: k, value: v })) : []}
                        dataKey="value" nameKey="name" outerRadius={100} innerRadius={50} label>
                        {(analytics?.incomeCounts ? Object.keys(analytics.incomeCounts) : []).map((_, index) => (
                          <Cell key={`cell-income-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-2">
                  <h4 className="text-sm font-semibold mb-2">Income Summary</h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    {analytics?.incomeCounts ? Object.entries(analytics.incomeCounts).map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span className="capitalize">{k}</span><span className="font-medium">{String(v)}</span></div>
                    )) : <div className="text-gray-500">No data</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

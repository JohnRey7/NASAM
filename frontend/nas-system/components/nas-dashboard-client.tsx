"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, ClipboardCheck, Clock } from "lucide-react"
import { NASSupervisorInterviews } from "@/components/nas-supervisor-interviews"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

interface DashboardStats {
  scheduledInterviews: number
  completedInterviews: number
  pendingEvaluations: number
  totalEvaluations: number
}

export function NASDashboardClient() {
  const [stats, setStats] = useState<DashboardStats>({
    scheduledInterviews: 0,
    completedInterviews: 0,
    pendingEvaluations: 0,
    totalEvaluations: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

      const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      }

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      const token = getCookie('jwt')
      
      // Fetch interviews
      const interviewsResponse = await fetch(`${API_URL}/interviews/nas-supervisor`, {
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (interviewsResponse.ok) {
        const interviewsData = await interviewsResponse.json()
        const interviews = interviewsData.data || []
        
        const scheduledCount = interviews.filter((interview: any) => 
          interview.status === 'scheduled' || interview.status === 'in-progress'
        ).length
        
        const completedCount = interviews.filter((interview: any) => 
          interview.status === 'completed'
        ).length

        // Fetch evaluations
        const evaluationsResponse = await fetch(`${API_URL}/evaluations/nas-supervisor`, {
          credentials: 'include',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        })

        let totalEvaluations = 0
        if (evaluationsResponse.ok) {
          const evaluationsData = await evaluationsResponse.json()
          totalEvaluations = evaluationsData.data?.length || 0
        }

        const pendingEvaluations = completedCount - totalEvaluations

        setStats({
          scheduledInterviews: scheduledCount,
          completedInterviews: completedCount,
          pendingEvaluations: Math.max(0, pendingEvaluations),
          totalEvaluations
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

    return (
    <DashboardLayout allowedRoles={["nas_supervisor"]}>
    <div className="space-y-6">
                          <div>
          <h2 className="text-3xl font-bold text-[#800000]">NAS Supervisor Dashboard</h2>
          <p className="text-gray-600">Manage interviews and evaluations for scholarship applicants</p>
                            </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
        <CardContent>
              <div className="text-2xl font-bold text-[#800000]">
                {loading ? "..." : stats.scheduledInterviews}
            </div>
              <p className="text-xs text-muted-foreground">
                Upcoming interviews to conduct
              </p>
            </CardContent>
      </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Interviews</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? "..." : stats.completedInterviews}
    </div>
              <p className="text-xs text-muted-foreground">
                Interviews conducted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loading ? "..." : stats.pendingEvaluations}
              </div>
              <p className="text-xs text-muted-foreground">
                Evaluations to submit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? "..." : stats.totalEvaluations}
              </div>
              <p className="text-xs text-muted-foreground">
                Evaluations submitted
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="interviews" className="space-y-4">
          <TabsList>
            <TabsTrigger value="interviews">My Interviews</TabsTrigger>
            <TabsTrigger value="evaluations">My Evaluations</TabsTrigger>
          </TabsList>

          <TabsContent value="interviews" className="space-y-4">
            <NASSupervisorInterviews onStatsUpdate={fetchDashboardStats} />
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-4">
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Evaluations Coming Soon</h3>
              <p className="text-gray-600">The evaluation system will be available here.</p>
      </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
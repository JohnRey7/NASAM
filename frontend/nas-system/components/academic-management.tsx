"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DepartmentManagementInline from "./DepartmentManagementInline"
import CourseManagement from "./CourseManagement"

export function AcademicManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Academic Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="departments">
            <TabsList>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
            </TabsList>
            <TabsContent value="departments">
              <DepartmentManagementInline isExpanded={true} onToggle={() => {}} />
            </TabsContent>
            <TabsContent value="courses">
              <CourseManagement isExpanded={true} onToggle={() => {}} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalityTestTemplates } from "@/components/admin/PersonalityTestTemplates"
import { PersonalityTestAnswers } from "@/components/admin/PersonalityTestAnswers"

export function PersonalityTestManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personality Test Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="templates">
            <TabsList>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="answers">Answers</TabsTrigger>
            </TabsList>
            <TabsContent value="templates">
              <div className="py-4">
                <h3 className="text-lg font-medium mb-4">Test Templates</h3>
                <PersonalityTestTemplates />
              </div>
            </TabsContent>
            <TabsContent value="answers">
              <div className="py-4">
                <h3 className="text-lg font-medium mb-4">Student Answers</h3>
                <PersonalityTestAnswers />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

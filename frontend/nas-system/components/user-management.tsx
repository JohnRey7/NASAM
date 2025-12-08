"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserList } from "@/components/admin/UserList"
import { RoleList } from "@/components/admin/RoleList"

export function UserManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <div className="py-4">
                <h3 className="text-lg font-medium mb-4">Users</h3>
                <UserList />
              </div>
            </TabsContent>
            <TabsContent value="roles">
              <div className="py-4">
                <h3 className="text-lg font-medium mb-4">Roles</h3>
                <RoleList />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

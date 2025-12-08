"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2 } from "lucide-react"
import roleService, { Role, Permission } from "@/services/roleService"
import { ScrollArea } from "@/components/ui/scroll-area"

export function RoleList() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await roleService.getAllRoles()
      setRoles(response.roles || [])
    } catch (error: any) {
      console.error("Error fetching roles:", error)
      setError(error.message || "Failed to fetch roles")
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await roleService.getAllPermissions()
      setPermissions(response)
    } catch (error) {
      console.error("Error fetching permissions:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole._id, formData)
        toast({ title: "Success", description: "Role updated successfully" })
      } else {
        await roleService.createRole(formData)
        toast({ title: "Success", description: "Role created successfully" })
      }
      setIsDialogOpen(false)
      fetchRoles()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Operation failed",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: Array.isArray(role.permissions) 
        ? role.permissions.map((p: any) => typeof p === 'string' ? p : p._id)
        : [],
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return
    try {
      await roleService.deleteRole(id)
      toast({ title: "Success", description: "Role deleted successfully" })
      fetchRoles()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      })
    }
  }

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  const resetForm = () => {
    setEditingRole(null)
    setFormData({
      name: "",
      description: "",
      permissions: [],
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Error: {error}
        </div>
      )}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#800000] hover:bg-[#600000]">
              <Plus className="mr-2 h-4 w-4" /> Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {permissions.map((permission) => (
                      <div key={permission._id} className="flex items-start space-x-2">
                        <Checkbox
                          id={permission._id}
                          checked={formData.permissions.includes(permission._id)}
                          onCheckedChange={() => togglePermission(permission._id)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={permission._id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.name}
                          </label>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-[#800000] hover:bg-[#600000]">
                  {editingRole ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading roles...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role._id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description || "-"}</TableCell>
                  <TableCell>{role.permissions.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(role._id)}
                        disabled={role.name === 'admin'} // Prevent deleting admin role
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

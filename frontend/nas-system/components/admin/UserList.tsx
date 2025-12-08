"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Pencil, Trash2, Ban, CheckCircle } from "lucide-react"
import userService, { User, CreateUserData } from "@/services/userService"
import roleService, { Role } from "@/services/roleService"
import departmentService, { Department } from "@/services/departmentService"
import { Badge } from "@/components/ui/badge"

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<CreateUserData>({
    name: "",
    email: "",
    idNumber: "",
    password: "",
    roleId: "",
    departmentCode: "",
  })

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchDepartments()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await userService.getAllUsers({ search })
      console.log("Fetched users:", response)
      setUsers(response.users || [])
    } catch (error: any) {
      console.error("Error fetching users:", error)
      setError(error.message || "Failed to fetch users")
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await roleService.getAllRoles()
      setRoles(response.roles || [])
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments(1, 100)
      setDepartments(response.data || [])
    } catch (error) {
      console.error("Error fetching departments:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await userService.updateUser(editingUser._id, {
          name: formData.name,
          email: formData.email,
          roleId: formData.roleId,
          departmentCode: formData.departmentCode,
        })
        toast({ title: "Success", description: "User updated successfully" })
      } else {
        await userService.createUser(formData)
        toast({ title: "Success", description: "User created successfully" })
      }
      setIsDialogOpen(false)
      fetchUsers()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Operation failed",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    // Handle role being populated as an object or just an ID
    const roleId = typeof user.role === 'object' && user.role !== null 
      ? (user.role as any)._id 
      : user.role || "";
      
    setFormData({
      name: user.name,
      email: user.email,
      idNumber: user.idNumber,
      roleId: roleId,
      departmentCode: user.departmentCode || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      await userService.deleteUser(id)
      toast({ title: "Success", description: "User deleted successfully" })
      fetchUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      if (user.is_disabled) {
        await userService.enableUser(user._id)
        toast({ title: "Success", description: "User enabled successfully" })
      } else {
        await userService.disableUser(user._id)
        toast({ title: "Success", description: "User disabled successfully" })
      }
      fetchUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      idNumber: "",
      password: "",
      roleId: "",
      departmentCode: "",
    })
  }

  // Helper to check if selected role is department head
  const isDepartmentHeadRole = () => {
    const selectedRole = roles.find(r => r._id === formData.roleId)
    return selectedRole?.name === "department_head"
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Error: {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[300px]"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#800000] hover:bg-[#600000]">
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.roleId}
                  onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isDepartmentHeadRole() && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.departmentCode}
                    onValueChange={(value) => setFormData({ ...formData, departmentCode: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept._id} value={dept.departmentCode}>
                          {dept.name} ({dept.departmentCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" className="bg-[#800000] hover:bg-[#600000]">
                  {editingUser ? "Update" : "Create"}
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
              <TableHead>Name</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.idNumber}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {typeof user.role === 'object' && user.role !== null ? (user.role as any).name : user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_disabled ? "destructive" : "default"} className={!user.is_disabled ? "bg-green-600" : ""}>
                      {user.is_disabled ? "Disabled" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(user)}
                        title={user.is_disabled ? "Enable User" : "Disable User"}
                      >
                        {user.is_disabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Ban className="h-4 w-4 text-orange-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user._id)}
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

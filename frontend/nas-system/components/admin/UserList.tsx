"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Pencil, Trash2, Ban, CheckCircle, Undo2, X, Loader2 } from "lucide-react"
import userService, { User, CreateUserData } from "@/services/userService"
import roleService, { Role } from "@/services/roleService"
import departmentService, { Department } from "@/services/departmentService"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const USERS_PER_PAGE = 20;

export function UserList() {
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active")
  const [users, setUsers] = useState<User[]>([])
  const [deletedUsers, setDeletedUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalUsers, setTotalUsers] = useState(0)

  // Intersection observer ref for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

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

  // Initial load
  useEffect(() => {
    fetchUsers(1, true)
    fetchDeletedUsers()
    fetchRoles()
    fetchDepartments()
  }, [])

  // Reset and refetch when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setUsers([])
      setCurrentPage(1)
      setHasMore(true)
      fetchUsers(1, true)
    }, 300) // Debounce search

    return () => clearTimeout(timer)
  }, [search])

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreUsers()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, loadingMore, hasMore, currentPage])

  const fetchUsers = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const response = await userService.getAllUsers({ 
        search, 
        page, 
        limit: USERS_PER_PAGE 
      })
      
      console.log("Fetched users:", response)
      
      const newUsers = response.users || []
      const pagination = response.pagination || {}
      
      if (reset) {
        setUsers(newUsers)
      } else {
        setUsers(prev => [...prev, ...newUsers])
      }
      
      setCurrentPage(page)
      setTotalUsers(pagination.totalUsers || 0)
      setHasMore(pagination.hasNext || false)
      
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
      setLoadingMore(false)
    }
  }

  const loadMoreUsers = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchUsers(currentPage + 1, false)
    }
  }, [currentPage, loadingMore, hasMore])

  const fetchDeletedUsers = async () => {
    try {
      const response = await userService.getDeletedUsers()
      console.log("Fetched deleted users:", response)
      setDeletedUsers(response.users || [])
    } catch (error: any) {
      console.error("Error fetching deleted users:", error)
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
    // Search is already handled by the useEffect with debounce
  }

  // Refresh users list (reset pagination)
  const refreshUsers = () => {
    setUsers([])
    setCurrentPage(1)
    setHasMore(true)
    fetchUsers(1, true)
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
      refreshUsers()
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
      refreshUsers()
      fetchDeletedUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleRestore = async (id: string) => {
    if (!confirm("Are you sure you want to restore this user?")) return
    try {
      await userService.restoreUser(id)
      toast({ title: "Success", description: "User restored successfully" })
      refreshUsers()
      fetchDeletedUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore user",
        variant: "destructive",
      })
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Are you sure you want to PERMANENTLY delete this user? This action cannot be undone!")) return
    try {
      await userService.permanentDeleteUser(id)
      toast({ title: "Success", description: "User permanently deleted" })
      fetchDeletedUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to permanently delete user",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      if (user.disabled) {
        await userService.enableUser(user._id)
        toast({ title: "Success", description: "User enabled successfully" })
      } else {
        await userService.disableUser(user._id)
        toast({ title: "Success", description: "User disabled successfully" })
      }
      refreshUsers()
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

  const getStatusBadge = (user: User) => {
    if (user.disabled) {
      return <Badge className="bg-red-600 hover:bg-red-700">Disabled</Badge>
    }
    if (!user.verified) {
      return <Badge className="bg-gray-500 hover:bg-gray-600">Not Verified</Badge>
    }
    return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
  }

  const renderUserTable = (userList: User[], isDeleted: boolean = false) => (
    <div className="space-y-4">
      {/* User count info */}
      {!isDeleted && totalUsers > 0 && (
        <div className="text-sm text-gray-500">
          Showing {userList.length} of {totalUsers} users
        </div>
      )}
      
      <div className="rounded-md border max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : userList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            userList.map((user) => (
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
                  {getStatusBadge(user)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!isDeleted && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(user)}
                          title={user.disabled ? "Enable User" : "Disable User"}
                        >
                          {user.disabled ? (
                            <Undo2 className="h-4 w-4 text-green-600" />
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
                      </>
                    )}
                    {isDeleted && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(user._id)}
                          title="Restore User"
                        >
                          <Undo2 className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePermanentDelete(user._id)}
                          title="Permanently Delete User"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Infinite scroll trigger - only for active users tab */}
      {!isDeleted && hasMore && !loading && (
        <div 
          ref={loadMoreRef}
          className="flex items-center justify-center py-4"
        >
          {loadingMore ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading more users...
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Scroll for more</div>
          )}
        </div>
      )}
      
      {/* End of list indicator */}
      {!isDeleted && !hasMore && userList.length > 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          All {totalUsers} users loaded
        </div>
      )}
      </div>
    </div>
  )

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
        <div className="flex gap-2 items-center">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "deleted")}>
            <TabsList>
              <TabsTrigger value="active">Active Users</TabsTrigger>
              <TabsTrigger value="deleted">Deleted Users</TabsTrigger>
            </TabsList>
          </Tabs>
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
      </div>

      {activeTab === "active" && renderUserTable(users, false)}
      {activeTab === "deleted" && renderUserTable(deletedUsers, true)}
    </div>
  )
}

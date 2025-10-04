"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CountrySelector } from "@/components/ui/country-selector"
import { Users as UsersIcon, Crown, Shield, User, Plus, Edit, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { COMMON_CURRENCIES } from "@/lib/currency"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  canBeEmployee: boolean
  country: string | null
  countryCode: string | null
  currency: string | null
  createdAt: string
  updatedAt: string
  _count: {
    expenses: number
    approvals: number
    categories: number
  }
}

interface UserFormData {
  name: string
  email: string
  password: string
  role: string
  canBeEmployee: boolean
  country: string
  countryCode: string
  currency: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    canBeEmployee: false,
    country: "",
    countryCode: "",
    currency: "USD"
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        toast.error("Failed to fetch users")
      }
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PATCH" : "POST"
      
      const submitData = { ...formData }
      // Don't send password if editing and password is empty
      if (editingUser && !formData.password) {
        delete (submitData as any).password
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        toast.success(editingUser ? "User updated" : "User created")
        fetchUsers()
        setDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || "Something went wrong")
      }
    } catch (error) {
      toast.error("Failed to save user")
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name || "",
      email: user.email,
      password: "", // Leave empty for editing
      role: user.role,
      canBeEmployee: user.canBeEmployee,
      country: user.country || "",
      countryCode: user.countryCode || "",
      currency: user.currency || "USD"
    })
    setDialogOpen(true)
  }

  const handleView = (user: User) => {
    setViewingUser(user)
    setViewDialogOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("User deleted")
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete user")
      }
    } catch (error) {
      toast.error("Failed to delete user")
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      canBeEmployee: false,
      country: "",
      countryCode: "",
      currency: "USD"
    })
    setEditingUser(null)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return <Crown className="h-4 w-4 text-yellow-600" />
      case "MANAGER": return <Shield className="h-4 w-4 text-blue-600" />
      case "EMPLOYEE": return <User className="h-4 w-4 text-green-600" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-yellow-100 text-yellow-800"
      case "MANAGER": return "bg-blue-100 text-blue-800"
      case "EMPLOYEE": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Access denied. Admin role required.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Create User"}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? "Update user information below."
                  : "Add a new user to the system."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@company.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    Password {editingUser && <span className="text-sm text-muted-foreground">(leave blank to keep current)</span>}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Password"
                    required={!editingUser}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      role: value,
                      canBeEmployee: value !== "MANAGER" ? false : prev.canBeEmployee
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === "MANAGER" && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="canBeEmployee"
                      checked={formData.canBeEmployee}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canBeEmployee: checked }))}
                    />
                    <Label htmlFor="canBeEmployee">Can act as Employee</Label>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Country</Label>
                  <CountrySelector
                    value={formData.country}
                    onSelect={(country) => setFormData(prev => ({ 
                      ...prev, 
                      country: country.name, 
                      countryCode: country.code,
                      currency: country.currency || "USD"
                    }))}
                    placeholder="Select country..."
                  />

                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Preferred Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUser ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Crown className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === "ADMIN").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  System administrators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Managers</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === "MANAGER").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Team managers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees</CardTitle>
                <User className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === "EMPLOYEE").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Team members
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                System users and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.name || "No name set"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.role === "MANAGER" && user.canBeEmployee && (
                              <Badge variant="outline" className="text-xs">
                                Can act as Employee
                              </Badge>
                            )}
                            {user.role === "ADMIN" && (
                              <div className="text-xs text-muted-foreground">
                                Full system access
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.country && (
                              <div>
                                <div>{user.country}</div>
                                <div className="text-xs text-muted-foreground">
                                  {user.currency}
                                </div>
                              </div>
                            )}
                            {!user.country && (
                              <span className="text-muted-foreground">Not specified</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>Expenses: {user._count.expenses}</div>
                            <div>Approvals: {user._count.approvals}</div>
                            <div>Categories: {user._count.categories}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(user.createdAt), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {session.user.id !== user.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(user)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewingUser?.name || viewingUser?.email}
            </DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <div className="text-sm mt-1">{viewingUser.name || "Not set"}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="text-sm mt-1">{viewingUser.email}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleIcon(viewingUser.role)}
                    <Badge className={getRoleColor(viewingUser.role)}>
                      {viewingUser.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Permissions</Label>
                  <div className="text-sm mt-1">
                    {viewingUser.role === "MANAGER" && viewingUser.canBeEmployee ? (
                      <Badge variant="outline">Can act as Employee</Badge>
                    ) : (
                      "Standard permissions"
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Country</Label>
                  <div className="text-sm mt-1">{viewingUser.country || "Not specified"}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Currency</Label>
                  <div className="text-sm mt-1">{viewingUser.currency || "USD"}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Joined</Label>
                  <div className="text-sm mt-1">
                    {format(new Date(viewingUser.createdAt), "PPP")}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <div className="text-sm mt-1">
                    {format(new Date(viewingUser.updatedAt), "PPP")}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium">Activity Summary</Label>
                <div className="grid grid-cols-3 gap-4 mt-2 text-center">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold">{viewingUser._count.expenses}</div>
                    <div className="text-xs text-muted-foreground">Expenses</div>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold">{viewingUser._count.approvals}</div>
                    <div className="text-xs text-muted-foreground">Approvals</div>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <div className="text-lg font-bold">{viewingUser._count.categories}</div>
                    <div className="text-xs text-muted-foreground">Categories</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name || userToDelete?.email}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (userToDelete._count.expenses > 0 || userToDelete._count.approvals > 0 || userToDelete._count.categories > 0) && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm font-medium text-yellow-800">Warning</div>
              <div className="text-sm text-yellow-700 mt-1">
                This user has {userToDelete._count.expenses} expenses, {userToDelete._count.approvals} approvals, 
                and {userToDelete._count.categories} categories. Deletion may fail.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
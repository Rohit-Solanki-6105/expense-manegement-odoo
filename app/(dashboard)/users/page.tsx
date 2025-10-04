"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users as UsersIcon, Crown, Shield, User } from "lucide-react"
import { format } from "date-fns"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  canBeEmployee: boolean
  country: string | null
  createdAt: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // For now, we'll create a mock users list since we haven't created the API
      // In a real implementation, you would fetch from /api/users
      setUsers([
        {
          id: "1",
          name: "John Admin",
          email: "admin@company.com",
          role: "ADMIN",
          canBeEmployee: false,
          country: "United States",
          createdAt: new Date().toISOString()
        },
        {
          id: "2", 
          name: "Jane Manager",
          email: "manager@company.com",
          role: "MANAGER",
          canBeEmployee: true,
          country: "Canada",
          createdAt: new Date().toISOString()
        },
        {
          id: "3",
          name: "Bob Employee",
          email: "employee@company.com", 
          role: "EMPLOYEE",
          canBeEmployee: false,
          country: "United Kingdom",
          createdAt: new Date().toISOString()
        }
      ])
    } catch (error) {
      console.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      {/* Users Table */}
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
                  <TableHead>Joined</TableHead>
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
                        {user.country || "Not specified"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notice about user management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User management features such as role updates, account activation/deactivation, 
            and detailed user permissions can be implemented in future iterations. 
            Currently, users can register through the signup process and their roles 
            are automatically assigned based on the authentication system.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
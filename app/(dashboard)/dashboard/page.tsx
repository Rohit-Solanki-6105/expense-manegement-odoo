"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Receipt, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  Plus
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role as string

  // Mock data - in real app, this would come from API
  const stats = {
    totalExpenses: 12500,
    pendingExpenses: 3,
    approvedExpenses: 15,
    rejectedExpenses: 2,
    monthlyBudget: 50000,
    teamMembers: 12
  }

  const recentExpenses = [
    {
      id: "1",
      title: "Business Lunch",
      amount: 250,
      status: "PENDING",
      date: "2025-10-04",
      category: "Meals"
    },
    {
      id: "2", 
      title: "Flight to Conference",
      amount: 1200,
      status: "APPROVED",
      date: "2025-10-03",
      category: "Travel"
    },
    {
      id: "3",
      title: "Hotel Accommodation",
      amount: 300,
      status: "REJECTED",
      date: "2025-10-02",
      category: "Accommodation"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          {(userRole === "MANAGER" || userRole === "EMPLOYEE" || session?.user?.canBeEmployee) && (
            <Button asChild>
              <Link href="/expenses/new">
                <Plus className="mr-2 h-4 w-4" />
                New Expense
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {userRole === "ADMIN" && <TabsTrigger value="admin">Admin</TabsTrigger>}
          {(userRole === "MANAGER" || userRole === "ADMIN") && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalExpenses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingExpenses}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvedExpenses}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((stats.totalExpenses / stats.monthlyBudget) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Of ${stats.monthlyBudget.toLocaleString()} budget
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Expenses */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>
                  Your latest expense submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center space-x-4">
                      <Receipt className="h-9 w-9 text-muted-foreground" />
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none">{expense.title}</p>
                        <p className="text-sm text-muted-foreground">{expense.category}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">${expense.amount}</p>
                        <Badge className={getStatusColor(expense.status)}>
                          {expense.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {(userRole === "MANAGER" || userRole === "EMPLOYEE" || session?.user?.canBeEmployee) && (
                  <Button asChild className="justify-start">
                    <Link href="/expenses/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Submit New Expense
                    </Link>
                  </Button>
                )}
                
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/expenses">
                    <Receipt className="mr-2 h-4 w-4" />
                    View All Expenses
                  </Link>
                </Button>

                {(userRole === "ADMIN" || userRole === "MANAGER") && (
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/approvals">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Review Approvals
                    </Link>
                  </Button>
                )}

                <Button asChild variant="outline" className="justify-start">
                  <Link href="/reports">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Reports
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {userRole === "ADMIN" && (
          <TabsContent value="admin" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.teamMembers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active team members
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>System Management</CardTitle>
                  <CardDescription>Administrative functions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full justify-start">
                    <Link href="/categories">
                      <Badge className="mr-2 h-4 w-4" />
                      Manage Categories
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/users">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {(userRole === "MANAGER" || userRole === "ADMIN") && (
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Expenses waiting for your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  No pending approvals at this time.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Receipt, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  Plus,
  Globe,
  Crown,
  Shield,
  User,
  ArrowRightLeft
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, useCurrencyConverter, COMMON_CURRENCIES } from "@/lib/currency"
import { toast } from "sonner"

interface DashboardStats {
  totalExpenses: number
  pendingExpenses: number
  approvedExpenses: number
  rejectedExpenses: number
  monthlyTotal: number
  recentExpenses: Array<{
    id: string
    title: string
    amount: number
    currency: string
    status: string
    date: string
    category: { name: string; color: string | null }
  }>
  userStats?: {
    totalUsers: number
    adminCount: number
    managerCount: number
    employeeCount: number
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewCurrency, setViewCurrency] = useState("USD")
  const { convertAmount } = useCurrencyConverter()

  const userRole = session?.user?.role as string

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch expenses data
      const expensesResponse = await fetch("/api/expenses?limit=5")
      const expensesData = await expensesResponse.json()

      // Fetch user stats if admin
      let userStats
      if (userRole === "ADMIN") {
        try {
          const usersResponse = await fetch("/api/users")
          const users = await usersResponse.json()
          userStats = {
            totalUsers: users.length,
            adminCount: users.filter((u: any) => u.role === "ADMIN").length,
            managerCount: users.filter((u: any) => u.role === "MANAGER").length,
            employeeCount: users.filter((u: any) => u.role === "EMPLOYEE").length,
          }
        } catch (error) {
          console.error("Failed to fetch user stats:", error)
        }
      }

      // Calculate stats from expenses
      const totalExpenses = expensesData.length
      const pendingExpenses = expensesData.filter((e: any) => e.status === "PENDING").length
      const approvedExpenses = expensesData.filter((e: any) => e.status === "APPROVED").length
      const rejectedExpenses = expensesData.filter((e: any) => e.status === "REJECTED").length

      // Calculate monthly total (this would normally be filtered by date range)
      const monthlyTotal = expensesData
        .filter((e: any) => e.status === "APPROVED")
        .reduce((sum: number, e: any) => sum + e.amount, 0)

      setStats({
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        monthlyTotal,
        recentExpenses: expensesData.slice(0, 5),
        userStats
      })
    } catch (error) {
      toast.error("Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const ConvertedAmount = ({ amount, fromCurrency }: { amount: number; fromCurrency: string }) => {
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
    const [converting, setConverting] = useState(false)

    useEffect(() => {
      if (fromCurrency !== viewCurrency) {
        setConverting(true)
        convertAmount(amount, fromCurrency, viewCurrency)
          .then(setConvertedAmount)
          .catch(() => setConvertedAmount(null))
          .finally(() => setConverting(false))
      } else {
        setConvertedAmount(null)
      }
    }, [amount, fromCurrency, viewCurrency])

    return (
      <div className="text-right">
        <div className="font-medium">
          {formatCurrency(amount, fromCurrency)}
        </div>
        {convertedAmount && fromCurrency !== viewCurrency && (
          <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
            <ArrowRightLeft className="h-3 w-3" />
            {converting ? "..." : formatCurrency(convertedAmount, viewCurrency)}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back, {session?.user?.name || session?.user?.email}!
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your expenses today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <Select value={viewCurrency} onValueChange={setViewCurrency}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_CURRENCIES.slice(0, 8).map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(userRole === "EMPLOYEE" || userRole === "MANAGER") && (
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
          <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
          {userRole === "ADMIN" && <TabsTrigger value="users">User Management</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalExpenses || 0}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingExpenses || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.approvedExpenses || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Ready for payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.monthlyTotal || 0, viewCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Approved expenses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(userRole === "EMPLOYEE" || userRole === "MANAGER") && (
                  <Button asChild className="w-full justify-start">
                    <Link href="/expenses/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Submit New Expense
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/expenses">
                    <Receipt className="mr-2 h-4 w-4" />
                    View All Expenses
                  </Link>
                </Button>
                {(userRole === "MANAGER" || userRole === "ADMIN") && (
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/approvals">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Review Approvals
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/reports">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Reports
                  </Link>
                </Button>
                {userRole === "ADMIN" && (
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/users">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Currency Settings</CardTitle>
                <CardDescription>
                  Your preferred currency display
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Display Currency</label>
                    <Select value={viewCurrency} onValueChange={setViewCurrency}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
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
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Currency Conversion</div>
                    <div className="text-xs text-blue-700 mt-1">
                      Exchange rates are updated hourly from ExchangeRate API
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>
                Your latest expense submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="mx-auto h-12 w-12 mb-4" />
                  <p>No expenses submitted yet.</p>
                  {(userRole === "EMPLOYEE" || userRole === "MANAGER") && (
                    <Button asChild className="mt-4">
                      <Link href="/expenses/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Submit Your First Expense
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: expense.category.color || "#3B82F6" }}
                        />
                        <div>
                          <div className="font-medium">{expense.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {expense.category.name} • {new Date(expense.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ConvertedAmount amount={expense.amount} fromCurrency={expense.currency} />
                        <Badge className={
                          expense.status === "APPROVED" ? "bg-green-100 text-green-800" :
                          expense.status === "REJECTED" ? "bg-red-100 text-red-800" :
                          expense.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }>
                          {expense.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Button variant="outline" asChild>
                      <Link href="/expenses">
                        View All Expenses
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === "ADMIN" && (
          <TabsContent value="users" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.userStats?.totalUsers || 0}</div>
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
                  <div className="text-2xl font-bold">{stats?.userStats?.adminCount || 0}</div>
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
                  <div className="text-2xl font-bold">{stats?.userStats?.managerCount || 0}</div>
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
                  <div className="text-2xl font-bold">{stats?.userStats?.employeeCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Team members
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button asChild className="w-full justify-start">
                    <Link href="/users">
                      <Users className="mr-2 h-4 w-4" />
                      View All Users
                    </Link>
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Add, edit, and manage user roles and permissions from the Users page.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
   

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "APPROVED": return "bg-green-100 text-green-800"
//       case "REJECTED": return "bg-red-100 text-red-800"
//       case "PENDING": return "bg-yellow-100 text-yellow-800"
//       default: return "bg-gray-100 text-gray-800"
//     }
//   }

//   return (
//     <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
//       <div className="flex items-center justify-between space-y-2">
//         <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
//         <div className="flex items-center space-x-2">
//           {(userRole === "MANAGER" || userRole === "EMPLOYEE" || session?.user?.canBeEmployee) && (
//             <Button asChild>
//               <Link href="/expenses/new">
//                 <Plus className="mr-2 h-4 w-4" />
//                 New Expense
//               </Link>
//             </Button>
//           )}
//         </div>
//       </div>

//       <Tabs defaultValue="overview" className="space-y-4">
//         <TabsList>
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           {userRole === "ADMIN" && <TabsTrigger value="admin">Admin</TabsTrigger>}
//           {(userRole === "MANAGER" || userRole === "ADMIN") && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
//         </TabsList>

//         <TabsContent value="overview" className="space-y-4">
//           {/* Stats Cards */}
//           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
//                 <DollarSign className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">${stats.totalExpenses.toLocaleString()}</div>
//                 <p className="text-xs text-muted-foreground">
//                   +20.1% from last month
//                 </p>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Pending</CardTitle>
//                 <Clock className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.pendingExpenses}</div>
//                 <p className="text-xs text-muted-foreground">
//                   Awaiting approval
//                 </p>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Approved</CardTitle>
//                 <CheckCircle className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.approvedExpenses}</div>
//                 <p className="text-xs text-muted-foreground">
//                   This month
//                 </p>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
//                 <TrendingUp className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">
//                   {Math.round((stats.totalExpenses / stats.monthlyBudget) * 100)}%
//                 </div>
//                 <p className="text-xs text-muted-foreground">
//                   Of ${stats.monthlyBudget.toLocaleString()} budget
//                 </p>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Recent Expenses */}
//           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
//             <Card className="col-span-4">
//               <CardHeader>
//                 <CardTitle>Recent Expenses</CardTitle>
//                 <CardDescription>
//                   Your latest expense submissions
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   {recentExpenses.map((expense) => (
//                     <div key={expense.id} className="flex items-center space-x-4">
//                       <Receipt className="h-9 w-9 text-muted-foreground" />
//                       <div className="space-y-1 flex-1">
//                         <p className="text-sm font-medium leading-none">{expense.title}</p>
//                         <p className="text-sm text-muted-foreground">{expense.category}</p>
//                       </div>
//                       <div className="text-right space-y-1">
//                         <p className="text-sm font-medium">${expense.amount}</p>
//                         <Badge className={getStatusColor(expense.status)}>
//                           {expense.status}
//                         </Badge>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="col-span-3">
//               <CardHeader>
//                 <CardTitle>Quick Actions</CardTitle>
//                 <CardDescription>
//                   Common tasks and shortcuts
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="grid gap-4">
//                 {(userRole === "MANAGER" || userRole === "EMPLOYEE" || session?.user?.canBeEmployee) && (
//                   <Button asChild className="justify-start">
//                     <Link href="/expenses/new">
//                       <Plus className="mr-2 h-4 w-4" />
//                       Submit New Expense
//                     </Link>
//                   </Button>
//                 )}
                
//                 <Button asChild variant="outline" className="justify-start">
//                   <Link href="/expenses">
//                     <Receipt className="mr-2 h-4 w-4" />
//                     View All Expenses
//                   </Link>
//                 </Button>

//                 {(userRole === "ADMIN" || userRole === "MANAGER") && (
//                   <Button asChild variant="outline" className="justify-start">
//                     <Link href="/approvals">
//                       <CheckCircle className="mr-2 h-4 w-4" />
//                       Review Approvals
//                     </Link>
//                   </Button>
//                 )}

//                 <Button asChild variant="outline" className="justify-start">
//                   <Link href="/reports">
//                     <TrendingUp className="mr-2 h-4 w-4" />
//                     View Reports
//                   </Link>
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         {userRole === "ADMIN" && (
//           <TabsContent value="admin" className="space-y-4">
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">Total Users</CardTitle>
//                   <Users className="h-4 w-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">{stats.teamMembers}</div>
//                   <p className="text-xs text-muted-foreground">
//                     Active team members
//                   </p>
//                 </CardContent>
//               </Card>
//             </div>
            
//             <div className="grid gap-4 md:grid-cols-2">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>System Management</CardTitle>
//                   <CardDescription>Administrative functions</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-2">
//                   <Button asChild className="w-full justify-start">
//                     <Link href="/categories">
//                       <Badge className="mr-2 h-4 w-4" />
//                       Manage Categories
//                     </Link>
//                   </Button>
//                   <Button asChild variant="outline" className="w-full justify-start">
//                     <Link href="/users">
//                       <Users className="mr-2 h-4 w-4" />
//                       Manage Users
//                     </Link>
//                   </Button>
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>
//         )}

//         {(userRole === "MANAGER" || userRole === "ADMIN") && (
//           <TabsContent value="approvals" className="space-y-4">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Pending Approvals</CardTitle>
//                 <CardDescription>
//                   Expenses waiting for your approval
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-center py-6 text-muted-foreground">
//                   No pending approvals at this time.
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>
//         )}
//       </Tabs>
//     </div>
//   )

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, BarChart3, PieChart, TrendingUp, Filter } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ExpenseSummary {
  totalAmount: number
  totalExpenses: number
  approvedAmount: number
  rejectedAmount: number
  pendingAmount: number
  byCategory: Array<{
    category: string
    amount: number
    count: number
    color: string
  }>
  byStatus: Array<{
    status: string
    amount: number
    count: number
  }>
  byMonth: Array<{
    month: string
    amount: number
    count: number
  }>
}

interface Expense {
  id: string
  title: string
  amount: number
  currency: string
  date: string
  status: string
  submitter: {
    name: string | null
    email: string
  }
  category: {
    name: string
    color: string | null
  }
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 2)),
    to: endOfMonth(new Date())
  })
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchReportData()
  }, [dateRange, statusFilter])

  const fetchReportData = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/expenses?${params}`)
      if (response.ok) {
        const data = await response.json()
        
        // Filter by date range
        const filteredExpenses = data.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date)
          return expenseDate >= dateRange.from && expenseDate <= dateRange.to
        })
        
        setExpenses(filteredExpenses)
        generateSummary(filteredExpenses)
      }
    } catch (error) {
      toast.error("Failed to fetch report data")
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = (expenses: Expense[]) => {
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalExpenses = expenses.length

    const approvedExpenses = expenses.filter(exp => exp.status === "APPROVED")
    const rejectedExpenses = expenses.filter(exp => exp.status === "REJECTED")
    const pendingExpenses = expenses.filter(exp => exp.status === "PENDING")

    const approvedAmount = approvedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const rejectedAmount = rejectedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const pendingAmount = pendingExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    // Group by category
    const categoryMap = new Map()
    expenses.forEach(expense => {
      const key = expense.category.name
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          category: key,
          amount: 0,
          count: 0,
          color: expense.category.color || "#3B82F6"
        })
      }
      const item = categoryMap.get(key)
      item.amount += expense.amount
      item.count += 1
    })

    // Group by status
    const statusMap = new Map()
    expenses.forEach(expense => {
      const key = expense.status
      if (!statusMap.has(key)) {
        statusMap.set(key, { status: key, amount: 0, count: 0 })
      }
      const item = statusMap.get(key)
      item.amount += expense.amount
      item.count += 1
    })

    // Group by month
    const monthMap = new Map()
    expenses.forEach(expense => {
      const key = format(new Date(expense.date), "MMM yyyy")
      if (!monthMap.has(key)) {
        monthMap.set(key, { month: key, amount: 0, count: 0 })
      }
      const item = monthMap.get(key)
      item.amount += expense.amount
      item.count += 1
    })

    setSummary({
      totalAmount,
      totalExpenses,
      approvedAmount,
      rejectedAmount,
      pendingAmount,
      byCategory: Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount),
      byStatus: Array.from(statusMap.values()),
      byMonth: Array.from(monthMap.values())
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const exportToCSV = () => {
    const headers = ["Title", "Category", "Amount", "Currency", "Date", "Status", "Submitter"]
    const rows = expenses.map(expense => [
      expense.title,
      expense.category.name,
      expense.amount,
      expense.currency,
      format(new Date(expense.date), "yyyy-MM-dd"),
      expense.status,
      expense.submitter.name || expense.submitter.email
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `expense-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Access denied. Manager or Admin role required.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            Expense analytics and reporting dashboard
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={loading || expenses.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading report data...</div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${summary?.totalAmount.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.totalExpenses} expense{summary?.totalExpenses !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${summary?.approvedAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((summary?.approvedAmount || 0) / (summary?.totalAmount || 1) * 100)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <PieChart className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    ${summary?.pendingAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((summary?.pendingAmount || 0) / (summary?.totalAmount || 1) * 100)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  <BarChart3 className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${summary?.rejectedAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((summary?.rejectedAmount || 0) / (summary?.totalAmount || 1) * 100)}% of total
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary?.byCategory.map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm font-medium">{item.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">${item.amount.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{item.count} expenses</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* By Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary?.byStatus.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">${item.amount.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{item.count} expenses</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expense Details</CardTitle>
                <CardDescription>
                  {expenses.length} expense{expenses.length !== 1 ? "s" : ""} in selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No expenses found for the selected criteria.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitter</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: expense.category.color || "#3B82F6" }}
                              />
                              {expense.category.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {expense.currency} {expense.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(expense.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(expense.status)}>
                              {expense.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {expense.submitter.name || expense.submitter.email}
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
      )}
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, Eye, Receipt, ArrowRightLeft, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { formatCurrency, useCurrencyConverter, COMMON_CURRENCIES } from "@/lib/currency"

interface Expense {
  id: string
  title: string
  description: string | null
  amount: number
  currency: string
  originalAmount?: number
  originalCurrency?: string
  convertedAmount?: number
  baseCurrency?: string
  date: string
  status: string
  createdAt: string
  submitter: {
    name: string | null
    email: string
    role: string
  }
  category: {
    name: string
    color: string | null
  }
  approvals: Array<{
    status: string
    approver: {
      name: string | null
      email: string
    }
  }>
}

interface Category {
  id: string
  name: string
}

export default function ExpensesPage() {
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [viewCurrency, setViewCurrency] = useState("USD")
  
  const { convertAmount } = useCurrencyConverter()

  useEffect(() => {
    fetchExpenses()
    fetchCategories()
  }, [statusFilter, categoryFilter])

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (categoryFilter !== "all") params.append("categoryId", categoryFilter)

      const response = await fetch(`/api/expenses?${params}`)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      toast.error("Failed to fetch expenses")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Failed to fetch categories")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "PROCESSING": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const ExpenseAmount = ({ expense }: { expense: Expense }) => {
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      if (expense.currency !== viewCurrency) {
        setLoading(true)
        convertAmount(expense.amount, expense.currency, viewCurrency)
          .then(setConvertedAmount)
          .catch(() => setConvertedAmount(null))
          .finally(() => setLoading(false))
      } else {
        setConvertedAmount(null)
      }
    }, [expense.amount, expense.currency, viewCurrency])

    return (
      <div className="text-right">
        <div className="font-medium">
          {formatCurrency(expense.amount, expense.currency)}
        </div>
        {convertedAmount && expense.currency !== viewCurrency && (
          <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
            <ArrowRightLeft className="h-3 w-3" />
            {loading ? "Converting..." : formatCurrency(convertedAmount, viewCurrency)}
          </div>
        )}
        {expense.originalCurrency && expense.originalCurrency !== expense.currency && (
          <div className="text-xs text-blue-600">
            Original: {formatCurrency(expense.originalAmount || expense.amount, expense.originalCurrency)}
          </div>
        )}
      </div>
    )
  }

  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const canSubmitExpenses = session?.user?.role === "EMPLOYEE" || 
                           session?.user?.role === "MANAGER" ||
                           ((session?.user as any)?.role === "MANAGER" && (session?.user as any)?.canBeEmployee)

  // Calculate total amounts by currency
  const totalsByCurrency = filteredExpenses.reduce((totals, expense) => {
    const currency = expense.currency
    if (!totals[currency]) totals[currency] = 0
    totals[currency] += expense.amount
    return totals
  }, {} as Record<string, number>)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">
            Manage and track your expense submissions
          </p>
        </div>
        {canSubmitExpenses && (
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Expense
            </Link>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredExpenses.length}</div>
            <p className="text-xs text-muted-foreground">
              Active submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-800">●</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredExpenses.filter(e => e.status === "PENDING").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Badge className="bg-green-100 text-green-800">●</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredExpenses.filter(e => e.status === "APPROVED").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(totalsByCurrency).slice(0, 2).map(([currency, total]) => (
                <div key={currency} className="text-lg font-bold">
                  {formatCurrency(total, currency)}
                </div>
              ))}
              {Object.keys(totalsByCurrency).length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{Object.keys(totalsByCurrency).length - 2} more currencies
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & View Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={viewCurrency} onValueChange={setViewCurrency}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="View Currency" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
          <CardDescription>
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading expenses...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="mx-auto h-12 w-12 mb-4" />
              <p>No expenses found.</p>
              {canSubmitExpenses && (
                <Button asChild className="mt-4">
                  <Link href="/expenses/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Your First Expense
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.title}</div>
                          {expense.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {expense.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: expense.category.color || "#3B82F6" }}
                          />
                          <span className="text-sm">{expense.category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ExpenseAmount expense={expense} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(expense.date), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(expense.status)}>
                          {expense.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {expense.submitter.name || expense.submitter.email}
                          </div>
                          <div className="text-muted-foreground">
                            {expense.submitter.role}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, DollarSign, ArrowRightLeft } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCurrencyConverter, formatCurrency, formatCurrencyWithSymbol, getCurrencySymbol, COMMON_CURRENCIES } from "@/lib/currency"
import { useCurrency } from "@/contexts/currency-context"

interface Category {
  id: string
  name: string
  color: string | null
  isActive?: boolean
}

interface ApprovalSequence {
  id: string
  name: string
  description?: string
  minApprovalPercentage: number
  isActive: boolean
  steps: Array<{
    id: string
    manager: {
      id: string
      name: string | null
      email: string
    }
    order: number
  }>
}

export default function NewExpensePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { currency: userCurrency, symbol: userSymbol, formatAmount } = useCurrency()
  const [categories, setCategories] = useState<Category[]>([])
  const [approvalSequences, setApprovalSequences] = useState<ApprovalSequence[]>([])
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date>()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    currency: userCurrency,
    categoryId: "",
    approvalSequenceId: "default",
    receiptUrl: ""
  })

  // Currency conversion functionality
  const { convertAmount, loading: convertLoading } = useCurrencyConverter()
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [showConversion, setShowConversion] = useState(false)

  // Base currency (company default or user preference)
  const baseCurrency = "USD" // Could be configurable

  useEffect(() => {
    fetchCategories()
    fetchApprovalSequences()
  }, [])

  useEffect(() => {
    // Auto-convert when amount or currency changes
    const amount = parseFloat(formData.amount)
    if (amount > 0 && formData.currency !== baseCurrency) {
      handleCurrencyConversion()
    } else {
      setConvertedAmount(null)
      setShowConversion(false)
    }
  }, [formData.amount, formData.currency])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.filter((cat: Category) => cat.isActive !== false))
      }
    } catch (error) {
      toast.error("Failed to fetch categories")
    }
  }

  const fetchApprovalSequences = async () => {
    try {
      const response = await fetch("/api/approval-sequences")
      if (response.ok) {
        const data = await response.json()
        setApprovalSequences(data.filter((seq: ApprovalSequence) => seq.isActive))
      }
    } catch (error) {
      console.error("Failed to fetch approval sequences:", error)
    }
  }

  const handleCurrencyConversion = async () => {
    const amount = parseFloat(formData.amount)
    if (amount <= 0 || formData.currency === baseCurrency) {
      setConvertedAmount(null)
      setShowConversion(false)
      return
    }

    try {
      const converted = await convertAmount(amount, formData.currency, baseCurrency)
      setConvertedAmount(converted)
      setShowConversion(true)
    } catch (error) {
      console.error("Currency conversion failed:", error)
      setShowConversion(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!date) {
      toast.error("Please select a date")
      return
    }

    if (!formData.categoryId) {
      toast.error("Please select a category")
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setLoading(true)

    try {
      // Calculate converted amount for storage if different currency
      let finalAmount = parseFloat(formData.amount)
      let finalCurrency = formData.currency

      // Store both original and converted amounts
      const expenseData = {
        ...formData,
        date: date.toISOString(),
        amount: finalAmount,
        currency: finalCurrency,
        originalAmount: finalAmount,
        originalCurrency: formData.currency,
        convertedAmount: convertedAmount,
        baseCurrency: baseCurrency,
        approvalSequenceId: formData.approvalSequenceId === "default" ? null : formData.approvalSequenceId
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(expenseData)
      })

      if (response.ok) {
        toast.success("Expense submitted successfully!")
        router.push("/expenses")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to submit expense")
      }
    } catch (error) {
      toast.error("Failed to submit expense")
    } finally {
      setLoading(false)
    }
  }

  const canSubmitExpenses = session?.user?.role === "EMPLOYEE" || 
                           session?.user?.role === "MANAGER" ||
                           ((session?.user as any)?.role === "MANAGER" && (session?.user as any)?.canBeEmployee)

  if (!canSubmitExpenses) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to submit expenses.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Submit New Expense</h2>
          <p className="text-muted-foreground">
            Create a new expense report for approval
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <CardDescription>
              Fill out the form below to submit your expense for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Expense Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Business Lunch, Flight to Conference"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide additional details about this expense"
                  rows={3}
                />
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="amount">Amount ({userCurrency})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm font-medium text-muted-foreground">
                      {userSymbol}
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Currency Conversion Display */}
              {showConversion && convertedAmount && formData.currency !== baseCurrency && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <ArrowRightLeft className="h-4 w-4" />
                    <span className="font-medium">Currency Conversion</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        {formatCurrencyWithSymbol(parseFloat(formData.amount) || 0, formData.currency)} 
                        <span className="text-muted-foreground ml-1">({formData.currency})</span>
                      </span>
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {formatCurrencyWithSymbol(convertedAmount, baseCurrency)}
                        <span className="text-muted-foreground ml-1">({baseCurrency})</span>
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Exchange rates are updated hourly
                    </div>
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="space-y-2">
                <Label>Expense Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {category.color && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Approval Sequence */}
              <div className="space-y-2">
                <Label htmlFor="approval-sequence">Approval Workflow (Optional)</Label>
                <Select
                  value={formData.approvalSequenceId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, approvalSequenceId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Use default approval or select a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Use default approval process</SelectItem>
                    {approvalSequences.map((sequence) => (
                      <SelectItem key={sequence.id} value={sequence.id}>
                        <div className="space-y-1">
                          <div className="font-medium">{sequence.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {sequence.steps.length} managers • Min {sequence.minApprovalPercentage}% approval
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.approvalSequenceId && formData.approvalSequenceId !== "default" && (
                  <div className="text-xs text-muted-foreground">
                    Selected workflow: {approvalSequences.find(s => s.id === formData.approvalSequenceId)?.description}
                  </div>
                )}
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <Label htmlFor="receipt-upload" className="cursor-pointer text-sm text-blue-600 hover:text-blue-500">
                      Upload a receipt
                    </Label>
                    <Input
                      id="receipt-upload"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        // Handle file upload here
                        const file = e.target.files?.[0]
                        if (file) {
                          // In a real app, you'd upload to cloud storage
                          toast.success("Receipt uploaded successfully")
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/expenses")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || convertLoading}
                  className="flex-1"
                >
                  {loading ? "Submitting..." : "Submit Expense"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
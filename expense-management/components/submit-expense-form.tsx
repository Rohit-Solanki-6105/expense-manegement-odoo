"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Upload, X, Loader2, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const CATEGORIES = ["Travel", "Meals", "Office Supplies", "Software", "Marketing", "Training", "Other"]

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"]

interface SubmitExpenseFormProps {
  companyId: string
  userId: string
}

export function SubmitExpenseForm({ companyId, userId }: SubmitExpenseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptName, setReceiptName] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("Please upload an image or PDF file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setReceiptUrl(data.url)
      setReceiptName(data.filename)
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload receipt. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveReceipt = async () => {
    if (!receiptUrl) return

    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: receiptUrl }),
      })
    } catch (error) {
      console.error("Delete error:", error)
    }

    setReceiptUrl(null)
    setReceiptName(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const supabase = createClient()

      // Insert expense
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          company_id: companyId,
          employee_id: userId,
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          amount: Number.parseFloat(formData.get("amount") as string),
          currency: formData.get("currency") as string,
          category: formData.get("category") as string,
          receipt_url: receiptUrl,
          expense_date: formData.get("expense_date") as string,
          status: "pending",
        })
        .select()
        .single()

      if (expenseError) throw expenseError

      // Get approval rules for this company
      const { data: rules } = await supabase
        .from("approval_rules")
        .select("*")
        .eq("company_id", companyId)
        .order("order_sequence", { ascending: true })

      if (rules && rules.length > 0) {
        // Create approval requests based on rules
        const approvalRequests = []

        for (const rule of rules) {
          if (rule.rule_type === "percentage") {
            // Get managers for percentage-based approval
            const { data: managers } = await supabase
              .from("profiles")
              .select("id")
              .eq("company_id", companyId)
              .eq("role", "manager")

            if (managers && managers.length > 0) {
              // For simplicity, assign to first manager
              // In production, you'd implement proper percentage logic
              approvalRequests.push({
                expense_id: expense.id,
                approver_id: managers[0].id,
                status: "pending",
                order_sequence: rule.order_sequence,
              })
            }
          } else if (rule.rule_type === "specific" && rule.approver_id) {
            approvalRequests.push({
              expense_id: expense.id,
              approver_id: rule.approver_id,
              status: "pending",
              order_sequence: rule.order_sequence,
            })
          }
        }

        if (approvalRequests.length > 0) {
          await supabase.from("approval_requests").insert(approvalRequests)
        }
      }

      router.push("/dashboard/employee")
      router.refresh()
    } catch (error) {
      console.error("Submit error:", error)
      alert("Failed to submit expense. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Expense Title *</Label>
            <Input id="title" name="title" placeholder="e.g., Client Dinner, Flight to NYC" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Add any additional details..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="0.00" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select name="currency" defaultValue="USD" required>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select name="category" required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_date">Expense Date *</Label>
              <Input id="expense_date" name="expense_date" type="date" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Receipt Upload</Label>
            {!receiptUrl ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="receipt"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <label htmlFor="receipt" className="cursor-pointer flex flex-col items-center gap-2">
                  {uploading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload receipt</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 5MB</p>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{receiptName}</p>
                    <p className="text-xs text-muted-foreground">Receipt uploaded successfully</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={handleRemoveReceipt}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Expense"
          )}
        </Button>
      </div>
    </form>
  )
}

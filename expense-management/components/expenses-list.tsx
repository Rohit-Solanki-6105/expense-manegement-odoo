"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { DeleteExpenseButton } from "@/components/delete-expense-button"

interface Expense {
  id: string
  title: string
  description: string | null
  amount: number
  currency: string
  category: string
  status: string
  receipt_url: string | null
  created_at: string
  employee?: { full_name: string; email: string }
  approval_requests?: Array<{
    id: string
    status: string
    approver: { full_name: string }
  }>
}

interface ExpensesListProps {
  expenses: Expense[]
  showEmployee?: boolean
  allowDelete?: boolean
}

export function ExpensesList({ expenses, showEmployee = false, allowDelete = false }: ExpensesListProps) {
  if (!expenses.length) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No expenses found</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
      default:
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
    }
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-start justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-medium">{expense.title}</p>
              <Badge className={getStatusColor(expense.status)} variant="outline">
                {expense.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {showEmployee && expense.employee && <span className="font-medium">{expense.employee.full_name}</span>}
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{expense.category}</span>
              <span className="font-semibold text-foreground">
                {expense.currency} {expense.amount.toFixed(2)}
              </span>
              <span>{new Date(expense.created_at).toLocaleDateString()}</span>
            </div>
            {expense.description && <p className="text-sm text-muted-foreground">{expense.description}</p>}
            {expense.approval_requests && expense.approval_requests.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {expense.approval_requests.map((request) => (
                  <div key={request.id} className="text-xs text-muted-foreground">
                    <span className="font-medium">{request.approver.full_name}</span>
                    {" - "}
                    <span className={getStatusColor(request.status).split(" ")[1]}>{request.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {expense.receipt_url && (
              <Button variant="ghost" size="icon" asChild>
                <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {allowDelete && (
              <DeleteExpenseButton
                expenseId={expense.id}
                expenseTitle={expense.title}
                receiptUrl={expense.receipt_url}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

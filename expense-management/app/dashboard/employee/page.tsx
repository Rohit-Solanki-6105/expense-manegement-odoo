import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ExpensesList } from "@/components/expenses-list"

export default async function EmployeeDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*, companies(name)").eq("id", user.id).single()

  if (!profile || profile.role !== "employee") {
    redirect("/dashboard")
  }

  // Get user's expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      `
      *,
      approval_requests(
        id,
        status,
        approver:profiles!approval_requests_approver_id_fkey(full_name)
      )
    `,
    )
    .eq("employee_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Expenses</h1>
          <p className="text-muted-foreground mt-1">Submit and track your expense claims</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/employee/submit">
            <Plus className="mr-2 h-4 w-4" />
            Submit Expense
          </Link>
        </Button>
      </div>

      <ExpensesList expenses={expenses || []} showEmployee={false} allowDelete />
    </div>
  )
}

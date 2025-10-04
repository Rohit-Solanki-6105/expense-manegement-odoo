import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { ExpensesList } from "@/components/expenses-list"

export default async function AdminExpensesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Get all expenses in the company with employee details
  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      `
      *,
      employee:profiles!expenses_employee_id_fkey(full_name, email)
    `,
    )
    .eq("company_id", profile.company_id)
    .order("submitted_at", { ascending: false })

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Expenses</h1>
          <p className="text-muted-foreground">View and manage all company expenses</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Company Expenses
            </CardTitle>
            <CardDescription>All submitted expenses across your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesList expenses={expenses || []} showEmployee allowDelete />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SubmitExpenseForm } from "@/components/submit-expense-form"

export default async function SubmitExpensePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "employee") {
    redirect("/dashboard")
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Submit Expense</h1>
        <p className="text-muted-foreground mt-1">Fill in the details and upload your receipt</p>
      </div>

      <SubmitExpenseForm companyId={profile.company_id} userId={user.id} />
    </div>
  )
}

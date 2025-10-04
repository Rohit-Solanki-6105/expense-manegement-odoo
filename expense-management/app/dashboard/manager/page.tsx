import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ApprovalQueue } from "@/components/approval-queue"

export default async function ManagerDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role === "employee") {
    redirect("/dashboard")
  }

  // Get pending approval requests for this user
  const { data: approvalRequests } = await supabase
    .from("approval_requests")
    .select(
      `
      *,
      expense:expenses(
        *,
        employee:profiles!expenses_employee_id_fkey(full_name, email)
      )
    `,
    )
    .eq("approver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  // Filter for sequential approvals - only show if previous approvals are done
  const validRequests = []
  if (approvalRequests) {
    for (const request of approvalRequests) {
      // Check if there are any previous approvals for this expense
      const { data: previousApprovals } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("expense_id", request.expense_id)
        .lt("order_sequence", request.order_sequence)

      // Only show if all previous approvals are approved
      const allPreviousApproved = previousApprovals?.every((prev) => prev.status === "approved")

      if (allPreviousApproved) {
        validRequests.push(request)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Approval Queue</h1>
        <p className="text-muted-foreground mt-1">Review and approve pending expense requests</p>
      </div>

      <ApprovalQueue requests={validRequests} />
    </div>
  )
}

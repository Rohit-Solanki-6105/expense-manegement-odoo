import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Settings } from "lucide-react"
import Link from "next/link"
import { ApprovalRulesList } from "@/components/approval-rules-list"

export default async function ApprovalRulesPage() {
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

  // Get approval rules with approver details
  const { data: rules } = await supabase
    .from("approval_rules")
    .select(
      `
      *,
      approver:profiles!approval_rules_approver_id_fkey(full_name, email)
    `,
    )
    .eq("company_id", profile.company_id)
    .order("sequence_order", { ascending: true })

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Approval Rules</h1>
            <p className="text-muted-foreground">Configure multi-level approval workflows</p>
          </div>
          <Link href="/dashboard/admin/rules/add">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Active Rules
            </CardTitle>
            <CardDescription>Rules are applied in sequence order when expenses are submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalRulesList rules={rules || []} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

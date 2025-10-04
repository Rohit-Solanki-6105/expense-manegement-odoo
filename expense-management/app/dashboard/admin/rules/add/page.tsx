import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddApprovalRuleForm } from "@/components/add-approval-rule-form"

export default async function AddApprovalRulePage() {
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

  // Get managers for approver selection
  const { data: managers } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("company_id", profile.company_id)
    .in("role", ["admin", "manager"])
    .order("full_name")

  return (
    <DashboardLayout profile={profile}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Approval Rule</h1>
          <p className="text-muted-foreground">Configure a new approval workflow rule</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rule Configuration</CardTitle>
            <CardDescription>Define when and how expenses should be approved</CardDescription>
          </CardHeader>
          <CardContent>
            <AddApprovalRuleForm companyId={profile.company_id} managers={managers || []} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

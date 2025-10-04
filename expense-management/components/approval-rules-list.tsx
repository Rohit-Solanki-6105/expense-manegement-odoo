"use client"

import { Badge } from "@/components/ui/badge"
import type { ApprovalRule } from "@/lib/types"
import { DeleteApprovalRuleButton } from "@/components/delete-approval-rule-button"

interface ApprovalRulesListProps {
  rules: (ApprovalRule & { approver?: { full_name: string; email: string } | null })[]
}

export function ApprovalRulesList({ rules }: ApprovalRulesListProps) {
  if (!rules.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No approval rules configured yet</p>
        <p className="text-sm">Add rules to automate expense approval workflows</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <div key={rule.id} className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              {index + 1}
            </div>
            <div className="space-y-1">
              <p className="font-medium">{rule.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="capitalize">
                  {rule.rule_type.replace("_", " ")}
                </Badge>
                {rule.rule_type === "percentage" && rule.threshold_percentage && (
                  <span>• {rule.threshold_percentage}% threshold</span>
                )}
                {rule.rule_type === "specific_approver" && rule.approver && (
                  <span>• Approver: {rule.approver.full_name}</span>
                )}
                {rule.rule_type === "hybrid" && (
                  <span>
                    • ${rule.threshold_amount} or {rule.threshold_percentage}%
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rule.is_active ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
            <DeleteApprovalRuleButton ruleId={rule.id} ruleName={rule.name} />
          </div>
        </div>
      ))}
    </div>
  )
}

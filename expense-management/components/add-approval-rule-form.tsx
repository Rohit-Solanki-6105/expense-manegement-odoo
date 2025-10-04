"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { ApprovalRuleType } from "@/lib/types"

interface AddApprovalRuleFormProps {
  companyId: string
  managers: { id: string; full_name: string; email: string }[]
}

export function AddApprovalRuleForm({ companyId, managers }: AddApprovalRuleFormProps) {
  const [name, setName] = useState("")
  const [ruleType, setRuleType] = useState<ApprovalRuleType>("percentage")
  const [thresholdAmount, setThresholdAmount] = useState("")
  const [thresholdPercentage, setThresholdPercentage] = useState("")
  const [approverId, setApproverId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Get the next sequence order
      const { data: existingRules } = await supabase
        .from("approval_rules")
        .select("sequence_order")
        .eq("company_id", companyId)
        .order("sequence_order", { ascending: false })
        .limit(1)

      const nextSequence = existingRules && existingRules.length > 0 ? existingRules[0].sequence_order + 1 : 1

      const ruleData: any = {
        company_id: companyId,
        name,
        rule_type: ruleType,
        sequence_order: nextSequence,
        is_active: true,
      }

      if (ruleType === "percentage" && thresholdPercentage) {
        ruleData.threshold_percentage = Number.parseInt(thresholdPercentage)
      }

      if (ruleType === "specific_approver" && approverId) {
        ruleData.approver_id = approverId
      }

      if (ruleType === "hybrid") {
        if (thresholdAmount) ruleData.threshold_amount = Number.parseFloat(thresholdAmount)
        if (thresholdPercentage) ruleData.threshold_percentage = Number.parseInt(thresholdPercentage)
        if (approverId) ruleData.approver_id = approverId
      }

      const { error: insertError } = await supabase.from("approval_rules").insert(ruleData)

      if (insertError) throw insertError

      router.push("/dashboard/admin/rules")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="e.g., Manager approval for expenses over $500"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ruleType">Rule Type</Label>
        <Select value={ruleType} onValueChange={(value: ApprovalRuleType) => setRuleType(value)}>
          <SelectTrigger id="ruleType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentage-based</SelectItem>
            <SelectItem value="specific_approver">Specific Approver</SelectItem>
            <SelectItem value="hybrid">Hybrid (Amount + Percentage)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {ruleType === "percentage" && "Trigger approval when expense exceeds a percentage of budget"}
          {ruleType === "specific_approver" && "Always route to a specific approver"}
          {ruleType === "hybrid" && "Combine amount threshold with percentage or specific approver"}
        </p>
      </div>

      {(ruleType === "percentage" || ruleType === "hybrid") && (
        <div className="space-y-2">
          <Label htmlFor="thresholdPercentage">Threshold Percentage</Label>
          <Input
            id="thresholdPercentage"
            type="number"
            placeholder="e.g., 10"
            min="0"
            max="100"
            value={thresholdPercentage}
            onChange={(e) => setThresholdPercentage(e.target.value)}
            required={ruleType === "percentage"}
          />
        </div>
      )}

      {ruleType === "hybrid" && (
        <div className="space-y-2">
          <Label htmlFor="thresholdAmount">Threshold Amount ($)</Label>
          <Input
            id="thresholdAmount"
            type="number"
            placeholder="e.g., 500"
            min="0"
            step="0.01"
            value={thresholdAmount}
            onChange={(e) => setThresholdAmount(e.target.value)}
          />
        </div>
      )}

      {(ruleType === "specific_approver" || ruleType === "hybrid") && (
        <div className="space-y-2">
          <Label htmlFor="approver">Approver</Label>
          <Select value={approverId} onValueChange={setApproverId} required={ruleType === "specific_approver"}>
            <SelectTrigger id="approver">
              <SelectValue placeholder="Select an approver" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.full_name} ({manager.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Rule"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

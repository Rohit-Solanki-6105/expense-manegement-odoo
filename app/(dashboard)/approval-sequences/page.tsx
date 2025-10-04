"use client"

import { ApprovalSequenceComponent } from "@/components/approval-sequence"

export default function ApprovalSequencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approval Sequences</h1>
        <p className="text-muted-foreground">
          Manage approval workflows for expense processing
        </p>
      </div>

      <ApprovalSequenceComponent mode="edit" />
    </div>
  )
}
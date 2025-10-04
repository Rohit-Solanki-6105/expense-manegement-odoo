"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, X, ExternalLink, Loader2, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ApprovalRequest {
  id: string
  expense_id: string
  status: string
  order_sequence: number
  created_at: string
  expense: {
    id: string
    title: string
    description: string | null
    amount: number
    currency: string
    category: string
    receipt_url: string | null
    expense_date: string
    employee: {
      full_name: string
      email: string
    }
  }
}

interface ApprovalQueueProps {
  requests: ApprovalRequest[]
}

export function ApprovalQueue({ requests }: ApprovalQueueProps) {
  const router = useRouter()
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAction = async (requestId: string, expenseId: string, actionType: "approve" | "reject") => {
    setLoading(true)

    try {
      const supabase = createClient()

      // Update approval request status
      const newStatus = actionType === "approve" ? "approved" : "rejected"
      await supabase
        .from("approval_requests")
        .update({
          status: newStatus,
          comments: comment || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      // Check if all approval requests for this expense are complete
      const { data: allRequests } = await supabase
        .from("approval_requests")
        .select("status")
        .eq("expense_id", expenseId)

      if (allRequests) {
        const allApproved = allRequests.every((req) => req.status === "approved")
        const anyRejected = allRequests.some((req) => req.status === "rejected")

        let expenseStatus = "pending"
        if (anyRejected) {
          expenseStatus = "rejected"
        } else if (allApproved) {
          expenseStatus = "approved"
        }

        // Update expense status
        await supabase.from("expenses").update({ status: expenseStatus }).eq("id", expenseId)
      }

      setSelectedRequest(null)
      setAction(null)
      setComment("")
      router.refresh()
    } catch (error) {
      console.error("Action error:", error)
      alert("Failed to process request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (request: ApprovalRequest, actionType: "approve" | "reject") => {
    setSelectedRequest(request)
    setAction(actionType)
  }

  if (!requests.length) {
    return (
      <Card className="p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Check className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
        <p className="mt-2 text-sm text-muted-foreground">No pending approval requests at the moment.</p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{request.expense.title}</h3>
                    <Badge
                      variant="outline"
                      className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                    >
                      Pending Review
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Submitted by {request.expense.employee.full_name} ({request.expense.employee.email})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {request.expense.currency} {request.expense.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.expense.expense_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {request.expense.description && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm">{request.expense.description}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category: </span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{request.expense.category}</span>
                </div>
                {request.expense.receipt_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={request.expense.receipt_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      View Receipt
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => openDialog(request, "approve")} className="flex-1">
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button onClick={() => openDialog(request, "reject")} variant="destructive" className="flex-1">
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "approve" ? "Approve" : "Reject"} Expense</DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "You are about to approve this expense request."
                : "You are about to reject this expense request."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="font-medium">{selectedRequest.expense.title}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.expense.currency} {selectedRequest.expense.amount.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Comment {action === "reject" && "(Required)"}</Label>
                <Textarea
                  id="comment"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null)
                    setAction(null)
                    setComment("")
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAction(selectedRequest.id, selectedRequest.expense_id, action!)}
                  disabled={loading || (action === "reject" && !comment.trim())}
                  variant={action === "approve" ? "default" : "destructive"}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {action === "approve" ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Confirm Approval
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Confirm Rejection
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

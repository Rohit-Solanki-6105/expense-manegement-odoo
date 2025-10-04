"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Eye, Clock, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { ApprovalStatusDialog } from "@/components/approval-status-dialog"

interface Approval {
    id: string
    status: string
    comments: string | null
    createdAt: string
    isSequenceApproval?: boolean // Flag to distinguish between old and new systems
    expense: {
        id: string
        title: string
        description: string | null
        amount: number
        currency: string
        date: string
        status: string
        submitter: {
            name: string | null
            email: string
            role: string
        }
        category: {
            name: string
            color: string | null
        }
        approvalSequence?: {
            id: string
            name: string
            description?: string
            minApprovalPercentage: number
            isActive: boolean
            steps: Array<{
                id: string
                managerId: string
                manager: {
                    id: string
                    name: string | null
                    email: string
                    role: string
                }
                order: number
                status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED"
                approvedAt?: string
                comments?: string
            }>
        }
    }
}

export default function ApprovalsPage() {
    const { data: session } = useSession()
    const [approvals, setApprovals] = useState<Approval[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED")
    const [comments, setComments] = useState("")
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchApprovals()
    }, [])

    const fetchApprovals = async () => {
        try {
            // Use the main approvals endpoint which now handles both systems
            const response = await fetch("/api/approvals")
            if (response.ok) {
                const data = await response.json()
                setApprovals(data)
            }
        } catch (error) {
            toast.error("Failed to fetch approvals")
        } finally {
            setLoading(false)
        }
    }

    const handleApprovalAction = (approval: Approval, action: "APPROVED" | "REJECTED") => {
        setSelectedApproval(approval)
        setActionType(action)
        setComments("")
        setDialogOpen(true)
    }

    const submitApproval = async () => {
        if (!selectedApproval) return

        if (actionType === "REJECTED" && !comments.trim()) {
            toast.error("Comments are required when rejecting an expense")
            return
        }

        setProcessing(true)

        try {
            let response: Response

            if (selectedApproval.isSequenceApproval) {
                // Handle new approval sequence system
                const expenseId = selectedApproval.expense.id
                
                // Find the current user's pending step in the approval sequence
                const currentStep = selectedApproval.expense.approvalSequence?.steps.find(
                    step => step.managerId === session?.user.id && step.status === "PENDING"
                )

                if (!currentStep) {
                    toast.error("No pending approval step found for you")
                    return
                }

                response = await fetch(`/api/expenses/${expenseId}/approve`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        stepId: currentStep.id,
                        action: actionType,
                        comments: comments.trim() || null
                    })
                })
            } else {
                // Handle old approval system
                response = await fetch("/api/approvals", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        approvalId: selectedApproval.id,
                        status: actionType,
                        comments: comments.trim() || null
                    })
                })
            }

            if (response.ok) {
                toast.success(`Expense ${actionType.toLowerCase()} successfully`)
                fetchApprovals()
                setDialogOpen(false)
                setSelectedApproval(null)
                setComments("")
            } else {
                const error = await response.json()
                toast.error(error.error || "Failed to process approval")
            }
        } catch (error) {
            toast.error("Failed to process approval")
        } finally {
            setProcessing(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "APPROVED": return "bg-green-100 text-green-800"
            case "REJECTED": return "bg-red-100 text-red-800"
            case "PENDING": return "bg-yellow-100 text-yellow-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Access denied. Manager or Admin role required.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Approvals</h2>
                    <p className="text-muted-foreground">
                        Review and approve expense submissions
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{approvals.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting your review
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${approvals.reduce((sum, approval) => sum + approval.expense.amount, 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pending expenses total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Amount</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${approvals.length > 0 ? (approvals.reduce((sum, approval) => sum + approval.expense.amount, 0) / approvals.length).toFixed(2) : "0.00"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Per expense
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Approvals Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>
                        Expenses waiting for your approval
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading approvals...</div>
                    ) : approvals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="mx-auto h-12 w-12 mb-4" />
                            <p>No pending approvals.</p>
                            <p className="text-sm">All caught up! Check back later for new submissions.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Expense</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Submitter</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvals.map((approval) => (
                                    <TableRow key={approval.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{approval.expense.title}</div>
                                                {approval.expense.description && (
                                                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                        {approval.expense.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: approval.expense.category.color || "#3B82F6" }}
                                                />
                                                <span className="text-sm">{approval.expense.category.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {approval.expense.currency} {approval.expense.amount.toFixed(2)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {format(new Date(approval.expense.date), "MMM dd, yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {approval.expense.submitter.name || approval.expense.submitter.email}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {approval.expense.submitter.role}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <ApprovalStatusDialog
                                                    expense={approval.expense}
                                                    trigger={
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleApprovalAction(approval, "APPROVED")}
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleApprovalAction(approval, "REJECTED")}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Approval Action Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === "APPROVED" ? "Approve" : "Reject"} Expense
                        </DialogTitle>
                        <DialogDescription>
                            {selectedApproval && (
                                <>
                                    <span className="font-medium">{selectedApproval.expense.title}</span>
                                    {" - "}
                                    <span>
                                        {selectedApproval.expense.currency} {selectedApproval.expense.amount.toFixed(2)}
                                    </span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {selectedApproval && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Category:</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: selectedApproval.expense.category.color || "#3B82F6" }}
                                            />
                                            {selectedApproval.expense.category.name}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-medium">Date:</span>
                                        <div className="mt-1">
                                            {format(new Date(selectedApproval.expense.date), "PPP")}
                                        </div>
                                    </div>
                                </div>

                                {selectedApproval.expense.description && (
                                    <div>
                                        <span className="font-medium text-sm">Description:</span>
                                        <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                                            {selectedApproval.expense.description}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="comments">
                                        Comments {actionType === "REJECTED" && <span className="text-red-500">*</span>}
                                    </Label>
                                    <Textarea
                                        id="comments"
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder={
                                            actionType === "APPROVED"
                                                ? "Optional comments about the approval..."
                                                : "Please provide a reason for rejection..."
                                        }
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitApproval}
                            disabled={processing}
                            className={actionType === "REJECTED" ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                            {processing ? "Processing..." : actionType === "APPROVED" ? "Approve" : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Users, 
  ArrowRight,
  Eye,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"

interface Manager {
  id: string
  name: string | null
  email: string
  role: string
}

interface ApprovalStep {
  id: string
  managerId: string
  manager: Manager
  order: number
  status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED"
  approvedAt?: string
  comments?: string
}

interface ApprovalSequence {
  id: string
  name: string
  description?: string
  minApprovalPercentage: number
  isActive: boolean
  steps: ApprovalStep[]
}

interface Expense {
  id: string
  title: string
  amount: number
  currency: string
  status: string
  approvalSequence?: ApprovalSequence
}

interface ApprovalStatusDialogProps {
  expense: Expense
  trigger?: React.ReactNode
}

export function ApprovalStatusDialog({ expense, trigger }: ApprovalStatusDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!expense.approvalSequence) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Approval Status
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approval Status</DialogTitle>
            <DialogDescription>
              This expense uses the default approval process
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No sequential approval workflow assigned to this expense.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Status: <Badge variant={expense.status === "APPROVED" ? "default" : expense.status === "REJECTED" ? "destructive" : "secondary"}>
                {expense.status}
              </Badge>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const { steps } = expense.approvalSequence
  const totalSteps = steps.length
  const approvedSteps = steps.filter(step => step.status === "APPROVED").length
  const rejectedSteps = steps.filter(step => step.status === "REJECTED").length
  const pendingSteps = steps.filter(step => step.status === "PENDING").length
  
  const approvalPercentage = totalSteps > 0 ? (approvedSteps / totalSteps) * 100 : 0
  const requiredApprovals = Math.ceil((expense.approvalSequence.minApprovalPercentage / 100) * totalSteps)
  const isCompleted = approvedSteps >= requiredApprovals
  const isRejected = rejectedSteps > 0
  
  const currentStep = steps.find(step => step.status === "PENDING")
  const currentStepIndex = currentStep ? steps.findIndex(step => step.id === currentStep.id) : -1

  const getStepIcon = (step: ApprovalStep, index: number) => {
    switch (step.status) {
      case "APPROVED":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "PENDING":
        return index === currentStepIndex ? 
          <Clock className="h-5 w-5 text-blue-600" /> : 
          <Clock className="h-5 w-5 text-muted-foreground" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStepBadge = (step: ApprovalStep, index: number) => {
    switch (step.status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "PENDING":
        return index === currentStepIndex ? 
          <Badge className="bg-blue-100 text-blue-800">Current</Badge> :
          <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Approval Status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Approval Progress: {expense.title}
          </DialogTitle>
          <DialogDescription>
            Workflow: {expense.approvalSequence.name}
            {expense.approvalSequence.description && ` - ${expense.approvalSequence.description}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {approvedSteps}/{totalSteps} approved
              </span>
            </div>
            <Progress value={approvalPercentage} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">{approvedSteps}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-yellow-600">{pendingSteps}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-600">{rejectedSteps}</div>
                <div className="text-xs text-muted-foreground">Rejected</div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50">
              {isRejected ? (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-600">Expense Rejected</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">
                    Approval Requirements Met ({requiredApprovals}/{totalSteps} required)
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-600">
                    Awaiting Approvals ({requiredApprovals - approvedSteps} more needed)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Approval Steps */}
          <div className="space-y-4">
            <h4 className="font-medium">Approval Sequence</h4>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs">
                      {getInitials(step.manager.name, step.manager.email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {step.manager.name || step.manager.email}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {step.manager.email}
                    </div>
                    {step.approvedAt && (
                      <div className="text-xs text-muted-foreground">
                        {step.status === "APPROVED" ? "Approved" : "Rejected"} on{" "}
                        {format(new Date(step.approvedAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    )}
                    {step.comments && (
                      <div className="text-xs bg-muted p-2 rounded mt-1 max-w-xs">
                        <strong>Comment:</strong> {step.comments}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStepIcon(step, index)}
                    {getStepBadge(step, index)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Approval Requirements</span>
            </div>
            <p className="text-xs text-blue-600">
              This expense requires {expense.approvalSequence.minApprovalPercentage}% approval 
              ({requiredApprovals} out of {totalSteps} managers) to be accepted.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
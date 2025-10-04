"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowRight, 
  Check, 
  Clock, 
  X, 
  Users,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

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
  createdAt: string
  updatedAt: string
}

interface ApprovalSequenceComponentProps {
  expenseId?: string
  currentSequence?: ApprovalSequence
  onSequenceUpdate?: (sequence: ApprovalSequence) => void
  mode?: "view" | "edit" | "approve"
}

export function ApprovalSequenceComponent({ 
  expenseId, 
  currentSequence, 
  onSequenceUpdate, 
  mode = "view" 
}: ApprovalSequenceComponentProps) {
  const { data: session } = useSession()
  const [managers, setManagers] = useState<Manager[]>([])
  const [sequences, setSequences] = useState<ApprovalSequence[]>([])
  const [selectedSequence, setSelectedSequence] = useState<ApprovalSequence | null>(currentSequence || null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state for creating/editing sequences
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minApprovalPercentage: 50,
    selectedManagerIds: [] as string[]
  })

  const userRole = session?.user?.role as string
  const userId = session?.user?.id as string
  const isAdmin = userRole === "ADMIN"
  const isManager = userRole === "MANAGER"

  useEffect(() => {
    fetchManagers()
    fetchSequences() // Allow all users to fetch sequences for viewing
  }, [])

  const fetchManagers = async () => {
    try {
      const response = await fetch("/api/users?role=MANAGER")
      if (response.ok) {
        const data = await response.json()
        setManagers(data.filter((user: Manager) => user.role === "MANAGER"))
      }
    } catch (error) {
      toast.error("Failed to fetch managers")
    }
  }

  const fetchSequences = async () => {
    try {
      const response = await fetch("/api/approval-sequences")
      if (response.ok) {
        const data = await response.json()
        setSequences(data)
      } else {
        console.error("Failed to fetch approval sequences:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch approval sequences:", error)
      toast.error("Failed to fetch approval sequences")
    }
  }

  const calculateApprovalProgress = (sequence: ApprovalSequence) => {
    const totalSteps = sequence.steps.length
    const approvedSteps = sequence.steps.filter(step => step.status === "APPROVED").length
    const rejectedSteps = sequence.steps.filter(step => step.status === "REJECTED").length
    
    const approvalPercentage = totalSteps > 0 ? (approvedSteps / totalSteps) * 100 : 0
    const isCompleted = approvedSteps >= Math.ceil((sequence.minApprovalPercentage / 100) * totalSteps)
    const isRejected = rejectedSteps > 0
    
    return {
      totalSteps,
      approvedSteps,
      rejectedSteps,
      approvalPercentage,
      isCompleted,
      isRejected,
      currentStep: sequence.steps.find(step => step.status === "PENDING")
    }
  }

  const handleCreateSequence = async () => {
    if (!formData.name.trim() || formData.selectedManagerIds.length === 0) {
      toast.error("Please provide sequence name and select at least one manager")
      return
    }

    setLoading(true)
    try {
      console.log("Creating sequence with data:", {
        name: formData.name,
        description: formData.description,
        minApprovalPercentage: formData.minApprovalPercentage,
        managerIds: formData.selectedManagerIds
      })

      const response = await fetch("/api/approval-sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          minApprovalPercentage: formData.minApprovalPercentage,
          managerIds: formData.selectedManagerIds
        })
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        const newSequence = await response.json()
        console.log("Created sequence:", newSequence)
        setSequences(prev => [...prev, newSequence])
        setIsCreateDialogOpen(false)
        resetForm()
        toast.success("Approval sequence created successfully")
      } else {
        const errorData = await response.json()
        console.error("Error creating sequence:", errorData)
        toast.error(errorData.error || "Failed to create approval sequence")
      }
    } catch (error) {
      console.error("Exception creating sequence:", error)
      toast.error("Failed to create approval sequence")
    } finally {
      setLoading(false)
    }
  }

  const handleApproveStep = async (stepId: string, action: "APPROVED" | "REJECTED", comments?: string) => {
    if (!selectedSequence || !expenseId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          action,
          comments
        })
      })

      if (response.ok) {
        const updatedSequence = await response.json()
        setSelectedSequence(updatedSequence)
        onSequenceUpdate?.(updatedSequence)
        toast.success(`Step ${action.toLowerCase()} successfully`)
      } else {
        toast.error("Failed to process approval")
      }
    } catch (error) {
      toast.error("Failed to process approval")
    } finally {
      setLoading(false)
    }
  }

  const moveManagerInSequence = (index: number, direction: "up" | "down") => {
    const newManagerIds = [...formData.selectedManagerIds]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newManagerIds.length) {
      [newManagerIds[index], newManagerIds[targetIndex]] = [newManagerIds[targetIndex], newManagerIds[index]]
      setFormData(prev => ({ ...prev, selectedManagerIds: newManagerIds }))
    }
  }

  const removeManagerFromSequence = (managerId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedManagerIds: prev.selectedManagerIds.filter(id => id !== managerId)
    }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      minApprovalPercentage: 50,
      selectedManagerIds: []
    })
  }

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Rejected</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const canUserApprove = (step: ApprovalStep) => {
    return isManager && step.managerId === userId && step.status === "PENDING"
  }

  if (mode === "approve" && selectedSequence) {
    const progress = calculateApprovalProgress(selectedSequence)
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Approval Workflow: {selectedSequence.name}
          </CardTitle>
          <CardDescription>
            {selectedSequence.description}
          </CardDescription>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{progress.approvedSteps}/{progress.totalSteps} approved</span>
              </div>
              <Progress value={progress.approvalPercentage} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              Min required: {selectedSequence.minApprovalPercentage}%
            </div>
          </div>
          {progress.isCompleted && (
            <div className="flex items-center gap-2 text-green-600 mt-2">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Approval requirements met</span>
            </div>
          )}
          {progress.isRejected && (
            <div className="flex items-center gap-2 text-red-600 mt-2">
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">Expense rejected</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedSequence.steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  {index < selectedSequence.steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="font-medium">{step.manager.name || step.manager.email}</div>
                  <div className="text-sm text-muted-foreground">{step.manager.email}</div>
                  {step.approvedAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.status} on {new Date(step.approvedAt).toLocaleDateString()}
                    </div>
                  )}
                  {step.comments && (
                    <div className="text-xs bg-gray-50 p-2 rounded mt-2">
                      <strong>Comments:</strong> {step.comments}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {getStepStatusBadge(step.status)}
                  
                  {canUserApprove(step) && (
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-green-600">
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve Expense</DialogTitle>
                            <DialogDescription>
                              Add any comments for this approval (optional)
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="approve-comments">Comments</Label>
                              <Input
                                id="approve-comments"
                                placeholder="Optional comments..."
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleApproveStep(step.id, "APPROVED", e.currentTarget.value)
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                const comments = document.getElementById("approve-comments") as HTMLInputElement
                                handleApproveStep(step.id, "APPROVED", comments?.value)
                              }}
                              disabled={loading}
                            >
                              Approve
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Expense</DialogTitle>
                            <DialogDescription>
                              Please provide a reason for rejection
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="reject-comments">Reason for rejection</Label>
                              <Input
                                id="reject-comments"
                                placeholder="Please provide a reason..."
                                required
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                    handleApproveStep(step.id, "REJECTED", e.currentTarget.value)
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                const comments = document.getElementById("reject-comments") as HTMLInputElement
                                if (comments?.value.trim()) {
                                  handleApproveStep(step.id, "REJECTED", comments.value)
                                } else {
                                  toast.error("Please provide a reason for rejection")
                                }
                              }}
                              disabled={loading}
                              variant="destructive"
                            >
                              Reject
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Approval Sequences
            </CardTitle>
            <CardDescription>
              Configure approval workflows for expense processing
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sequence
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Approval Sequence</DialogTitle>
                  <DialogDescription>
                    Set up a new approval workflow for expenses
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="sequence-name">Sequence Name</Label>
                      <Input
                        id="sequence-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Standard Approval Flow"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sequence-description">Description (Optional)</Label>
                      <Input
                        id="sequence-description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of this approval sequence"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="min-approval">Minimum Approval Percentage</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="min-approval"
                          type="number"
                          min="1"
                          max="100"
                          value={formData.minApprovalPercentage}
                          onChange={(e) => setFormData(prev => ({ ...prev, minApprovalPercentage: parseInt(e.target.value) || 50 }))}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">% of managers must approve</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>Approval Sequence</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add managers in the order they should approve expenses. Use the arrows to reorder.
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <Select
                        onValueChange={(managerId) => {
                          if (!formData.selectedManagerIds.includes(managerId)) {
                            setFormData(prev => ({
                              ...prev,
                              selectedManagerIds: [...prev.selectedManagerIds, managerId]
                            }))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add a manager to the sequence" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers
                            .filter(manager => !formData.selectedManagerIds.includes(manager.id))
                            .map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name || manager.email}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      {formData.selectedManagerIds.map((managerId, index) => {
                        const manager = managers.find(m => m.id === managerId)
                        if (!manager) return null

                        return (
                          <div key={managerId} className="flex items-center gap-2 p-3 border rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-medium">{manager.name || manager.email}</div>
                              <div className="text-sm text-muted-foreground">{manager.email}</div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveManagerInSequence(index, "up")}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveManagerInSequence(index, "down")}
                                disabled={index === formData.selectedManagerIds.length - 1}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeManagerFromSequence(managerId)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {formData.selectedManagerIds.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Approval Calculation</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">
                          With {formData.minApprovalPercentage}% requirement, 
                          {" " + Math.ceil((formData.minApprovalPercentage / 100) * formData.selectedManagerIds.length)} 
                          {" "}out of {formData.selectedManagerIds.length} managers must approve for the expense to be accepted.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSequence} disabled={loading}>
                    Create Sequence
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {sequences.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-4" />
            <p>No approval sequences configured yet.</p>
            {isAdmin && (
              <p className="text-sm">Create your first approval sequence to get started.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sequences.map((sequence) => {
              const progress = calculateApprovalProgress(sequence)
              
              return (
                <div key={sequence.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{sequence.name}</h3>
                      {sequence.description && (
                        <p className="text-sm text-muted-foreground">{sequence.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sequence.isActive ? "default" : "secondary"}>
                        {sequence.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {isAdmin && (
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>{sequence.steps.length} managers</span>
                    <span>Min {sequence.minApprovalPercentage}% approval</span>
                    <span>
                      Requires {Math.ceil((sequence.minApprovalPercentage / 100) * sequence.steps.length)} approvals
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {sequence.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                          <span>{index + 1}.</span>
                          <span>{step.manager.name || step.manager.email}</span>
                        </div>
                        {index < sequence.steps.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
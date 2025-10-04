import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/expenses/[id]/approve - Process approval step
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { stepId, action, comments } = await request.json()
    const expenseId = params.id
    const managerId = session.user.id

    if (!stepId || !action || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { error: "Step ID and valid action (APPROVED/REJECTED) are required" },
        { status: 400 }
      )
    }

    // Get the expense with its approval sequence
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        approvalSequence: {
          include: {
            steps: {
              include: {
                manager: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                  }
                }
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    })

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    if (!expense.approvalSequence) {
      return NextResponse.json(
        { error: "No approval sequence assigned to this expense" },
        { status: 400 }
      )
    }

    // Find the specific step
    const step = expense.approvalSequence.steps.find((s: any) => s.id === stepId)
    if (!step) {
      return NextResponse.json(
        { error: "Approval step not found" },
        { status: 404 }
      )
    }

    // Verify the manager can approve this step
    if (step.managerId !== managerId) {
      return NextResponse.json(
        { error: "You are not authorized to approve this step" },
        { status: 403 }
      )
    }

    if (step.status !== "PENDING") {
      return NextResponse.json(
        { error: "This step has already been processed" },
        { status: 400 }
      )
    }

    // Update the approval step
    const updatedStep = await prisma.approvalStep.update({
      where: { id: stepId },
      data: {
        status: action,
        approvedAt: new Date(),
        comments: comments || null
      }
    })

    // Get updated sequence to calculate approval status
    const updatedSequence = await prisma.approvalSequence.findUnique({
      where: { id: expense.approvalSequence.id },
      include: {
        steps: {
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!updatedSequence) {
      return NextResponse.json(
        { error: "Failed to get updated sequence" },
        { status: 500 }
      )
    }

    // Calculate approval status
    const totalSteps = updatedSequence.steps.length
    const approvedSteps = updatedSequence.steps.filter((s: any) => s.status === "APPROVED").length
    const rejectedSteps = updatedSequence.steps.filter((s: any) => s.status === "REJECTED").length
    const requiredApprovals = Math.ceil((updatedSequence.minApprovalPercentage / 100) * totalSteps)

    let newExpenseStatus = expense.status

    if (rejectedSteps > 0) {
      // If any step is rejected, expense is rejected
      newExpenseStatus = "REJECTED"
    } else if (approvedSteps >= requiredApprovals) {
      // If minimum approvals are met, expense is approved
      newExpenseStatus = "APPROVED"
    }

    // Update expense status if it changed
    if (newExpenseStatus !== expense.status) {
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: newExpenseStatus }
      })
    }

    // Return the updated sequence
    return NextResponse.json(updatedSequence)
  } catch (error) {
    console.error("Error processing approval:", error)
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const managerId = session.user.id

    // Get pending approvals from the old approval system
    const oldSystemApprovals = await prisma.approval.findMany({
      where: {
        approverId: managerId,
        status: "PENDING"
      },
      include: {
        expense: {
          include: {
            submitter: {
              select: {
                name: true,
                email: true,
                role: true
              }
            },
            category: {
              select: {
                name: true,
                color: true
              }
            },
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
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Get expenses with approval sequences where this manager has a pending step
    const expensesWithSequences = await prisma.expense.findMany({
      where: {
        AND: [
          {
            approvalSequenceId: {
              not: null
            }
          },
          {
            status: "PENDING"
          },
          {
            approvalSequence: {
              steps: {
                some: {
                  managerId: managerId,
                  status: "PENDING"
                }
              }
            }
          }
        ]
      },
      include: {
        submitter: {
          select: {
            name: true,
            email: true,
            role: true
          }
        },
        category: {
          select: {
            name: true,
            color: true
          }
        },
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
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Convert approval sequence expenses to the approval format
    const sequenceApprovals = expensesWithSequences.map((expense: any) => {
      // Find the pending step for this manager
      const pendingStep = expense.approvalSequence?.steps.find(
        (step: any) => step.managerId === managerId && step.status === "PENDING"
      )

      return {
        id: `seq_${expense.id}_${pendingStep?.id}`, // Unique ID for sequence approvals
        status: "PENDING",
        comments: null,
        createdAt: expense.createdAt,
        expense: expense,
        isSequenceApproval: true,
        stepId: pendingStep?.id // Store step ID for later use
      }
    })

    // Combine both systems
    const allApprovals = [
      ...oldSystemApprovals.map((approval: any) => ({ ...approval, isSequenceApproval: false })),
      ...sequenceApprovals
    ]

    return NextResponse.json(allApprovals)
  } catch (error) {
    console.error("Error fetching approvals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { approvalId, status, comments } = await request.json()

    if (!approvalId || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid approval ID or status" },
        { status: 400 }
      )
    }

    // Verify the approval belongs to this user
    const approval = await prisma.approval.findFirst({
      where: {
        id: approvalId,
        approverId: session.user.id,
        status: "PENDING"
      },
      include: {
        expense: true
      }
    })

    if (!approval) {
      return NextResponse.json(
        { error: "Approval not found or already processed" },
        { status: 404 }
      )
    }

    // Update the approval
    const updatedApproval = await prisma.approval.update({
      where: {
        id: approvalId
      },
      data: {
        status,
        comments
      }
    })

    // Check if all approvals are complete and update expense status
    const allApprovals = await prisma.approval.findMany({
      where: {
        expenseId: approval.expense.id
      }
    })

    const pendingApprovals = allApprovals.filter((a: any) => a.status === "PENDING")
    const rejectedApprovals = allApprovals.filter((a: any) => a.status === "REJECTED")

    let newExpenseStatus = approval.expense.status

    if (rejectedApprovals.length > 0) {
      // If any approval is rejected, reject the expense
      newExpenseStatus = "REJECTED"
    } else if (pendingApprovals.length === 0) {
      // If no pending approvals, approve the expense
      newExpenseStatus = "APPROVED"
    }

    if (newExpenseStatus !== approval.expense.status) {
      await prisma.expense.update({
        where: {
          id: approval.expense.id
        },
        data: {
          status: newExpenseStatus,
          ...(status === "REJECTED" && comments && { rejectionReason: comments })
        }
      })
    }

    return NextResponse.json({
      ...updatedApproval,
      expense: {
        ...approval.expense,
        status: newExpenseStatus
      }
    })
  } catch (error) {
    console.error("Error updating approval:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
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

    // Get pending approvals for this user
    const approvals = await prisma.approval.findMany({
      where: {
        approverId: session.user.id,
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
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(approvals)
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
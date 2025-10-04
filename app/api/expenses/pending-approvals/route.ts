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

    // Get expenses that need approval from this manager
    // This includes both approval sequence system and old approval system
    
    // First, get expenses with approval sequences where this manager has a pending step
    const expensesWithSequences = await prisma.expense.findMany({
      where: {
        AND: [
          {
            approvalSequence: {
              isNot: null,
              steps: {
                some: {
                  managerId: managerId,
                  status: "PENDING"
                }
              }
            }
          },
          {
            status: "PENDING"
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

    // Get expenses from old approval system
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

    // Convert new system expenses to the format expected by the frontend
    const newSystemFormatted = expensesWithSequences.map(expense => ({
      id: `seq_${expense.id}`, // Prefix to distinguish from old system
      status: "PENDING",
      comments: null,
      createdAt: expense.createdAt,
      expense: expense,
      isSequenceApproval: true
    }))

    // Convert old system approvals to include the flag
    const oldSystemFormatted = oldSystemApprovals.map(approval => ({
      ...approval,
      isSequenceApproval: false
    }))

    // Combine both systems
    const allApprovals = [...newSystemFormatted, ...oldSystemFormatted]

    return NextResponse.json(allApprovals)
  } catch (error) {
    console.error("Error fetching pending approvals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const categoryId = searchParams.get("categoryId")

    const where: any = {}

    // Role-based filtering
    if (session.user.role === "EMPLOYEE" || 
        (session.user.role === "MANAGER" && session.user.canBeEmployee)) {
      where.submittedBy = session.user.id
    } else if (session.user.role === "MANAGER") {
      // Managers can see expenses from their team (for now, all expenses they can approve)
      where.OR = [
        { submittedBy: session.user.id },
        { 
          submitter: {
            role: { in: ["EMPLOYEE", "MANAGER"] }
          }
        }
      ]
    }
    // Admins can see all expenses (no additional filter)

    if (status) {
      where.status = status
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const expenses = await prisma.expense.findMany({
      where,
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
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can submit expenses
    const canSubmit = session.user.role === "EMPLOYEE" || 
                     session.user.role === "MANAGER" ||
                     ((session.user as any).role === "MANAGER" && (session.user as any).canBeEmployee)

    if (!canSubmit) {
      return NextResponse.json({ error: "Not authorized to submit expenses" }, { status: 403 })
    }

    const { title, description, amount, currency, date, categoryId, receiptUrl } = await request.json()

    if (!title || !amount || !date || !categoryId) {
      return NextResponse.json(
        { error: "Title, amount, date, and category are required" },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      )
    }

    // Verify category exists and is active
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Invalid or inactive category" },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount: parseFloat(amount),
        currency: currency || "USD",
        date: new Date(date),
        categoryId,
        receiptUrl,
        submittedBy: session.user.id
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
        }
      }
    })

    // Create approval records for managers/admins
    const approvers = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "MANAGER"] },
        id: { not: session.user.id } // Don't create approval for self
      }
    })

    if (approvers.length > 0) {
      await prisma.approval.createMany({
        data: approvers.map((approver: any) => ({
          expenseId: expense.id,
          approverId: approver.id
        }))
      })
    }

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
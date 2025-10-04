import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/approval-sequences - Get all approval sequences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Allow all authenticated users to view approval sequences
    const sequences = await prisma.approvalSequence.findMany({
      where: {
        isActive: true
      },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(sequences)
  } catch (error) {
    console.error("Error fetching approval sequences:", error)
    return NextResponse.json(
      { error: "Failed to fetch approval sequences" },
      { status: 500 }
    )
  }
}

// POST /api/approval-sequences - Create new approval sequence
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Creating approval sequence with data:", body)
    
    const { name, description, minApprovalPercentage, managerIds } = body

    if (!name || !managerIds || managerIds.length === 0) {
      return NextResponse.json(
        { error: "Name and manager IDs are required" },
        { status: 400 }
      )
    }

    if (minApprovalPercentage < 1 || minApprovalPercentage > 100) {
      return NextResponse.json(
        { error: "Minimum approval percentage must be between 1 and 100" },
        { status: 400 }
      )
    }

    // Verify all manager IDs exist and are managers
    const managers = await prisma.user.findMany({
      where: {
        id: { in: managerIds },
        role: "MANAGER"
      }
    })

    if (managers.length !== managerIds.length) {
      return NextResponse.json(
        { error: "Some manager IDs are invalid" },
        { status: 400 }
      )
    }

    // Create the approval sequence with steps
    const sequence = await prisma.approvalSequence.create({
      data: {
        name,
        description: description || null,
        minApprovalPercentage,
        isActive: true,
        steps: {
          create: managerIds.map((managerId: string, index: number) => ({
            managerId,
            order: index + 1,
            status: "PENDING"
          }))
        }
      },
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

    console.log("Created approval sequence:", sequence)
    return NextResponse.json(sequence, { status: 201 })
  } catch (error) {
    console.error("Error creating approval sequence:", error)
    return NextResponse.json(
      { error: "Failed to create approval sequence" },
      { status: 500 }
    )
  }
}
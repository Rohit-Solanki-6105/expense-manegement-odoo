import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/approval-sequences/[id] - Update approval sequence
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, minApprovalPercentage, managerIds, isActive } = await request.json()
    const sequenceId = params.id

    // Verify the sequence exists
    const existingSequence = await prisma.approvalSequence.findUnique({
      where: { id: sequenceId },
      include: { steps: true }
    })

    if (!existingSequence) {
      return NextResponse.json(
        { error: "Approval sequence not found" },
        { status: 404 }
      )
    }

    // If updating manager IDs, verify they're all valid managers
    if (managerIds) {
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
    }

    // Update the sequence
    const updatedSequence = await prisma.$transaction(async (tx: any) => {
      // Update basic info
      const sequence = await tx.approvalSequence.update({
        where: { id: sequenceId },
        data: {
          name: name || existingSequence.name,
          description: description !== undefined ? description : existingSequence.description,
          minApprovalPercentage: minApprovalPercentage || existingSequence.minApprovalPercentage,
          isActive: isActive !== undefined ? isActive : existingSequence.isActive
        }
      })

      // If manager IDs are provided, update the steps
      if (managerIds) {
        // Delete existing steps
        await tx.approvalStep.deleteMany({
          where: { sequenceId }
        })

        // Create new steps
        await tx.approvalStep.createMany({
          data: managerIds.map((managerId: string, index: number) => ({
            sequenceId,
            managerId,
            order: index + 1,
            status: "PENDING" as const
          }))
        })
      }

      // Return the updated sequence with steps
      return await tx.approvalSequence.findUnique({
        where: { id: sequenceId },
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
    })

    return NextResponse.json(updatedSequence)
  } catch (error) {
    console.error("Error updating approval sequence:", error)
    return NextResponse.json(
      { error: "Failed to update approval sequence" },
      { status: 500 }
    )
  }
}

// DELETE /api/approval-sequences/[id] - Delete approval sequence
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sequenceId = params.id

    // Check if sequence is being used by any expenses
    const expensesUsingSequence = await prisma.expense.findFirst({
      where: { approvalSequenceId: sequenceId }
    })

    if (expensesUsingSequence) {
      return NextResponse.json(
        { error: "Cannot delete sequence that is being used by expenses" },
        { status: 400 }
      )
    }

    // Delete the sequence (steps will be deleted due to cascade)
    await prisma.approvalSequence.delete({
      where: { id: sequenceId }
    })

    return NextResponse.json({ message: "Approval sequence deleted successfully" })
  } catch (error) {
    console.error("Error deleting approval sequence:", error)
    return NextResponse.json(
      { error: "Failed to delete approval sequence" },
      { status: 500 }
    )
  }
}
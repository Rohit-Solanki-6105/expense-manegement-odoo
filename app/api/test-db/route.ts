import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Check if we have users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    // Check specifically for managers
    const managers = await prisma.user.findMany({
      where: {
        role: "MANAGER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    // Check approval sequences
    const sequences = await prisma.approvalSequence.findMany({
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
          }
        }
      }
    })
    
    return NextResponse.json({
      users: users.length,
      managers: managers.length,
      sequences: sequences.length,
      managersData: managers,
      sequencesData: sequences
    })
    
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      { error: "Database test failed", details: error },
      { status: 500 }
    )
  }
}
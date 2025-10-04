import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: params.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canBeEmployee: true,
        country: true,
        countryCode: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            expenses: true,
            approvals: true,
            categories: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Prevent admin from modifying their own account to avoid lockout
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: "Cannot modify your own account" },
        { status: 400 }
      )
    }

    const { name, email, password, role, canBeEmployee, country, countryCode, currency } = await request.json()

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: params.id }
        }
      })
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already taken by another user" },
          { status: 400 }
        )
      }
      updateData.email = email
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }
    if (role !== undefined) {
      if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(role)) {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
        )
      }
      updateData.role = role
      // Reset canBeEmployee if role is not MANAGER
      if (role !== "MANAGER") {
        updateData.canBeEmployee = false
      }
    }
    if (canBeEmployee !== undefined && updateData.role !== "EMPLOYEE") {
      updateData.canBeEmployee = canBeEmployee
    }
    if (country !== undefined) updateData.country = country
    if (countryCode !== undefined) updateData.countryCode = countryCode
    if (currency !== undefined) updateData.currency = currency

    const user = await prisma.user.update({
      where: {
        id: params.id
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canBeEmployee: true,
        country: true,
        countryCode: true,
        currency: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Prevent admin from deleting their own account
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Check if user has expenses or approvals
    const userWithData = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            expenses: true,
            approvals: true,
            categories: true
          }
        }
      }
    })

    if (!userWithData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (userWithData._count.expenses > 0 || userWithData._count.approvals > 0 || userWithData._count.categories > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete user with existing expenses, approvals, or categories. Consider deactivating instead.",
          details: {
            expenses: userWithData._count.expenses,
            approvals: userWithData._count.approvals,
            categories: userWithData._count.categories
          }
        },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
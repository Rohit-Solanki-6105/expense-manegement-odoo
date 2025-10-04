import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currency } = await request.json()

    if (!currency) {
      return NextResponse.json({ error: "Currency is required" }, { status: 400 })
    }

    // Update user's currency preference
    await prisma.user.update({
      where: { email: session.user.email },
      data: { currency }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user currency:", error)
    return NextResponse.json(
      { error: "Failed to update currency" },
      { status: 500 }
    )
  }
}
import { prisma } from "@/lib/prisma"

async function testDatabase() {
  try {
    console.log("Testing database connection...")
    
    // Check if we have users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    console.log("Users in database:", users)
    
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
    console.log("Managers in database:", managers)
    
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
    console.log("Approval sequences in database:", sequences)
    
  } catch (error) {
    console.error("Database test error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
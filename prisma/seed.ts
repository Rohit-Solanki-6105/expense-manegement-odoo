import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // First, find an admin user to be the creator of categories
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    }
  })

  if (!adminUser) {
    console.log('No admin user found. Please create an admin user first.')
    return
  }

  console.log('Found admin user:', adminUser.email)

  // Create default categories
  const defaultCategories = [
    {
      name: 'Travel',
      description: 'Transportation expenses including flights, trains, taxis, and car rentals',
      color: '#3B82F6',
      createdBy: adminUser.id
    },
    {
      name: 'Meals',
      description: 'Business meals, dining, and food expenses',
      color: '#EF4444',
      createdBy: adminUser.id
    },
    {
      name: 'Accommodation',
      description: 'Hotel stays and lodging expenses',
      color: '#10B981',
      createdBy: adminUser.id
    },
    {
      name: 'Office Supplies',
      description: 'Stationery, equipment, and office materials',
      color: '#F59E0B',
      createdBy: adminUser.id
    },
    {
      name: 'Software & Subscriptions',
      description: 'Software licenses, SaaS subscriptions, and digital tools',
      color: '#8B5CF6',
      createdBy: adminUser.id
    },
    {
      name: 'Training & Education',
      description: 'Courses, conferences, workshops, and professional development',
      color: '#06B6D4',
      createdBy: adminUser.id
    },
    {
      name: 'Marketing',
      description: 'Advertising, promotional materials, and marketing expenses',
      color: '#EC4899',
      createdBy: adminUser.id
    },
    {
      name: 'Utilities',
      description: 'Internet, phone, electricity, and other utility expenses',
      color: '#84CC16',
      createdBy: adminUser.id
    }
  ]

  for (const category of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: category.name,
          mode: 'insensitive'
        }
      }
    })

    if (!existing) {
      await prisma.category.create({
        data: category
      })
      console.log(`Created category: ${category.name}`)
    } else {
      console.log(`Category already exists: ${category.name}`)
    }
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
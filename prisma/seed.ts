import { PrismaClient } from '../src/generated/prisma'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Helper function to convert image to base64
function imageToBase64(imagePath: string): string {
  try {
    const imageBuffer = fs.readFileSync(imagePath)
    const base64Image = imageBuffer.toString('base64')
    const ext = path.extname(imagePath).toLowerCase()
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'
    return `data:${mimeType};base64,${base64Image}`
  } catch (error) {
    console.warn(`Warning: Could not read image ${imagePath}, using placeholder`)
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
}

// Load local images
const localImages = [
  'C:\\Users\\Medha\\Downloads\\Telegram Desktop\\87797895_189234452493993_8432098881788968960_n.jpg',
  'C:\\Users\\Medha\\Downloads\\Telegram Desktop\\87864302_189234492493989_5609371702556360704_n.jpg',
  'C:\\Users\\Medha\\Downloads\\Telegram Desktop\\73712536_116859583064814_2953424558763278336_n.jpg',
  'C:\\Users\\Medha\\Downloads\\Telegram Desktop\\86836450_182741666476605_5761736169893134336_n.jpg',
]

const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

async function main() {
  console.log('🌱 Starting database seed...\n')

  // ==================== CLEAR EXISTING DATA ====================
  console.log('🗑️ Clearing existing data...')
  await prisma.productImage.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.product.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.store.deleteMany()
  await prisma.user.deleteMany()
  await prisma.category.deleteMany()
  console.log('✅ Cleared existing data\n')

  // ==================== CATEGORIES ====================
  console.log('📂 Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Electronics', description: 'Electronic devices, computers, phones, and accessories' } }),
    prisma.category.create({ data: { name: 'Clothing', description: 'Men, women, and children apparel' } }),
    prisma.category.create({ data: { name: 'Home & Kitchen', description: 'Furniture, decor, kitchen appliances, and home essentials' } }),
    prisma.category.create({ data: { name: 'Sports & Fitness', description: 'Sporting goods, gym equipment, and outdoor gear' } }),
    prisma.category.create({ data: { name: 'Books & Media', description: 'Books, magazines, movies, and music' } }),
    prisma.category.create({ data: { name: 'Toys & Games', description: 'Toys, board games, and entertainment for all ages' } }),
    prisma.category.create({ data: { name: 'Health & Beauty', description: 'Personal care, cosmetics, and wellness products' } }),
    prisma.category.create({ data: { name: 'Automotive', description: 'Car parts, accessories, and maintenance products' } }),
    prisma.category.create({ data: { name: 'Office Supplies', description: 'Business and office essentials, stationery' } }),
    prisma.category.create({ data: { name: 'Outdoor & Garden', description: 'Gardening tools, outdoor furniture, and equipment' } }),
    prisma.category.create({ data: { name: 'Pet Supplies', description: 'Pet food, toys, and accessories' } }),
    prisma.category.create({ data: { name: 'Baby & Kids', description: 'Baby care, kids clothing, and toys' } }),
    prisma.category.create({ data: { name: 'Jewelry & Accessories', description: 'Fashion jewelry, watches, and accessories' } }),
    prisma.category.create({ data: { name: 'Food & Beverages', description: 'Gourmet foods, snacks, and beverages' } }),
    prisma.category.create({ data: { name: 'Musical Instruments', description: 'Instruments, audio equipment, and accessories' } }),
    prisma.category.create({ data: { name: 'Furniture', description: 'Indoor and outdoor furniture' } }),
    prisma.category.create({ data: { name: 'Tools & Hardware', description: 'Power tools, hand tools, and hardware' } }),
    prisma.category.create({ data: { name: 'Crafts & Hobbies', description: 'Art supplies, crafting materials, and hobby items' } }),
    prisma.category.create({ data: { name: 'Luggage & Bags', description: 'Travel bags, backpacks, and luggage' } }),
    prisma.category.create({ data: { name: 'Shoes & Footwear', description: 'Shoes, boots, sandals, and sneakers' } })
  ])
  console.log(`✅ Created ${categories.length} categories\n`)

  // ==================== USERS ====================
  console.log('👥 Creating setup user...')
  
  const users = [
    await prisma.user.create({
      data: {
        username: 'setup',
        passwordHash: await bcrypt.hash('setup123', 10),
        role: 'admin',
        fullName: 'Setup Administrator',
        email: 'setup@bizflow.com',
        isActive: true,
      },
    })
  ]
  
  console.log(`✅ Created ${users.length} user`)
  console.log('   Default credentials:')
  console.log('   • setup / setup123 (Full access)\n')

  console.log('� Seed data created successfully!\n')
  console.log('� Summary:')
  console.log(`   • ${users.length} user (setup account only)`)
  console.log(`\n💡 Use the setup account to create your own users, stores, employees, customers, and products.`)

}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
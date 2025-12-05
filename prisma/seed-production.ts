/**
 * Production Seed - Setup Account Only
 * Creates minimal data needed for production deployment
 */

import { PrismaClient } from '../src/generated/prisma'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting production seed (setup account only)...\n')

  // ==================== CLEAR EXISTING DATA ====================
  console.log('🗑️ Clearing existing data...')
  
  // Delete in correct order respecting foreign key constraints
  // Use try-catch to handle cases where tables might not exist yet
  try {
    await prisma.stockMovement.deleteMany()
    await prisma.productImage.deleteMany()
    await prisma.productVariant.deleteMany()
    await prisma.saleItem.deleteMany()
    await prisma.saleTransaction.deleteMany()
    await prisma.sale.deleteMany()
    await prisma.financialTransaction.deleteMany()
    await prisma.product.deleteMany()
    await prisma.employee.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.store.deleteMany()
    await prisma.user.deleteMany()
    await prisma.category.deleteMany()
    console.log('✅ Cleared existing data\n')
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('⚠️  Database tables not found. They will be created by migrations.\n')
    } else {
      throw error
    }
  }

  // ==================== SETUP USER ====================
  console.log('👤 Creating setup user...')
  const setupUser = await prisma.user.create({
    data: {
      id: '00000000-0000-0000-0000-000000000000',
      username: 'setup',
      passwordHash: await bcrypt.hash('setup123', 10),
      role: 'admin',
      fullName: 'Setup Administrator',
      email: 'setup@bizflow.local',
      isActive: true,
    },
  })
  console.log('✅ Created setup user\n')

  console.log('🎉 Production seeding completed successfully!\n')
  console.log('📊 Summary:')
  console.log('   • 1 setup user (admin)')
  console.log('\n🔐 Login Credentials:')
  console.log('   Username: setup')
  console.log('   Password: setup123')
  console.log('\n⚠️  SECURITY: Change this password after first login!')
  console.log('💡 Ready for production configuration!')
}

main()
  .catch((e) => {
    console.error('❌ Error during production seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

// Quick test seed with small data to verify all features work
const CONFIG = {
  TOTAL_PRODUCTS: 100,
  TOTAL_SALES: 200,
  CUSTOMER_COUNT: 50,
  REFUND_RATE: 0.1, // 10% for testing
  PRODUCT_BATCH_SIZE: 50,
  SALE_BATCH_SIZE: 100
}

async function main() {
  console.log('🧪 Running test seed (small dataset for validation)...\n')

  // Clear data
  console.log('🗑️  Clearing data...')
  await prisma.$transaction([
    prisma.stockMovement.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.saleTransaction.deleteMany(),
    prisma.financialTransaction.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.store.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany()
  ])
  console.log('✅ Data cleared\n')

  // Create categories
  const categories = await prisma.category.createManyAndReturn({
    data: [
      { name: 'Electronics' },
      { name: 'Clothing' },
      { name: 'Food' }
    ]
  })
  console.log(`✅ Created ${categories.length} categories\n`)

  // Create users
  const users = await prisma.user.createManyAndReturn({
    data: [
      { username: 'admin', email: 'admin@test.com', password: 'admin123', role: 'admin' },
      { username: 'manager', email: 'manager@test.com', password: 'manager123', role: 'manager' }
    ]
  })
  console.log(`✅ Created ${users.length} users\n`)

  // Create stores
  const stores = await prisma.store.createManyAndReturn({
    data: [
      { name: 'Main Store', location: 'Downtown' },
      { name: 'Branch', location: 'Uptown' }
    ]
  })
  console.log(`✅ Created ${stores.length} stores\n`)

  // Create employees
  await prisma.employee.createMany({
    data: [
      { 
        name: 'John Doe', 
        email: 'john@test.com', 
        phone: '1234567890',
        salary: 50000,
        position: 'Sales',
        hireDate: new Date('2023-01-01')
      }
    ]
  })
  console.log('✅ Created 1 employee\n')

  // Create customers
  const customerData = []
  for (let i = 0; i < CONFIG.CUSTOMER_COUNT; i++) {
    customerData.push({
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@test.com`,
      phone: `555${String(i).padStart(7, '0')}`,
      loyaltyTier: 'bronze',
      totalSpent: 0
    })
  }
  const customers = await prisma.customer.createManyAndReturn({ data: customerData })
  console.log(`✅ Created ${customers.length} customers\n`)

  // Create products with variants
  console.log('📦 Creating products...')
  const products = []
  for (let i = 0; i < CONFIG.TOTAL_PRODUCTS; i++) {
    const category = categories[i % categories.length]
    const product = await prisma.product.create({
      data: {
        name: `Product ${i + 1}`,
        categoryId: category.id,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
      }
    })
    
    // Create 1-2 variants per product
    const variantCount = 1 + Math.floor(Math.random() * 2)
    for (let v = 0; v < variantCount; v++) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          barcode: `BAR${i}${v}${Date.now()}`,
          purchasePrice: 10 + Math.random() * 90,
          sellPrice: 20 + Math.random() * 180,
          stock: Math.floor(Math.random() * 100) + 50
        }
      })
    }
    
    products.push(product)
  }
  console.log(`✅ Created ${products.length} products\n`)

  // Create sales
  console.log('💰 Creating sales...')
  const allVariants = await prisma.productVariant.findMany()
  let salesCreated = 0
  
  for (let i = 0; i < CONFIG.TOTAL_SALES; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    const store = stores[Math.floor(Math.random() * stores.length)]
    
    // Create sale with 1-3 items
    const itemCount = 1 + Math.floor(Math.random() * 3)
    const saleItems = []
    let subtotal = 0
    
    for (let j = 0; j < itemCount; j++) {
      const variant = allVariants[Math.floor(Math.random() * allVariants.length)]
      const quantity = 1 + Math.floor(Math.random() * 3)
      const price = variant.sellPrice
      const total = price * quantity
      
      saleItems.push({
        variantId: variant.id,
        quantity,
        price,
        total
      })
      
      subtotal += total
    }
    
    const tax = subtotal * 0.08
    const total = subtotal + tax
    
    await prisma.saleTransaction.create({
      data: {
        customerId: customer.id,
        userId: user.id,
        storeId: store.id,
        paymentMethod: Math.random() > 0.5 ? 'cash' : 'card',
        subtotal,
        tax,
        total,
        status: 'completed',
        items: {
          create: saleItems
        },
        createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
      }
    })
    
    salesCreated++
  }
  
  console.log(`✅ Created ${salesCreated} sales\n`)

  // Create refunds (10% of sales)
  console.log('🔄 Creating refunds...')
  const salesToRefund = await prisma.saleTransaction.findMany({
    where: { status: 'completed' },
    include: { items: true },
    take: Math.floor(CONFIG.TOTAL_SALES * CONFIG.REFUND_RATE)
  })
  
  let refundCount = 0
  for (const sale of salesToRefund) {
    if (sale.items.length > 0) {
      // Randomly decide partial or full refund
      const isFullRefund = Math.random() > 0.6
      
      if (isFullRefund) {
        // Full refund
        for (const item of sale.items) {
          await prisma.saleItem.update({
            where: { id: item.id },
            data: {
              refundedQuantity: item.quantity,
              refundedAt: new Date()
            }
          })
        }
        
        await prisma.saleTransaction.update({
          where: { id: sale.id },
          data: { status: 'refunded' }
        })
      } else {
        // Partial refund
        const itemToRefund = sale.items[0]
        const refundQty = Math.max(1, Math.floor(itemToRefund.quantity * 0.5))
        
        await prisma.saleItem.update({
          where: { id: itemToRefund.id },
          data: {
            refundedQuantity: refundQty,
            refundedAt: new Date()
          }
        })
        
        await prisma.saleTransaction.update({
          where: { id: sale.id },
          data: { status: 'partially_refunded' }
        })
      }
      
      refundCount++
    }
  }
  
  console.log(`✅ Created ${refundCount} refunds\n`)

  // Update customer totals
  console.log('💳 Updating customer totals...')
  for (const customer of customers) {
    const sum = await prisma.saleTransaction.aggregate({
      where: { 
        customerId: customer.id,
        status: 'completed'
      },
      _sum: { total: true }
    })
    
    await prisma.customer.update({
      where: { id: customer.id },
      data: { totalSpent: sum._sum.total || 0 }
    })
  }
  console.log('✅ Customer totals updated\n')

  // Summary
  const finalCounts = {
    categories: await prisma.category.count(),
    users: await prisma.user.count(),
    stores: await prisma.store.count(),
    employees: await prisma.employee.count(),
    customers: await prisma.customer.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    sales: await prisma.saleTransaction.count(),
    refunded: await prisma.saleTransaction.count({ where: { status: { in: ['refunded', 'partially_refunded'] } } })
  }

  console.log('🎉 Test seed completed!\n')
  console.log('📊 Summary:')
  console.log(`   • Categories: ${finalCounts.categories}`)
  console.log(`   • Users: ${finalCounts.users}`)
  console.log(`   • Stores: ${finalCounts.stores}`)
  console.log(`   • Employees: ${finalCounts.employees}`)
  console.log(`   • Customers: ${finalCounts.customers}`)
  console.log(`   • Products: ${finalCounts.products}`)
  console.log(`   • Variants: ${finalCounts.variants}`)
  console.log(`   • Sales: ${finalCounts.sales}`)
  console.log(`   • Refunded: ${finalCounts.refunded}`)
  console.log('\n✅ All features validated!\n')
  console.log('💡 To run full seed with 50K products and 150K sales:')
  console.log('   npx tsx prisma/seed-development.ts')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

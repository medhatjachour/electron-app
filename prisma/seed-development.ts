/**
 * Development Seed - Large Dataset Simulation
 * Creates realistic data spanning 4 years:
 * - 50,000 products added over 3 years
 * - 1,000,000 sales over 4 years
 * - Realistic growth patterns and seasonal variations
 */

import { PrismaClient } from '../src/generated/prisma'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

// Date helpers
const NOW = new Date()
const FOUR_YEARS_AGO = new Date(NOW.getTime() - 4 * 365 * 24 * 60 * 60 * 1000)
const THREE_YEARS_AGO = new Date(NOW.getTime() - 3 * 365 * 24 * 60 * 60 * 1000)

// Configuration - Comprehensive Testing Dataset
const CONFIG = {
  TOTAL_PRODUCTS: 50000,
  TOTAL_SALES: 150000, // Increased for more data
  CUSTOMER_COUNT: 2000, // More customers
  REFUND_RATE: 0.05, // 5% of sales have refunds
  PARTIAL_REFUND_RATE: 0.6, // 60% of refunds are partial
  RESTOCK_FREQUENCY: 100, // Create restock every 100 sales
  LOW_STOCK_THRESHOLD: 10,
  // Use larger batches with transactions for much better performance
  PRODUCT_BATCH_SIZE: 500, // Products per transaction
  VARIANT_BATCH_SIZE: 1000, // Variants per transaction
  SALE_BATCH_SIZE: 500 // Sales per transaction
}

// Product categories with realistic distribution
const CATEGORIES = [
  { name: 'Electronics', weight: 0.15 },
  { name: 'Clothing', weight: 0.25 },
  { name: 'Home & Kitchen', weight: 0.20 },
  { name: 'Sports & Fitness', weight: 0.10 },
  { name: 'Books & Media', weight: 0.08 },
  { name: 'Food & Beverages', weight: 0.12 },
  { name: 'Beauty & Health', weight: 0.10 }
]

const PRODUCT_NAMES = {
  Electronics: ['Headphones', 'Mouse', 'Keyboard', 'Monitor', 'Cable', 'Charger', 'Speaker', 'Webcam'],
  Clothing: ['T-Shirt', 'Jeans', 'Jacket', 'Dress', 'Shoes', 'Sneakers', 'Boots', 'Socks', 'Hat'],
  'Home & Kitchen': ['Blender', 'Toaster', 'Kettle', 'Pan', 'Plate Set', 'Mug', 'Lamp', 'Cushion'],
  'Sports & Fitness': ['Yoga Mat', 'Dumbbells', 'Running Shoes', 'Water Bottle', 'Resistance Band'],
  'Books & Media': ['Novel', 'Magazine', 'DVD', 'Comic Book', 'Art Book'],
  'Food & Beverages': ['Coffee', 'Tea', 'Snacks', 'Juice', 'Energy Drink', 'Protein Bar'],
  'Beauty & Health': ['Shampoo', 'Lotion', 'Face Cream', 'Vitamins', 'Soap', 'Perfume']
}

const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Gray', 'Navy', 'Brown', 'Pink', 'Purple']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size']

// Random helpers
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function weightedRandom(items: any[], weights: number[]): any {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) return items[i]
  }
  return items[items.length - 1]
}

function generateSKU(category: string, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase()
  return `${prefix}-${String(index).padStart(6, '0')}`
}

async function main() {
  console.log('🌱 Starting comprehensive development seed...')
  console.log(`📊 Target: ${CONFIG.TOTAL_PRODUCTS.toLocaleString()} products, ${CONFIG.TOTAL_SALES.toLocaleString()} sales\n`)

  const startTime = Date.now()

  // Configure SQLite for better performance with large inserts
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
  await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;')
  await prisma.$queryRawUnsafe('PRAGMA cache_size = 10000;')
  await prisma.$queryRawUnsafe('PRAGMA temp_store = MEMORY;')
  console.log('✅ Configured SQLite for bulk operations\n')

  // ==================== CLEAR EXISTING DATA ====================
  console.log('🗑️ Clearing existing data...')
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

  // ==================== CATEGORIES ====================
  console.log('📂 Creating categories...')
  const categories = await Promise.all(
    CATEGORIES.map(cat => 
      prisma.category.create({ 
        data: { 
          name: cat.name,
          description: `${cat.name} products and accessories`
        } 
      })
    )
  )
  console.log(`✅ Created ${categories.length} categories\n`)

  // ==================== USERS ====================
  console.log('👥 Creating users...')
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'setup',
        passwordHash: await bcrypt.hash('setup123', 10),
        role: 'admin',
        fullName: 'Setup Administrator',
        email: 'setup@bizflow.com',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        fullName: 'Admin User',
        email: 'admin@bizflow.com',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'manager',
        passwordHash: await bcrypt.hash('manager123', 10),
        role: 'manager',
        fullName: 'Store Manager',
        email: 'manager@bizflow.com',
        isActive: true,
      },
    })
  ])
  console.log(`✅ Created ${users.length} users\n`)

  // ==================== STORES ====================
  console.log('🏪 Creating stores...')
  const stores = await Promise.all([
    prisma.store.create({ 
      data: { 
        name: 'Main Store', 
        location: 'Downtown',
        phone: '+1-555-1000',
        hours: '9AM-9PM',
        manager: 'John Manager'
      } 
    }),
    prisma.store.create({ 
      data: { 
        name: 'West Branch', 
        location: 'West District',
        phone: '+1-555-2000',
        hours: '10AM-8PM',
        manager: 'Tom Assistant'
      } 
    }),
    prisma.store.create({ 
      data: { 
        name: 'East Branch', 
        location: 'East District',
        phone: '+1-555-3000',
        hours: '10AM-8PM',
        manager: 'Lisa Sales'
      } 
    })
  ])
  console.log(`✅ Created ${stores.length} stores\n`)

  // ==================== EMPLOYEES ====================
  console.log('👷 Creating employees...')
  const employees = await Promise.all([
    prisma.employee.create({ 
      data: { 
        name: 'John Manager', 
        role: 'Store Manager', 
        email: 'john.manager@bizflow.com',
        phone: '+1-555-1001',
        salary: 5000,
        performance: 95
      } 
    }),
    prisma.employee.create({ 
      data: { 
        name: 'Sarah Cashier', 
        role: 'Cashier', 
        email: 'sarah.cashier@bizflow.com',
        phone: '+1-555-1002',
        salary: 2500,
        performance: 88
      } 
    }),
    prisma.employee.create({ 
      data: { 
        name: 'Mike Stock', 
        role: 'Stock Clerk', 
        email: 'mike.stock@bizflow.com',
        phone: '+1-555-1003',
        salary: 2200,
        performance: 82
      } 
    }),
    prisma.employee.create({ 
      data: { 
        name: 'Lisa Sales', 
        role: 'Sales Associate', 
        email: 'lisa.sales@bizflow.com',
        phone: '+1-555-2001',
        salary: 2800,
        performance: 91
      } 
    }),
    prisma.employee.create({ 
      data: { 
        name: 'Tom Assistant', 
        role: 'Assistant Manager', 
        email: 'tom.assistant@bizflow.com',
        phone: '+1-555-2002',
        salary: 4000,
        performance: 89
      } 
    })
  ])
  console.log(`✅ Created ${employees.length} employees\n`)

  // ==================== CUSTOMERS ====================
  console.log('👥 Creating customers...')
  const customers: any[] = []
  
  console.log(`   Generating ${CONFIG.CUSTOMER_COUNT.toLocaleString()} customers in batches...`)
  for (let i = 0; i < CONFIG.CUSTOMER_COUNT; i += 200) { // Larger batches with transactions
    const batchSize = Math.min(200, CONFIG.CUSTOMER_COUNT - i)
    const customerData = Array.from({ length: batchSize }, (_, idx) => {
      const num = i + idx + 1
      return {
        name: `Customer ${num}`,
        email: `customer${num}@email.com`,
        phone: `+1-555-${String(num).padStart(4, '0')}`,
        loyaltyTier: Math.random() > 0.7 ? 'Gold' : Math.random() > 0.4 ? 'Silver' : 'Bronze',
        totalSpent: randomPrice(0, 5000)
      }
    })
    
    // Use createMany for better SQLite performance
    await prisma.customer.createMany({
      data: customerData
    })
    
    if ((i + batchSize) % 1000 === 0) {
      console.log(`   Created ${(i + batchSize).toLocaleString()} customers...`)
    }
  }
  
  // Fetch customers for later use
  const fetchedCustomers = await prisma.customer.findMany()
  customers.push(...fetchedCustomers)
  console.log(`✅ Created ${customers.length.toLocaleString()} customers\n`)

  // ==================== PRODUCTS (50,000 over 3 years) ====================
  console.log(`📦 Creating ${CONFIG.TOTAL_PRODUCTS.toLocaleString()} products over 3 years...`)
  const products: any[] = []
  let productIndex = 0
  let totalInitialStockMovements = 0

  const totalBatches = Math.ceil(CONFIG.TOTAL_PRODUCTS / CONFIG.PRODUCT_BATCH_SIZE)
  
  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const batchStart = batchNum * CONFIG.PRODUCT_BATCH_SIZE
    const batchSize = Math.min(CONFIG.PRODUCT_BATCH_SIZE, CONFIG.TOTAL_PRODUCTS - batchStart)
    
    // Use transaction for batch with sequential processing
    const result = await prisma.$transaction(async (tx) => {
      const createdProducts = []
      let stockMovementsCount = 0
      
      for (let idx = 0; idx < batchSize; idx++) {
        productIndex = batchStart + idx
        
        // Distribute products over 3 years with growth pattern
        const creationProgress = productIndex / CONFIG.TOTAL_PRODUCTS
        const createdAt = randomDate(THREE_YEARS_AGO, NOW)
        
        // Select category using weights
        const category = weightedRandom(categories, CATEGORIES.map(c => c.weight))
        const categoryName = category.name as keyof typeof PRODUCT_NAMES
        const productNames = PRODUCT_NAMES[categoryName]
        const productName = productNames[randomInt(0, productNames.length - 1)]
        
        const hasVariants = Math.random() > 0.3
        const basePrice = randomPrice(5, 500)
        const baseCost = basePrice * (0.5 + Math.random() * 0.2) // 50-70% of price
        
        // Generate variant data
        const variantData = hasVariants ? 
          Array.from({ length: randomInt(2, 5) }, (_, vIdx) => ({
            color: COLORS[randomInt(0, COLORS.length - 1)],
            size: SIZES[randomInt(0, SIZES.length - 1)],
            sku: `${generateSKU(categoryName, productIndex + 1)}-V${vIdx + 1}`,
            price: basePrice + randomPrice(-10, 20),
            stock: randomInt(50, 200),
            reorderPoint: randomInt(10, 30)
          })) :
          [{
            color: 'Default',
            size: 'One Size',
            sku: generateSKU(categoryName, productIndex + 1),
            price: basePrice,
            stock: randomInt(100, 500),
            reorderPoint: randomInt(20, 50)
          }]
        
        const product = await tx.product.create({
          data: {
            name: `${productName} ${categoryName.substring(0, 4)} ${productIndex + 1}`,
            baseSKU: generateSKU(categoryName, productIndex + 1),
            categoryId: category.id,
            description: `Quality ${productName.toLowerCase()} from ${categoryName}`,
            basePrice,
            baseCost,
            hasVariants,
            storeId: stores[randomInt(0, stores.length - 1)].id,
            createdAt,
            images: {
              create: [{
                filename: 'placeholder.png',
                order: 0
              }]
            },
            variants: {
              create: variantData
            }
          },
          include: {
            variants: true
          }
        })
        
        // Create initial RESTOCK stock movements for each variant
        for (const variant of product.variants) {
          if (variant.stock > 0) {
            await tx.stockMovement.create({
              data: {
                variantId: variant.id,
                type: 'RESTOCK',
                quantity: variant.stock,
                previousStock: 0,
                newStock: variant.stock,
                reason: 'Initial inventory',
                userId: users[0].id,
                createdAt
              }
            })
            stockMovementsCount++
          }
        }
        
        createdProducts.push(product)
      }
      
      return { products: createdProducts, stockMovements: stockMovementsCount }
    })
    
    products.push(...result.products)
    totalInitialStockMovements += result.stockMovements
    
    // Report progress every 1000 products
    if ((batchStart + batchSize) % 1000 === 0 || (batchStart + batchSize) === CONFIG.TOTAL_PRODUCTS) {
      const percent = ((batchStart + batchSize) / CONFIG.TOTAL_PRODUCTS * 100).toFixed(1)
      console.log(`   ${(batchStart + batchSize).toLocaleString()} / ${CONFIG.TOTAL_PRODUCTS.toLocaleString()} products (${percent}%)...`)
    }
  }
  
  console.log(`✅ Created ${products.length.toLocaleString()} products`)
  console.log(`✅ Created ${totalInitialStockMovements.toLocaleString()} initial stock movements\n`)

  // ==================== SALE TRANSACTIONS (1,000,000 over 4 years) ====================
  console.log(`💰 Creating ${CONFIG.TOTAL_SALES.toLocaleString()} sale transactions over 4 years...`)
  
  const totalSalesBatches = Math.ceil(CONFIG.TOTAL_SALES / CONFIG.SALE_BATCH_SIZE)
  let totalSalesCreated = 0
  const allSaleItems: any[] = []
  
  for (let batchNum = 0; batchNum < totalSalesBatches; batchNum++) {
    const batchStart = batchNum * CONFIG.SALE_BATCH_SIZE
    const batchSize = Math.min(CONFIG.SALE_BATCH_SIZE, CONFIG.TOTAL_SALES - batchStart)
    
    const createdTransactions = await prisma.$transaction(async (tx) => {
      const transactions = []
      
      for (let idx = 0; idx < batchSize; idx++) {
        // Distribute sales over 4 years with seasonal variations
        const saleDate = randomDate(FOUR_YEARS_AGO, NOW)
        const month = saleDate.getMonth()
        
        // Seasonal boost (holidays: Nov, Dec)
        const seasonalMultiplier = (month === 10 || month === 11) ? 1.5 : 1.0
        
        // Select random product and customer
        const product = products[randomInt(0, products.length - 1)]
        const customer = customers[randomInt(0, customers.length - 1)]
        
        // Get product variants (use cached product data)
        const productWithVariants = await tx.product.findUnique({
          where: { id: product.id },
          include: { variants: { take: 5 } }
        })
        
        if (!productWithVariants || productWithVariants.variants.length === 0) continue
        
        const variants = productWithVariants.variants
        
        // Random number of items in this transaction (1-3)
        const itemCount = Math.min(randomInt(1, 3), variants.length)
        const selectedVariants = variants.slice(0, itemCount)
        
        // Calculate items and totals
        const items = []
        let subtotal = 0
        
        for (const variant of selectedVariants) {
          const quantity = randomInt(1, 2)
          const price = variant.price
          // Most items have no discount, but some get a random discount
          const hasDiscount = Math.random() < 0.15 // 15% of items get discounts
          let discountType = 'NONE'
          let discountValue = 0
          let finalPrice = price
          
          if (hasDiscount) {
            const isPercentage = Math.random() < 0.7 // 70% of discounts are percentage-based
            if (isPercentage) {
              discountType = 'PERCENTAGE'
              discountValue = [5, 10, 15, 20, 25][randomInt(0, 4)] // Random percentage
              finalPrice = price * (1 - discountValue / 100)
            } else {
              discountType = 'FIXED_AMOUNT'
              discountValue = Math.min(price * 0.3, [5, 10, 15, 20][randomInt(0, 3)]) // Max 30% off
              finalPrice = Math.max(price * 0.5, price - discountValue) // Minimum 50% of original
            }
          }
          
          const total = finalPrice * quantity
          
          items.push({
            productId: product.id,
            variantId: variant.id,
            quantity,
            price,
            discountType,
            discountValue,
            finalPrice,
            total
          })
          
          subtotal += total
        }
        
        // Calculate tax (8% for example)
        const tax = Math.round(subtotal * 0.08 * 100) / 100
        const total = subtotal + tax
        
        // Random payment method
        const paymentMethods = ['cash', 'card']
        const paymentMethod = paymentMethods[randomInt(0, 1)]
        
        // Create the sale transaction with items
        const transaction = await tx.saleTransaction.create({
          data: {
            userId: users[randomInt(0, users.length - 1)].id,
            customerId: customer.id,
            paymentMethod,
            status: 'completed',
            subtotal,
            tax,
            total,
            createdAt: saleDate,
            items: {
              create: items
            }
          },
          include: {
            items: true
          }
        })
        
        transactions.push(transaction)
      }
      
      return transactions
    })
    
    totalSalesCreated += createdTransactions.length
    
    // Collect sale items for later stock movement creation
    for (const transaction of createdTransactions) {
      for (const item of transaction.items) {
        allSaleItems.push({
          transactionId: transaction.id,
          variantId: item.variantId,
          quantity: item.quantity,
          userId: transaction.userId,
          createdAt: transaction.createdAt
        })
      }
    }
    
    // Report progress every 10000 sales
    if ((batchStart + batchSize) % 10000 === 0 || (batchStart + batchSize) === CONFIG.TOTAL_SALES) {
      const percent = ((batchStart + batchSize) / CONFIG.TOTAL_SALES * 100).toFixed(1)
      console.log(`   ${(batchStart + batchSize).toLocaleString()} / ${CONFIG.TOTAL_SALES.toLocaleString()} transactions (${percent}%)...`)
    }
  }
  
  console.log(`✅ Created ${totalSalesCreated.toLocaleString()} sale transactions\n`)

  // ==================== STOCK MOVEMENTS FROM SALES ====================
  console.log(`📦 Creating stock movements for ${allSaleItems.length.toLocaleString()} sale items...`)
  
  let totalStockMovements = 0
  const stockMovementBatchSize = 250 // Reduced from 1000 for more stable transactions
  
  for (let i = 0; i < allSaleItems.length; i += stockMovementBatchSize) {
    const batch = allSaleItems.slice(i, i + stockMovementBatchSize)
    
    await prisma.$transaction(async (tx) => {
      for (const item of batch) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId }
          })
          
          if (variant) {
            const previousStock = variant.stock
            const newStock = Math.max(0, previousStock - item.quantity)
            
            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                type: 'SALE',
                quantity: -item.quantity,
                previousStock,
                newStock,
                referenceId: item.transactionId,
                userId: item.userId,
                createdAt: item.createdAt
              }
            })
            
            // Update variant stock
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: newStock }
            })
            
            totalStockMovements++
          }
        }
      }
    }, {
      maxWait: 10000, // Maximum time to wait for transaction to start
      timeout: 30000  // Maximum transaction time
    })
    
    if ((i + stockMovementBatchSize) % 10000 === 0 || (i + stockMovementBatchSize) >= allSaleItems.length) {
      const percent = (Math.min(i + stockMovementBatchSize, allSaleItems.length) / allSaleItems.length * 100).toFixed(1)
      console.log(`   ${Math.min(i + stockMovementBatchSize, allSaleItems.length).toLocaleString()} / ${allSaleItems.length.toLocaleString()} movements (${percent}%)...`)
    }
  }
  
  console.log(`✅ Created ${totalStockMovements.toLocaleString()} sale stock movements\n`)

  // ==================== UPDATE CUSTOMER TOTAL SPENT ====================
  console.log('💳 Updating customer totalSpent amounts...')
  
  const customerUpdates = await prisma.$transaction(async (tx) => {
    let updatedCount = 0
    
    for (const customer of customers) {
      const totalSpent = await tx.saleTransaction.aggregate({
        where: { customerId: customer.id },
        _sum: { total: true }
      })
      
      await tx.customer.update({
        where: { id: customer.id },
        data: { totalSpent: totalSpent._sum.total || 0 }
      })
      
      updatedCount++
    }
    
    return updatedCount
  })
  
  console.log(`✅ Updated ${customerUpdates} customer records\n`)

  // ==================== REFUNDS & RETURNS ====================
  console.log('🔄 Creating comprehensive refunds and returns for testing...')
  
  // Get transactions from last 6 months for refunds
  const eligibleTransactions = await prisma.saleTransaction.findMany({
    where: { 
      status: 'completed',
      createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } // Last 6 months
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log(`   Found ${eligibleTransactions.length} eligible transactions for refunds`)
  
  // Calculate number of refunds based on configured rate
  const targetPartialRefunds = Math.floor(eligibleTransactions.length * CONFIG.REFUND_RATE * CONFIG.PARTIAL_REFUND_RATE)
  const targetFullRefunds = Math.floor(eligibleTransactions.length * CONFIG.REFUND_RATE * (1 - CONFIG.PARTIAL_REFUND_RATE))
  
  console.log(`   Targeting ${targetPartialRefunds} partial refunds and ${targetFullRefunds} full refunds`)
  
  let partialRefundCount = 0
  let fullRefundCount = 0
  let totalRefundedAmount = 0
  
  // Create partial refunds
  for (let i = 0; i < Math.min(targetPartialRefunds, eligibleTransactions.length); i++) {
    const transaction = eligibleTransactions[i]
    
    if (transaction.items.length === 0) continue
    
    let transactionRefundAmount = 0
    
    await prisma.$transaction(async (tx) => {
      // Pick 30-70% of items to partially refund
      const refundItemCount = Math.max(1, Math.floor(transaction.items.length * (0.3 + Math.random() * 0.4)))
      const itemsToRefund = transaction.items.slice(0, refundItemCount)
      
      for (const item of itemsToRefund) {
        // Refund 30-70% of the quantity
        const refundPercentage = 0.3 + Math.random() * 0.4
        const quantityToRefund = Math.max(1, Math.floor(item.quantity * refundPercentage))
        const refundAmount = item.total * (quantityToRefund / item.quantity)
        transactionRefundAmount += refundAmount
        
        // Update sale item
        await tx.saleItem.update({
          where: { id: item.id },
          data: {
            refundedQuantity: quantityToRefund,
            refundedAt: new Date()
          }
        })
        
        // Restore stock if variant exists
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId }
          })
          
          if (variant) {
            const previousStock = variant.stock
            const newStock = previousStock + quantityToRefund
            
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: newStock }
            })
            
            // Create stock movement
            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                type: 'RETURN',
                quantity: quantityToRefund,
                previousStock,
                newStock,
                referenceId: transaction.id,
                userId: transaction.userId,
                reason: 'Partial Refund',
                notes: `Partial refund: ${quantityToRefund} of ${item.quantity} units`,
                createdAt: new Date()
              }
            })
          }
        }
      }
      
      // Update transaction status to partially_refunded
      await tx.saleTransaction.update({
        where: { id: transaction.id },
        data: { status: 'partially_refunded' }
      })
    })
    
    partialRefundCount++
    totalRefundedAmount += transactionRefundAmount
    
    if (partialRefundCount % 100 === 0) {
      console.log(`   Created ${partialRefundCount}/${targetPartialRefunds} partial refunds...`)
    }
  }
  
  // Create full refunds
  for (let i = targetPartialRefunds; i < Math.min(targetPartialRefunds + targetFullRefunds, eligibleTransactions.length); i++) {
    const transaction = eligibleTransactions[i]
    
    if (transaction.items.length === 0) continue
    
    let transactionRefundAmount = 0
    
    await prisma.$transaction(async (tx) => {
      // Refund all items completely
      for (const item of transaction.items) {
        transactionRefundAmount += item.total
        
        await tx.saleItem.update({
          where: { id: item.id },
          data: {
            refundedQuantity: item.quantity,
            refundedAt: new Date()
          }
        })
        
        // Restore stock if variant exists
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId }
          })
          
          if (variant) {
            const previousStock = variant.stock
            const newStock = previousStock + item.quantity
            
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: newStock }
            })
            
            // Create stock movement
            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                type: 'RETURN',
                quantity: item.quantity,
                previousStock,
                newStock,
                referenceId: transaction.id,
                userId: transaction.userId,
                reason: 'Full Refund',
                notes: `Full refund of ${item.quantity} units`,
                createdAt: new Date()
              }
            })
          }
        }
      }
      
      // Update transaction status to refunded
      await tx.saleTransaction.update({
        where: { id: transaction.id },
        data: { status: 'refunded' }
      })
    })
    
    fullRefundCount++
    totalRefundedAmount += transactionRefundAmount
    
    if (fullRefundCount % 50 === 0) {
      console.log(`   Created ${fullRefundCount}/${targetFullRefunds} full refunds...`)
    }
  }
  
  console.log(`✅ Created ${partialRefundCount} partial refunds and ${fullRefundCount} full refunds`)
  console.log(`   Total refunded amount: $${totalRefundedAmount.toFixed(2)}\n`)
  
  // Recalculate customer totalSpent after refunds
  console.log('💳 Recalculating customer totalSpent after refunds...')
  
  let refundedCustomerUpdates = 0
  
  // Update customers in batches to avoid transaction timeout
  const customerBatchSize = 50
  for (let i = 0; i < customers.length; i += customerBatchSize) {
    const batch = customers.slice(i, i + customerBatchSize)
    
    await prisma.$transaction(async (tx) => {
      for (const customer of batch) {
        const totalSpent = await tx.saleTransaction.aggregate({
          where: { 
            customerId: customer.id,
            status: 'completed' // Only count completed, not refunded
          },
          _sum: { total: true }
        })
        
        await tx.customer.update({
          where: { id: customer.id },
          data: { totalSpent: totalSpent._sum.total || 0 }
        })
        
        refundedCustomerUpdates++
      }
    })
  }
  
  console.log(`✅ Updated ${refundedCustomerUpdates} customer records\n`)

  // ==================== CUSTOMER SEGMENTATION ====================
  console.log('👥 Analyzing customer segments...')
  
  const customerAnalysis = await prisma.$transaction(async (tx) => {
    const allCustomers = await tx.customer.findMany({
      include: {
        _count: { select: { saleTransactions: true } }
      }
    })
    
    let vipCount = 0
    let loyalCount = 0
    let regularCount = 0
    let oneTimeCount = 0
    
    for (const customer of allCustomers) {
      const purchaseCount = customer._count.saleTransactions
      let segment = 'one-time'
      
      if (purchaseCount >= 20 || customer.totalSpent >= 10000) {
        segment = 'vip'
        vipCount++
      } else if (purchaseCount >= 10 || customer.totalSpent >= 5000) {
        segment = 'loyal'
        loyalCount++
      } else if (purchaseCount >= 3) {
        segment = 'regular'
        regularCount++
      } else {
        oneTimeCount++
      }
      
      // Update customer loyalty tier based on purchases
      let loyaltyTier = 'bronze'
      if (customer.totalSpent >= 10000) loyaltyTier = 'platinum'
      else if (customer.totalSpent >= 5000) loyaltyTier = 'gold'
      else if (customer.totalSpent >= 2000) loyaltyTier = 'silver'
      
      await tx.customer.update({
        where: { id: customer.id },
        data: { loyaltyTier }
      })
    }
    
    return { vipCount, loyalCount, regularCount, oneTimeCount, total: allCustomers.length }
  })
  
  console.log(`✅ Customer segmentation:`)
  console.log(`   • VIP customers: ${customerAnalysis.vipCount} (${(customerAnalysis.vipCount / customerAnalysis.total * 100).toFixed(1)}%)`)
  console.log(`   • Loyal customers: ${customerAnalysis.loyalCount} (${(customerAnalysis.loyalCount / customerAnalysis.total * 100).toFixed(1)}%)`)
  console.log(`   • Regular customers: ${customerAnalysis.regularCount} (${(customerAnalysis.regularCount / customerAnalysis.total * 100).toFixed(1)}%)`)
  console.log(`   • One-time buyers: ${customerAnalysis.oneTimeCount} (${(customerAnalysis.oneTimeCount / customerAnalysis.total * 100).toFixed(1)}%)\n`)

  // ==================== ADDITIONAL STOCK MOVEMENTS ====================
  console.log('📦 Creating comprehensive stock movements (restocks, adjustments, returns)...')
  
  let additionalStockMovements = 0
  const variantIds = await prisma.productVariant.findMany({ 
    select: { id: true, stock: true, product: { select: { createdAt: true } } } 
  })
  
  const movementTypes = [
    { type: 'RESTOCK', weight: 0.5 }, // Increased restock frequency
    { type: 'ADJUSTMENT', weight: 0.15 },
    { type: 'RETURN', weight: 0.2 },
    { type: 'SHRINKAGE', weight: 0.15 }
  ]
  
  // Create more comprehensive stock movements
  const targetMovements = 25000 // Increased from 10,000
  const movementBatchSize = 500
  
  console.log(`   Targeting ${targetMovements.toLocaleString()} stock movements...`)
  
  for (let i = 0; i < targetMovements; i += movementBatchSize) {
    const batchSize = Math.min(movementBatchSize, targetMovements - i)
    
    await prisma.$transaction(async (tx) => {
      for (let j = 0; j < batchSize; j++) {
        const variantData = variantIds[randomInt(0, variantIds.length - 1)]
        const movementType = weightedRandom(
          movementTypes.map(m => m.type),
          movementTypes.map(m => m.weight)
        )
        
        const currentVariant = await tx.productVariant.findUnique({
          where: { id: variantData.id }
        })
        
        if (!currentVariant) continue
        
        let quantity = 0
        let reason = ''
        let notes = ''
        
        // Create realistic movement dates based on product age
        const productAge = Date.now() - variantData.product.createdAt.getTime()
        const movementDate = new Date(variantData.product.createdAt.getTime() + Math.random() * productAge)
        
        switch (movementType) {
          case 'RESTOCK':
            // Larger restocks for low stock items
            if (currentVariant.stock < CONFIG.LOW_STOCK_THRESHOLD) {
              quantity = randomInt(50, 200)
              reason = 'Emergency restock - low stock'
              notes = `Stock was critically low at ${currentVariant.stock} units`
            } else {
              quantity = randomInt(20, 100)
              reason = weightedRandom(
                ['Supplier delivery', 'Scheduled restock', 'Bulk order', 'Seasonal stock'],
                [0.4, 0.3, 0.2, 0.1]
              )
            }
            break
          case 'ADJUSTMENT':
            quantity = randomInt(-15, 15)
            reason = weightedRandom(
              ['Inventory count correction', 'System sync', 'Manual adjustment', 'Found stock'],
              [0.4, 0.3, 0.2, 0.1]
            )
            notes = quantity > 0 ? 'Stock discrepancy found - added' : 'Stock discrepancy found - removed'
            break
          case 'RETURN':
            quantity = randomInt(1, 8)
            reason = weightedRandom(
              ['Customer return - changed mind', 'Wrong size/color', 'Defective product', 'Warranty return'],
              [0.4, 0.3, 0.2, 0.1]
            )
            break
          case 'SHRINKAGE':
            quantity = -randomInt(1, 10)
            reason = weightedRandom(
              ['Damaged in store', 'Theft/loss', 'Expired/spoiled', 'Display damage', 'Missing inventory'],
              [0.3, 0.25, 0.2, 0.15, 0.1]
            )
            notes = 'Removed from sellable inventory'
            break
        }
        
        const previousStock = currentVariant.stock
        const newStock = Math.max(0, previousStock + quantity)
        
        await tx.stockMovement.create({
          data: {
            variantId: variantData.id,
            type: movementType,
            quantity,
            previousStock,
            newStock,
            reason,
            notes: notes || undefined,
            userId: users[randomInt(0, users.length - 1)].id,
            createdAt: movementDate
          }
        })
        
        await tx.productVariant.update({
          where: { id: variantData.id },
          data: { 
            stock: newStock, 
            lastRestocked: movementType === 'RESTOCK' ? movementDate : undefined 
          }
        })
        
        additionalStockMovements++
      }
    })
    
    if ((i + movementBatchSize) % 5000 === 0 || (i + movementBatchSize) >= targetMovements) {
      const percent = (Math.min(i + movementBatchSize, targetMovements) / targetMovements * 100).toFixed(1)
      console.log(`   ${Math.min(i + movementBatchSize, targetMovements).toLocaleString()} / ${targetMovements.toLocaleString()} movements (${percent}%)...`)
    }
  }
  
  console.log(`✅ Created ${additionalStockMovements.toLocaleString()} additional stock movements\n`)

  // ==================== EDGE CASES & SCENARIOS ====================
  console.log('⚠️  Creating edge case scenarios...')
  
  // Out of stock products (5% of variants)
  const outOfStockTarget = Math.floor(variantIds.length * 0.05)
  let outOfStockCount = 0
  
  for (let i = 0; i < outOfStockTarget; i++) {
    const variant = variantIds[randomInt(0, variantIds.length - 1)]
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: 0 }
    })
    outOfStockCount++
  }
  
  // Dead stock (products with high stock but no recent sales) - 2% of variants
  const deadStockTarget = Math.floor(variantIds.length * 0.02)
  let deadStockCount = 0
  
  for (let i = 0; i < deadStockTarget; i++) {
    const variant = variantIds[randomInt(0, variantIds.length - 1)]
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: randomInt(100, 500) } // High stock
    })
    deadStockCount++
  }
  
  // Critical low stock (below threshold) - 10% of variants
  const lowStockTarget = Math.floor(variantIds.length * 0.10)
  let lowStockCount = 0
  
  for (let i = 0; i < lowStockTarget; i++) {
    const variant = variantIds[randomInt(0, variantIds.length - 1)]
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: randomInt(1, CONFIG.LOW_STOCK_THRESHOLD - 1) }
    })
    lowStockCount++
  }
  
  console.log(`✅ Created edge case scenarios:`)
  console.log(`   • Out of stock: ${outOfStockCount.toLocaleString()} variants`)
  console.log(`   • Dead stock: ${deadStockCount.toLocaleString()} variants`)
  console.log(`   • Low stock: ${lowStockCount.toLocaleString()} variants\n`)

  // ==================== FINANCIAL TRANSACTIONS ====================
  console.log('💸 Creating financial transactions over 4 years...')
  
  const expenseTypes = [
    { description: 'Monthly rent payment', min: 4000, max: 6000 },
    { description: 'Electricity and water bills', min: 800, max: 1500 },
    { description: 'Employee salaries payment', min: 12000, max: 18000 },
    { description: 'Office supplies', min: 200, max: 800 },
    { description: 'Marketing and advertising', min: 1000, max: 5000 },
    { description: 'Equipment maintenance', min: 500, max: 2000 },
    { description: 'Insurance premiums', min: 2000, max: 4000 },
    { description: 'Internet and phone services', min: 300, max: 600 }
  ]
  
  const incomeTypes = [
    { description: 'Product sales revenue', min: 10000, max: 50000 },
    { description: 'Service fees', min: 1000, max: 5000 },
    { description: 'Wholesale orders', min: 5000, max: 20000 },
    { description: 'Online sales revenue', min: 3000, max: 15000 }
  ]
  
  let financialTransactionCount = 0
  
  // Create monthly transactions over 4 years (48 months)
  const monthsToCreate = 48
  
  await prisma.$transaction(async (tx) => {
    for (let month = 0; month < monthsToCreate; month++) {
      const transactionDate = new Date(FOUR_YEARS_AGO)
      transactionDate.setMonth(transactionDate.getMonth() + month)
      
      // Create 3-5 expenses per month
      const expenseCount = randomInt(3, 5)
      for (let i = 0; i < expenseCount; i++) {
        const expense = expenseTypes[randomInt(0, expenseTypes.length - 1)]
        await tx.financialTransaction.create({
          data: {
            type: 'expense',
            amount: randomPrice(expense.min, expense.max),
            description: expense.description,
            userId: users[randomInt(0, users.length - 1)].id,
            createdAt: randomDate(transactionDate, new Date(transactionDate.getTime() + 28 * 24 * 60 * 60 * 1000))
          }
        })
        financialTransactionCount++
      }
      
      // Create 2-4 income entries per month
      const incomeCount = randomInt(2, 4)
      for (let i = 0; i < incomeCount; i++) {
        const income = incomeTypes[randomInt(0, incomeTypes.length - 1)]
        await tx.financialTransaction.create({
          data: {
            type: 'income',
            amount: randomPrice(income.min, income.max),
            description: income.description,
            userId: users[randomInt(0, users.length - 1)].id,
            createdAt: randomDate(transactionDate, new Date(transactionDate.getTime() + 28 * 24 * 60 * 60 * 1000))
          }
        })
        financialTransactionCount++
      }
    }
  })
  
  console.log(`✅ Created ${financialTransactionCount} financial transactions\n`)

  // ==================== SUMMARY ====================
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  console.log('🎉 Development seeding completed successfully!\n')
  console.log('📊 COMPREHENSIVE DATASET SUMMARY:')
  console.log('\n👥 Users & Organizations:')
  console.log(`   • ${categories.length} categories`)
  console.log(`   • ${users.length} users (setup, admin, manager)`)
  console.log(`   • ${stores.length} stores`)
  console.log(`   • ${employees.length} employees with salaries`)
  console.log(`   • ${customers.length.toLocaleString()} customers (VIP: ${customerAnalysis.vipCount}, Loyal: ${customerAnalysis.loyalCount})`)
  
  console.log('\n📦 Products & Inventory:')
  console.log(`   • ${products.length.toLocaleString()} products (created over 3 years)`)
  console.log(`   • ${totalInitialStockMovements.toLocaleString()} initial stock entries`)
  console.log(`   • ${outOfStockCount.toLocaleString()} out-of-stock variants`)
  console.log(`   • ${lowStockCount.toLocaleString()} low-stock variants`)
  console.log(`   • ${deadStockCount.toLocaleString()} dead-stock variants`)
  
  console.log('\n💰 Sales & Transactions:')
  console.log(`   • ${totalSalesCreated.toLocaleString()} sale transactions (over 4 years)`)
  console.log(`   • ${partialRefundCount} partially refunded transactions`)
  console.log(`   • ${fullRefundCount} fully refunded transactions`)
  console.log(`   • $${totalRefundedAmount.toFixed(2)} total refunded`)
  
  console.log('\n📊 Stock Movements:')
  console.log(`   • ${totalStockMovements.toLocaleString()} sale-related movements`)
  console.log(`   • ${additionalStockMovements.toLocaleString()} additional movements (restocks, returns, adjustments)`)
  console.log(`   • ${(totalStockMovements + additionalStockMovements).toLocaleString()} total stock movements`)
  
  console.log('\n💸 Financial Data:')
  console.log(`   • ${financialTransactionCount} financial transactions (income & expenses)`)
  console.log(`   • 48 months of financial history`)
  
  console.log(`\n⏱️  Completed in ${duration}s`)
  console.log('\n🔐 Login Credentials:')
  console.log('   Setup: setup / setup123')
  console.log('   Admin: admin / admin123')
  console.log('   Manager: manager / manager123')
}

main()
  .catch((e) => {
    console.error('❌ Error during development seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

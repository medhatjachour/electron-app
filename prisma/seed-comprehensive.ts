import { PrismaClient } from '../src/generated/prisma'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n')

  // ==================== CLEAR EXISTING DATA ====================
  console.log('🗑️ Clearing existing data...')
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
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Electronics', description: 'Electronic devices, computers, phones, and accessories' } }),
    prisma.category.create({ data: { name: 'Clothing', description: 'Men, women, and children apparel' } }),
    prisma.category.create({ data: { name: 'Home & Kitchen', description: 'Furniture, decor, kitchen appliances, and home essentials' } }),
    prisma.category.create({ data: { name: 'Sports & Fitness', description: 'Sporting goods, gym equipment, and outdoor gear' } }),
    prisma.category.create({ data: { name: 'Books & Media', description: 'Books, magazines, movies, and music' } }),
    prisma.category.create({ data: { name: 'Food & Beverages', description: 'Gourmet foods, snacks, and beverages' } })
  ])
  console.log(`✅ Created ${categories.length} categories\n`)

  // ==================== USERS ====================
  console.log('👥 Creating users...')
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        fullName: 'System Administrator',
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
    }),
    prisma.user.create({
      data: {
        username: 'cashier1',
        passwordHash: await bcrypt.hash('cashier123', 10),
        role: 'sales',
        fullName: 'John Cashier',
        email: 'john@bizflow.com',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'cashier2',
        passwordHash: await bcrypt.hash('cashier123', 10),
        role: 'sales',
        fullName: 'Jane Cashier',
        email: 'jane@bizflow.com',
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
        name: 'Downtown Store',
        location: '123 Main Street, Downtown',
        phone: '+1-555-0101',
        hours: '9:00 AM - 9:00 PM',
        manager: 'Store Manager',
        status: 'active',
      },
    }),
    prisma.store.create({
      data: {
        name: 'Mall Branch',
        location: '456 Shopping Mall, Level 2',
        phone: '+1-555-0102',
        hours: '10:00 AM - 10:00 PM',
        manager: 'Store Manager',
        status: 'active',
      },
    })
  ])
  console.log(`✅ Created ${stores.length} stores\n`)

  // ==================== EMPLOYEES ====================
  console.log('👷 Creating employees...')
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        name: 'John Cashier',
        role: 'Cashier',
        email: 'john@bizflow.com',
        phone: '+1-555-1001',
        salary: 35000,
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Jane Cashier',
        role: 'Cashier',
        email: 'jane@bizflow.com',
        phone: '+1-555-1002',
        salary: 35000,
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Mike Stock',
        role: 'Stock Clerk',
        email: 'mike@bizflow.com',
        phone: '+1-555-1003',
        salary: 30000,
      },
    })
  ])
  console.log(`✅ Created ${employees.length} employees\n`)

  // ==================== CUSTOMERS ====================
  console.log('👥 Creating customers...')
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@email.com',
        phone: '+1-555-2001',
        loyaltyTier: 'Gold',
        totalSpent: 450.75,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Bob Smith',
        email: 'bob@email.com',
        phone: '+1-555-2002',
        loyaltyTier: 'Silver',
        totalSpent: 890.50,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Carol Davis',
        email: 'carol@email.com',
        phone: '+1-555-2003',
        loyaltyTier: 'Bronze',
        totalSpent: 125.25,
      },
    })
  ])
  console.log(`✅ Created ${customers.length} customers\n`)

  // ==================== PRODUCTS ====================
  console.log('📦 Creating products...')
  const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  const TARGET_PRODUCT_COUNT = 250
  const products: any[] = []

  const baseProducts = await Promise.all([
    // Electronics
    prisma.product.create({
      data: {
        name: 'Wireless Bluetooth Headphones',
        baseSKU: 'ELE-001',
        categoryId: categories[0].id,
        description: 'High-quality wireless headphones with noise cancellation',
        basePrice: 89.99,
        baseCost: 45.00,
        hasVariants: false,
        storeId: stores[0].id,
        images: { create: [{ imageData: placeholder, order: 0 }] },
        variants: {
          create: [{
            color: 'Black',
            size: 'One Size',
            sku: 'ELE-001-BLK',
            price: 89.99,
            stock: 25
          }]
        }
      },
    }),
    prisma.product.create({
      data: {
        name: 'Smart Watch Series 5',
        baseSKU: 'ELE-002',
        categoryId: categories[0].id,
        description: 'Latest smartwatch with health monitoring features',
        basePrice: 299.99,
        baseCost: 150.00,
        hasVariants: true,
        storeId: stores[0].id,
        images: { create: [{ imageData: placeholder, order: 0 }] },
        variants: {
          create: [
            { color: 'Black', size: 'One Size', sku: 'ELE-002-BLK', price: 299.99, stock: 15 },
            { color: 'Silver', size: 'One Size', sku: 'ELE-002-SLV', price: 299.99, stock: 12 }
          ]
        }
      },
    }),
    prisma.product.create({
      data: {
        name: 'USB-C Charging Cable',
        baseSKU: 'ELE-003',
        categoryId: categories[0].id,
        description: 'Fast charging USB-C cable, 6ft length',
        basePrice: 19.99,
        baseCost: 8.00,
        hasVariants: false,
        storeId: stores[1].id,
        images: { create: [{ imageData: placeholder, order: 0 }] },
        variants: {
          create: [{
            color: 'White',
            size: 'One Size',
            sku: 'ELE-003-WHT',
            price: 19.99,
            stock: 50
          }]
        }
      },
    }),

    // Clothing
    prisma.product.create({
      data: {
        name: 'Cotton T-Shirt',
        baseSKU: 'CLT-001',
        categoryId: categories[1].id,
        description: 'Comfortable 100% cotton t-shirt',
        basePrice: 24.99,
        baseCost: 12.00,
        hasVariants: true,
        storeId: stores[1].id,
        images: { create: [{ imageData: placeholder, order: 0 }] },
        variants: {
          create: [
            { color: 'White', size: 'S', sku: 'CLT-001-WHT-S', price: 24.99, stock: 20 },
            { color: 'White', size: 'M', sku: 'CLT-001-WHT-M', price: 24.99, stock: 25 },
            { color: 'Black', size: 'S', sku: 'CLT-001-BLK-S', price: 24.99, stock: 18 },
            { color: 'Black', size: 'M', sku: 'CLT-001-BLK-M', price: 24.99, stock: 20 }
          ]
        }
      },
    }),

    // Home & Kitchen
    prisma.product.create({
      data: {
        name: 'Coffee Mug Set',
        baseSKU: 'HMK-001',
        categoryId: categories[2].id,
        description: 'Set of 4 ceramic coffee mugs',
        basePrice: 34.99,
        baseCost: 15.00,
        hasVariants: false,
        storeId: stores[0].id,
        images: { create: [{ imageData: placeholder, order: 0 }] },
        variants: {
          create: [{
            color: 'Assorted',
            size: 'One Size',
            sku: 'HMK-001-ASS',
            price: 34.99,
            stock: 30
          }]
        }
      },
    }),

    // Sports & Fitness
    prisma.product.create({
      data: {
        name: 'Yoga Mat',
        baseSKU: 'SPF-001',
        categoryId: categories[3].id,
        description: 'Non-slip yoga mat, 6mm thick',
        basePrice: 39.99,
        baseCost: 18.00,
        hasVariants: true,
        storeId: stores[0].id,
        images: { create: [{ imageData: placeholder, order: 0 }] },
        variants: {
          create: [
            { color: 'Purple', size: 'Standard', sku: 'SPF-001-PUR-STD', price: 39.99, stock: 15 },
            { color: 'Blue', size: 'Standard', sku: 'SPF-001-BLU-STD', price: 39.99, stock: 12 }
          ]
        }
      },
    }),

    // Books & Media
    prisma.product.create({
      data: {
        name: 'Bestseller Novel',
        baseSKU: 'BKM-001',
        categoryId: categories[4].id,
        description: 'Latest bestselling fiction novel',
        basePrice: 16.99,
        baseCost: 8.00,
        hasVariants: false,
        storeId: stores[1].id,
        images: { create: [{ imageData: placeholder, order: 0 }] },
        variants: {
          create: [{
            color: 'Standard',
            size: 'One Size',
            sku: 'BKM-001-STD',
            price: 16.99,
            stock: 40
          }]
        }
      },
    }),

    // Food & Beverages
    prisma.product.create({
      data: {
        name: 'Premium Coffee Beans',
        baseSKU: 'FBD-001',
        categoryId: categories[5].id,
        description: 'Fresh roasted premium coffee beans, 1lb',
        basePrice: 24.99,
        baseCost: 12.00,
        hasVariants: false,
        storeId: stores[0].id,
        images: { create: [{ imageData: placeholder, order: 0 }] },
        variants: {
          create: [{
            color: 'Standard',
            size: '1lb',
            sku: 'FBD-001-STD-1LB',
            price: 24.99,
            stock: 35
          }]
        }
      },
    })
  ])
  products.push(...baseProducts)

  const extraToCreate = Math.max(TARGET_PRODUCT_COUNT - products.length, 0)

  if (extraToCreate > 0) {
  console.log(`🛠️ Generating ${extraToCreate} additional products...`)

  const extraProductPromises: Promise<any>[] = []

    for (let i = 0; i < extraToCreate; i++) {
      const index = i + 1
      const idSuffix = String(index).padStart(3, '0')
      const category = categories[i % categories.length]
      const store = stores[i % stores.length]
      const basePrice = Number((Math.random() * 150 + 10).toFixed(2))
      const baseCost = Number((basePrice * (0.5 + Math.random() * 0.2)).toFixed(2))
      const stock = Math.floor(Math.random() * 60) + 10

      extraProductPromises.push(
        prisma.product.create({
          data: {
            name: `Autogen Product ${idSuffix}`,
            baseSKU: `AUTO-${idSuffix}`,
            categoryId: category.id,
            description: `Automatically generated product ${idSuffix} for testing`,
            basePrice,
            baseCost,
            hasVariants: false,
            storeId: store.id,
            images: { create: [{ imageData: placeholder, order: 0 }] },
            variants: {
              create: [{
                color: 'Standard',
                size: 'One Size',
                sku: `AUTO-${idSuffix}-STD`,
                price: basePrice,
                stock
              }]
            }
          }
        })
      )
    }

    const extraProducts = await Promise.all(extraProductPromises)
    products.push(...extraProducts)
  }

  console.log(`✅ Created ${products.length} products\n`)

  // ==================== SALE TRANSACTIONS ====================
  console.log('💰 Creating sale transactions...')

  // Helper function to get random items from products
  const getRandomItems = (count: number) => {
    const shuffled = [...products].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  const saleTransactions = []

  // Create transactions for the last 30 days
  const totalTransactions = 200
  for (let i = 0; i < totalTransactions; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const transactionDate = new Date()
    transactionDate.setDate(transactionDate.getDate() - daysAgo)

    const numItems = Math.floor(Math.random() * 3) + 1 // 1-3 items per transaction
    const selectedProducts = getRandomItems(numItems)

    let subtotal = 0
    const saleItems = []

    for (const product of selectedProducts) {
      // Get the product's variants
      const variants = await prisma.productVariant.findMany({
        where: { productId: product.id }
      })
      const variant = variants[0] // Use first variant

      const quantity = Math.floor(Math.random() * 3) + 1 // 1-3 quantity
      const price = variant.price
      const total = price * quantity

      subtotal += total

      saleItems.push({
        productId: product.id,
        variantId: variant.id,
        quantity,
        price,
        total
      })
    }

    const tax = subtotal * 0.08 // 8% tax
    const total = subtotal + tax

    const transaction = await prisma.saleTransaction.create({
      data: {
        userId: users[Math.floor(Math.random() * users.length)].id,
        paymentMethod: ['cash', 'card'][Math.floor(Math.random() * 2)],
        status: 'completed',
        customerName: Math.random() > 0.5 ? customers[Math.floor(Math.random() * customers.length)].name : null,
        subtotal,
        tax,
        total,
        createdAt: transactionDate,
        items: {
          create: saleItems
        }
      }
    })

    saleTransactions.push(transaction)
  }

  console.log(`✅ Created ${saleTransactions.length} sale transactions\n`)

  // ==================== FINANCIAL TRANSACTIONS ====================
  console.log('💸 Creating financial transactions...')

  const financialTransactions = await Promise.all([
    prisma.financialTransaction.create({
      data: {
        type: 'expense',
        amount: 2500.00,
        description: 'Monthly rent payment',
        userId: users[0].id,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    }),
    prisma.financialTransaction.create({
      data: {
        type: 'expense',
        amount: 1800.00,
        description: 'Employee salaries',
        userId: users[0].id,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
    }),
    prisma.financialTransaction.create({
      data: {
        type: 'income',
        amount: 5000.00,
        description: 'Equipment sale',
        userId: users[1].id,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      },
    }),
    prisma.financialTransaction.create({
      data: {
        type: 'expense',
        amount: 750.00,
        description: 'Office supplies',
        userId: users[1].id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    })
  ])

  console.log(`✅ Created ${financialTransactions.length} financial transactions\n`)

  // ==================== SUMMARY ====================
  console.log('🎉 Database seeding completed successfully!\n')
  console.log('📊 Summary:')
  console.log(`   • ${categories.length} categories`)
  console.log(`   • ${users.length} users (admin, manager, cashier1, cashier2)`)
  console.log(`   • ${stores.length} stores`)
  console.log(`   • ${employees.length} employees`)
  console.log(`   • ${customers.length} customers`)
  console.log(`   • ${products.length} products with variants`)
  console.log(`   • ${saleTransactions.length} sale transactions`)
  console.log(`   • ${financialTransactions.length} financial transactions`)
  console.log('')
  console.log('🔐 Login Credentials:')
  console.log('   Admin: admin / admin123')
  console.log('   Manager: manager / manager123')
  console.log('   Cashier: cashier1 / cashier123 or cashier2 / cashier123')
  console.log('')
  console.log('💡 You can now test all features with realistic data!')

}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
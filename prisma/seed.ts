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
        username: 'sales',
        passwordHash: await bcrypt.hash('sales123', 10),
        role: 'sales',
        fullName: 'Sales Associate',
        email: 'sales@bizflow.com',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'inventory',
        passwordHash: await bcrypt.hash('inventory123', 10),
        role: 'inventory',
        fullName: 'Inventory Manager',
        email: 'inventory@bizflow.com',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'finance',
        passwordHash: await bcrypt.hash('finance123', 10),
        role: 'finance',
        fullName: 'Finance Manager',
        email: 'finance@bizflow.com',
        isActive: true,
      },
    }),
  ])
  
  console.log(`✅ Created ${users.length} users`)
  console.log('   Default credentials:')
  console.log('   • admin / admin123 (Full access)')
  console.log('   • manager / manager123 (Management access)')
  console.log('   • sales / sales123 (Sales only)')
  console.log('   • inventory / inventory123 (Inventory only)')
  console.log('   • finance / finance123 (Finance only)\n')

  // ==================== STORES ====================
  console.log('🏪 Creating stores...')
  
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        name: 'Downtown Store',
        location: '123 Main St, City Center',
        phone: '+1-555-0101',
        hours: 'Mon-Fri: 9AM-9PM, Sat-Sun: 10AM-6PM',
        manager: 'John Smith',
        status: 'active',
      },
    }),
    prisma.store.create({
      data: {
        name: 'Westside Mall',
        location: '456 West Ave, Shopping District',
        phone: '+1-555-0102',
        hours: 'Mon-Sun: 10AM-10PM',
        manager: 'Sarah Johnson',
        status: 'active',
      },
    }),
    prisma.store.create({
      data: {
        name: 'Airport Branch',
        location: '789 Airport Rd, Terminal 2',
        phone: '+1-555-0103',
        hours: '24/7',
        manager: 'Mike Chen',
        status: 'active',
      },
    }),
  ])
  
  console.log(`✅ Created ${stores.length} stores\n`)

  // ==================== EMPLOYEES ====================
  console.log('💼 Creating employees...')
  
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        name: 'Alice Brown',
        role: 'Cashier',
        email: 'alice@example.com',
        phone: '+1-555-1001',
        performance: 92.5,
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Bob Wilson',
        role: 'Stock Manager',
        email: 'bob@example.com',
        phone: '+1-555-1002',
        performance: 88.0,
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Carol Davis',
        role: 'Sales Associate',
        email: 'carol@example.com',
        phone: '+1-555-1003',
        performance: 95.2,
      },
    }),
    prisma.employee.create({
      data: {
        name: 'David Lee',
        role: 'Floor Manager',
        email: 'david@example.com',
        phone: '+1-555-1004',
        performance: 90.8,
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Emma Garcia',
        role: 'Customer Service',
        email: 'emma@example.com',
        phone: '+1-555-1005',
        performance: 87.3,
      },
    }),
  ])
  
  console.log(`✅ Created ${employees.length} employees\n`)

  // ==================== CUSTOMERS ====================
  console.log('🛍️ Creating customers...')
  
  const customerFirstNames = [
    'James', 'Lisa', 'Robert', 'Jennifer', 'Michael', 'Emily', 'William', 'Jessica',
    'David', 'Sarah', 'Richard', 'Ashley', 'Joseph', 'Amanda', 'Thomas', 'Melissa',
    'Christopher', 'Deborah', 'Daniel', 'Stephanie', 'Matthew', 'Dorothy', 'Anthony', 'Rebecca',
    'Mark', 'Michelle', 'Donald', 'Laura', 'Steven', 'Sharon', 'Paul', 'Cynthia',
    'Andrew', 'Kathleen', 'Joshua', 'Amy', 'Kenneth', 'Angela', 'Kevin', 'Shirley',
    'Brian', 'Anna', 'George', 'Brenda', 'Timothy', 'Pamela', 'Ronald', 'Nicole',
    'Edward', 'Emma', 'Jason', 'Samantha', 'Jeffrey', 'Katherine', 'Ryan', 'Christine'
  ]
  
  const customerLastNames = [
    'Anderson', 'Martinez', 'Taylor', 'White', 'Brown', 'Wilson', 'Moore', 'Garcia',
    'Rodriguez', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright',
    'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter',
    'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans',
    'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook',
    'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox'
  ]
  
  const loyaltyTiers = ['Bronze', 'Silver', 'Gold', 'Platinum']
  
  const customers: any[] = []
  for (let i = 0; i < 100; i++) {
    const firstName = customerFirstNames[Math.floor(Math.random() * customerFirstNames.length)]
    const lastName = customerLastNames[Math.floor(Math.random() * customerLastNames.length)]
    const name = `${firstName} ${lastName}`
    const totalSpent = Math.floor(Math.random() * 15000) + 100
    
    const customer = await prisma.customer.create({
      data: {
        name,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
        phone: `+1-555-${String(3000 + i).padStart(4, '0')}`,
        loyaltyTier: loyaltyTiers[Math.floor(Math.random() * loyaltyTiers.length)],
        totalSpent,
      },
    })
    customers.push(customer)
    
    if ((i + 1) % 20 === 0) {
      console.log(`  Created ${i + 1} customers...`)
    }
  }
  
  console.log(`✅ Created ${customers.length} customers\n`)

  // ==================== PRODUCTS (4000 ITEMS) ====================
  console.log('📦 Creating 4000 products with variants and images...')
  
  const colors = [
    'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink', 
    'Gray', 'Brown', 'Orange', 'Navy', 'Teal', 'Beige', 'Burgundy', 
    'Olive', 'Coral', 'Turquoise', 'Mint', 'Lavender'
  ]
  
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'One Size']
  
  // Expanded product names for more variety
  const productPrefixes = [
    'Premium', 'Deluxe', 'Pro', 'Ultra', 'Super', 'Classic', 'Modern', 
    'Vintage', 'Elite', 'Essential', 'Smart', 'Advanced', 'Basic', 
    'Luxury', 'Eco', 'Portable', 'Compact', 'Heavy Duty', 'Lightweight', 'Professional'
  ]
  
  const productTypes = [
    'Headphones', 'Watch', 'Speaker', 'Cable', 'Case', 'Stand', 'Mouse', 
    'Keyboard', 'Webcam', 'Charger', 'T-Shirt', 'Jeans', 'Hoodie', 'Jacket',
    'Pants', 'Shorts', 'Sweater', 'Mug', 'Bottle', 'Plate', 'Bowl', 'Knife',
    'Mat', 'Dumbbell', 'Bands', 'Rope', 'Bag', 'Shoes', 'Novel', 'Guide',
    'Toy', 'Game', 'Puzzle', 'Ball', 'Kit', 'Set', 'Cream', 'Lotion', 'Shampoo',
    'Brush', 'Tool', 'Mount', 'Cover', 'Organizer', 'Notebook', 'Pen', 'Folder',
    'Tent', 'Backpack', 'Lantern', 'Cooler', 'Rod', 'Collar', 'Leash', 'Toy',
    'Stroller', 'Crib', 'Necklace', 'Bracelet', 'Ring', 'Earrings', 'Coffee',
    'Tea', 'Snacks', 'Chips', 'Guitar', 'Drum', 'Piano', 'Chair', 'Desk',
    'Table', 'Shelf', 'Hammer', 'Drill', 'Saw', 'Paint', 'Canvas', 'Yarn',
    'Suitcase', 'Wallet', 'Boots', 'Sandals', 'Sneakers'
  ]
  
  const materials = ['Cotton', 'Polyester', 'Leather', 'Metal', 'Plastic', 'Wood', 'Glass', 'Ceramic', 'Rubber', 'Silicone']
  const brands = ['TechPro', 'StyleMax', 'HomeEssentials', 'FitLife', 'ReadMore', 'PlayTime', 'BeautyPlus', 'AutoCare', 'OfficeHub', 'OutdoorPro']
  
  // Convert local images to base64
  console.log('  Loading local product images...')
  const productImages = localImages.map(imagePath => {
    try {
      return imageToBase64(imagePath)
    } catch (error) {
      return placeholder
    }
  })
  console.log(`  Loaded ${productImages.length} product images`)
  
  const createdProducts: any[] = []
  let productCount = 0
  const batchSize = 100
  
  for (let batch = 0; batch < 400; batch++) { // 40 batches of 100 products = 4000
    const productsInBatch: any[] = []
    
    for (let i = 0; i < batchSize; i++) {
      const category = categories[productCount % categories.length]
      const prefix = productPrefixes[Math.floor(Math.random() * productPrefixes.length)]
      const type = productTypes[Math.floor(Math.random() * productTypes.length)]
      const material = materials[Math.floor(Math.random() * materials.length)]
      const brand = brands[Math.floor(Math.random() * brands.length)]
      
      const name = `${prefix} ${material} ${type}`
      const basePrice = Math.floor(Math.random() * 500) + 10
      const hasVariants = Math.random() > 0.4 // 60% of products have variants
      const storeId = stores[productCount % 3].id
      
      // Randomly assign images from our local collection
      const numImages = Math.floor(Math.random() * 3) + 1 // 1-3 images per product
      const productImageData = []
      for (let imgIdx = 0; imgIdx < numImages; imgIdx++) {
        productImageData.push({
          imageData: productImages[imgIdx % productImages.length],
          order: imgIdx
        })
      }
      
      // Create variants
      const variantsData = []
      if (hasVariants) {
        const numVariants = Math.floor(Math.random() * 5) + 2 // 2-6 variants
        for (let v = 0; v < numVariants; v++) {
          // More realistic stock distribution: 10% out of stock, 15% low, 50% normal, 25% high
          const stockRandom = Math.random()
          let stock: number
          if (stockRandom < 0.10) {
            stock = 0 // 10% out of stock
          } else if (stockRandom < 0.25) {
            stock = Math.floor(Math.random() * 10) + 1 // 15% low stock (1-10)
          } else if (stockRandom < 0.75) {
            stock = Math.floor(Math.random() * 40) + 11 // 50% normal stock (11-50)
          } else {
            stock = Math.floor(Math.random() * 150) + 51 // 25% high stock (51-200)
          }
          
          variantsData.push({
            color: colors[Math.floor(Math.random() * colors.length)],
            size: sizes[Math.floor(Math.random() * sizes.length)],
            sku: `${brand.substring(0, 3).toUpperCase()}-${(productCount + 1).toString().padStart(5, '0')}-${v + 1}`,
            price: basePrice + (v * 5),
            stock,
          })
        }
      } else {
        // More realistic stock for non-variant products
        const stockRandom = Math.random()
        let stock: number
        if (stockRandom < 0.05) {
          stock = 0 // 5% out of stock
        } else if (stockRandom < 0.15) {
          stock = Math.floor(Math.random() * 10) + 1 // 10% low stock
        } else if (stockRandom < 0.65) {
          stock = Math.floor(Math.random() * 40) + 11 // 50% normal stock
        } else {
          stock = Math.floor(Math.random() * 250) + 51 // 35% high stock
        }
        
        variantsData.push({
          color: null,
          size: null,
          sku: `${brand.substring(0, 3).toUpperCase()}-${(productCount + 1).toString().padStart(5, '0')}`,
          price: basePrice,
          stock,
        })
      }
      
      productsInBatch.push({
        name,
        baseSKU: `SKU${(productCount + 1).toString().padStart(5, '0')}`,
        categoryId: category.id,
        description: `${brand} ${prefix} ${type} made from high-quality ${material}. Perfect for everyday use with excellent durability and style.`,
        basePrice,
        baseCost: Math.floor(basePrice * 0.65),
        hasVariants,
        storeId,
        images: {
          create: productImageData
        },
        variants: {
          create: variantsData
        }
      })
      
      productCount++
    }
    
    // Batch create products
    for (const productData of productsInBatch) {
      const product = await prisma.product.create({
        data: productData,
        include: {
          variants: true,
        },
      })
      createdProducts.push(product)
    }
    
    console.log(`  Created ${productCount} products...`)
  }
  
  console.log(`✅ Created ${productCount} products with variants and images\n`)

  // ==================== SALES (10000 TRANSACTIONS) ====================
  console.log('💰 Creating 10,000 sales transactions over the past year...')
  
  const paymentMethods = ['cash', 'card']
  const salesUsers = [users[2]] // sales
  const statuses = ['completed', 'completed', 'completed', 'completed', 'completed', 'pending', 'refunded'] // 5/7 completed
  
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const now = new Date()
  const yearInMs = now.getTime() - oneYearAgo.getTime()
  
  const salesBatchSize = 100
  
  for (let batch = 0; batch < 100; batch++) { // 100 batches of 100 sales = 10,000
    const salesInBatch = []
    
    for (let i = 0; i < salesBatchSize; i++) {
      const product = createdProducts[Math.floor(Math.random() * createdProducts.length)]
      const variant = product.variants[Math.floor(Math.random() * product.variants.length)]
      const quantity = Math.floor(Math.random() * 8) + 1
      const salesUser = salesUsers[Math.floor(Math.random() * salesUsers.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      // Random timestamp within the past year
      const randomTime = oneYearAgo.getTime() + Math.random() * yearInMs
      const saleDate = new Date(randomTime)
      
      // Add customer name for some sales
      const hasCustomer = Math.random() > 0.3 // 70% have customer names
      const customerName = hasCustomer 
        ? customers[Math.floor(Math.random() * customers.length)].name 
        : null
      
      salesInBatch.push({
        productId: product.id,
        variantId: variant.id,
        userId: salesUser.id,
        quantity,
        price: variant.price,
        total: variant.price * quantity,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status,
        customerName,
        createdAt: saleDate,
      })
    }
    
    // Batch create sales
    await prisma.sale.createMany({
      data: salesInBatch
    })
    
    const totalCreated = (batch + 1) * salesBatchSize
    if (totalCreated % 1000 === 0) {
      console.log(`  Created ${totalCreated} sales...`)
    }
  }
  
  console.log(`✅ Created 10,000 sales transactions\n`)

  // ==================== TRANSACTIONS (500 FINANCIAL) ====================
  console.log('💵 Creating financial transactions...')
  
  const transactionTypes = ['income', 'expense']
  const incomeDescriptions = [
    'Product Sales', 'Service Revenue', 'Consultation Fee', 'Commission', 'Bonus', 
    'Refund Received', 'Investment Return', 'Licensing Fee', 'Wholesale Order', 
    'Subscription Payment', 'Rental Income', 'Royalty Payment'
  ]
  const expenseDescriptions = [
    'Office Rent', 'Utilities', 'Salaries', 'Marketing', 'Equipment', 'Supplies', 
    'Maintenance', 'Insurance', 'Travel', 'Training', 'Legal Fees', 'Accounting',
    'Software Licenses', 'Internet', 'Phone Bills', 'Shipping', 'Packaging',
    'Advertising', 'Repairs', 'Cleaning Services', 'Security', 'Taxes'
  ]
  
  for (let i = 0; i < 500; i++) {
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
    const descriptions = type === 'income' ? incomeDescriptions : expenseDescriptions
    const amount = type === 'income' 
      ? Math.floor(Math.random() * 10000) + 500 
      : Math.floor(Math.random() * 5000) + 100
    
    const randomTime = oneYearAgo.getTime() + Math.random() * yearInMs
    const transactionDate = new Date(randomTime)
    
    await prisma.transaction.create({
      data: {
        type,
        amount,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        userId: users[4].id, // finance
        createdAt: transactionDate,
      },
    })
    
    if ((i + 1) % 100 === 0) {
      console.log(`  Created ${i + 1} transactions...`)
    }
  }
  
  console.log(`✅ Created 500 financial transactions\n`)

  console.log('🎉 Seed data created successfully!\n')
  console.log('📊 Summary:')
  console.log(`   • ${users.length} users`)
  console.log(`   • ${stores.length} stores`)
  console.log(`   • ${employees.length} employees`)
  console.log(`   • ${customers.length} customers`)
  console.log(`   • ${productCount} products with variants and real images`)
  console.log(`   • 10,000 sales transactions (over 1 year)`)
  console.log(`   • 500 financial transactions`)
  console.log(`\n💡 Total database records: ~${productCount + 10000 + 500 + users.length + stores.length + employees.length + customers.length}+`)
  console.log(`\n🖼️  Product images loaded from:`)
  localImages.forEach((img, idx) => {
    console.log(`   ${idx + 1}. ${img}`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
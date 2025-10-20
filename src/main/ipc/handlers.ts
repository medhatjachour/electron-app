import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'
import path from 'node:path'

// Enable Prisma client for real database operations
let prisma: any = null
try {
  // Import from the generated location - use absolute path from project root
  const prismaPath = path.join(__dirname, '../../src/generated/prisma')
  const { PrismaClient } = require(prismaPath)
  if (PrismaClient) {
    prisma = new PrismaClient()
    console.log('[Database] Prisma client initialized successfully')
  }
} catch (e) {
  console.warn('Prisma client not available in IPC handlers; using mock fallbacks', e)
}

if (!prisma) {
  console.warn('[Dev Mode] Prisma client disabled - IPC handlers using mock data')
}

// Auth handlers
ipcMain.handle('auth:login', async (_, { username, password }) => {
  try {
    // Accept a built-in default account for quick access in dev: 0000 / 0000
    if (username === '0000' && password === '0000') {
      return { success: true, user: { id: '0', username: '0000', role: 'admin' } }
    }
    if (prisma) {
      const user = await prisma.user.findUnique({ where: { username } })
      if (!user) return { success: false, message: 'Invalid username or password' }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) return { success: false, message: 'Invalid username or password' }

      return { success: true, user: { id: user.id, username: user.username, role: user.role } }
    }

    // Mock fallback
    return { success: true, user: { id: '1', username, role: 'admin' } }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, message: 'An error occurred during login' }
  }
})

// Dashboard handlers
ipcMain.handle('dashboard:getMetrics', async () => {
  try {
    if (prisma) {
      const totalSales = await prisma.sale.aggregate({ _sum: { total: true } })
      return { sales: totalSales._sum.total || 0, orders: 0, profit: 0 }
    }

    return { sales: 12345, orders: 123, profit: 4567 }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    throw error
  }
})

// Sales handlers
ipcMain.handle('sales:create', async (_, { productId, userId, quantity, total }) => {
  try {
    if (prisma) {
      const [sale] = await prisma.$transaction([
        prisma.sale.create({ data: { productId, userId, quantity, total } }),
        prisma.product.update({ where: { id: productId }, data: { stock: { decrement: quantity } } })
      ])
      return { success: true, sale }
    }
    // mock
    return { success: true, sale: { id: 's_mock', productId, userId, quantity, total } }
  } catch (error) {
    console.error('Error creating sale:', error)
    throw error
  }
})

// Inventory handlers
ipcMain.handle('inventory:getProducts', async () => {
  try {
    if (prisma) {
      const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })
      return products
    }
    return [{ id: 'p1', name: 'Product A', sku: 'A-1', price: 10, stock: 100 }, { id: 'p2', name: 'Product B', sku: 'B-1', price: 20, stock: 5 }]
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
})

ipcMain.handle('inventory:addProduct', async (_, { name, sku, price, stock }) => {
  try {
    if (prisma) {
      const product = await prisma.product.create({ data: { name, sku, price, stock } })
      return { success: true, product }
    }
    return { success: true, product: { id: 'p_mock', name, sku, price, stock } }
  } catch (error) {
    console.error('Error adding product:', error)
    throw error
  }
})

// Finance handlers
ipcMain.handle('finance:addTransaction', async (_, { type, amount, description, userId }) => {
  try {
    if (prisma) {
      const transaction = await prisma.transaction.create({ data: { type, amount, description, userId } })
      return { success: true, transaction }
    }
    return { success: true, transaction: { id: 't_mock', type, amount, description, userId } }
  } catch (error) {
    console.error('Error adding transaction:', error)
    throw error
  }
})

ipcMain.handle('finance:getTransactions', async (_, { startDate, endDate }) => {
  try {
    if (prisma) {
      const transactions = await prisma.transaction.findMany({ where: { createdAt: { gte: startDate, lte: endDate } }, orderBy: { createdAt: 'desc' }, include: { user: { select: { username: true } } } })
      return transactions
    }
    return []
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }
})

// ==================== PRODUCT HANDLERS (WITH VARIANTS) ====================

// Get all products with variants and images
ipcMain.handle('products:getAll', async () => {
  try {
    if (prisma) {
      const products = await prisma.product.findMany({
        include: {
          images: { orderBy: { order: 'asc' } },
          variants: { orderBy: { createdAt: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
      })
      return products
    }
    return []
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
})

// Create product with variants and images
ipcMain.handle('products:create', async (_, productData) => {
  try {
    if (prisma) {
      const { images, variants, baseStock, ...product } = productData
      
      const newProduct = await prisma.product.create({
        data: {
          ...product,
          images: images?.length ? {
            create: images.map((img: string, idx: number) => ({
              imageData: img,
              order: idx
            }))
          } : undefined,
          variants: variants?.length ? {
            create: variants.map((v: any) => ({
              color: v.color,
              size: v.size,
              sku: v.sku,
              price: v.price,
              stock: v.stock
            }))
          } : undefined
        },
        include: {
          images: true,
          variants: true
        }
      })
      
      return { success: true, product: newProduct }
    }
    return { success: false, message: 'Database not available' }
  } catch (error: any) {
    console.error('Error creating product:', error)
    return { success: false, message: error.message }
  }
})

// Update product
ipcMain.handle('products:update', async (_, { id, productData }) => {
  try {
    if (prisma) {
      const { images, variants, baseStock, ...product } = productData
      
      // Delete existing images and variants, then recreate
      await prisma.productImage.deleteMany({ where: { productId: id } })
      await prisma.productVariant.deleteMany({ where: { productId: id } })
      
      const updated = await prisma.product.update({
        where: { id },
        data: {
          ...product,
          images: images?.length ? {
            create: images.map((img: string, idx: number) => ({
              imageData: img,
              order: idx
            }))
          } : undefined,
          variants: variants?.length ? {
            create: variants.map((v: any) => ({
              color: v.color,
              size: v.size,
              sku: v.sku,
              price: v.price,
              stock: v.stock
            }))
          } : undefined
        },
        include: {
          images: true,
          variants: true
        }
      })
      
      return { success: true, product: updated }
    }
    return { success: false, message: 'Database not available' }
  } catch (error: any) {
    console.error('Error updating product:', error)
    return { success: false, message: error.message }
  }
})

// Delete product
ipcMain.handle('products:delete', async (_, id) => {
  try {
    if (prisma) {
      await prisma.product.delete({ where: { id } })
      return { success: true }
    }
    return { success: false, message: 'Database not available' }
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return { success: false, message: error.message }
  }
})

// ==================== STORE HANDLERS ====================

ipcMain.handle('stores:getAll', async () => {
  try {
    if (prisma) {
      return await prisma.store.findMany({ orderBy: { createdAt: 'desc' } })
    }
    return []
  } catch (error) {
    console.error('Error fetching stores:', error)
    throw error
  }
})

ipcMain.handle('stores:create', async (_, storeData) => {
  try {
    if (prisma) {
      const store = await prisma.store.create({ data: storeData })
      return { success: true, store }
    }
    return { success: false, message: 'Database not available' }
  } catch (error: any) {
    console.error('Error creating store:', error)
    return { success: false, message: error.message }
  }
})

// ==================== EMPLOYEE HANDLERS ====================

ipcMain.handle('employees:getAll', async () => {
  try {
    if (prisma) {
      return await prisma.employee.findMany({ orderBy: { createdAt: 'desc' } })
    }
    return []
  } catch (error) {
    console.error('Error fetching employees:', error)
    throw error
  }
})

ipcMain.handle('employees:create', async (_, employeeData) => {
  try {
    if (prisma) {
      const employee = await prisma.employee.create({ data: employeeData })
      return { success: true, employee }
    }
    return { success: false, message: 'Database not available' }
  } catch (error: any) {
    console.error('Error creating employee:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('employees:update', async (_, { id, employeeData }) => {
  try {
    if (prisma) {
      const employee = await prisma.employee.update({ where: { id }, data: employeeData })
      return { success: true, employee }
    }
    return { success: false, message: 'Database not available' }
  } catch (error: any) {
    console.error('Error updating employee:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('employees:delete', async (_, id) => {
  try {
    if (prisma) {
      await prisma.employee.delete({ where: { id } })
      return { success: true }
    }
    return { success: false, message: 'Database not available' }
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    return { success: false, message: error.message }
  }
})

// ==================== CUSTOMER HANDLERS ====================

ipcMain.handle('customers:getAll', async () => {
  try {
    if (prisma) {
      return await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } })
    }
    return []
  } catch (error) {
    console.error('Error fetching customers:', error)
    throw error
  }
})

ipcMain.handle('customers:create', async (_, customerData) => {
  try {
    if (prisma) {
      const customer = await prisma.customer.create({ data: customerData })
      return { success: true, customer }
    }
    return { success: false, message: 'Database not available' }
  } catch (error: any) {
    console.error('Error creating customer:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('customers:update', async (_, { id, customerData }) => {
  try {
    if (prisma) {
      const customer = await prisma.customer.update({ where: { id }, data: customerData })
      return { success: true, customer }
    }
    return { success: false, message: 'Database not available' }
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('customers:delete', async (_, id) => {
  try {
    if (prisma) {
      await prisma.customer.delete({ where: { id } })
      return { success: true }
    }
    return { success: false, message: 'Database not available' }
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return { success: false, message: error.message }
  }
})

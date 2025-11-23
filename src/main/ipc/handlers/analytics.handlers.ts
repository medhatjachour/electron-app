/**
 * Product Analytics & Stock Movement Tracking Handlers
 * 
 * Features:
 * 1. Stock Movement Tracking - Record every inventory change
 * 2. Product Sales Analytics - Units sold, revenue, trends
 * 3. Time-based Analysis - Daily, monthly, yearly charts
 * 4. Stockout History - Track when products run out
 */

import { ipcMain } from 'electron'
import path from 'node:path'
import { getDatabasePath } from '../../database/init'

// Initialize Prisma client
function initializePrisma() {
  try {
    const isDev = process.env.NODE_ENV === 'development'
    let PrismaClient
    
    if (isDev) {
      const prismaPath = path.resolve(process.cwd(), 'src', 'generated', 'prisma')
      PrismaClient = require(prismaPath).PrismaClient
    } else {
      const prismaPath = path.resolve(__dirname, '..', '..', '..', 'app.asar.unpacked', 'src', 'generated', 'prisma')
      PrismaClient = require(prismaPath).PrismaClient
    }
    
    if (PrismaClient) {
      const dbPath = getDatabasePath()
      return new PrismaClient({
        datasources: {
          db: {
            url: `file:${dbPath}?connection_limit=1&timeout=60000&journal_mode=WAL`
          }
        }
      })
    }
  } catch (error) {
    console.error('❌ Failed to initialize Prisma for analytics:', error)
  }
  return null
}

let prisma: any = null

export function registerAnalyticsHandlers() {
  // Initialize Prisma when registering handlers
  prisma = initializePrisma()
  
  if (!prisma) {
    console.warn('⚠️  Analytics handlers registered but Prisma client unavailable')
    return
  }

// ==================== STOCK MOVEMENT TRACKING ====================

/**
 * Record a stock movement (restock, sale, adjustment, etc.)
 */
ipcMain.handle('analytics:recordStockMovement', async (_, data: {
  variantId: string
  type: 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'SHRINKAGE' | 'RETURN'
  quantity: number
  reason?: string
  referenceId?: string
  userId?: string
  notes?: string
}) => {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: data.variantId },
      include: { product: true }
    })

    if (!variant) {
      throw new Error('Product variant not found')
    }

    const previousStock = variant.stock
    const newStock = previousStock + data.quantity

    if (newStock < 0) {
      throw new Error('Insufficient stock for this operation')
    }

    // Create stock movement record
    const movement = await prisma.stockMovement.create({
      data: {
        variantId: data.variantId,
        type: data.type,
        quantity: data.quantity,
        previousStock,
        newStock,
        reason: data.reason,
        referenceId: data.referenceId,
        userId: data.userId,
        notes: data.notes
      },
      include: {
        variant: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      }
    })

    // Update variant stock
    await prisma.productVariant.update({
      where: { id: data.variantId },
      data: {
        stock: newStock,
        lastRestocked: data.type === 'RESTOCK' ? new Date() : undefined
      }
    })

    console.log(`✅ Stock movement: ${data.type} ${data.quantity} units for ${variant.product.name}`)
    return movement
  } catch (error) {
    console.error('❌ Error recording stock movement:', error)
    throw error
  }
})

/**
 * Get stock movement history for a variant
 */
ipcMain.handle('analytics:getStockMovementHistory', async (_, variantId: string, options?: {
  limit?: number
  type?: string
  startDate?: string
  endDate?: string
}) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: {
        variantId,
        ...(options?.type && { type: options.type }),
        ...(options?.startDate && options?.endDate && {
          createdAt: {
            gte: new Date(options.startDate),
            lte: new Date(options.endDate)
          }
        })
      },
      include: {
        variant: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: options?.limit || 100
    })

    return movements
  } catch (error) {
    console.error('❌ Error fetching movement history:', error)
    throw error
  }
})

/**
 * Get stockout history - times when product ran out and was restocked
 */
ipcMain.handle('analytics:getStockoutHistory', async (_, variantId: string) => {
  try {
    // Find all times this variant went to 0 stock
    const stockouts = await prisma.stockMovement.findMany({
      where: {
        variantId,
        newStock: 0
      },
      include: {
        variant: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // For each stockout, find the next restock
    const stockoutHistory = await Promise.all(
      stockouts.map(async (stockout) => {
        const nextRestock = await prisma.stockMovement.findFirst({
          where: {
            variantId,
            type: 'RESTOCK',
            createdAt: {
              gt: stockout.createdAt
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        })

        const daysOutOfStock = nextRestock 
          ? Math.ceil((nextRestock.createdAt.getTime() - stockout.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : null

        return {
          stockoutDate: stockout.createdAt,
          restockDate: nextRestock?.createdAt || null,
          daysOutOfStock,
          restockQuantity: nextRestock?.quantity || null,
          stillOutOfStock: !nextRestock
        }
      })
    )

    const totalStockouts = stockoutHistory.length
    const avgDaysOutOfStock = stockoutHistory
      .filter(s => s.daysOutOfStock !== null)
      .reduce((sum, s) => sum + (s.daysOutOfStock || 0), 0) / 
      (stockoutHistory.filter(s => s.daysOutOfStock !== null).length || 1)

    return {
      totalStockouts,
      avgDaysOutOfStock: Math.round(avgDaysOutOfStock * 10) / 10,
      history: stockoutHistory
    }
  } catch (error) {
    console.error('❌ Error fetching stockout history:', error)
    throw error
  }
})

/**
 * Get restock history
 */
ipcMain.handle('analytics:getRestockHistory', async (_, variantId: string, limit = 50) => {
  try {
    const restocks = await prisma.stockMovement.findMany({
      where: {
        variantId,
        type: 'RESTOCK'
      },
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        },
        variant: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    const totalRestocked = restocks.reduce((sum, r) => sum + r.quantity, 0)
    const avgRestockQuantity = restocks.length > 0 ? totalRestocked / restocks.length : 0

    return {
      totalRestocks: restocks.length,
      totalQuantity: totalRestocked,
      avgQuantity: Math.round(avgRestockQuantity),
      restocks
    }
  } catch (error) {
    console.error('❌ Error fetching restock history:', error)
    throw error
  }
})

// ==================== PRODUCT SALES ANALYTICS ====================

/**
 * Get product sales statistics
 */
ipcMain.handle('analytics:getProductSalesStats', async (_, productId: string, options?: {
  startDate?: string
  endDate?: string
}) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        variants: true
      }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const whereClause: any = {
      productId,
      transaction: {
        status: 'completed'
      }
    }

    if (options?.startDate && options?.endDate) {
      whereClause.createdAt = {
        gte: new Date(options.startDate),
        lte: new Date(options.endDate)
      }
    }

    // Get all sale items for this product
    const saleItems = await prisma.saleItem.findMany({
      where: whereClause,
      include: {
        transaction: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const totalUnitsSold = saleItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalRevenue = saleItems.reduce((sum, item) => sum + item.total, 0)
    const totalTransactions = new Set(saleItems.map(item => item.transactionId)).size
    const avgUnitsPerSale = totalTransactions > 0 ? totalUnitsSold / totalTransactions : 0
    const avgRevenuePerSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    // Calculate current stock across all variants
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)

    return {
      product: {
        id: product.id,
        name: product.name,
        baseSKU: product.baseSKU,
        category: product.category.name
      },
      totalUnitsSold,
      totalRevenue,
      totalTransactions,
      avgUnitsPerSale: Math.round(avgUnitsPerSale * 10) / 10,
      avgRevenuePerSale: Math.round(avgRevenuePerSale * 100) / 100,
      currentStock: totalStock,
      turnoverRate: totalStock > 0 ? (totalUnitsSold / totalStock) : 0
    }
  } catch (error) {
    console.error('❌ Error fetching product sales stats:', error)
    throw error
  }
})

/**
 * Get sales trend over time (for charts)
 */
ipcMain.handle('analytics:getProductSalesTrend', async (_, productId: string, options: {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  startDate?: string
  endDate?: string
}) => {
  try {
    const whereClause: any = {
      productId,
      transaction: {
        status: 'completed'
      }
    }

    if (options.startDate && options.endDate) {
      whereClause.createdAt = {
        gte: new Date(options.startDate),
        lte: new Date(options.endDate)
      }
    }

    const saleItems = await prisma.saleItem.findMany({
      where: whereClause,
      include: {
        transaction: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group by period
    const grouped: Record<string, { units: number; revenue: number; count: number }> = {}

    saleItems.forEach(item => {
      const date = new Date(item.createdAt)
      let key: string

      switch (options.period) {
        case 'daily':
          key = date.toISOString().split('T')[0] // YYYY-MM-DD
          break
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay()) // Start of week
          key = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
          break
        case 'yearly':
          key = String(date.getFullYear()) // YYYY
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!grouped[key]) {
        grouped[key] = { units: 0, revenue: 0, count: 0 }
      }

      grouped[key].units += item.quantity
      grouped[key].revenue += item.total
      grouped[key].count += 1
    })

    // Convert to array and sort
    const trend = Object.entries(grouped)
      .map(([period, data]) => ({
        period,
        unitsSold: data.units,
        revenue: Math.round(data.revenue * 100) / 100,
        transactions: data.count,
        avgUnitsPerTransaction: Math.round((data.units / data.count) * 10) / 10
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    return trend
  } catch (error) {
    console.error('❌ Error fetching sales trend:', error)
    throw error
  }
})

/**
 * Get top selling products
 */
ipcMain.handle('analytics:getTopSellingProducts', async (_, options: {
  limit?: number
  startDate?: string
  endDate?: string
  categoryId?: string
}) => {
  try {
    const whereClause: any = {
      transaction: {
        status: 'completed'
      }
    }

    if (options.startDate && options.endDate) {
      whereClause.createdAt = {
        gte: new Date(options.startDate),
        lte: new Date(options.endDate)
      }
    }

    if (options.categoryId) {
      whereClause.product = {
        categoryId: options.categoryId
      }
    }

    const saleItems = await prisma.saleItem.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            category: true
          }
        },
        transaction: true
      }
    })

    // Group by product
    const productSales: Record<string, {
      product: any
      units: number
      revenue: number
      transactions: number
    }> = {}

    saleItems.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          product: item.product,
          units: 0,
          revenue: 0,
          transactions: 0
        }
      }

      productSales[item.productId].units += item.quantity
      productSales[item.productId].revenue += item.total
      productSales[item.productId].transactions += 1
    })

    // Convert to array and sort by units sold
    const topProducts = Object.values(productSales)
      .map(data => ({
        productId: data.product.id,
        productName: data.product.name,
        category: data.product.category.name,
        unitsSold: data.units,
        revenue: Math.round(data.revenue * 100) / 100,
        transactions: data.transactions,
        avgUnitsPerTransaction: Math.round((data.units / data.transactions) * 10) / 10
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, options.limit || 10)

    return topProducts
  } catch (error) {
    console.error('❌ Error fetching top selling products:', error)
    throw error
  }
})

/**
 * Get all stock movements across all variants with filters
 */
ipcMain.handle('analytics:getAllStockMovements', async (_, options?: {
  limit?: number
  type?: 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'SHRINKAGE' | 'RETURN'
  startDate?: string
  endDate?: string
  search?: string
}) => {
  try {
    const whereClause: any = {}

    // Filter by movement type
    if (options?.type) {
      whereClause.type = options.type
    }

    // Filter by date range
    if (options?.startDate || options?.endDate) {
      whereClause.createdAt = {}
      if (options.startDate) {
        whereClause.createdAt.gte = new Date(options.startDate)
      }
      if (options.endDate) {
        whereClause.createdAt.lte = new Date(options.endDate)
      }
    }

    // Search by product name or SKU
    if (options?.search) {
      whereClause.variant = {
        OR: [
          {
            product: {
              name: {
                contains: options.search,
                mode: 'insensitive'
              }
            }
          },
          {
            sku: {
              contains: options.search,
              mode: 'insensitive'
            }
          }
        ]
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        variant: {
          include: {
            product: {
              select: {
                name: true,
                baseSKU: true
              }
            }
          }
        },
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: options?.limit || 100
    })

    // Format response
    return movements.map(m => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      previousStock: m.previousStock,
      newStock: m.newStock,
      reason: m.reason,
      notes: m.notes,
      createdAt: m.createdAt,
      product: {
        name: m.variant.product.name,
        sku: m.variant.sku || m.variant.product.baseSKU
      },
      user: m.user ? {
        username: m.user.username,
        fullName: m.user.fullName
      } : null
    }))
  } catch (error) {
    console.error('❌ Error fetching all stock movements:', error)
    throw error
  }
})

  console.log('✅ Analytics handlers registered')
}

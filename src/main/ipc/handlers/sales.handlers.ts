/**
 * Sales IPC Handlers
 * Handles sale transactions, refunds, and sales history
 */

import { ipcMain } from 'electron'

export function registerSalesHandlers(prisma: any) {
  ipcMain.handle('sales:create', async (_, saleData) => {
    try {
      const { productId, variantId, userId, quantity, price, total, paymentMethod, customerName } = saleData
      
      if (prisma) {
        // Use transaction to create sale and decrease stock atomically
        // Optimized: Removed unnecessary includes to speed up transaction
        const result = await prisma.$transaction(async (tx: any) => {
          // Create the sale (without includes for speed)
          const sale = await tx.sale.create({
            data: {
              productId,
              variantId,
              userId,
              quantity,
              price,
              total,
              paymentMethod,
              customerName,
              status: 'completed'
            }
          })
          
          // Decrease stock
          if (variantId) {
            // Decrease variant stock
            await tx.productVariant.update({
              where: { id: variantId },
              data: { stock: { decrement: quantity } }
            })
          }
          // Note: Simple products (without variants) don't have stock tracking in schema
          // They use variant.stock even if hasVariants=false
          
          return sale
        }, {
          // Transaction-specific timeout (overrides global setting if needed)
          maxWait: 30000,
          timeout: 30000
        })
        
        return { success: true, sale: result }
      }
      
      // Mock fallback
      return { success: true, sale: { id: 's_mock', ...saleData, status: 'completed' } }
    } catch (error) {
      console.error('Error creating sale:', error)
      throw error
    }
  })

  ipcMain.handle('sales:getAll', async () => {
    try {
      if (prisma) {
        const sales = await prisma.sale.findMany({
          include: {
            product: {
              select: {
                name: true,
                category: true
              }
            },
            user: {
              select: {
                username: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        return sales
      }
      return []
    } catch (error) {
      console.error('Error fetching sales:', error)
      throw error
    }
  })

  /**
   * Get sales by date range - OPTIMIZED for dashboard
   * Only loads sales within specified date range
   */
  ipcMain.handle('sales:getByDateRange', async (_, options = {}) => {
    try {
      const { startDate, endDate } = options
      
      if (!prisma) return []

      const where: any = {}
      
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate)
      }

      const sales = await prisma.sale.findMany({
        where,
        select: {
          id: true,
          total: true,
          quantity: true,
          createdAt: true,
          paymentMethod: true,
          status: true,
          customerName: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return sales
    } catch (error) {
      console.error('Error fetching sales by date range:', error)
      throw error
    }
  })

  /**
   * Get sales statistics - OPTIMIZED with raw SQL
   */
  ipcMain.handle('sales:getStats', async (_, options = {}) => {
    try {
      if (!prisma) return null

      const { startDate, endDate } = options
      const where: any = {}
      
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate)
      }

      const [totalSales, completedSales, refundedSales] = await Promise.all([
        prisma.sale.count({ where }),
        prisma.sale.count({ where: { ...where, status: 'completed' } }),
        prisma.sale.count({ where: { ...where, status: 'refunded' } })
      ])

      // Get revenue using aggregation
      const revenue = await prisma.sale.aggregate({
        where: { ...where, status: 'completed' },
        _sum: { total: true }
      })

      return {
        totalSales,
        completedSales,
        refundedSales,
        totalRevenue: revenue._sum.total || 0
      }
    } catch (error) {
      console.error('Error fetching sales stats:', error)
      throw error
    }
  })

  ipcMain.handle('sales:refund', async (_, saleId) => {
    try {
      if (prisma) {
        const sale = await prisma.sale.update({
          where: { id: saleId },
          data: { status: 'refunded' },
          include: {
            product: true,
            user: {
              select: {
                username: true
              }
            }
          }
        })

        // Restore stock
        if (sale.variantId) {
          await prisma.productVariant.update({
            where: { id: sale.variantId },
            data: { stock: { increment: sale.quantity } }
          })
        }

        return { success: true, sale }
      }
      return { success: false, message: 'Database not available' }
    } catch (error) {
      console.error('Error refunding sale:', error)
      throw error
    }
  })
}

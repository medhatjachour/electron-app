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
        const result = await prisma.$transaction(async (tx: any) => {
          // Create the sale
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
            },
            include: {
              product: {
                include: {
                  images: true
                }
              },
              user: {
                select: {
                  username: true
                }
              }
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
          
          return sale
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

/**
 * Customers IPC Handlers
 * Handles customer management
 */

import { ipcMain } from 'electron'

export function registerCustomersHandlers(prisma: any) {
  // Helper function to recalculate customer totalSpent from transactions
  async function recalculateCustomerTotalSpent(customerId: string) {
    if (!prisma) return
    
    try {
      const result = await prisma.saleTransaction.aggregate({
        where: {
          customerId: customerId,
          status: 'completed' // Only count completed transactions
        },
        _sum: {
          total: true
        }
      })
      
      const totalSpent = result._sum.total || 0
      
      await prisma.customer.update({
        where: { id: customerId },
        data: { totalSpent }
      })
      
      console.log(`[Customer] Recalculated totalSpent for customer ${customerId}: $${totalSpent}`)
    } catch (error) {
      console.error('Error recalculating customer totalSpent:', error)
    }
  }

  ipcMain.handle('customers:getAll', async () => {
    try {
      if (prisma) {
        // Get all customers with their real calculated stats
        const customers = await prisma.customer.findMany({ 
          orderBy: { createdAt: 'desc' },
          include: {
            saleTransactions: {
              where: { status: 'completed' },
              select: {
                id: true,
                total: true,
                createdAt: true
              }
            }
          }
        })
        
        // Recalculate totalSpent for each customer from transactions
        const customersWithRealStats = customers.map((customer: any) => {
          const realTotalSpent = customer.saleTransactions.reduce(
            (sum: number, t: any) => sum + t.total, 
            0
          )
          const purchaseCount = customer.saleTransactions.length
          
          return {
            ...customer,
            totalSpent: realTotalSpent,
            purchaseCount,
            saleTransactions: undefined // Remove from response to reduce payload
          }
        })
        
        return customersWithRealStats
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

  // Get customer purchase history
  ipcMain.handle('customers:getPurchaseHistory', async (_, customerId) => {
    try {
      if (prisma) {
        const transactions = await prisma.saleTransaction.findMany({
          where: { customerId },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    baseSKU: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50 // Last 50 transactions
        })
        return transactions
      }
      return []
    } catch (error) {
      console.error('Error fetching purchase history:', error)
      throw error
    }
  })

  // Recalculate totalSpent for a customer (called when transactions change)
  ipcMain.handle('customers:recalculateTotalSpent', async (_, customerId) => {
    try {
      await recalculateCustomerTotalSpent(customerId)
      return { success: true }
    } catch (error: any) {
      console.error('Error recalculating totalSpent:', error)
      return { success: false, message: error.message }
    }
  })
}

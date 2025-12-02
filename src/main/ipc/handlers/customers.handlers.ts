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
      
    } catch (error) {
      console.error('Error recalculating customer totalSpent:', error)
    }
  }

  ipcMain.handle('customers:getAll', async (_, options = {}) => {
    try {
      if (prisma) {
        const {
          limit = 100,
          offset = 0,
          searchTerm = ''
        } = options

        // Build where clause for search
        const where: any = {}
        if (searchTerm) {
          where.OR = [
            { name: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { phone: { contains: searchTerm } }
          ]
        }

        // Get customers with pagination
        const [customers, totalCount] = await Promise.all([
          prisma.customer.findMany({ 
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
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
          }),
          prisma.customer.count({ where })
        ])
        
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
        
        return {
          customers: customersWithRealStats,
          totalCount,
          hasMore: offset + limit < totalCount
        }
      }
      return { customers: [], totalCount: 0, hasMore: false }
    } catch (error) {
      console.error('Error fetching customers:', error)
      throw error
    }
  })

  ipcMain.handle('customers:create', async (_, customerData) => {
    try {
      if (prisma) {
        // Normalize empty email to null to avoid unique constraint issues
        const normalizedData = {
          ...customerData,
          email: customerData.email?.trim() || null
        }
        
        // Check if phone already exists
        const existingCustomer = await prisma.customer.findUnique({
          where: { phone: normalizedData.phone }
        })
        
        if (existingCustomer) {
          return { 
            success: false, 
            message: 'A customer with this phone number already exists',
            existingCustomer 
          }
        }
        
        const customer = await prisma.customer.create({ data: normalizedData })
        return { success: true, customer }
      }
      return { success: false, message: 'Database not available' }
    } catch (error: any) {
      console.error('Error creating customer:', error)
      if (error.code === 'P2002') {
        return { success: false, message: 'A customer with this phone number already exists' }
      }
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('customers:update', async (_, { id, customerData }) => {
    try {
      if (prisma) {
        // Normalize empty email to null to avoid unique constraint issues
        const normalizedData = {
          ...customerData,
          email: customerData.email?.trim() || null
        }
        
        // Check if phone already exists (excluding current customer)
        if (normalizedData.phone) {
          const existingCustomer = await prisma.customer.findUnique({
            where: { phone: normalizedData.phone }
          })
          
          if (existingCustomer && existingCustomer.id !== id) {
            return { 
              success: false, 
              message: 'A customer with this phone number already exists',
              existingCustomer 
            }
          }
        }
        
        const customer = await prisma.customer.update({ where: { id }, data: normalizedData })
        return { success: true, customer }
      }
      return { success: false, message: 'Database not available' }
    } catch (error: any) {
      console.error('Error updating customer:', error)
      if (error.code === 'P2002') {
        return { success: false, message: 'A customer with this phone number already exists' }
      }
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

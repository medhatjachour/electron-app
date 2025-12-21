/**
 * Customers IPC Handlers
 * Handles customer management
 */

import { ipcMain } from 'electron'
import * as XLSX from 'xlsx'

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
        const where: any = {
          isArchived: false // Always exclude archived customers
        }
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
            },
            deposits: true,
            installments: true
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

  // Helper function to sanitize vCard field values per RFC 2426
  function sanitizeVCardField(value: string): string {
    if (!value) return ''
    return value
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/\r/g, '')      // Remove carriage returns
      .replace(/,/g, '\\,')    // Escape commas
      .replace(/;/g, '\\;')    // Escape semicolons
  }

  // Export customers in different formats
  ipcMain.handle('customers:export', async (_, { format, searchTerm = '' }) => {
    try {
      if (!prisma) return { success: false, message: 'Database not available' }

      // Build where clause for search (same as getAll)
      const where: any = {
        isArchived: false
      }
      if (searchTerm) {
        where.OR = [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { phone: { contains: searchTerm } }
        ]
      }

      // Fetch customers with limit to prevent memory issues
      const MAX_EXPORT_LIMIT = 10000
      const customerCount = await prisma.customer.count({ where })
      
      if (customerCount > MAX_EXPORT_LIMIT) {
        return { 
          success: false, 
          message: `Export limited to ${MAX_EXPORT_LIMIT} customers. Found ${customerCount}. Please use search to filter.` 
        }
      }

      // Fetch all customers matching the filter (with limit)
      const customers = await prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        take: MAX_EXPORT_LIMIT,
        include: {
          saleTransactions: {
            where: { 
              OR: [
                { status: 'completed' },
                { status: 'partially_refunded' }
              ]
            },
            select: { 
              status: true,
              total: true,
              items: {
                select: {
                  price: true,
                  finalPrice: true,
                  refundedQuantity: true
                }
              }
            }
          }
        }
      })

      // Recalculate totalSpent including partially refunded transactions
      const customersWithStats = customers.map((customer: any) => {
        // Calculate completed transactions total
        const completedTotal = customer.saleTransactions
          .filter((t: any) => t.status === 'completed')
          .reduce((sum: number, t: any) => sum + t.total, 0)
        
        // Calculate net amount for partially refunded transactions
        const partiallyRefundedTotal = customer.saleTransactions
          .filter((t: any) => t.status === 'partially_refunded')
          .reduce((sum: number, tx: any) => {
            const refundedAmount = tx.items.reduce((itemSum: number, item: any) => {
              const refunded = item.refundedQuantity || 0
              return itemSum + (refunded * (item.finalPrice || item.price))
            }, 0)
            return sum + (tx.total - refundedAmount)
          }, 0)
        
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone,
          loyaltyTier: customer.loyaltyTier,
          totalSpent: completedTotal + partiallyRefundedTotal,
          createdAt: customer.createdAt
        }
      })

      const timestamp = new Date().toISOString().split('T')[0]

      if (format === 'excel') {
        // Create Excel workbook
        const ws = XLSX.utils.json_to_sheet(customersWithStats.map(c => ({
          'Name': c.name,
          'Email': c.email,
          'Phone': c.phone,
          'Loyalty Tier': c.loyaltyTier,
          'Total Spent': c.totalSpent,
          'Member Since': new Date(c.createdAt).toLocaleDateString()
        })))
        
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Customers')
        
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
        
        return {
          success: true,
          data: excelBuffer,
          filename: `customers-${timestamp}.xlsx`,
          count: customersWithStats.length
        }
      } else if (format === 'csv') {
        // Create CSV
        const ws = XLSX.utils.json_to_sheet(customersWithStats.map(c => ({
          'Name': c.name,
          'Email': c.email,
          'Phone': c.phone,
          'Loyalty Tier': c.loyaltyTier,
          'Total Spent': c.totalSpent,
          'Member Since': new Date(c.createdAt).toLocaleDateString()
        })))
        
        const csv = XLSX.utils.sheet_to_csv(ws)
        
        return {
          success: true,
          data: Buffer.from(csv),
          filename: `customers-${timestamp}.csv`,
          count: customersWithStats.length
        }
      } else if (format === 'vcf') {
        // Create vCard format (VCF) - compatible with iOS and Android
        const vcards = customersWithStats.map(c => {
          const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${sanitizeVCardField(c.name)}`,
            `TEL;TYPE=CELL:${sanitizeVCardField(c.phone)}`,
            c.email ? `EMAIL:${sanitizeVCardField(c.email)}` : '',
            `NOTE:${sanitizeVCardField(`Loyalty Tier: ${c.loyaltyTier} | Total Spent: $${c.totalSpent.toFixed(2)}`)}`,
            'END:VCARD'
          ].filter(line => line).join('\r\n')
          return vcard
        }).join('\r\n')

        return {
          success: true,
          data: Buffer.from(vcards),
          filename: `customers-${timestamp}.vcf`,
          count: customersWithStats.length
        }
      } else {
        return { success: false, message: 'Invalid export format' }
      }
    } catch (error: any) {
      console.error('Error exporting customers:', error)
      return { success: false, message: error.message }
    }
  })
}

/**
 * Customers IPC Handlers
 * Handles customer management
 */

import { ipcMain } from 'electron'

export function registerCustomersHandlers(prisma: any) {
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
}

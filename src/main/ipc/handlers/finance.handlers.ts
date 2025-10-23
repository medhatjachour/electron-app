/**
 * Finance IPC Handlers
 * Handles financial transactions and reports
 */

import { ipcMain } from 'electron'

export function registerFinanceHandlers(prisma: any) {
  ipcMain.handle('finance:addTransaction', async (_, { type, amount, description, userId }) => {
    try {
      if (prisma) {
        const transaction = await prisma.transaction.create({ 
          data: { type, amount, description, userId } 
        })
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
        const transactions = await prisma.transaction.findMany({ 
          where: { createdAt: { gte: startDate, lte: endDate } }, 
          orderBy: { createdAt: 'desc' }, 
          include: { user: { select: { username: true } } } 
        })
        return transactions
      }
      return []
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  })
}

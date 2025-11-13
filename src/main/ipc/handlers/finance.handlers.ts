/**
 * Finance IPC Handlers
 * Handles financial transactions and reports
 */

import { ipcMain } from 'electron'

export function registerFinanceHandlers(prisma: any) {
  ipcMain.handle('finance:addTransaction', async (_, { type, amount, description, userId }) => {
    try {
      if (prisma) {
        const transaction = await prisma.financialTransaction.create({ 
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
        const transactions = await prisma.financialTransaction.findMany({ 
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

  ipcMain.handle('finance:getStats', async () => {
    try {
      if (prisma) {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const monthlyTransactions = await prisma.financialTransaction.findMany({
          where: { createdAt: { gte: startOfMonth } }
        })
        
        const income = monthlyTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const expenses = monthlyTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
        
        return {
          totalIncome: income,
          totalExpenses: expenses,
          netProfit: income - expenses,
          transactionCount: monthlyTransactions.length
        }
      }
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        transactionCount: 0
      }
    } catch (error) {
      console.error('Error fetching finance stats:', error)
      throw error
    }
  })
}

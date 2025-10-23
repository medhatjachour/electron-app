/**
 * Dashboard IPC Handlers
 * Handles dashboard metrics and statistics
 */

import { ipcMain } from 'electron'

export function registerDashboardHandlers(prisma: any) {
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
}

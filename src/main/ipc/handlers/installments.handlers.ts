import { ipcMain } from 'electron'
import { InstallmentService } from '../../services/InstallmentService'

export function registerInstallmentsHandlers(prisma: any) {
  const installmentService = new InstallmentService(prisma)

  ipcMain.handle('installments:create', async (_, data) => {
    try {
      const installment = await installmentService.createInstallment(data)
      return { success: true, installment }
    } catch (error) {
      console.error('Error creating installment:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('installments:list', async () => {
    try {
      const installments = await installmentService.listInstallments()
      return installments
    } catch (error) {
      console.error('Error listing installments:', error)
      return []
    }
  })

  ipcMain.handle('installments:getByCustomer', async (_, customerId) => {
    try {
      const installments = await installmentService.getInstallmentsByCustomer(customerId)
      return installments
    } catch (error) {
      console.error('Error getting installments by customer:', error)
      return []
    }
  })

  ipcMain.handle('installments:getBySale', async (_, saleId) => {
    try {
      const installments = await installmentService.getInstallmentsBySale(saleId)
      return installments
    } catch (error) {
      console.error('Error getting installments by sale:', error)
      return []
    }
  })

  ipcMain.handle('installments:getUpcomingReminders', async (_, daysAhead) => {
    try {
      const reminders = await installmentService.getUpcomingReminders(daysAhead)
      return reminders
    } catch (error) {
      console.error('Error getting upcoming reminders:', error)
      return []
    }
  })

  ipcMain.handle('installments:getOverdue', async () => {
    try {
      const overdue = await installmentService.getOverdueInstallments()
      return overdue
    } catch (error) {
      console.error('Error getting overdue installments:', error)
      return []
    }
  })

  ipcMain.handle('installments:markAsPaid', async (_, { installmentId, paidDate }) => {
    try {
      const installment = await installmentService.markAsPaid(installmentId, paidDate ? new Date(paidDate) : undefined)
      return { success: true, installment }
    } catch (error) {
      console.error('Error marking installment as paid:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('installments:markAsOverdue', async (_, installmentId) => {
    try {
      const installment = await installmentService.markAsOverdue(installmentId)
      return { success: true, installment }
    } catch (error) {
      console.error('Error marking installment as overdue:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('installments:linkToSale', async (_, { installmentIds, saleId }) => {
    try {
      const result = await installmentService.linkInstallmentsToSale(installmentIds, saleId)
      return { success: true, result }
    } catch (error) {
      console.error('Error linking installments to sale:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

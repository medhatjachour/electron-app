/**
 * Deposit Service
 * Handles business logic for deposits
 */
import type { PrismaClient } from '@prisma/client'

export class DepositService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async createDeposit(data: {
    amount: number
    date?: Date
    method: string
    status?: string
    note?: string
    customerId?: string
    saleId?: string
  }) {
    return this.prisma.deposit.create({
      data: {
        amount: data.amount,
        date: data.date ?? new Date(),
        method: data.method,
        status: data.status ?? 'paid',
        note: data.note,
        customerId: data.customerId ?? null,
        saleId: data.saleId ?? null,
      }
    })
  }

  async getDepositsByCustomer(customerId: string) {
    return this.prisma.deposit.findMany({
      where: { customerId },
      orderBy: { date: 'desc' }
    })
  }

  async getDepositsBySale(saleId: string) {
    return this.prisma.deposit.findMany({
      where: { saleId },
      orderBy: { date: 'desc' }
    })
  }

  async listDeposits() {
    return this.prisma.deposit.findMany({ orderBy: { date: 'desc' } })
  }

  async linkDepositsToSale(depositIds: string[], saleId: string) {
    return this.prisma.deposit.updateMany({
      where: {
        id: { in: depositIds },
        saleId: null // Only update deposits that aren't already linked to a sale
      },
      data: { saleId }
    })
  }
}

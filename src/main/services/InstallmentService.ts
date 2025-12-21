/**
 * Installment Service
 * Handles business logic for installments
 */
import type { PrismaClient } from '@prisma/client'

export class InstallmentService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async createInstallment(data: {
    amount: number
    dueDate: Date
    paidDate?: Date
    status?: string
    note?: string
    customerId?: string
    saleId?: string
  }) {
    return this.prisma.installment.create({
      data: {
        amount: data.amount,
        dueDate: data.dueDate,
        paidDate: data.paidDate ?? null,
        status: data.status ?? 'pending',
        note: data.note,
        customerId: data.customerId ?? null,
        saleId: data.saleId ?? null,
      }
    })
  }

  async getInstallmentsByCustomer(customerId: string) {
    return this.prisma.installment.findMany({
      where: { customerId },
      orderBy: { dueDate: 'asc' }
    })
  }

  async getInstallmentsBySale(saleId: string) {
    return this.prisma.installment.findMany({
      where: { saleId },
      orderBy: { dueDate: 'asc' }
    })
  }

  async listInstallments() {
    return this.prisma.installment.findMany({ orderBy: { dueDate: 'asc' } })
  }

  async getUpcomingReminders(daysAhead: number = 7) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    return this.prisma.installment.findMany({
      where: {
        status: 'pending',
        dueDate: {
          lte: futureDate,
          gte: new Date()
        }
      },
      include: {
        customer: true
      },
      orderBy: { dueDate: 'asc' }
    })
  }

  async getOverdueInstallments() {
    return this.prisma.installment.findMany({
      where: {
        status: 'pending',
        dueDate: {
          lt: new Date()
        }
      },
      include: {
        customer: true
      },
      orderBy: { dueDate: 'asc' }
    })
  }

  async markAsPaid(installmentId: string, paidDate?: Date) {
    return this.prisma.installment.update({
      where: { id: installmentId },
      data: {
        status: 'paid',
        paidDate: paidDate ?? new Date()
      }
    })
  }

  async markAsOverdue(installmentId: string) {
    return this.prisma.installment.update({
      where: { id: installmentId },
      data: { status: 'overdue' }
    })
  }

  async linkInstallmentsToSale(installmentIds: string[], saleId: string) {
    return this.prisma.installment.updateMany({
      where: {
        id: { in: installmentIds },
        saleId: null // Only update installments that aren't already linked to a sale
      },
      data: { saleId }
    })
  }
}

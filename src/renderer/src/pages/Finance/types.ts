/**
 * Finance Domain Types
 * Centralized type definitions for finance-related data
 */

export interface FinancialMetrics {
  totalRevenue: number
  totalCost: number
  netProfit: number
  profitMargin: number
  totalSales: number
  averageOrderValue: number
  totalPiecesSold: number
  numberOfOrders: number
  expectedSales: number
  actualSales: number
  expectedIncome: number
  actualIncome: number
  revenueGrowth: number
  orderGrowth: number
  roi: number
  conversionRate: number
  averageItemsPerOrder: number
  inventoryTurnover: number
}

export interface TopProduct {
  name: string
  revenue: number
  quantity: number
  category?: string
}

export type DateRangeType = 'today' | '7days' | '30days' | '90days' | 'custom'

export interface DateRangeFilter {
  type: DateRangeType
  customStart?: string
  customEnd?: string
}

/**
 * useFinanceMetrics Hook
 * Encapsulates finance metrics calculation logic
 */

import { useMemo } from 'react'
import type { Sale, Product, FinancialMetrics, TopProduct } from '../../../../shared/types'

export interface UseFinanceMetricsResult {
  metrics: FinancialMetrics
  topProducts: TopProduct[]
  bottomProducts: TopProduct[]
}

interface CalculateMetricsParams {
  currentSales: Sale[]
  previousSales: Sale[]
  products: Product[]
  costMargin?: number
}

export function useFinanceMetrics(params: CalculateMetricsParams): UseFinanceMetricsResult {
  const { currentSales, previousSales, products, costMargin = 0.6 } = params

  return useMemo(() => {
    // Current period metrics
    const totalRevenue = currentSales.reduce((sum, sale) => sum + sale.total, 0)
    const totalPiecesSold = currentSales.reduce((sum, sale) => sum + sale.quantity, 0)
    const numberOfOrders = currentSales.length
    const averageOrderValue = numberOfOrders > 0 ? totalRevenue / numberOfOrders : 0
    const averageItemsPerOrder = numberOfOrders > 0 ? totalPiecesSold / numberOfOrders : 0

    // Cost estimation
    const totalCost = totalRevenue * costMargin
    const netProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Previous period comparison
    const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.total, 0)
    const previousOrders = previousSales.length
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0
    const orderGrowth = previousOrders > 0 
      ? ((numberOfOrders - previousOrders) / previousOrders) * 100 
      : 0

    // ROI calculation
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0

    // Inventory turnover (estimated)
    const totalInventoryValue = products.reduce((sum, product) => {
      const variants = product.variants || []
      return sum + variants.reduce((vSum, variant) => vSum + (variant.price * (variant.stock || 0)), 0)
    }, 0)
    const inventoryTurnover = totalInventoryValue > 0 ? totalCost / totalInventoryValue : 0

    const metrics: FinancialMetrics = {
      totalRevenue,
      totalCost,
      netProfit,
      profitMargin,
      totalSales: totalRevenue,
      averageOrderValue,
      totalPiecesSold,
      numberOfOrders,
      expectedSales: 0, // Would need business logic
      actualSales: totalRevenue,
      expectedIncome: 0, // Would need business logic
      actualIncome: totalRevenue,
      revenueGrowth,
      orderGrowth,
      roi,
      conversionRate: 100, // Assume all completed sales
      averageItemsPerOrder,
      inventoryTurnover
    }

    // Calculate top products
    const productSales = new Map<string, { name: string; revenue: number; quantity: number; category?: string }>()
    
    // Create a product lookup map for better performance
    const productMap = new Map(products.map(p => [p.id, p]))
    
    currentSales.forEach(sale => {
      const product = productMap.get(sale.productId)
      const productName = product?.name || `[Deleted Product]`
      const category = product?.category
      
      const existing = productSales.get(sale.productId) || { name: productName, revenue: 0, quantity: 0, category }
      existing.revenue += sale.total
      existing.quantity += sale.quantity
      productSales.set(sale.productId, existing)
    })

    const sortedProducts = Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue)
    const topProducts = sortedProducts.slice(0, 5)
    const bottomProducts = sortedProducts.slice(-5).reverse()

    return { metrics, topProducts, bottomProducts }
  }, [currentSales, previousSales, products, costMargin])
}

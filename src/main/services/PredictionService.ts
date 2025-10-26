/**
 * PredictionService
 * 
 * Provides financial forecasting and predictive analytics
 * Features:
 * - Revenue forecasting (linear regression)
 * - Demand prediction
 * - Seasonal trend analysis
 * - Growth rate projections
 * - Anomaly detection
 * - Cash flow predictions
 */

import type { PrismaClient, Sale } from '@prisma/client'
import logger from '../../shared/utils/logger'

export interface ForecastResult {
  predictions: Array<{
    date: string
    predictedRevenue: number
    confidence: number
    lowerBound: number
    upperBound: number
  }>
  trend: 'up' | 'down' | 'stable'
  trendStrength: number // 0-100
  seasonalityDetected: boolean
  growthRate: number // percentage
}

export interface CashFlowProjection {
  projections: Array<{
    date: string
    expectedInflow: number
    expectedOutflow: number
    netCashFlow: number
    cumulativeCash: number
  }>
  burnRate: number // $ per day
  runway: number | null // days until cash depletes
  recommendation: string
}

export interface ProductInsight {
  productId: string
  productName: string
  insight: string
  type: 'opportunity' | 'warning' | 'success'
  metrics: {
    sales: number
    revenue: number
    profitMargin: number
    trend: 'up' | 'down' | 'stable'
    velocityScore: number // 0-100
  }
  recommendations: string[]
}

export interface FinancialHealth {
  score: number // 0-100
  indicators: {
    profitMargin: { value: number; status: 'good' | 'fair' | 'poor' }
    inventoryTurnover: { value: number; status: 'good' | 'fair' | 'poor' }
    growthRate: { value: number; status: 'good' | 'fair' | 'poor' }
    cashPosition: { value: number; status: 'good' | 'fair' | 'poor' }
  }
  alerts: string[]
  recommendations: string[]
}

export class PredictionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Forecast revenue for next N days using linear regression
   */
  async forecastRevenue(days: number = 30, historicalDays: number = 90): Promise<ForecastResult> {
    try {
      // Get historical sales data
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - historicalDays)

      const sales = await this.prisma.sale.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      // Group by day
      const dailySales = this.groupSalesByDay(sales)
      const dataPoints = Object.entries(dailySales).map(([date, revenue], index) => ({
        x: index,
        y: revenue,
        date
      }))

      if (dataPoints.length < 7) {
        // Not enough data for meaningful prediction
        return {
          predictions: [],
          trend: 'stable',
          trendStrength: 0,
          seasonalityDetected: false,
          growthRate: 0
        }
      }

      // Calculate linear regression
      const { slope, intercept } = this.linearRegression(dataPoints)
      
      // Detect seasonality
      const seasonalityDetected = this.detectSeasonality(dataPoints)
      
      // Calculate growth rate
      const recentAvg = this.average(dataPoints.slice(-7).map(p => p.y))
      const oldAvg = this.average(dataPoints.slice(0, 7).map(p => p.y))
      const growthRate = oldAvg > 0 ? ((recentAvg - oldAvg) / oldAvg) * 100 : 0

      // Determine trend
      const trend = slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'stable'
      const trendStrength = Math.min(100, Math.abs(slope) * 20)

      // Calculate standard deviation for confidence intervals
      const predictions = dataPoints.map(p => slope * p.x + intercept)
      const stdDev = this.standardDeviation(
        dataPoints.map((p, i) => p.y - predictions[i])
      )

      // Generate predictions
      const forecastPredictions = []
      const lastX = dataPoints.length - 1
      const today = new Date()

      for (let i = 1; i <= days; i++) {
        const x = lastX + i
        const predictedRevenue = slope * x + intercept
        
        // Apply confidence interval (95% = ±1.96 std dev)
        const margin = 1.96 * stdDev
        
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + i)

        forecastPredictions.push({
          date: futureDate.toISOString().split('T')[0],
          predictedRevenue: Math.max(0, predictedRevenue),
          confidence: Math.max(0, 100 - (i * 2)), // Confidence decreases over time
          lowerBound: Math.max(0, predictedRevenue - margin),
          upperBound: predictedRevenue + margin
        })
      }

      return {
        predictions: forecastPredictions,
        trend,
        trendStrength,
        seasonalityDetected,
        growthRate
      }
    } catch (error) {
      logger.error('Error forecasting revenue:', error)
      throw error
    }
  }

  /**
   * Project cash flow for next N days
   */
  async projectCashFlow(days: number = 30): Promise<CashFlowProjection> {
    try {
      // Get forecast
      const forecast = await this.forecastRevenue(days)
      
      // Get historical sales to calculate average daily outflow (cost of goods)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const sales = await this.prisma.sale.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        include: {
          product: true
        }
      })

      // Calculate average daily cost
      const totalCost = sales.reduce((sum, sale) => {
        return sum + (sale.quantity * sale.product.baseCost)
      }, 0)
      const avgDailyCost = totalCost / 30

      // Current cash position (you might want to store this in settings)
      let cumulativeCash = 0 // Starting cash - this should come from settings

      const projections = forecast.predictions.map(pred => {
        const expectedInflow = pred.predictedRevenue
        const expectedOutflow = avgDailyCost
        const netCashFlow = expectedInflow - expectedOutflow
        cumulativeCash += netCashFlow

        return {
          date: pred.date,
          expectedInflow,
          expectedOutflow,
          netCashFlow,
          cumulativeCash
        }
      })

      // Calculate burn rate (average daily loss)
      const avgNetCashFlow = this.average(projections.map(p => p.netCashFlow))
      const burnRate = avgNetCashFlow < 0 ? Math.abs(avgNetCashFlow) : 0

      // Calculate runway
      let runway = null
      if (burnRate > 0 && cumulativeCash > 0) {
        runway = Math.floor(cumulativeCash / burnRate)
      }

      // Generate recommendation
      let recommendation = ''
      if (runway !== null && runway < 30) {
        recommendation = `⚠️ Cash runway is critically low (${runway} days). Immediate action required.`
      } else if (avgNetCashFlow < 0) {
        recommendation = '⚠️ Negative cash flow detected. Consider cost reduction or revenue increase strategies.'
      } else {
        recommendation = '✅ Cash flow is positive. Consider reinvesting in growth.'
      }

      return {
        projections,
        burnRate,
        runway,
        recommendation
      }
    } catch (error) {
      logger.error('Error projecting cash flow:', error)
      throw error
    }
  }

  /**
   * Generate smart insights for products
   */
  async generateProductInsights(limit: number = 10): Promise<ProductInsight[]> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      // Get sales data
      const [recentSales, olderSales] = await Promise.all([
        this.prisma.sale.findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          include: { product: true }
        }),
        this.prisma.sale.findMany({
          where: {
            createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
          },
          include: { product: true }
        })
      ])

      // Aggregate by product
      const productMetrics = new Map<string, {
        productId: string
        productName: string
        recentSales: number
        recentRevenue: number
        olderSales: number
        olderRevenue: number
        profitMargin: number
      }>()

      recentSales.forEach(sale => {
        const key = sale.productId
        if (!productMetrics.has(key)) {
          productMetrics.set(key, {
            productId: sale.productId,
            productName: sale.product.name,
            recentSales: 0,
            recentRevenue: 0,
            olderSales: 0,
            olderRevenue: 0,
            profitMargin: 0
          })
        }
        const metrics = productMetrics.get(key)!
        metrics.recentSales += sale.quantity
        metrics.recentRevenue += sale.total
        const cost = sale.quantity * sale.product.baseCost
        const profit = sale.total - cost
        metrics.profitMargin = (profit / sale.total) * 100
      })

      olderSales.forEach(sale => {
        const key = sale.productId
        if (productMetrics.has(key)) {
          const metrics = productMetrics.get(key)!
          metrics.olderSales += sale.quantity
          metrics.olderRevenue += sale.total
        }
      })

      // Generate insights
      const insights: ProductInsight[] = []

      productMetrics.forEach((metrics) => {
        const salesChange = metrics.olderSales > 0 
          ? ((metrics.recentSales - metrics.olderSales) / metrics.olderSales) * 100
          : 100

        const trend: 'up' | 'down' | 'stable' = 
          salesChange > 20 ? 'up' : 
          salesChange < -20 ? 'down' : 
          'stable'

        // Velocity score (0-100) based on sales frequency and volume
        const velocityScore = Math.min(100, (metrics.recentSales / 30) * 10)

        let insight = ''
        let type: 'opportunity' | 'warning' | 'success' = 'success'
        const recommendations: string[] = []

        // Analyze and generate insights
        if (trend === 'up' && metrics.profitMargin > 30) {
          insight = `🚀 Strong performer with ${salesChange.toFixed(0)}% growth and high margins`
          type = 'success'
          recommendations.push('Consider increasing inventory levels')
          recommendations.push('Maintain current pricing strategy')
        } else if (trend === 'down') {
          insight = `📉 Sales declining by ${Math.abs(salesChange).toFixed(0)}%. Needs attention.`
          type = 'warning'
          recommendations.push('Consider promotional pricing')
          recommendations.push('Review product positioning')
          recommendations.push('Analyze competitor offerings')
        } else if (velocityScore < 10) {
          insight = `⚠️ Slow-moving product. Low turnover detected.`
          type = 'warning'
          recommendations.push('Consider clearance pricing')
          recommendations.push('Reduce reorder quantities')
        } else if (metrics.profitMargin > 40) {
          insight = `💰 High margin opportunity with ${metrics.profitMargin.toFixed(1)}% profit`
          type = 'opportunity'
          recommendations.push('Increase marketing focus')
          recommendations.push('Consider bundling with other products')
        }

        if (insight) {
          insights.push({
            productId: metrics.productId,
            productName: metrics.productName,
            insight,
            type,
            metrics: {
              sales: metrics.recentSales,
              revenue: metrics.recentRevenue,
              profitMargin: metrics.profitMargin,
              trend,
              velocityScore
            },
            recommendations
          })
        }
      })

      return insights.slice(0, limit)
    } catch (error) {
      logger.error('Error generating product insights:', error)
      throw error
    }
  }

  /**
   * Calculate overall financial health score
   */
  async calculateFinancialHealth(): Promise<FinancialHealth> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const sales = await this.prisma.sale.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        include: { product: true }
      })

      // Calculate profit margin
      const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
      const totalCost = sales.reduce((sum, s) => sum + (s.quantity * s.product.baseCost), 0)
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0

      // Get inventory turnover (simplified - should use inventory data)
      const products = await this.prisma.product.count()
      const inventoryTurnover = products > 0 ? sales.length / products : 0

      // Get growth rate
      const forecast = await this.forecastRevenue(30, 90)
      const growthRate = forecast.growthRate

      // Mock cash position (should come from accounting)
      const cashPosition = totalRevenue - totalCost

      // Evaluate each indicator
      const indicators = {
        profitMargin: {
          value: profitMargin,
          status: (profitMargin > 30 ? 'good' : profitMargin > 15 ? 'fair' : 'poor') as 'good' | 'fair' | 'poor'
        },
        inventoryTurnover: {
          value: inventoryTurnover,
          status: (inventoryTurnover > 5 ? 'good' : inventoryTurnover > 2 ? 'fair' : 'poor') as 'good' | 'fair' | 'poor'
        },
        growthRate: {
          value: growthRate,
          status: (growthRate > 10 ? 'good' : growthRate > 0 ? 'fair' : 'poor') as 'good' | 'fair' | 'poor'
        },
        cashPosition: {
          value: cashPosition,
          status: (cashPosition > 10000 ? 'good' : cashPosition > 5000 ? 'fair' : 'poor') as 'good' | 'fair' | 'poor'
        }
      }

      // Calculate overall score
      const weights = { profitMargin: 30, inventoryTurnover: 25, growthRate: 25, cashPosition: 20 }
      const statusScores = { good: 100, fair: 60, poor: 30 }
      const score = Math.round(
        (statusScores[indicators.profitMargin.status] * weights.profitMargin +
         statusScores[indicators.inventoryTurnover.status] * weights.inventoryTurnover +
         statusScores[indicators.growthRate.status] * weights.growthRate +
         statusScores[indicators.cashPosition.status] * weights.cashPosition) / 100
      )

      // Generate alerts and recommendations
      const alerts: string[] = []
      const recommendations: string[] = []

      if (indicators.profitMargin.status === 'poor') {
        alerts.push('⚠️ Low profit margins detected')
        recommendations.push('Review pricing strategy')
        recommendations.push('Analyze cost reduction opportunities')
      }

      if (indicators.inventoryTurnover.status === 'poor') {
        alerts.push('⚠️ Slow inventory turnover')
        recommendations.push('Consider clearance sales for slow-moving items')
      }

      if (indicators.growthRate.status === 'poor') {
        alerts.push('⚠️ Negative or stagnant growth')
        recommendations.push('Increase marketing efforts')
        recommendations.push('Explore new customer segments')
      }

      return {
        score,
        indicators,
        alerts,
        recommendations
      }
    } catch (error) {
      logger.error('Error calculating financial health:', error)
      throw error
    }
  }

  // ========== HELPER METHODS ==========

  private groupSalesByDay(sales: Sale[]): Record<string, number> {
    const grouped: Record<string, number> = {}
    
    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0]
      grouped[date] = (grouped[date] || 0) + sale.total
    })

    return grouped
  }

  private linearRegression(points: Array<{ x: number; y: number }>): { slope: number; intercept: number } {
    const n = points.length
    const sumX = points.reduce((sum, p) => sum + p.x, 0)
    const sumY = points.reduce((sum, p) => sum + p.y, 0)
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  private detectSeasonality(points: Array<{ x: number; y: number }>): boolean {
    // Simple seasonality detection using autocorrelation
    // If we have enough data (>= 28 days), check for weekly patterns
    if (points.length < 28) return false

    const values = points.map(p => p.y)
    const weeklyLag = 7
    
    const correlation = this.autocorrelation(values, weeklyLag)
    
    // If correlation > 0.5, we have weekly seasonality
    return Math.abs(correlation) > 0.5
  }

  private autocorrelation(values: number[], lag: number): number {
    if (values.length <= lag) return 0

    const mean = this.average(values)
    const subset = values.slice(lag)
    const originalSubset = values.slice(0, -lag)

    let numerator = 0
    let denominator = 0

    for (let i = 0; i < subset.length; i++) {
      numerator += (subset[i] - mean) * (originalSubset[i] - mean)
      denominator += (originalSubset[i] - mean) ** 2
    }

    return denominator !== 0 ? numerator / denominator : 0
  }

  private average(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
  }

  private standardDeviation(values: number[]): number {
    const avg = this.average(values)
    const squaredDiffs = values.map(v => (v - avg) ** 2)
    const variance = this.average(squaredDiffs)
    return Math.sqrt(variance)
  }
}

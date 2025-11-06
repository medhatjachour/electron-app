// Old finance page placeholder. Content removed as part of cleanup. Safe to delete.

/**
 * Finance Page - Refactored with Data Caching
 * Clean, modular architecture with separated concerns
 * Features instant navigation via data preloading
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { RefreshCcw } from 'lucide-react'
import { ipc } from '../../utils/ipc'
import { useDataCache } from '../../hooks/useDataCache'
import type { Sale, Product } from '../../../../shared/types'
import type { DateRangeType } from './types'
import { useFinanceMetrics } from './useFinanceMetrics'
import FinanceKPICards from './FinanceKPICards'
import DateRangeFilter from './DateRangeFilter'
import FinanceCharts from './FinanceCharts'

export default function Finance() {
  // Cache finance data for instant loading
  const { data: cachedData, loading, refetch } = useDataCache(
    'finance-data',
    async () => {
      const [salesData, productsResponse] = await Promise.all([
        ipc.sales.getAll(),
        ipc.products.getAll({ includeImages: false }) // Removed limit to load ALL products
      ])
      const productsData = productsResponse.products || productsResponse || []
      return { sales: salesData, products: productsData }
    },
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  )

  const sales = cachedData?.sales || []
  const products = cachedData?.products || []
  
  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeType>('30days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Memoize date calculations to avoid recalculation on every render
  const dateRangeDates = useMemo(() => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    let start = new Date()

    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case '7days':
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        break
      case '30days':
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
        break
      case '90days':
        start.setDate(start.getDate() - 90)
        start.setHours(0, 0, 0, 0)
        break
      case 'custom':
        if (customStartDate) start = new Date(customStartDate)
        if (customEndDate) end.setTime(new Date(customEndDate).getTime())
        break
    }

    return { start, end }
  }, [dateRange, customStartDate, customEndDate])

  // Memoize filtered sales to avoid recalculation
  const { filteredSales, previousPeriodSales } = useMemo(() => {
    const { start, end } = dateRangeDates
    
    const filtered = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= start && saleDate <= end
    })

    // Get previous period for comparison
    const periodLength = end.getTime() - start.getTime()
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - periodLength)
    
    const previousPeriod = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= prevStart && saleDate <= prevEnd
    })

    return { filteredSales: filtered, previousPeriodSales: previousPeriod }
  }, [sales, dateRangeDates])

  // Calculate metrics using custom hook (already memoized internally)
  const { metrics, topProducts, bottomProducts } = useFinanceMetrics({
    currentSales: filteredSales,
    previousSales: previousPeriodSales,
    products
  })

  // Memoize callbacks to prevent unnecessary re-renders of child components
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleDateRangeChange = useCallback((range: DateRangeType) => {
    setDateRange(range)
  }, [])

  const handleCustomStartChange = useCallback((date: string) => {
    setCustomStartDate(date)
  }, [])

  const handleCustomEndChange = useCallback((date: string) => {
    setCustomEndDate(date)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Financial Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Comprehensive financial analytics and insights</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartChange={handleCustomStartChange}
        onCustomEndChange={handleCustomEndChange}
      />

      {/* KPI Cards */}
      <FinanceKPICards metrics={metrics} />

      {/* Charts */}
      <FinanceCharts 
        sales={filteredSales} 
        metrics={metrics} 
        topProducts={topProducts} 
      />

      {/* Bottom Products Section */}
      {bottomProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Products Needing Attention
          </h3>
          <div className="space-y-2">
            {bottomProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-slate-700 dark:text-slate-300">{product.name}</span>
                <div className="text-right">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {product.quantity} units
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    ${product.revenue.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

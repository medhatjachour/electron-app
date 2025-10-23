/**
 * Finance Page - Refactored
 * Clean, modular architecture with separated concerns
 */

import { useEffect, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { ipc } from '../../utils/ipc'
import type { Sale, Product } from '../../../../shared/types'
import type { DateRangeType } from './types'
import { useFinanceMetrics } from './useFinanceMetrics'
import FinanceKPICards from './FinanceKPICards'
import DateRangeFilter from './DateRangeFilter'
import FinanceCharts from './FinanceCharts'

export default function Finance() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeType>('30days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  // Filtered data
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [previousPeriodSales, setPreviousPeriodSales] = useState<Sale[]>([])

  // Calculate metrics using custom hook
  const { metrics, topProducts, bottomProducts } = useFinanceMetrics({
    currentSales: filteredSales,
    previousSales: previousPeriodSales,
    products
  })

  useEffect(() => {
    loadFinancialData()
  }, [])

  useEffect(() => {
    if (sales.length > 0) {
      filterSalesByDateRange()
    }
  }, [dateRange, customStartDate, customEndDate, sales])

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      const [salesData, productsResponse] = await Promise.all([
        ipc.sales.getAll(),
        ipc.products.getAll({ includeImages: false, limit: 1000 })
      ])

      setSales(salesData)
      // Handle new response format
      const productsData = productsResponse.products || productsResponse || []
      setProducts(productsData)
    } catch (error) {
      console.error('Error loading financial data:', error)
      setSales([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const getDateRangeDates = (): { start: Date; end: Date } => {
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
  }

  const filterSalesByDateRange = () => {
    const { start, end } = getDateRangeDates()
    
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

    setFilteredSales(filtered)
    setPreviousPeriodSales(previousPeriod)
  }

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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Financial Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Comprehensive financial analytics and insights</p>
        </div>
        <button
          onClick={loadFinancialData}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartChange={setCustomStartDate}
        onCustomEndChange={setCustomEndDate}
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

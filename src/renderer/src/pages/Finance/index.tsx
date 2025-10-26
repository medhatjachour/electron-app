/**
 * Finance Page - Refactored with Backend Filtering
 * Performance optimized with server-side date range filtering
 * 
 * Features:
 * - Backend date range filtering
 * - Real-time metrics calculation
 * - Profit margin tracking
 * - Top products analysis
 * - Sales trends visualization
 * - Export capabilities
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { RefreshCcw, Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Percent, Calendar, BarChart3, Waves, Sparkles, Activity } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { DateRangeType } from './types'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/ui/ToastContainer'
import RevenueForecasting from './components/RevenueForecasting'
import CashFlowProjection from './components/CashFlowProjection'
import ProductInsights from './components/ProductInsights'
import FinancialHealthDashboard from './components/FinancialHealth'

type FinanceMetrics = {
  revenue: number
  transactions: number
  avgOrderValue: number
  revenueChange: number
  transactionsChange: number
  avgOrderValueChange: number
  totalProfit: number
  profitMargin: number
  totalCost: number
}

type TopProduct = {
  name: string
  revenue: number
  quantity: number
  cost: number
  profit: number
  profitMargin: number
}

type SalesByDay = {
  date: string
  revenue: number
}

type SalesByCategory = {
  name: string
  revenue: number
}

type TabType = 'overview' | 'forecasting' | 'cashflow' | 'insights' | 'health'

export default function Finance() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeType>('30days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Finance data state
  const [currentMetrics, setCurrentMetrics] = useState<FinanceMetrics | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [salesByDay, setSalesByDay] = useState<SalesByDay[]>([])
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([])

  // Calculate date ranges
  const { currentDates, previousDates } = useMemo(() => {
    const currentEnd = new Date()
    currentEnd.setHours(23, 59, 59, 999)
    let currentStart = new Date()

    switch (dateRange) {
      case 'today':
        currentStart.setHours(0, 0, 0, 0)
        break
      case '7days':
        currentStart.setDate(currentStart.getDate() - 7)
        currentStart.setHours(0, 0, 0, 0)
        break
      case '30days':
        currentStart.setDate(currentStart.getDate() - 30)
        currentStart.setHours(0, 0, 0, 0)
        break
      case '90days':
        currentStart.setDate(currentStart.getDate() - 90)
        currentStart.setHours(0, 0, 0, 0)
        break
      case 'custom':
        if (customStartDate) currentStart = new Date(customStartDate)
        if (customEndDate) currentEnd.setTime(new Date(customEndDate).getTime())
        break
    }

    // Calculate previous period for comparison
    const periodLength = currentEnd.getTime() - currentStart.getTime()
    const previousEnd = new Date(currentStart.getTime() - 1)
    const previousStart = new Date(previousEnd.getTime() - periodLength)

    return {
      currentDates: {
        start: currentStart.toISOString(),
        end: currentEnd.toISOString()
      },
      previousDates: {
        start: previousStart.toISOString(),
        end: previousEnd.toISOString()
      }
    }
  }, [dateRange, customStartDate, customEndDate])

  // Load finance data from backend
  const loadFinanceData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      // @ts-ignore
      const data = await window.api['search:finance']({
        startDate: currentDates.start,
        endDate: currentDates.end,
        previousStartDate: previousDates.start,
        previousEndDate: previousDates.end
      })

      if (data) {
        setCurrentMetrics(data.currentMetrics)
        setTopProducts(data.topProducts || [])
        setSalesByDay(data.salesByDay || [])
        setSalesByCategory(data.salesByCategory || [])
      }
    } catch (error) {
      console.error('Error loading finance data:', error)
      // Show error without including toast in dependencies
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to load finance data:', errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentDates.start, currentDates.end, previousDates.start, previousDates.end])

  // Load data when dates change
  useEffect(() => {
    loadFinanceData()
  }, [loadFinanceData])

  const handleRefresh = () => {
    loadFinanceData()
  }

  const handleExport = async () => {
    try {
      setExporting(true)

      const exportData = [
        { Section: 'Overview', Metric: 'Total Revenue', Value: `$${currentMetrics?.revenue.toFixed(2)}` },
        { Section: 'Overview', Metric: 'Total Transactions', Value: currentMetrics?.transactions },
        { Section: 'Overview', Metric: 'Avg Order Value', Value: `$${currentMetrics?.avgOrderValue.toFixed(2)}` },
        { Section: 'Overview', Metric: 'Total Profit', Value: `$${currentMetrics?.totalProfit.toFixed(2)}` },
        { Section: 'Overview', Metric: 'Profit Margin', Value: `${currentMetrics?.profitMargin.toFixed(2)}%` },
        { Section: '', Metric: '', Value: '' },
        ...topProducts.map((p, i) => ({
          Section: 'Top Products',
          Metric: `${i + 1}. ${p.name}`,
          Value: `$${p.revenue.toFixed(2)} (${p.quantity} units, ${p.profitMargin.toFixed(1)}% margin)`
        }))
      ]

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Finance Report')

      const date = new Date().toISOString().split('T')[0]
      const filename = `finance-report-${dateRange}-${date}.xlsx`
      XLSX.writeFile(wb, filename)

      toast.success('Export completed', `Finance report exported to ${filename}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setExporting(false)
    }
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
    <div className="p-6 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Financial Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Comprehensive financial analytics and AI-powered insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-2 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<BarChart3 size={18} />}
            label="Overview"
          />
          <TabButton
            active={activeTab === 'forecasting'}
            onClick={() => setActiveTab('forecasting')}
            icon={<TrendingUp size={18} />}
            label="Revenue Forecasting"
            badge="AI"
          />
          <TabButton
            active={activeTab === 'cashflow'}
            onClick={() => setActiveTab('cashflow')}
            icon={<Waves size={18} />}
            label="Cash Flow"
          />
          <TabButton
            active={activeTab === 'insights'}
            onClick={() => setActiveTab('insights')}
            icon={<Sparkles size={18} />}
            label="Product Insights"
            badge="AI"
          />
          <TabButton
            active={activeTab === 'health'}
            onClick={() => setActiveTab('health')}
            icon={<Activity size={18} />}
            label="Financial Health"
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Date Range Filter */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Date Range</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['today', '7days', '30days', '90days', 'custom'] as DateRangeType[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    dateRange === range
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {range === 'today' && 'Today'}
                  {range === '7days' && 'Last 7 Days'}
                  {range === '30days' && 'Last 30 Days'}
                  {range === '90days' && 'Last 90 Days'}
                  {range === 'custom' && 'Custom Range'}
                </button>
              ))}
              {dateRange === 'custom' && (
                <div className="flex items-center gap-2 ml-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-500">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Revenue"
              value={`$${currentMetrics?.revenue.toFixed(2) || '0.00'}`}
              change={currentMetrics?.revenueChange || 0}
              icon={<DollarSign size={24} />}
              color="blue"
            />
            <KPICard
              title="Transactions"
              value={currentMetrics?.transactions.toString() || '0'}
              change={currentMetrics?.transactionsChange || 0}
              icon={<ShoppingCart size={24} />}
              color="green"
            />
            <KPICard
              title="Avg Order Value"
              value={`$${currentMetrics?.avgOrderValue.toFixed(2) || '0.00'}`}
              change={currentMetrics?.avgOrderValueChange || 0}
              icon={<TrendingUp size={24} />}
              color="purple"
            />
            <KPICard
              title="Profit Margin"
              value={`${currentMetrics?.profitMargin.toFixed(2) || '0.00'}%`}
              change={0}
              icon={<Percent size={24} />}
              color="orange"
              showChange={false}
            />
          </div>

          {/* Charts and Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Sales Trend</h3>
              <div className="h-64 flex items-center justify-center text-slate-500">
                {salesByDay.length > 0 ? (
                  <div className="w-full">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {salesByDay.length} days of data
                    </p>
                    {/* Simple visualization - you can integrate a chart library here */}
                    <div className="space-y-2">
                      {salesByDay.slice(-7).map((day) => (
                        <div key={day.date} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-24">{new Date(day.date).toLocaleDateString()}</span>
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                            <div 
                              className="bg-primary h-full rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(day.revenue / Math.max(...salesByDay.map(d => d.revenue))) * 100}%` }}
                            >
                              <span className="text-xs text-white font-medium">${day.revenue.toFixed(0)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  'No sales data available'
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Top Products</h3>
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.quantity} units • {product.profitMargin.toFixed(1)}% margin</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">${product.revenue.toFixed(2)}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">+${product.profit.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sales by Category */}
          {salesByCategory.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Sales by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{category.name}</span>
                    <span className="font-semibold text-primary">${category.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'forecasting' && <RevenueForecasting />}
      {activeTab === 'cashflow' && <CashFlowProjection />}
      {activeTab === 'insights' && <ProductInsights />}
      {activeTab === 'health' && <FinancialHealthDashboard />}

      <ToastContainer toasts={toast.toasts} onClose={toast.dismiss} />
    </div>
  )
}

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  change, 
  icon, 
  color,
  showChange = true 
}: { 
  title: string
  value: string
  change: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
  showChange?: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {showChange && (
          <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  icon,
  label,
  badge
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
        active
          ? 'bg-primary text-white shadow-md'
          : 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
          active
            ? 'bg-white/20 text-white'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  )
}

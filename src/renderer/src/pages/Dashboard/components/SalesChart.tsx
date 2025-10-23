/**
 * SalesChart Component
 * Visual representation of sales over time with key metrics
 */

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar, DollarSign, ShoppingBag, Percent } from 'lucide-react'

export default function SalesChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7days' | '30days'>('7days')
  const [allSales, setAllSales] = useState<any[]>([])

  useEffect(() => {
    loadChartData()
  }, [period])

  const loadChartData = async () => {
    try {
      setLoading(true)
      // @ts-ignore
      const sales = await (globalThis as any).api?.sales?.getAll()
      setAllSales(sales || [])

      const days = period === '7days' ? 7 : 30
      const data: any[] = []

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const daySales = (sales || []).filter((sale: any) => {
          const saleDate = new Date(sale.createdAt)
          return saleDate >= date && saleDate < nextDate && sale.status === 'completed'
        })

        const total = daySales.reduce((sum: number, sale: any) => sum + sale.total, 0)

        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          total,
          count: daySales.length,
        })
      }

      setChartData(data)
    } catch (error) {
      console.error('Error loading chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate key metrics
  const metrics = useMemo(() => {
    const completedSales = allSales.filter((s: any) => s.status === 'completed')
    
    // Current period
    const totalRevenue = chartData.reduce((sum, d) => sum + d.total, 0)
    const totalSales = chartData.reduce((sum, d) => sum + d.count, 0)
    const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0
    
    // Previous period for comparison
    const days = period === '7days' ? 7 : 30
    const previousPeriodStart = new Date()
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2))
    const previousPeriodEnd = new Date()
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - days)
    
    const previousSales = completedSales.filter((sale: any) => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= previousPeriodStart && saleDate < previousPeriodEnd
    })
    
    const previousRevenue = previousSales.reduce((sum: number, sale: any) => sum + sale.total, 0)
    const previousCount = previousSales.length
    
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : totalRevenue > 0 ? 100 : 0
      
    const salesChange = previousCount > 0
      ? ((totalSales - previousCount) / previousCount) * 100
      : totalSales > 0 ? 100 : 0
    
    return {
      totalRevenue,
      totalSales,
      avgSale,
      revenueChange,
      salesChange,
      hasData: chartData.length > 0 && totalRevenue > 0
    }
  }, [chartData, allSales, period])

  const maxValue = Math.max(...chartData.map(d => d.total), 1)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp size={20} />
          Sales Overview
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              period === '7days'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPeriod('30days')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              period === '30days'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {!loading && metrics.hasData && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-success/10 to-emerald-50 dark:from-success/20 dark:to-slate-800 rounded-lg p-4 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <DollarSign size={16} className="text-success" />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              ${metrics.totalRevenue.toFixed(2)}
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${metrics.revenueChange >= 0 ? 'text-success' : 'text-error'}`}>
              {metrics.revenueChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(metrics.revenueChange).toFixed(1)}%</span>
              <span className="text-slate-500 dark:text-slate-400">vs prev period</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-blue-50 dark:from-primary/20 dark:to-slate-800 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <ShoppingBag size={16} className="text-primary" />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Sales</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {metrics.totalSales}
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${metrics.salesChange >= 0 ? 'text-success' : 'text-error'}`}>
              {metrics.salesChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(metrics.salesChange).toFixed(1)}%</span>
              <span className="text-slate-500 dark:text-slate-400">vs prev period</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-accent/10 to-orange-50 dark:from-accent/20 dark:to-slate-800 rounded-lg p-4 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Percent size={16} className="text-accent" />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Avg. Sale Value</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              ${metrics.avgSale.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Per transaction
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading sales data...</p>
          </div>
        </div>
      ) : metrics.hasData ? (
        <div className="space-y-4">
          {/* Chart */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-end justify-between gap-2 h-56">
              {chartData.map((data, index) => {
                // Calculate height as pixels instead of percentage for better visibility
                const heightPx = Math.max((data.total / maxValue) * 192, 8) // 192px = h-48 (12rem)
                const isToday = index === chartData.length - 1
                
                return (
                  <div key={`bar-${data.date}-${index}`} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
                    {/* Bar container with fixed height */}
                    <div className="relative w-full h-48 flex items-end justify-center">
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                        <div className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap">
                          <div className="font-semibold mb-1">{data.date}</div>
                          <div className="text-success font-bold">${data.total.toFixed(2)}</div>
                          <div className="text-slate-300">{data.count} sale{data.count !== 1 ? 's' : ''}</div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                            <div className="border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg cursor-pointer ${
                          isToday 
                            ? 'bg-gradient-to-t from-success via-emerald-400 to-emerald-300 shadow-lg shadow-success/30' 
                            : 'bg-gradient-to-t from-primary via-blue-500 to-secondary hover:from-primary/90'
                        }`}
                        style={{ height: `${heightPx}px` }}
                      ></div>
                    </div>
                    
                    {/* Date label */}
                    <span className={`text-[10px] font-medium whitespace-nowrap ${
                      isToday ? 'text-success font-bold' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {period === '7days' ? data.date.split(' ')[1] : data.date.split(' ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Summary Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Last {period === '7days' ? '7' : '30'} days • {chartData.filter(d => d.count > 0).length} active days
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Peak:</span>
              <span className="text-sm font-bold text-primary">
                ${Math.max(...chartData.map(d => d.total)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={32} className="text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Sales Data</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Start making sales to see your performance chart
            </p>
            <button 
              onClick={() => window.location.href = '/pos'}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to POS
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

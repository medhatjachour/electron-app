/**
 * FinanceCharts Component
 * Display all financial charts (Revenue Trend, Top Products, Performance Radar, Sales Status)
 */

import { memo } from 'react'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js'
import type { Sale } from '../../../../shared/types'
import type { FinancialMetrics, TopProduct } from './types'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler)

interface FinanceChartsProps {
  sales: Sale[]
  metrics: FinancialMetrics
  topProducts: TopProduct[]
}

function FinanceCharts({ sales, metrics, topProducts }: Readonly<FinanceChartsProps>) {
  // Revenue Trend Chart (last 7 days)
  const getLast7DaysTrend = () => {
    const days: string[] = []
    const revenues: number[] = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      
      const dayRevenue = sales
        .filter(s => {
          const saleDate = new Date(s.createdAt)
          return saleDate.toISOString().split('T')[0] === dateStr
        })
        .reduce((sum, s) => sum + s.total, 0)
      
      revenues.push(dayRevenue)
    }
    
    return { days, revenues }
  }

  const trendData = getLast7DaysTrend()

  const revenueTrendData = {
    labels: trendData.days,
    datasets: [{
      label: 'Daily Revenue',
      data: trendData.revenues,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }

  // Top Products Chart
  const topProductsData = {
    labels: topProducts.map(p => p.name),
    datasets: [{
      label: 'Revenue',
      data: topProducts.map(p => p.revenue),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ]
    }]
  }

  // Performance Radar Chart
  const performanceData = {
    labels: ['Profit Margin', 'Order Growth', 'Inventory Turnover', 'ROI', 'Items/Order'],
    datasets: [{
      label: 'Performance Metrics',
      data: [
        Math.min(metrics.profitMargin, 100),
        Math.min(50 + metrics.orderGrowth, 100),
        Math.min(metrics.inventoryTurnover * 20, 100),
        Math.min(50 + metrics.roi / 2, 100),
        Math.min(metrics.averageItemsPerOrder * 20, 100)
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2
    }]
  }

  // Sales Status Chart - Count actual status from sales
  const salesByStatus = sales.reduce((acc, sale) => {
    const status = sale.status || 'completed'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const salesStatusData = {
    labels: ['Completed', 'Pending', 'Cancelled', 'Refunded'],
    datasets: [{
      data: [
        salesByStatus.completed || 0,
        salesByStatus.pending || 0,
        salesByStatus.cancelled || 0,
        salesByStatus.refunded || 0
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',    // Green for completed
        'rgba(251, 146, 60, 0.8)',   // Orange for pending
        'rgba(239, 68, 68, 0.8)',    // Red for cancelled
        'rgba(147, 51, 234, 0.8)'    // Purple for refunded
      ]
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        labels: { color: 'rgb(148, 163, 184)' }
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Revenue Trend */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Revenue Trend (7 Days)</h3>
        <div className="h-64">
          <Line data={revenueTrendData} options={chartOptions} />
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Products by Revenue</h3>
        <div className="h-64">
          <Bar data={topProductsData} options={chartOptions} />
        </div>
      </div>

      {/* Performance Radar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Performance Overview</h3>
        <div className="h-64">
          <Radar data={performanceData} options={chartOptions} />
        </div>
      </div>

      {/* Sales Status */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Sales Status</h3>
        <div className="h-64">
          <Doughnut data={salesStatusData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}

export default memo(FinanceCharts)

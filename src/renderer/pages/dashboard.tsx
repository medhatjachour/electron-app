import { useEffect, useMemo, useState } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { DollarSign, ShoppingCart, TrendingUp, Package, RefreshCcw } from 'lucide-react'
import { ipc } from '../src/utils/ipc'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement)

type Sale = {
  id: string
  total: number
  quantity: number
  createdAt: string
  paymentMethod: string
  status: string
  customerName?: string
  product?: { name: string; category: string }
  user?: { username: string }
}

type Product = {
  id: string
  name: string
  category: string
  variants: { stock: number }[]
}

type KPICardProps = Readonly<{ 
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: string
  trendDirection?: 'up' | 'down'
  color?: string
}>

function KPICard({ title, value, subtitle, icon, trend, trendDirection, color = 'primary' }: KPICardProps) {
  const colorClasses = {
    primary: 'bg-blue-500/10 text-blue-500',
    success: 'bg-green-500/10 text-green-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
    pink: 'bg-pink-500/10 text-pink-500'
  }

  return (
    <div className="glass-card p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon && (
            <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
              {icon}
            </div>
          )}
          {trend && trendDirection && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trendDirection === 'up' 
                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              {trendDirection === 'up' ? '↗' : '↘'} {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecentTransactions({ sales, loading }: Readonly<{ sales: Sale[]; loading: boolean }>) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-slate-600 dark:text-slate-400 mt-4">Loading transactions...</p>
      </div>
    )
  }

  if (sales.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
        <p>No transactions yet</p>
        <p className="text-sm mt-2">Complete your first sale to see it here</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Product</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Payment</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {sales.slice(0, 10).map((sale) => (
            <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm font-mono text-primary font-semibold">{sale.id.slice(0, 8)}</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {sale.product?.name || 'Product'}
                </div>
                <div className="text-xs text-slate-500">{sale.product?.category || 'N/A'}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {(sale.customerName || sale.user?.username || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {sale.customerName || sale.user?.username || 'Walk-in'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  ${sale.total.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {sale.paymentMethod}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  sale.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : sale.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {sale.status}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date(sale.createdAt).toLocaleDateString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboardData = async () => {
    try {
      setRefreshing(true)
      const [salesData, productsData] = await Promise.all([
        ipc.sales.getAll(),
        ipc.products.getAll()
      ])
      
      setSales(salesData || [])
      setProducts(productsData || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    const completedSales = sales.filter(s => s.status === 'completed')
    const last7Days = sales.filter(s => {
      const saleDate = new Date(s.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return saleDate >= weekAgo && s.status === 'completed'
    })

    const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total, 0)
    const last7DaysRevenue = last7Days.reduce((sum, sale) => sum + sale.total, 0)
    const totalOrders = completedSales.length
    
    // Calculate total inventory
    const totalInventory = products.reduce((sum, product) => {
      return sum + product.variants.reduce((vSum, variant) => vSum + variant.stock, 0)
    }, 0)

    // Calculate low stock items (< 10)
    const lowStockItems = products.filter(product => {
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
      return totalStock < 10 && totalStock > 0
    }).length

    // Calculate out of stock
    const outOfStockItems = products.filter(product => {
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
      return totalStock === 0
    }).length

    // Simple growth calculation
    const prev7Days = sales.filter(s => {
      const saleDate = new Date(s.createdAt)
      const twoWeeksAgo = new Date()
      const weekAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return saleDate >= twoWeeksAgo && saleDate < weekAgo && s.status === 'completed'
    })
    const prev7DaysRevenue = prev7Days.reduce((sum, sale) => sum + sale.total, 0)
    const revenueGrowth = prev7DaysRevenue > 0 
      ? ((last7DaysRevenue - prev7DaysRevenue) / prev7DaysRevenue * 100).toFixed(1)
      : '0.0'

    return {
      totalRevenue,
      totalOrders,
      totalInventory,
      lowStockItems,
      outOfStockItems,
      revenueGrowth: parseFloat(revenueGrowth),
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    }
  }, [sales, products])

  // Chart data for last 7 days
  const salesChartData = useMemo(() => {
    const last7DaysData: { [key: string]: number } = {}
    const labels: string[] = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' })
      labels.push(dateStr)
      last7DaysData[dateStr] = 0
    }

    sales.forEach(sale => {
      if (sale.status !== 'completed') return
      const saleDate = new Date(sale.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      if (saleDate >= weekAgo) {
        const dayLabel = saleDate.toLocaleDateString('en-US', { weekday: 'short' })
        if (last7DaysData.hasOwnProperty(dayLabel)) {
          last7DaysData[dayLabel] += sale.total
        }
      }
    })

    return {
      labels,
      datasets: [{
        label: 'Revenue',
        data: labels.map(label => last7DaysData[label]),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }]
    }
  }, [sales])

  // Category breakdown
  const categoryData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {}
    
    sales.filter(s => s.status === 'completed').forEach(sale => {
      const category = sale.product?.category || 'Other'
      categoryTotals[category] = (categoryTotals[category] || 0) + sale.total
    })

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    return {
      labels: sortedCategories.map(([cat]) => cat),
      datasets: [{
        data: sortedCategories.map(([, total]) => total),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 2,
      }]
    }
  }, [sales])

  const chartOptions: any = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => '$' + context.parsed.y.toFixed(2)
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          borderDash: [5, 5]
        },
        ticks: {
          color: '#9ca3af',
          callback: (value: any) => '$' + value
        }
      }
    }
  }), [])

  const doughnutOptions: any = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          padding: 15,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: $${value.toFixed(2)} (${percentage}%)`
          }
        }
      }
    }
  }), [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button 
          onClick={loadDashboardData}
          disabled={refreshing}
          className="btn-secondary px-4 py-2 flex items-center gap-2"
        >
          <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mt-2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="Total Revenue" 
            value={`$${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="All time" 
            trend={Math.abs(metrics.revenueGrowth) + '%'}
            trendDirection={metrics.revenueGrowth >= 0 ? 'up' : 'down'}
            color="success"
            icon={<DollarSign size={24} />}
          />
          <KPICard 
            title="Total Orders" 
            value={metrics.totalOrders.toLocaleString()}
            subtitle="Completed sales"
            color="primary"
            icon={<ShoppingCart size={24} />}
          />
          <KPICard 
            title="Inventory" 
            value={metrics.totalInventory.toLocaleString()}
            subtitle={`${metrics.lowStockItems} low, ${metrics.outOfStockItems} out`}
            color="purple"
            icon={<Package size={24} />}
          />
          <KPICard 
            title="Avg Order Value" 
            value={`$${metrics.avgOrderValue.toFixed(2)}`}
            subtitle="Per transaction"
            color="orange"
            icon={<TrendingUp size={24} />}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Sales Overview</h2>
            <span className="text-sm text-slate-600 dark:text-slate-400">Last 7 days</span>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Line options={chartOptions} data={salesChartData} />
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Categories</h3>
          <div className="h-72">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : categoryData.labels.length > 0 ? (
              <Doughnut options={doughnutOptions} data={categoryData} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Package size={48} className="opacity-20 mb-2" />
                <p>No sales data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Recent Transactions</h3>
        <RecentTransactions sales={sales} loading={loading} />
      </div>
    </div>
  )
}
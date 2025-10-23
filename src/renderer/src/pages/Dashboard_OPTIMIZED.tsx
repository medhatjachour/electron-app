/**
 * Optimized Dashboard with Advanced Analytics
 * Senior Engineer Pattern: Performance + Clean Architecture
 */

import { useEffect, useMemo, useState, useCallback, memo } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import Card from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { analyticsService } from '../services'
import { useDebounce, useInterval } from '../hooks/useEnhanced'
import { TrendingUp, DollarSign, ShoppingBag, Users, ArrowUp, ArrowDown } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Memoized KPI Card Component
const KPICard = memo(({ title, value, subtitle, icon, trend, trendValue }: {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down'
  trendValue?: string
}) => {
  const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500'
  const TrendIcon = trend === 'up' ? ArrowUp : ArrowDown

  return (
    <div className="glass-card p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon && (
            <div className="p-3 rounded-lg bg-primary/10 text-primary">{icon}</div>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon size={16} />
              <span className="text-sm font-semibold">{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

KPICard.displayName = 'KPICard'

// Memoized Transaction Row Component
const TransactionRow = memo(({ transaction }: { transaction: any }) => {
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
          {transaction.id}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {transaction.user[0].toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-slate-900 dark:text-slate-200">{transaction.user}</span>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          ${transaction.total.toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {new Date(transaction.createdAt).toLocaleString()}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </td>
    </tr>
  )
})

TransactionRow.displayName = 'TransactionRow'

export default function Dashboard(): JSX.Element {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [dateRange, setDateRange] = useState('7days')
  const [loading, setLoading] = useState(true)

  // Debounced date range for API calls
  const debouncedDateRange = useDebounce(dateRange, 300)

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const metricsData = await analyticsService.getDashboardMetrics()
      setMetrics(metricsData)

      // Mock transactions (replace with real API call)
      const mockTransactions = [
        { id: 'TXN001', user: 'admin', total: 199.99, createdAt: new Date().toISOString() },
        { id: 'TXN002', user: 'jane', total: 49.5, createdAt: new Date().toISOString() },
        { id: 'TXN003', user: 'john', total: 125.0, createdAt: new Date().toISOString() },
        { id: 'TXN004', user: 'sarah', total: 89.99, createdAt: new Date().toISOString() },
      ]
      setTransactions(mockTransactions)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadDashboard()
  }, [loadDashboard, debouncedDateRange])

  // Auto-refresh every 30 seconds
  useInterval(loadDashboard, 30000)

  // Memoized chart data
  const salesChartData = useMemo(
    () => ({
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Sales',
          data: [120, 190, 170, 220, 260, 300, 280],
          borderColor: 'rgba(8, 145, 178, 1)',
          backgroundColor: 'rgba(8, 145, 178, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }),
    []
  )

  const categoryChartData = useMemo(
    () => ({
      labels: ['Electronics', 'Clothing', 'Food', 'Books', 'Other'],
      datasets: [
        {
          label: 'Sales by Category',
          data: [30, 25, 20, 15, 10],
          backgroundColor: [
            'rgba(8, 145, 178, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
        },
      ],
    }),
    []
  )

  const chartOptions: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function (context: any) {
              return '$' + context.parsed.y.toLocaleString()
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#94a3b8',
          },
        },
        y: {
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
            borderDash: [5, 5],
          },
          ticks: {
            color: '#94a3b8',
            callback: function (value: any) {
              return '$' + value.toLocaleString()
            },
          },
        },
      },
    }),
    []
  )

  const doughnutOptions: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: '#64748b',
            padding: 15,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
        },
      },
    }),
    []
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Welcome back, <span className="font-semibold">{user?.username || 'User'}</span> •{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="3months">Last 3 months</option>
          </select>
          <button className="btn-secondary px-4 py-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Sales"
          value={`$${metrics?.sales?.toLocaleString() ?? '12,345'}`}
          subtitle="Last 7 days"
          trend="up"
          trendValue="+12.5%"
          icon={<DollarSign size={24} />}
        />
        <KPICard
          title="Orders"
          value={metrics?.orders?.toLocaleString() ?? '123'}
          subtitle="Completed orders"
          trend="up"
          trendValue="+8.2%"
          icon={<ShoppingBag size={24} />}
        />
        <KPICard
          title="Customers"
          value={metrics?.customers?.toLocaleString() ?? '89'}
          subtitle="Active customers"
          trend="up"
          trendValue="+5.1%"
          icon={<Users size={24} />}
        />
        <KPICard
          title="Net Profit"
          value={`$${metrics?.profit?.toLocaleString() ?? '4,567'}`}
          subtitle="This month"
          trend="up"
          trendValue="+15.3%"
          icon={<TrendingUp size={24} />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Sales Overview
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Weekly trend</span>
          </div>
          <div className="h-64">
            <Line options={chartOptions} data={salesChartData} />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Sales by Category
          </h3>
          <div className="h-64">
            <Doughnut options={doughnutOptions} data={categoryChartData} />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Recent Transactions
          </h3>
          <button className="text-primary hover:text-primary/80 text-sm font-medium">
            View All →
          </button>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {transactions.map((t) => (
                  <TransactionRow key={t.id} transaction={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

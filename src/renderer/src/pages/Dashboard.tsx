import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import Card from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

type KPICardProps = Readonly<{ title: string; value: string | number; subtitle?: string; icon?: React.ReactNode; trend?: 'up' | 'down' }>

function KPICard({ title, value, subtitle, icon, trend }: KPICardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-400">{title}</p>
          <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">{value}</p>
          {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon && <div className="p-3 rounded-lg bg-primary/10 text-primary">{icon}</div>}
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend === 'up' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
            }`}>
              {trend === 'up' ? '↗' : '↘'} {trend === 'up' ? '+12%' : '-5%'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecentTransactions({ items }: Readonly<{ items: Array<any> }>) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">User</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((t) => (
            <tr key={t.id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm font-mono text-neutral-300">{t.id}</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">{t.user[0].toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-neutral-200">{t.user}</span>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm font-semibold text-secondary">${t.total}</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm text-neutral-400">{new Date(t.createdAt).toLocaleString()}</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <button className="text-neutral-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard(): JSX.Element {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<{ sales?: number; orders?: number; profit?: number } | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        // prefer globalThis for contexts
        // @ts-ignore
        if (typeof globalThis !== 'undefined' && (globalThis as any).api?.dashboard?.getMetrics) {
          // @ts-ignore
          const m = await (globalThis as any).api.dashboard.getMetrics()
          if (mounted) setMetrics(m)
        }

        // fetch recent transactions from finance handler
        // @ts-ignore
        if (typeof globalThis !== 'undefined' && (globalThis as any).api?.finance?.getTransactions) {
          const now = new Date()
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          // @ts-ignore
          const tx = await (globalThis as any).api.finance.getTransactions({ startDate: weekAgo, endDate: now })
          if (mounted && tx) setTransactions(tx)
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Dashboard load failed', e)
      }

      if (mounted && !metrics) setMetrics({ sales: 12345, orders: 123, profit: 4567 })
      if (mounted && transactions.length === 0) setTransactions([
        { id: 't1', user: 'admin', total: 199.99, createdAt: new Date().toISOString() },
        { id: 't2', user: 'jane', total: 49.5, createdAt: new Date().toISOString() },
  { id: 't3', user: 'john', total: 25, createdAt: new Date().toISOString() }
      ])
    }

    void load()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sampleData = useMemo(() => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales',
        data: [120, 190, 170, 220, 260, 300, 280],
        borderColor: 'rgba(37,99,235,1)',
        backgroundColor: 'rgba(37,99,235,0.12)',
        tension: 0.3,
        pointRadius: 3
      }
    ]
  }), [])

  const chartOptions: any = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: false 
      },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#fff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return '$' + context.parsed.y.toLocaleString()
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#9ca3af'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          borderDash: [5, 5]
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return '$' + value.toLocaleString()
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-500 via-slate-700 to-slate-900 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-neutral-400 mt-1">Welcome back, <span className="font-semibold text-white">{user?.username || 'User'}</span> • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary px-4 py-2">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          title="Total Sales" 
          value={`$${metrics?.sales?.toLocaleString() ?? '—'}`}
          subtitle="Last 7 days" 
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard 
          title="Orders" 
          value={metrics?.orders?.toLocaleString() ?? '—'}
          subtitle="Completed orders"
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
        <KPICard 
          title="Net Profit" 
          value={`$${metrics?.profit?.toLocaleString() ?? '—'}`}
          subtitle="This month"
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Sales Overview</h2>
            <select className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-300">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
            </select>
          </div>
          <div className="h-64">
            <Line options={chartOptions} data={sampleData as any} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="btn-primary w-full py-3">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Sale
              </span>
            </button>
            <button className="btn-secondary w-full py-3">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Add Product
              </span>
            </button>
            <button className="btn-secondary w-full py-3">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Add Transaction
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Recent Transactions</h3>
        <RecentTransactions items={transactions} />
      </div>
    </div>
  )
}


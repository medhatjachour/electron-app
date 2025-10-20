import { useState, useMemo } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, Filter, Download } from 'lucide-react'

type Sale = {
  id: string
  date: string
  customer: string
  items: number
  total: number
  payment: string
  status: 'completed' | 'pending' | 'refunded'
}

const MOCK_SALES: Sale[] = [
  { id: 'S-001', date: '2024-01-16 14:30', customer: 'John Doe', items: 3, total: 159.97, payment: 'Card', status: 'completed' },
  { id: 'S-002', date: '2024-01-16 13:15', customer: 'Jane Smith', items: 1, total: 29.99, payment: 'Cash', status: 'completed' },
  { id: 'S-003', date: '2024-01-16 12:45', customer: 'Bob Wilson', items: 5, total: 324.95, payment: 'Card', status: 'completed' },
  { id: 'S-004', date: '2024-01-16 11:20', customer: 'Alice Brown', items: 2, total: 89.98, payment: 'Cash', status: 'completed' },
  { id: 'S-005', date: '2024-01-16 10:00', customer: 'Carol Martinez', items: 4, total: 199.96, payment: 'Card', status: 'completed' },
  { id: 'S-006', date: '2024-01-15 16:30', customer: 'David Lee', items: 1, total: 49.99, payment: 'Card', status: 'refunded' },
  { id: 'S-007', date: '2024-01-15 15:10', customer: 'Emma Davis', items: 3, total: 142.47, payment: 'Cash', status: 'completed' },
  { id: 'S-008', date: '2024-01-15 14:25', customer: 'Frank Miller', items: 2, total: 79.98, payment: 'Card', status: 'completed' },
]

export default function Sales(): JSX.Element {
  const [sales] = useState<Sale[]>(MOCK_SALES)
  const [dateFilter, setDateFilter] = useState('today')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSales = useMemo(() => {
    return sales.filter(sale => 
      sale.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [sales, searchQuery])

  const stats = useMemo(() => {
    const completedSales = sales.filter(s => s.status === 'completed')
    const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total, 0)
    const totalItems = completedSales.reduce((sum, sale) => sum + sale.items, 0)
    const avgSale = completedSales.length > 0 ? totalRevenue / completedSales.length : 0

    return {
      totalRevenue,
      totalSales: completedSales.length,
      totalItems,
      avgSale
    }
  }, [sales])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success'
      case 'pending': return 'bg-accent/10 text-accent'
      case 'refunded': return 'bg-error/10 text-error'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sales Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Track and manage your sales transactions</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download size={20} />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</span>
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign size={20} className="text-success" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            ${stats.totalRevenue.toFixed(2)}
          </div>
          <div className="flex items-center text-sm text-success">
            <TrendingUp size={16} className="mr-1" />
            +12.5% from last week
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Sales</span>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag size={20} className="text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {stats.totalSales}
          </div>
          <div className="flex items-center text-sm text-primary">
            <TrendingUp size={16} className="mr-1" />
            +8 new today
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Items Sold</span>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <ShoppingBag size={20} className="text-secondary" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {stats.totalItems}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Across all transactions
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg. Sale</span>
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <DollarSign size={20} className="text-accent" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            ${stats.avgSale.toFixed(2)}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Per transaction
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by customer name or sale ID..."
              className="input-field w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="input-field w-48"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={20} />
            Filter
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Sale ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    Date & Time
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    Customer
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-primary">{sale.id}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {sale.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900 dark:text-white">{sale.customer}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-900 dark:text-white">{sale.items}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 dark:text-white">${sale.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{sale.payment}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-primary hover:bg-primary/10 px-3 py-1 rounded-lg text-sm font-medium transition-colors">
                        View
                      </button>
                      {sale.status === 'completed' && (
                        <button className="text-error hover:bg-error/10 px-3 py-1 rounded-lg text-sm font-medium transition-colors">
                          Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

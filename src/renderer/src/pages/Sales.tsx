import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, Filter, Download, RefreshCcw, X, Eye } from 'lucide-react'
import { ipc } from '../utils/ipc'
import Pagination from '../components/Pagination'

type Sale = {
  id: string
  productId: string
  variantId?: string
  userId: string
  quantity: number
  price: number
  total: number
  paymentMethod: string
  status: string
  customerName?: string
  createdAt: string
  product?: {
    name: string
    category: string
  }
  user?: {
    username: string
  }
}

export default function Sales(): JSX.Element {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      setLoading(true)
      const data = await ipc.sales.getAll()
      setSales(data)
    } catch (error) {
      console.error('Failed to load sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = useMemo(() => {
    let filtered = sales.filter(sale => 
      (sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       sale.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       sale.user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
       sale.id.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.createdAt)
        switch (dateFilter) {
          case 'today':
            return saleDate >= startOfToday
          case 'week':
            return saleDate >= startOfWeek
          case 'month':
            return saleDate >= startOfMonth
          default:
            return true
        }
      })
    }

    return filtered
  }, [sales, searchQuery, dateFilter])

  const stats = useMemo(() => {
    const completedSales = filteredSales.filter(s => s.status === 'completed')
    const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total, 0)
    const totalItems = completedSales.reduce((sum, sale) => sum + sale.quantity, 0)
    const avgSale = completedSales.length > 0 ? totalRevenue / completedSales.length : 0

    // Calculate today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySales = sales.filter(s => {
      const saleDate = new Date(s.createdAt)
      return saleDate >= today && s.status === 'completed'
    })
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
    const todayCount = todaySales.length

    // Calculate yesterday's stats for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdaySales = sales.filter(s => {
      const saleDate = new Date(s.createdAt)
      return saleDate >= yesterday && saleDate < today && s.status === 'completed'
    })
    const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0)
    const yesterdayCount = yesterdaySales.length

    // Calculate percentage changes
    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : todayRevenue > 0 ? 100 : 0
    const salesChange = yesterdayCount > 0 
      ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 
      : todayCount > 0 ? 100 : 0

    // Calculate this week vs last week
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const thisWeekSales = sales.filter(s => {
      const saleDate = new Date(s.createdAt)
      return saleDate >= startOfWeek && s.status === 'completed'
    })
    const thisWeekRevenue = thisWeekSales.reduce((sum, sale) => sum + sale.total, 0)

    const lastWeekStart = new Date(startOfWeek)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(startOfWeek)
    
    const lastWeekSales = sales.filter(s => {
      const saleDate = new Date(s.createdAt)
      return saleDate >= lastWeekStart && saleDate < lastWeekEnd && s.status === 'completed'
    })
    const lastWeekRevenue = lastWeekSales.reduce((sum, sale) => sum + sale.total, 0)
    
    const weeklyRevenueChange = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
      : thisWeekRevenue > 0 ? 100 : 0

    return {
      totalRevenue,
      totalSales: completedSales.length,
      totalItems,
      avgSale,
      todayRevenue,
      todayCount,
      revenueChange,
      salesChange,
      weeklyRevenueChange,
      hasData: sales.length > 0
    }
  }, [filteredSales, sales])

  // Pagination
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredSales.slice(startIndex, endIndex)
  }, [filteredSales, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)

  const handleRefund = async (saleId: string) => {
    if (!confirm('Are you sure you want to refund this sale? Stock will be restored.')) {
      return
    }

    try {
      const result = await ipc.sales.refund(saleId)
      if (result.success) {
        alert('Sale refunded successfully! Stock has been restored.')
        await loadSales()
      } else {
        alert('Failed to refund sale: ' + result.message)
      }
    } catch (error) {
      console.error('Failed to refund sale:', error)
      alert('Failed to process refund. Please try again.')
    }
  }

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale)
    setShowViewModal(true)
  }

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ['Sale ID', 'Date', 'Customer', 'Product', 'Quantity', 'Price', 'Total', 'Payment Method', 'Status', 'Sold By']
      const rows = filteredSales.map(sale => [
        sale.id,
        formatDate(sale.createdAt),
        sale.customerName || 'Walk-in Customer',
        sale.product?.name || 'Unknown',
        sale.quantity,
        `$${sale.price.toFixed(2)}`,
        `$${sale.total.toFixed(2)}`,
        sale.paymentMethod,
        sale.status,
        sale.user?.username || 'Unknown'
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export:', error)
      alert('Failed to export sales report')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

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
        <div className="flex gap-3">
          <button 
            onClick={loadSales}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={handleExport}
            className="btn-primary flex items-center gap-2"
          >
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            ${stats.totalRevenue.toFixed(2)}
          </div>
          {stats.hasData ? (
            <div className={`flex items-center text-sm ${stats.weeklyRevenueChange >= 0 ? 'text-success' : 'text-error'}`}>
              {stats.weeklyRevenueChange >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingUp size={16} className="mr-1 rotate-180" />}
              {Math.abs(stats.weeklyRevenueChange).toFixed(1)}% from last week
            </div>
          ) : (
            <div className="text-sm text-slate-400">No sales data yet</div>
          )}
        </div>

        <div className="glass-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Sales</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <ShoppingBag size={20} className="text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {stats.totalSales}
          </div>
          {stats.hasData ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {stats.todayCount} {stats.todayCount === 1 ? 'sale' : 'sales'} today
            </div>
          ) : (
            <div className="text-sm text-slate-400">Start making sales</div>
          )}
        </div>

        <div className="glass-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Items Sold</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-purple-600 flex items-center justify-center">
              <ShoppingBag size={20} className="text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {stats.totalItems}
          </div>
          {stats.hasData ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Across all transactions
            </div>
          ) : (
            <div className="text-sm text-slate-400">No items sold</div>
          )}
        </div>

        <div className="glass-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg. Sale</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-orange-500 flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            ${stats.avgSale.toFixed(2)}
          </div>
          {stats.hasData ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Per transaction
            </div>
          ) : (
            <div className="text-sm text-slate-400">No average yet</div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!stats.hasData && !loading && (
        <div className="glass-card p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              No Sales Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Start making sales to see your transaction history and analytics here.
            </p>
            <button 
              onClick={() => window.location.href = '/pos'}
              className="btn-primary inline-flex items-center gap-2"
            >
              <ShoppingBag size={20} />
              Go to Point of Sale
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      {stats.hasData && (
        <div className="glass-card p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[250px] relative">
            <input
              type="text"
              placeholder="Search by customer name or sale ID..."
              className="input-field w-full"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <select 
            className="input-field w-48"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Filter size={16} />
            <span>{filteredSales.length} result{filteredSales.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
      )}

      {/* Sales Table */}
      {stats.hasData && (
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <p className="text-slate-600 dark:text-slate-400">Loading sales...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-slate-600 dark:text-slate-400">
                      {sales.length === 0 
                        ? 'No sales yet. Complete a sale in the POS to see it here!' 
                        : 'No sales match your search or filter criteria.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {sale.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {sale.customerName || 'Walk-in Customer'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sale.product?.name || 'Product'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-900 dark:text-white">{sale.quantity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 dark:text-white">${sale.total.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sale.status)}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewSale(sale)}
                          className="text-primary hover:bg-primary/10 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        {sale.status === 'completed' && (
                          <button 
                            onClick={() => handleRefund(sale.id)}
                            className="text-error hover:bg-error/10 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredSales.length}
          itemsPerPage={itemsPerPage}
          itemName="sales"
        />
      </div>
      )}

      {/* View Sale Modal */}
      {showViewModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sale Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Sale ID and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Sale ID</p>
                  <p className="font-mono font-bold text-primary">{selectedSale.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedSale.status)}`}>
                    {selectedSale.status}
                  </span>
                </div>
              </div>

              {/* Date and Time */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Date & Time</p>
                <p className="font-medium text-slate-900 dark:text-white">{formatDate(selectedSale.createdAt)}</p>
              </div>

              {/* Customer */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Customer</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedSale.customerName || 'Walk-in Customer'}
                </p>
              </div>

              {/* Product */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Product</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedSale.product?.name || 'Unknown Product'}
                </p>
                {selectedSale.product?.category && (
                  <p className="text-xs text-slate-500 mt-1">Category: {selectedSale.product.category}</p>
                )}
              </div>

              {/* Sold By */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Sold By</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedSale.user?.username || 'Unknown User'}
                </p>
              </div>

              {/* Sale Details */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Quantity:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedSale.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Price per unit:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">${selectedSale.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Payment Method:</span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">{selectedSale.paymentMethod}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">Total:</span>
                  <span className="text-2xl font-bold text-primary">${selectedSale.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedSale.status === 'completed' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      handleRefund(selectedSale.id)
                    }}
                    className="flex-1 btn-secondary text-error hover:bg-error/10"
                  >
                    Process Refund
                  </button>
                )}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

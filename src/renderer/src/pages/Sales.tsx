import React, { useState, useMemo, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, Filter, Download, RefreshCcw, X, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import { ipc } from '../utils/ipc'
import Pagination from '../components/Pagination'

type SaleItem = {
  id: string
  productId: string
  variantId?: string | null
  quantity: number
  price: number
  total: number
  product?: {
    name: string
    category: string | { name: string }
    baseSKU: string
  }
  variant?: {
    variantSKU: string
    size?: string
    color?: string
  }
}

type SaleTransaction = {
  id: string
  userId: string
  paymentMethod: string
  status: string
  customerName?: string | null
  subtotal: number
  tax: number
  total: number
  createdAt: string
  items: SaleItem[]
  user?: {
    username: string
  }
}

export default function Sales(): JSX.Element {
  const [transactions, setTransactions] = useState<SaleTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<SaleTransaction | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const data = await ipc.saleTransactions.getAll()
      setTransactions(data)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (transactionId: string) => {
    setExpandedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => 
      (transaction.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       transaction.user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
       transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
       transaction.items.some(item => 
         item.product?.name.toLowerCase().includes(searchQuery.toLowerCase())
       ))
    )

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt)
        switch (dateFilter) {
          case 'today':
            return transactionDate >= startOfToday
          case 'week':
            return transactionDate >= startOfWeek
          case 'month':
            return transactionDate >= startOfMonth
          default:
            return true
        }
      })
    }

    return filtered
  }, [transactions, searchQuery, dateFilter])

  const stats = useMemo(() => {
    const completedTransactions = filteredTransactions.filter(t => t.status === 'completed')
    const totalRevenue = completedTransactions.reduce((sum, transaction) => sum + transaction.total, 0)
    const totalItems = completedTransactions.reduce((sum, transaction) => 
      sum + transaction.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )
    const avgSale = completedTransactions.length > 0 ? totalRevenue / completedTransactions.length : 0

    // Calculate today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= today && t.status === 'completed'
    })
    const todayRevenue = todayTransactions.reduce((sum, transaction) => sum + transaction.total, 0)
    const todayCount = todayTransactions.length

    // Calculate yesterday's stats for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= yesterday && transactionDate < today && t.status === 'completed'
    })
    const yesterdayRevenue = yesterdayTransactions.reduce((sum, transaction) => sum + transaction.total, 0)
    const yesterdayCount = yesterdayTransactions.length

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
    
    const thisWeekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= startOfWeek && t.status === 'completed'
    })
    const thisWeekRevenue = thisWeekTransactions.reduce((sum, transaction) => sum + transaction.total, 0)

    const lastWeekStart = new Date(startOfWeek)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(startOfWeek)
    
    const lastWeekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= lastWeekStart && transactionDate < lastWeekEnd && t.status === 'completed'
    })
    const lastWeekRevenue = lastWeekTransactions.reduce((sum, transaction) => sum + transaction.total, 0)
    
    const weeklyRevenueChange = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
      : thisWeekRevenue > 0 ? 100 : 0

    return {
      totalRevenue,
      totalSales: completedTransactions.length,
      totalItems,
      avgSale,
      todayRevenue,
      todayCount,
      revenueChange,
      salesChange,
      weeklyRevenueChange,
      hasData: transactions.length > 0
    }
  }, [filteredTransactions, transactions])

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredTransactions.slice(startIndex, endIndex)
  }, [filteredTransactions, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

  const handleRefund = async (transactionId: string) => {
    if (!confirm('Are you sure you want to refund this transaction? Stock will be restored for all items.')) {
      return
    }

    try {
      const result = await ipc.saleTransactions.refund(transactionId)
      if (result.success) {
        alert('Transaction refunded successfully! Stock has been restored.')
        await loadTransactions()
      } else {
        alert('Failed to refund transaction: ' + result.message)
      }
    } catch (error) {
      console.error('Failed to refund transaction:', error)
      alert('Failed to process refund. Please try again.')
    }
  }

  const handleViewTransaction = (transaction: SaleTransaction) => {
    setSelectedTransaction(transaction)
    setShowViewModal(true)
  }

  const handleExport = () => {
    try {
      // Create CSV content with transaction-based data
      const headers = ['Transaction ID', 'Date', 'Customer', 'Items', 'Total Items', 'Subtotal', 'Tax', 'Total', 'Payment Method', 'Status', 'Sold By']
      const rows = filteredTransactions.map(transaction => {
        const totalItems = transaction.items.reduce((sum, item) => sum + item.quantity, 0)
        const itemsList = transaction.items.map(item => 
          `${item.product?.name || 'Unknown'} (${item.quantity}x)`
        ).join('; ')
        
        return [
          transaction.id,
          formatDate(transaction.createdAt),
          transaction.customerName || 'Walk-in Customer',
          itemsList,
          totalItems,
          `$${transaction.subtotal.toFixed(2)}`,
          `$${transaction.tax.toFixed(2)}`,
          `$${transaction.total.toFixed(2)}`,
          transaction.paymentMethod,
          transaction.status,
          transaction.user?.username || 'Unknown'
        ]
      })

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
            onClick={loadTransactions}
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
            <span>{filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
      )}

      {/* Transactions Table */}
      {stats.hasData && (
        <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white w-12"></th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Transaction ID</th>
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
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <p className="text-slate-600 dark:text-slate-400">Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <p className="text-slate-600 dark:text-slate-400">
                      {transactions.length === 0 
                        ? 'No transactions yet. Complete a sale in the POS to see it here!' 
                        : 'No transactions match your search or filter criteria.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => {
                  const isExpanded = expandedTransactions.has(transaction.id)
                  const totalItems = transaction.items.reduce((sum, item) => sum + item.quantity, 0)
                  
                  return (
                    <React.Fragment key={transaction.id}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleExpanded(transaction.id)}
                            className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                          >
                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {transaction.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {transaction.customerName || 'Walk-in Customer'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-900 dark:text-white">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 dark:text-white">${transaction.total.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                            {transaction.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleViewTransaction(transaction)}
                              className="text-primary hover:bg-primary/10 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            >
                              <Eye size={14} />
                              View
                            </button>
                            {transaction.status === 'completed' && (
                              <button 
                                onClick={() => handleRefund(transaction.id)}
                                className="text-error hover:bg-error/10 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${transaction.id}-items`} className="bg-slate-50 dark:bg-slate-800/30">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="ml-8 space-y-2">
                              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Transaction Items:</h4>
                              <div className="grid gap-2">
                                {transaction.items.map((item, idx) => (
                                  <div key={item.id || idx} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                    <div className="flex-1">
                                      <div className="font-medium text-slate-900 dark:text-white">
                                        {item.product?.name || 'Unknown Product'}
                                      </div>
                                      <div className="text-xs text-slate-500 mt-1">
                                        {item.variant && (
                                          <span className="mr-3">
                                            SKU: {item.variant.variantSKU} 
                                            {item.variant.size && ` | Size: ${item.variant.size}`}
                                            {item.variant.color && ` | Color: ${item.variant.color}`}
                                          </span>
                                        )}
                                        {!item.variant && item.product?.baseSKU && (
                                          <span className="mr-3">SKU: {item.product.baseSKU}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                      <div className="text-slate-600 dark:text-slate-400">
                                        Qty: <span className="font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
                                      </div>
                                      <div className="text-slate-600 dark:text-slate-400">
                                        @ ${item.price.toFixed(2)}
                                      </div>
                                      <div className="font-semibold text-slate-900 dark:text-white min-w-[80px] text-right">
                                        ${item.total.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-6 text-sm">
                                <div className="text-slate-600 dark:text-slate-400">
                                  Subtotal: <span className="font-semibold text-slate-900 dark:text-white">${transaction.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="text-slate-600 dark:text-slate-400">
                                  Tax: <span className="font-semibold text-slate-900 dark:text-white">${transaction.tax.toFixed(2)}</span>
                                </div>
                                <div className="text-slate-900 dark:text-white font-bold">
                                  Total: ${transaction.total.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredTransactions.length}
          itemsPerPage={itemsPerPage}
          itemName="transactions"
        />
      </div>
      )}

      {/* View Transaction Modal */}
      {showViewModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Transaction ID and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Transaction ID</p>
                  <p className="font-mono font-bold text-primary">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
              </div>

              {/* Date and Time */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Date & Time</p>
                <p className="font-medium text-slate-900 dark:text-white">{formatDate(selectedTransaction.createdAt)}</p>
              </div>

              {/* Customer */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Customer</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedTransaction.customerName || 'Walk-in Customer'}
                </p>
              </div>

              {/* Sold By */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Sold By</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedTransaction.user?.username || 'Unknown User'}
                </p>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Items</p>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item, idx) => (
                    <div key={item.id || idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {item.product?.name || 'Unknown Product'}
                          </p>
                          {item.variant && (
                            <p className="text-xs text-slate-500 mt-1">
                              SKU: {item.variant.variantSKU}
                              {item.variant.size && ` | Size: ${item.variant.size}`}
                              {item.variant.color && ` | Color: ${item.variant.color}`}
                            </p>
                          )}
                          {!item.variant && item.product?.baseSKU && (
                            <p className="text-xs text-slate-500 mt-1">SKU: {item.product.baseSKU}</p>
                          )}
                          {item.product?.category && (
                            <p className="text-xs text-slate-500 mt-1">
                              Category: {typeof item.product.category === 'string' 
                                ? item.product.category 
                                : item.product.category?.name || 'Uncategorized'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">
                          Quantity: <span className="font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          Price: <span className="font-semibold text-slate-900 dark:text-white">${item.price.toFixed(2)}</span>
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">${item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">${selectedTransaction.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tax:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">${selectedTransaction.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Payment Method:</span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">{selectedTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">Total:</span>
                  <span className="text-2xl font-bold text-primary">${selectedTransaction.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedTransaction.status === 'completed' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      handleRefund(selectedTransaction.id)
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

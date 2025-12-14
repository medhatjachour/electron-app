import React, { useState, useMemo, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, Filter, Download, RefreshCcw, X, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import { ipc } from '../utils/ipc'
import Pagination from '../components/Pagination'
import { formatCurrency, formatLargeNumber } from '@renderer/utils/formatNumber'
import RefundItemsModal from './Sales/RefundItemsModal'
import { calculateRefundedAmount } from '@/shared/utils/refundCalculations'
import { useLanguage } from '../contexts/LanguageContext'

type SaleItem = {
  id: string
  productId: string
  variantId?: string | null
  quantity: number
  refundedQuantity?: number
  price: number
  total: number
  refundedAt?: string | null
  discountType?: string
  discountValue?: number
  finalPrice?: number
  discountReason?: string
  discountAppliedBy?: string
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
  status: 'completed' | 'pending' | 'partially_refunded' | 'refunded'
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
  const { t } = useLanguage()
  const [transactions, setTransactions] = useState<SaleTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<SaleTransaction | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Get refund period from settings
  const refundPeriodDays = parseInt(localStorage.getItem('refundPeriodDays') || '30')
  
  // Check if transaction is within refund period
  const isWithinRefundPeriod = (transactionDate: string): boolean => {
    if (refundPeriodDays === 0) return false // 0 means refunds disabled
    
    const transactionTime = new Date(transactionDate).getTime()
    const now = new Date().getTime()
    const daysDifference = (now - transactionTime) / (1000 * 60 * 60 * 24)
    
    return daysDifference <= refundPeriodDays
  }
  
  // Check if refunds are enabled in settings
  const refundsEnabled = refundPeriodDays > 0

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      // Load only recent transactions (last 30 days) with limit for faster loading
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30) // Last 30 days only
      
      const data = await ipc.saleTransactions.getByDateRange({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100 // Limit to recent 100 transactions
      })
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
    // Include completed and partially_refunded transactions
    const activeTransactions = filteredTransactions.filter(t => 
      t.status === 'completed' || t.status === 'partially_refunded'
    )
    
    // Calculate total revenue accounting for refunds
    const totalRevenue = activeTransactions.reduce((sum, transaction) => {
      // Calculate refunded amount for this transaction
      const refundedAmount = calculateRefundedAmount(transaction.items)
      // Add net revenue (total - refunded)
      return sum + (transaction.total - refundedAmount)
    }, 0)
    
    // Calculate total items sold (excluding refunded items)
    const totalItems = activeTransactions.reduce((sum, transaction) => 
      sum + transaction.items.reduce((itemSum, item) => {
        const activeQuantity = item.quantity - (item.refundedQuantity || 0)
        return itemSum + activeQuantity
      }, 0), 0
    )
    
    const avgSale = activeTransactions.length > 0 ? totalRevenue / activeTransactions.length : 0

    // Calculate today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= today && (t.status === 'completed' || t.status === 'partially_refunded')
    })
    const todayRevenue = todayTransactions.reduce((sum, transaction) => {
      const refundedAmount = calculateRefundedAmount(transaction.items)
      return sum + (transaction.total - refundedAmount)
    }, 0)
    const todayCount = todayTransactions.length

    // Calculate yesterday's stats for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= yesterday && transactionDate < today && (t.status === 'completed' || t.status === 'partially_refunded')
    })
    const yesterdayRevenue = yesterdayTransactions.reduce((sum, transaction) => {
      const refundedAmount = calculateRefundedAmount(transaction.items)
      return sum + (transaction.total - refundedAmount)
    }, 0)
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
      return transactionDate >= startOfWeek && (t.status === 'completed' || t.status === 'partially_refunded')
    })
    const thisWeekRevenue = thisWeekTransactions.reduce((sum, transaction) => {
      const refundedAmount = calculateRefundedAmount(transaction.items)
      return sum + (transaction.total - refundedAmount)
    }, 0)

    const lastWeekStart = new Date(startOfWeek)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(startOfWeek)
    
    const lastWeekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= lastWeekStart && transactionDate < lastWeekEnd && (t.status === 'completed' || t.status === 'partially_refunded')
    })
    const lastWeekRevenue = lastWeekTransactions.reduce((sum, transaction) => {
      const refundedAmount = calculateRefundedAmount(transaction.items)
      return sum + (transaction.total - refundedAmount)
    }, 0)
    
    const weeklyRevenueChange = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
      : thisWeekRevenue > 0 ? 100 : 0

    return {
      totalRevenue,
      totalSales: activeTransactions.length,
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
    if (!confirm('Are you sure you want to refund this entire transaction? Stock will be restored for all items.')) {
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

  const handlePartialRefund = (transaction: SaleTransaction) => {
    setSelectedTransaction(transaction)
    setShowRefundModal(true)
  }

  const handleRefundItems = async (items: Array<{ saleItemId: string; quantityToRefund: number }>) => {
    if (!selectedTransaction) return

    const result = await ipc.saleTransactions.refundItems({
      transactionId: selectedTransaction.id,
      items
    })

    if (result.success) {
      alert('Items refunded successfully! Stock has been restored.')
      await loadTransactions()
    } else {
      throw new Error(result.error || 'Failed to refund items')
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
      case 'partially_refunded': return 'bg-warning/10 text-warning'
      case 'refunded': return 'bg-error/10 text-error'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('sales')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{t('salesHistory')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={loadTransactions}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            {t('refresh')}
          </button>
          <button 
            onClick={handleExport}
            className="btn-primary flex items-center gap-2"
          >
            <Download size={20} />
            {t('export')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('totalRevenue')}</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1" title={`$${stats.totalRevenue.toLocaleString()}`}>
            {formatCurrency(stats.totalRevenue)}
          </div>
          {stats.hasData ? (
            <div className={`flex items-center text-sm ${stats.weeklyRevenueChange >= 0 ? 'text-success' : 'text-error'}`}>
              {stats.weeklyRevenueChange >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingUp size={16} className="mr-1 rotate-180" />}
              {Math.abs(stats.weeklyRevenueChange).toFixed(1)}% {t('fromLastWeek')}
            </div>
          ) : (
            <div className="text-sm text-slate-400">{t('noSalesData')}</div>
          )}
        </div>

        <div className="glass-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('totalSales')}</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <ShoppingBag size={20} className="text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1" title={stats.totalSales.toLocaleString()}>
            {formatLargeNumber(stats.totalSales)}
          </div>
          {stats.hasData ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {stats.todayCount} {stats.todayCount === 1 ? t('saleToday') : t('salesToday')}
            </div>
          ) : (
            <div className="text-sm text-slate-400">{t('startMakingSales')}</div>
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
              {t('acrossAllTransactions')}
            </div>
          ) : (
            <div className="text-sm text-slate-400">{t('noItemsSold')}</div>
          )}
        </div>

        <div className="glass-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('avgSale')}</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-orange-500 flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1" title={`$${stats.avgSale.toLocaleString()}`}>
            {formatCurrency(stats.avgSale)}
          </div>
          {stats.hasData ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {t('perTransaction')}
            </div>
          ) : (
            <div className="text-sm text-slate-400">{t('noSalesData')}</div>
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
              {t('noSalesYet')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {t('startMakingSalesToSee')}
            </p>
            <button 
              onClick={() => window.location.href = '/pos'}
              className="btn-primary inline-flex items-center gap-2"
            >
              <ShoppingBag size={20} />
              {t('goToPointOfSale')}
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
              placeholder={t('searchByCustomerOrSaleId')}
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
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border-b-2 border-primary/20">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-12"></th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('saleId')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {t('saleDate')}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    {t('customer')}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('itemCount')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('totalAmount')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('payment')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <p className="text-slate-600 dark:text-slate-400">{t('loading')}...</p>
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
                      <tr className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent dark:hover:from-slate-800/50 dark:hover:to-transparent transition-all border-b border-slate-100 dark:border-slate-800">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleExpanded(transaction.id)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                            title={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
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
                            {transaction.customerName || t('walkInCustomer')}
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
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(transaction.status)}`}>
                            {transaction.status === 'completed' && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            {transaction.status === 'partially_refunded' && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                            {transaction.status === 'refunded' && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                            )}
                            {transaction.status === 'pending' && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            )}
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleViewTransaction(transaction)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold transition-all hover:shadow-sm"
                              title="View transaction details"
                            >
                              <Eye size={14} />
                              View
                            </button>
                            {(transaction.status === 'completed' || transaction.status === 'partially_refunded') && refundsEnabled && (
                              <>
                                {isWithinRefundPeriod(transaction.createdAt) ? (
                                  <button 
                                    onClick={() => handlePartialRefund(transaction)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold transition-all hover:shadow-sm"
                                    title={t('processRefund')}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                                    </svg>
                                    {t('refundItems')}
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-not-allowed"
                                    title={`Refund period expired (${refundPeriodDays} days)`}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Expired
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${transaction.id}-items`} className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/30 dark:to-slate-800/10 border-l-4 border-primary">
                          <td colSpan={9} className="px-6 py-6">
                            <div className="ml-8 space-y-3">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-5 bg-primary rounded-full"></div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wide">Transaction Items</h4>
                              </div>
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
                                      {item.discountReason && (
                                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded inline-block">
                                          💡 Discount reason: {item.discountReason}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                      <div className="text-slate-600 dark:text-slate-400">
                                        Qty: <span className="font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
                                        {item.refundedQuantity && item.refundedQuantity > 0 && (
                                          <span className="ml-2 text-red-600 dark:text-red-400 text-xs">
                                            (-{item.refundedQuantity} refunded)
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-slate-600 dark:text-slate-400">
                                        {item.discountType && item.discountType !== 'NONE' ? (
                                          <div className="flex flex-col items-end">
                                            <span className="line-through text-xs text-slate-400">
                                              @ ${item.price.toFixed(2)}
                                            </span>
                                            <span className="text-green-600 dark:text-green-400 font-semibold">
                                              @ ${(item.finalPrice || item.price).toFixed(2)}
                                            </span>
                                            <span className="text-xs text-green-600 dark:text-green-400">
                                              {item.discountType === 'PERCENTAGE' 
                                                ? `(-${item.discountValue}%)`
                                                : `(-$${item.discountValue?.toFixed(2)})`}
                                            </span>
                                          </div>
                                        ) : (
                                          <>@ ${item.price.toFixed(2)}</>
                                        )}
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('transactionDetails')}</h2>
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
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('transactionId')}</p>
                  <p className="font-mono font-bold text-primary">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('statusLabel')}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
              </div>

              {/* Date and Time */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('dateAndTime')}</p>
                <p className="font-medium text-slate-900 dark:text-white">{formatDate(selectedTransaction.createdAt)}</p>
              </div>

              {/* Customer */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('customerLabel')}</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedTransaction.customerName || t('walkInCustomer')}
                </p>
              </div>

              {/* Sold By */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('soldByLabel')}</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedTransaction.user?.username || t('unknownUser')}
                </p>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{t('itemsLabel')}</p>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item, idx) => (
                    <div key={item.id || idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {item.product?.name || t('unknownProduct')}
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
                              {t('categoryLabel')}: {typeof item.product.category === 'string' 
                                ? item.product.category 
                                : item.product.category?.name || t('uncategorized')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-slate-600 dark:text-slate-400">
                          <div>
                            {t('quantityLabel')}: <span className="font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
                          </div>
                          {item.refundedQuantity && item.refundedQuantity > 0 && (
                            <div className="mt-1 space-y-0.5">
                              <div className="text-red-600 dark:text-red-400 text-xs">
                                {t('refundedLabel')}: {item.refundedQuantity} {item.refundedQuantity > 1 ? t('unitsLabel') : t('unitLabel')}
                              </div>
                              <div className="text-green-600 dark:text-green-400 text-xs">
                                {t('activeLabel')}: {item.quantity - item.refundedQuantity} {(item.quantity - item.refundedQuantity) > 1 ? t('unitsLabel') : t('unitLabel')}
                              </div>
                              {item.refundedAt && (
                                <div className="text-xs text-slate-500">
                                  {t('refundedOn')}: {new Date(item.refundedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {item.discountType && item.discountType !== 'NONE' ? (
                            <div className="flex flex-col items-end">
                              <span className="line-through text-xs text-slate-400">
                                {t('originalPrice')}: ${item.price.toFixed(2)}
                              </span>
                              <span className="text-green-600 dark:text-green-400 font-semibold">
                                {t('priceLabel')}: ${(item.finalPrice || item.price).toFixed(2)}
                              </span>
                              <span className="text-xs text-green-600 dark:text-green-400">
                                {item.discountType === 'PERCENTAGE' 
                                  ? `${t('discountLabel')}: -${item.discountValue}%`
                                  : `${t('discountLabel')}: -$${item.discountValue?.toFixed(2)}`}
                              </span>
                            </div>
                          ) : (
                            <>{t('priceLabel')}: <span className="font-semibold text-slate-900 dark:text-white">${item.price.toFixed(2)}</span></>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-white">${item.total.toFixed(2)}</div>
                          {item.refundedQuantity && item.refundedQuantity > 0 && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              -${(item.refundedQuantity * item.price).toFixed(2)} refunded
                            </div>
                          )}
                        </div>
                      </div>
                      {item.discountReason && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded">
                            <span className="font-semibold">💡 {t('discountReason')}:</span> {item.discountReason}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{t('subtotalLabel')}:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">${selectedTransaction.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{t('taxLabel')}:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">${selectedTransaction.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{t('paymentMethodLabel')}:</span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">{selectedTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{t('originalTotal')}:</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">${selectedTransaction.total.toFixed(2)}</span>
                </div>
                {(() => {
                  const totalRefunded = selectedTransaction.items.reduce((sum, item) => {
                    const refunded = item.refundedQuantity || 0
                    return sum + (refunded * item.price)
                  }, 0)
                  
                  if (totalRefunded > 0) {
                    const netTotal = selectedTransaction.total - totalRefunded
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">{t('lessRefundedAmount')}</span>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">-${totalRefunded.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t-2 border-primary/30">
                          <span className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {t('netTotal')}
                            <span className="text-xs font-normal text-slate-500">({t('afterRefunds')})</span>
                          </span>
                          <span className="text-2xl font-bold text-primary">${netTotal.toFixed(2)}</span>
                        </div>
                      </>
                    )
                  }
                  return null
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                {(selectedTransaction.status === 'completed' || selectedTransaction.status === 'partially_refunded') && (
                  <>
                    {!refundsEnabled ? (
                      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('refundsDisabled')}</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {t('refundsDisabledMessage')}
                        </p>
                      </div>
                    ) : isWithinRefundPeriod(selectedTransaction.createdAt) ? (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">{t('refundOptions')}</h4>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                          {t('refundOptionsMessage')}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setShowViewModal(false)
                              handlePartialRefund(selectedTransaction)
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-orange-500 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors font-medium text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            {t('refundItems')}
                          </button>
                          <button
                            onClick={() => {
                              setShowViewModal(false)
                              handleRefund(selectedTransaction.id)
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                            </svg>
                            {t('refundAll')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('refundPeriodExpired')}</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {t('refundPeriodExpiredMessage').replace('{days}', refundPeriodDays.toString())}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  {t('closeButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Items Modal */}
      <RefundItemsModal
        show={showRefundModal}
        transaction={selectedTransaction}
        onClose={() => setShowRefundModal(false)}
        onRefund={handleRefundItems}
      />
    </div>
  )
}

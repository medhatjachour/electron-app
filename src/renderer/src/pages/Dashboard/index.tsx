/**
 * Dashboard Page
 * Comprehensive overview with real-time metrics, analytics, and quick actions
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import {
  BarChart3,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react'
import DashboardStats from './components/DashboardStats'
import RecentActivity from './components/RecentActivity'
import logger from '../../../../shared/utils/logger'

import QuickActions from './components/QuickActions'
import SalesChart from './components/SalesChart'
import TopProducts from './components/TopProducts'
import InventoryAlerts from './components/InventoryAlerts'
import GoalTracking from './components/GoalTracking'
import NotificationCenter from './components/NotificationCenter'

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
    totalCustomers: 0,
    revenueChange: 0,
    ordersChange: 0,
  })

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 5 minutes (reduced from 30 seconds)
    const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes
    const interval = setInterval(() => {
      loadDashboardData(true)
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      
      // Calculate date ranges
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // Fetch dashboard data using optimized endpoints with date filtering
      const saleTransactionsApi = (globalThis as any).api?.saleTransactions
      const [productStats, todaySales, yesterdaySales, customerStats] = await Promise.all([
        // Use optimized stats endpoint instead of loading all products
        // @ts-ignore
        (globalThis as any).api?.products?.getStats?.() || Promise.resolve({ totalProducts: 0, lowStockCount: 0 }),
        // Only fetch today's sales (filtered at database level)
        // @ts-ignore
        saleTransactionsApi?.getByDateRange?.({ 
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString()
        }) || Promise.resolve([]),
        // Only fetch yesterday's sales (filtered at database level)
        // @ts-ignore
        saleTransactionsApi?.getByDateRange?.({ 
          startDate: yesterday.toISOString(), 
          endDate: today.toISOString() 
        }) || Promise.resolve([]),
        // Get customer count only (not all customer data)
        // @ts-ignore
        (globalThis as any).api?.customers?.getAll?.() || Promise.resolve([]),
      ])
      
      logger.info('Dashboard data loaded', {
        todaySales: todaySales.length,
        yesterdaySales: yesterdaySales.length
      })

      // Calculate metrics from filtered data
      const todayRevenue = (todaySales || []).reduce((sum: number, sale: any) => sum + sale.total, 0)
      const yesterdayRevenue = (yesterdaySales || []).reduce((sum: number, sale: any) => sum + sale.total, 0)
      
      const revenueChange = yesterdayRevenue > 0 
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
        : 0

      const ordersChange = (yesterdaySales || []).length > 0
        ? (((todaySales || []).length - (yesterdaySales || []).length) / (yesterdaySales || []).length) * 100
        : 0

      setStats({
        todayRevenue,
        todayOrders: (todaySales || []).length,
        totalProducts: productStats?.totalProducts || 0,
        lowStockItems: productStats?.lowStockCount || 0,
        totalCustomers: customerStats?.length || 0,
        revenueChange,
        ordersChange,
      })
    } catch (error) {
      logger.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadDashboardData()
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return `🌅 ${t('goodMorning')}`
    if (hour < 18) return `☀️ ${t('goodAfternoon')}`
    return `🌙 ${t('goodEvening')}`
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {getGreeting()}, {user?.username}!
              </h1>
              <p className="text-white/80 text-sm flex items-center gap-2">
                <Activity size={16} />
                {t('businessOverview')} {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh Dashboard"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                <span className="text-sm font-medium hidden sm:inline">
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>
              
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Zap size={16} />
                <span className="text-sm font-medium capitalize">{t(`${user?.role}Access` as any) || `${user?.role} Access`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className=" mx-auto p-4 space-y-4">
        {/* Key Metrics */}
        <DashboardStats stats={stats} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            {/* Sales Chart */}
            <SalesChart />

            {/* Top Products */}
            <TopProducts />

            {/* Recent Activity */}
            <RecentActivity />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <QuickActions userRole={user?.role || 'sales'} />

            {/* Goal Tracking */}
            <GoalTracking />

            {/* Notification Center */}
            <NotificationCenter />

            {/* Inventory Alerts */}
            <InventoryAlerts />

            {/* Quick Stats Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 size={18} />
                {t('quickStats')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{t('avgOrderValue')}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ${stats.todayOrders > 0 ? (stats.todayRevenue / stats.todayOrders).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{t('productsInStock')}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {stats.totalProducts - stats.lowStockItems}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{t('lowStockItems')}</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {stats.lowStockItems}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{t('activeCustomers')}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {stats.totalCustomers}
                  </span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">{t('systemStatus')}</span>
              </div>
              <p className="text-2xl font-bold mb-1">{t('allSystemsOperational')}</p>
              <p className="text-white/80 text-xs">{t('lastUpdated')}: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

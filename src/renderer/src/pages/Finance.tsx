import { useEffect, useState } from 'react'
import { 
  DollarSign, TrendingUp, TrendingDown, ShoppingCart, 
  Store, Package, ArrowUpRight, ArrowDownRight, 
  RefreshCcw, Calendar, Zap, Target, Activity,
  BarChart3, PieChart, ShoppingBag, Percent,
  AlertCircle, CheckCircle, XCircle, Clock
} from 'lucide-react'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js'
import { ipc } from '../utils/ipc'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler)

interface Sale {
  id: string
  productId: string
  quantity: number
  total: number
  price: number
  createdAt: string
  status?: string // 'completed', 'pending', 'cancelled'
  product?: { name: string; category?: string; storeId?: string }
}

interface Product {
  id: string
  name: string
  category?: string
  storeId?: string
  variants: Array<{ id: string; stock: number; price: number }>
}

interface Store {
  id: string
  name: string
  location: string
}

interface FinancialMetrics {
  totalRevenue: number
  totalCost: number
  netProfit: number
  profitMargin: number
  totalSales: number
  averageOrderValue: number
  totalPiecesSold: number
  numberOfOrders: number
  expectedSales: number
  actualSales: number
  expectedIncome: number
  actualIncome: number
  revenueGrowth: number
  orderGrowth: number
  roi: number
  conversionRate: number
  averageItemsPerOrder: number
  inventoryTurnover: number
}

interface TopProduct {
  name: string
  revenue: number
  quantity: number
  category?: string
}

type DateRangeType = 'today' | '7days' | '30days' | '90days' | 'custom'

export default function Finance() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRangeType>('30days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [previousPeriodSales, setPreviousPeriodSales] = useState<Sale[]>([])
  
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    profitMargin: 0,
    totalSales: 0,
    averageOrderValue: 0,
    totalPiecesSold: 0,
    numberOfOrders: 0,
    expectedSales: 0,
    actualSales: 0,
    expectedIncome: 0,
    actualIncome: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    roi: 0,
    conversionRate: 100, // Assume 100% for sales that completed
    averageItemsPerOrder: 0,
    inventoryTurnover: 0
  })
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [bottomProducts, setBottomProducts] = useState<TopProduct[]>([])
  const [storeRevenue, setStoreRevenue] = useState<{ name: string; revenue: number }[]>([])

  useEffect(() => {
    loadFinancialData()
  }, [])

  useEffect(() => {
    if (sales.length > 0) {
      filterSalesByDateRange()
    }
  }, [dateRange, customStartDate, customEndDate, sales])

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      const [salesData, productsData, storesData] = await Promise.all([
        ipc.sales.getAll(),
        ipc.products.getAll(),
        ipc.stores.getAll()
      ])

      setSales(salesData)
      setProducts(productsData)
      setStores(storesData)
    } catch (error) {
      console.error('Error loading financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRangeDates = (): { start: Date; end: Date } => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    let start = new Date()

    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case '7days':
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        break
      case '30days':
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
        break
      case '90days':
        start.setDate(start.getDate() - 90)
        start.setHours(0, 0, 0, 0)
        break
      case 'custom':
        if (customStartDate) start = new Date(customStartDate)
        if (customEndDate) end.setTime(new Date(customEndDate).getTime())
        break
    }

    return { start, end }
  }

  const filterSalesByDateRange = () => {
    const { start, end } = getDateRangeDates()
    
    const filtered = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= start && saleDate <= end
    })

    // Get previous period for comparison
    const periodLength = end.getTime() - start.getTime()
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - periodLength)
    
    const previousPeriod = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= prevStart && saleDate <= prevEnd
    })

    setFilteredSales(filtered)
    setPreviousPeriodSales(previousPeriod)
    calculateMetrics(filtered, previousPeriod)
    calculateTopProducts(filtered)
    calculateStoreRevenue(filtered, products, stores)
  }

  const calculateMetrics = (currentSales: Sale[], previousSales: Sale[]) => {
    // Current period metrics
    const totalRevenue = currentSales.reduce((sum, sale) => sum + sale.total, 0)
    const totalPiecesSold = currentSales.reduce((sum, sale) => sum + sale.quantity, 0)
    const numberOfOrders = currentSales.length
    const averageOrderValue = numberOfOrders > 0 ? totalRevenue / numberOfOrders : 0
    const averageItemsPerOrder = numberOfOrders > 0 ? totalPiecesSold / numberOfOrders : 0

    // Cost estimation (can be customized)
    const costMargin = 0.6 // 60% cost of goods sold
    const totalCost = totalRevenue * costMargin
    const netProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Previous period metrics for growth calculation
    const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.total, 0)
    const previousOrders = previousSales.length

    // Growth metrics (comparing to previous period)
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0
    const orderGrowth = previousOrders > 0 
      ? ((numberOfOrders - previousOrders) / previousOrders) * 100 
      : 0

    // ROI Calculation
    const roi = totalCost > 0 ? ((netProfit / totalCost) * 100) : 0

    // Expected vs Actual calculations
    // Expected sales based on historical average (simple projection)
    const { start, end } = getDateRangeDates()
    const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const dailyAverageRevenue = daysInPeriod > 0 ? totalRevenue / daysInPeriod : 0
    
    // Use previous period as baseline for expectations
    const previousDailyAverage = previousSales.length > 0 && daysInPeriod > 0
      ? previousRevenue / daysInPeriod
      : dailyAverageRevenue

    const expectedIncome = previousDailyAverage * daysInPeriod
    const actualIncome = totalRevenue

    const expectedSalesCount = previousSales.length > 0 && daysInPeriod > 0
      ? (previousOrders / daysInPeriod) * daysInPeriod
      : numberOfOrders
    const actualSales = numberOfOrders

    // Inventory turnover (simplified - total pieces sold / average inventory)
    const totalInventory = products.reduce((sum, product) => {
      return sum + product.variants.reduce((vSum, variant) => vSum + variant.stock, 0)
    }, 0)
    const inventoryTurnover = totalInventory > 0 ? totalPiecesSold / totalInventory : 0

    setMetrics({
      totalRevenue,
      totalCost,
      netProfit,
      profitMargin,
      totalSales: numberOfOrders,
      averageOrderValue,
      totalPiecesSold,
      numberOfOrders,
      expectedSales: Math.round(expectedSalesCount),
      actualSales,
      expectedIncome,
      actualIncome,
      revenueGrowth,
      orderGrowth,
      roi,
      conversionRate: 100, // Simplified - all completed sales
      averageItemsPerOrder,
      inventoryTurnover
    })
  }

  const calculateTopProducts = (salesData: Sale[]) => {
    const productMap = new Map<string, { name: string; revenue: number; quantity: number; category?: string }>()

    salesData.forEach(sale => {
      const productName = sale.product?.name || 'Unknown Product'
      const existing = productMap.get(productName) || { name: productName, revenue: 0, quantity: 0, category: sale.product?.category }
      existing.revenue += sale.total
      existing.quantity += sale.quantity
      productMap.set(productName, existing)
    })

    const sorted = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)
    setTopProducts(sorted.slice(0, 5))
    setBottomProducts(sorted.slice(-5).reverse())
  }

  const calculateStoreRevenue = (salesData: Sale[], productsData: Product[], storesData: Store[]) => {
    const storeMap = new Map<string, number>()

    salesData.forEach(sale => {
      const product = productsData.find(p => p.id === sale.productId)
      const storeId = product?.storeId || 'no-store'
      const current = storeMap.get(storeId) || 0
      storeMap.set(storeId, current + sale.total)
    })

    const storeRevenueData = Array.from(storeMap.entries()).map(([storeId, revenue]) => {
      const store = storesData.find(s => s.id === storeId)
      return {
        name: store?.name || 'All Locations',
        revenue
      }
    }).sort((a, b) => b.revenue - a.revenue)

    setStoreRevenue(storeRevenueData)
  }

  // Chart data functions
  const getDailyDataForPeriod = () => {
    const { start, end } = getDateRangeDates()
    const days: string[] = []
    const revenueData: number[] = []
    const costData: number[] = []
    
    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      
      const dayRevenue = filteredSales
        .filter(sale => {
          const saleDate = new Date(sale.createdAt)
          return saleDate.toDateString() === date.toDateString()
        })
        .reduce((sum, sale) => sum + sale.total, 0)
      
      revenueData.push(dayRevenue)
      costData.push(dayRevenue * 0.6)
    }

    return { labels: days, revenueData, costData }
  }

  const dailyData = getDailyDataForPeriod()

  const incomeExpenseData = {
    labels: dailyData.labels,
    datasets: [
      {
        label: 'Revenue',
        data: dailyData.revenueData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Estimated Cost',
        data: dailyData.costData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const storeRevenueChartData = {
    labels: storeRevenue.map(s => s.name),
    datasets: [{
      label: 'Revenue by Store',
      data: storeRevenue.map(s => s.revenue),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(168, 85, 247)',
        'rgb(236, 72, 153)',
        'rgb(34, 197, 94)',
        'rgb(251, 146, 60)'
      ],
      borderWidth: 1
    }]
  }

  const categoryRevenueData = {
    labels: topProducts.map(p => p.category || 'Uncategorized'),
    datasets: [{
      data: topProducts.map(p => p.revenue),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)'
      ],
      borderWidth: 0
    }]
  }

  // Performance radar chart - Pro-level analytics visualization
  const performanceRadarData = {
    labels: ['Revenue', 'Profit Margin', 'Order Growth', 'Inventory Turn', 'ROI', 'Avg Items/Order'],
    datasets: [{
      label: 'Performance Metrics',
      data: [
        Math.min((metrics.totalRevenue / 10000) * 100, 100), // Normalize to 100
        Math.min(metrics.profitMargin, 100),
        Math.min(50 + metrics.orderGrowth, 100),
        Math.min(metrics.inventoryTurnover * 20, 100),
        Math.min(50 + metrics.roi / 2, 100),
        Math.min(metrics.averageItemsPerOrder * 20, 100)
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(59, 130, 246)'
    }]
  }

  // Sales Status Chart - Accepted, Refused, Waiting
  const salesStatusData = {
    labels: ['Accepted (Completed)', 'Waiting (Pending)', 'Refused (Cancelled)'],
    datasets: [{
      data: [
        filteredSales.filter(s => !s.status || s.status === 'completed').length,
        filteredSales.filter(s => s.status === 'pending').length,
        filteredSales.filter(s => s.status === 'cancelled').length
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',   // Green for accepted
        'rgba(251, 146, 60, 0.8)',  // Orange for waiting
        'rgba(239, 68, 68, 0.8)'    // Red for refused
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(251, 146, 60)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        labels: { color: 'rgb(148, 163, 184)' }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgb(226, 232, 240)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgb(51, 65, 85)',
        borderWidth: 1
      }
    },
    scales: {
      x: { 
        ticks: { color: 'rgb(148, 163, 184)' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      y: { 
        ticks: { color: 'rgb(148, 163, 184)' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: 'rgb(148, 163, 184)' }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgb(226, 232, 240)',
        bodyColor: 'rgb(203, 213, 225)'
      }
    }
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgb(226, 232, 240)',
        bodyColor: 'rgb(203, 213, 225)'
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: 'rgb(148, 163, 184)',
          backdropColor: 'transparent'
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)'
        },
        pointLabels: {
          color: 'rgb(148, 163, 184)',
          font: { size: 11 }
        }
      }
    }
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatNumber = (num: number) => num.toLocaleString()
  const formatPercent = (num: number) => `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCcw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 pb-8">
      {/* Header with Date Range */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-500" />
            Financial Analytics Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Professional-grade business intelligence & performance metrics
          </p>
        </div>
        
        {/* Date Range Selector - Enhanced Styling */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex items-center gap-2 bg-white dark:bg-slate-700 rounded-xl p-3 shadow-md border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <Calendar className="w-5 h-5 text-blue-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeType)}
              className="bg-transparent border-none outline-none text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer pr-2 appearance-none"
              style={{ minWidth: '140px' }}
            >
              <option value="today">📅 Today</option>
              <option value="7days">📊 Last 7 Days</option>
              <option value="30days">📈 Last 30 Days</option>
              <option value="90days">📉 Last 90 Days</option>
              <option value="custom">🗓️ Custom Range</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-700 rounded-xl p-3 shadow-md border-2 border-slate-200 dark:border-slate-600">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <span className="text-slate-500 dark:text-slate-400 font-medium">→</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <button
            onClick={loadFinancialData}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Advanced KPI Metrics - 8 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-end">
              <ArrowUpRight className="w-5 h-5 opacity-75" />
              <span className="text-xs font-semibold">{formatPercent(metrics.revenueGrowth)}</span>
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
          <p className="text-xs opacity-75 mt-2">{formatNumber(metrics.numberOfOrders)} orders</p>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-xs bg-white/20 px-2 py-1 rounded">
              {metrics.profitMargin.toFixed(1)}% Margin
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Net Profit</p>
          <p className="text-3xl font-bold">{formatCurrency(metrics.netProfit)}</p>
          <p className="text-xs opacity-75 mt-2">ROI: {metrics.roi.toFixed(1)}%</p>
        </div>

        {/* Total Pieces Sold */}
        <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <Zap className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Pieces Sold</p>
          <p className="text-3xl font-bold">{formatNumber(metrics.totalPiecesSold)}</p>
          <p className="text-xs opacity-75 mt-2">Avg {metrics.averageItemsPerOrder.toFixed(1)} items/order</p>
        </div>

        {/* Number of Orders */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-end">
              {metrics.orderGrowth >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              <span className="text-xs font-semibold">{formatPercent(metrics.orderGrowth)}</span>
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Number of Orders</p>
          <p className="text-3xl font-bold">{formatNumber(metrics.numberOfOrders)}</p>
          <p className="text-xs opacity-75 mt-2">AOV: {formatCurrency(metrics.averageOrderValue)}</p>
        </div>

        {/* Expected Sales vs Actual */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <Target className="w-6 h-6" />
            </div>
            {metrics.actualSales >= metrics.expectedSales ? 
              <CheckCircle className="w-5 h-5" /> : 
              <AlertCircle className="w-5 h-5" />
            }
          </div>
          <p className="text-sm opacity-90 mb-1">Expected vs Actual Sales</p>
          <p className="text-3xl font-bold">{formatNumber(metrics.actualSales)}</p>
          <p className="text-xs opacity-75 mt-2">Target: {formatNumber(metrics.expectedSales)} orders</p>
        </div>

        {/* Expected Income vs Actual */}
        <div className="bg-gradient-to-br from-teal-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            {metrics.actualIncome >= metrics.expectedIncome ? 
              <CheckCircle className="w-5 h-5" /> : 
              <XCircle className="w-5 h-5" />
            }
          </div>
          <p className="text-sm opacity-90 mb-1">Expected vs Actual Income</p>
          <p className="text-3xl font-bold">{formatCurrency(metrics.actualIncome)}</p>
          <p className="text-xs opacity-75 mt-2">Target: {formatCurrency(metrics.expectedIncome)}</p>
        </div>

        {/* Inventory Turnover */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <Activity className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">Inventory Turnover</p>
          <p className="text-3xl font-bold">{metrics.inventoryTurnover.toFixed(2)}x</p>
          <p className="text-xs opacity-75 mt-2">Conversion: {metrics.conversionRate.toFixed(0)}%</p>
        </div>

        {/* Total Costs */}
        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6" />
            </div>
            <Percent className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">Estimated Costs</p>
          <p className="text-3xl font-bold">{formatCurrency(metrics.totalCost)}</p>
          <p className="text-xs opacity-75 mt-2">60% of revenue (COGS)</p>
        </div>
      </div>

      {/* Advanced Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Cost Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Revenue & Cost Trend
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {dateRange === 'today' ? 'Today' : 
               dateRange === '7days' ? 'Last 7 Days' : 
               dateRange === '30days' ? 'Last 30 Days' : 
               dateRange === '90days' ? 'Last 90 Days' : 'Custom Range'}
            </div>
          </div>
          <div className="h-80">
            <Line data={incomeExpenseData} options={chartOptions} />
          </div>
        </div>

        {/* Performance Radar - Professional Analytics */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Performance Index
          </h2>
          <div className="h-80">
            <Radar data={performanceRadarData} options={radarOptions} />
          </div>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Status - Accepted/Waiting/Refused */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border-2 border-transparent hover:border-blue-500/50 transition-colors">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-500" />
            Sales Status Breakdown
          </h2>
          <div className="h-80">
            <Doughnut data={salesStatusData} options={doughnutOptions} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-600 dark:text-slate-300">Accepted</span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-white">
                {filteredSales.filter(s => !s.status || s.status === 'completed').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-slate-600 dark:text-slate-300">Waiting</span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-white">
                {filteredSales.filter(s => s.status === 'pending').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-slate-600 dark:text-slate-300">Refused</span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-white">
                {filteredSales.filter(s => s.status === 'cancelled').length}
              </span>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border-2 border-transparent hover:border-purple-500/50 transition-colors">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-500" />
            Top Categories Revenue
          </h2>
          <div className="h-80">
            <Doughnut data={categoryRevenueData} options={doughnutOptions} />
          </div>
        </div>

        {/* Store Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border-2 border-transparent hover:border-indigo-500/50 transition-colors">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-500" />
            Store Performance
          </h2>
          <div className="h-80">
            <Bar data={storeRevenueChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Top Selling Products
          </h2>
          <div className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{product.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{product.quantity} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{product.category || 'N/A'}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-400 py-8">No sales data available</p>
            )}
          </div>
        </div>

        {/* Lowest Selling Products */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Lowest Selling Products
          </h2>
          <div className="space-y-3">
            {bottomProducts.length > 0 ? bottomProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{product.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{product.quantity} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{product.category || 'N/A'}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-400 py-8">No sales data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Expected Income Projection - Enhanced */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Target className="w-6 h-6" />
              30-Day Income Projection
            </h2>
            <p className="text-sm opacity-90">Based on current period average</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">
              {formatCurrency((dailyData.revenueData.reduce((a, b) => a + b, 0) / dailyData.revenueData.length) * 30)}
            </p>
            <p className="text-sm opacity-75 mt-1">Projected revenue</p>
          </div>
        </div>
      </div>

      {/* Recent Sales Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-500" />
          Recent Sales Activity
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Product</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice(0, 10).map((sale) => (
                <tr key={sale.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-3 px-4 text-slate-800 dark:text-white">{sale.product?.name || 'Unknown'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{sale.quantity}</td>
                  <td className="py-3 px-4 font-semibold text-green-600 dark:text-green-400">{formatCurrency(sale.total)}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-sm">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && (
            <p className="text-center text-slate-400 py-8">No sales in selected period</p>
          )}
        </div>
      </div>
    </div>
  )
}

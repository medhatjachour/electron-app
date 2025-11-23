/**
 * Product Analytics Component
 * Shows sales performance, trends, and top sellers
 */

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Package, ShoppingCart, Calendar } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

type TopProduct = {
  productId: string
  productName: string
  category: string
  unitsSold: number
  revenue: number
  transactions: number
  avgUnitsPerTransaction: number
}

type TrendData = {
  period: string
  unitsSold: number
  revenue: number
  transactions: number
  avgUnitsPerTransaction: number
}

export default function ProductAnalytics() {
  const [loading, setLoading] = useState(true)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [timeRange, setTimeRange] = useState('30') // days

  useEffect(() => {
    loadAnalytics()
  }, [timeRange, period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))

      console.log('📊 Loading analytics...', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period
      })

      // Get top selling products
      // @ts-ignore
      const productsData = await window.api?.analytics?.getTopSellingProducts({
        limit: 10,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      
      console.log('📦 Top products data:', productsData)
      setTopProducts(productsData || [])

      // Get trend data for the top product if available
      if (productsData && productsData.length > 0) {
        console.log('📈 Fetching trend for product:', productsData[0].productId)
        // @ts-ignore
        const trend = await window.api?.analytics?.getProductSalesTrend(
          productsData[0].productId,
          {
            period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        )
        console.log('📊 Trend data:', trend)
        setTrendData(trend || [])
      } else {
        console.log('⚠️ No products data, skipping trend fetch')
        setTrendData([])
      }
    } catch (error) {
      console.error('❌ Error loading analytics:', error)
      setTopProducts([])
      setTrendData([])
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: trendData.map(d => {
      const date = new Date(d.period)
      if (period === 'daily') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (period === 'weekly') {
        return `Week ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
    }),
    datasets: [
      {
        label: 'Units Sold',
        data: trendData.map(d => d.unitsSold),
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Product Analytics</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Sales performance and trends over time
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-slate-400" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && topProducts.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <TrendingUp size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No Sales Data Available
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Start making sales to see analytics and performance metrics here
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Sales data for the selected time period ({timeRange} days) will appear once transactions are recorded
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && topProducts.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Package size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {topProducts.reduce((sum, p) => sum + p.unitsSold, 0).toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Units Sold</div>
            </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <DollarSign size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${topProducts.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <ShoppingCart size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {topProducts.reduce((sum, p) => sum + p.transactions, 0).toLocaleString()}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Transactions</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <TrendingUp size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {topProducts.length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Active Products</div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sales Trend</h3>
            {topProducts.length > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Showing data for: {topProducts[0].productName}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  period === p
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {trendData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
              <p>No sales data for selected period</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Top Selling Products */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Selling Products</h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading analytics...</p>
          </div>
        ) : topProducts.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No Sales Data Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Product analytics will appear here once you make some sales
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Units Sold
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Avg Units/Sale
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {topProducts.map((product, index) => (
                  <tr
                    key={product.productId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-2xl font-bold text-slate-400 dark:text-slate-500">
                        #{index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {product.productName}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {product.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {product.unitsSold.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                        ${product.revenue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-900 dark:text-white">
                      {product.transactions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                      {product.avgUnitsPerTransaction.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  )
}

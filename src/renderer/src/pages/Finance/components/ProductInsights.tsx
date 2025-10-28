/**
 * Product Insights Component
 * 
 * AI-powered product recommendations:
 * - Sales velocity analysis
 * - Profit margin insights
 * - Trend detection
 * - Actionable recommendations
 */

import { useState, useEffect } from 'react'
import { Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react'

type ProductInsight = {
  productId: string
  productName: string
  insight: string
  type: 'opportunity' | 'warning' | 'success'
  metrics: {
    sales: number
    revenue: number
    profitMargin: number
    trend: 'up' | 'down' | 'stable'
    velocityScore: number
  }
  recommendations: string[]
}

export default function ProductInsights() {
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<ProductInsight[]>([])
  const [filter, setFilter] = useState<'all' | 'opportunity' | 'warning' | 'success'>('all')

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      setLoading(true)
      // @ts-ignore
      const data = await window.api['insights:products']({ limit: 20 })
      setInsights(data)
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const filteredInsights = filter === 'all' 
    ? insights 
    : insights.filter(i => i.type === filter)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Sparkles size={18} className="text-green-600" />
      case 'opportunity':
        return <Lightbulb size={18} className="text-blue-600" />
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-600" />
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'opportunity':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      default:
        return 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} className="text-green-600" />
      case 'down':
        return <TrendingDown size={14} className="text-red-600" />
      default:
        return <Minus size={14} className="text-slate-600" />
    }
  }

  const getVelocityColor = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Lightbulb size={20} className="text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Product Insights</h3>
          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
            AI-Powered
          </span>
          <Tooltip text="AI analyzes sales velocity, profit margins, and trends to identify opportunities, warnings, and successful products. Velocity score shows how fast items are selling.">
            <HelpCircle size={16} className="text-slate-400 hover:text-slate-600 cursor-help" />
          </Tooltip>
        </div>
        
        <button
          onClick={loadInsights}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {(['all', 'success', 'opportunity', 'warning'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {f}
            {f === 'all' && ` (${insights.length})`}
            {f !== 'all' && ` (${insights.filter(i => i.type === f).length})`}
          </button>
        ))}
      </div>

      {/* Insights List */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No insights available</p>
          <p className="text-sm text-slate-500 mt-2">
            {filter === 'all' 
              ? 'Need more sales data to generate insights' 
              : `No ${filter} insights found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredInsights.map((insight, index) => (
            <div 
              key={index}
              className={`relative border-l-4 rounded-lg p-5 transition-all hover:shadow-lg ${getTypeColor(insight.type)}`}
              style={{
                borderLeftColor: 
                  insight.type === 'success' ? 'rgb(34, 197, 94)' :
                  insight.type === 'opportunity' ? 'rgb(59, 130, 246)' :
                  'rgb(245, 158, 11)'
              }}
            >
              {/* Priority Badge */}
              <div className="absolute top-4 right-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  insight.metrics.velocityScore >= 70 
                    ? 'bg-green-500 text-white' 
                    : insight.metrics.velocityScore >= 40 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {insight.metrics.velocityScore >= 70 ? 'High Priority' : 
                   insight.metrics.velocityScore >= 40 ? 'Medium' : 'Low Priority'}
                </div>
              </div>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getTypeIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {insight.productName}
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {insight.insight}
                    </p>
                  </div>
                </div>
                
                {/* Velocity Score */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Velocity</span>
                    <div className={`w-2 h-2 rounded-full ${getVelocityColor(insight.metrics.velocityScore)}`}></div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {insight.metrics.velocityScore.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-3 mb-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Sales</p>
                    <Tooltip text="Number of units sold during the period">
                      <HelpCircle size={10} className="text-slate-400 opacity-60" />
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(insight.metrics.trend)}
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {insight.metrics.sales}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Revenue</p>
                    <Tooltip text="Total sales value generated">
                      <HelpCircle size={10} className="text-slate-400 opacity-60" />
                    </Tooltip>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    ${insight.metrics.revenue.toFixed(0)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Margin</p>
                    <Tooltip text="Profit margin percentage">
                      <HelpCircle size={10} className="text-slate-400 opacity-60" />
                    </Tooltip>
                  </div>
                  <p className={`text-sm font-semibold ${
                    insight.metrics.profitMargin > 30 
                      ? 'text-green-600' 
                      : insight.metrics.profitMargin > 15 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                  }`}>
                    {insight.metrics.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Trend</p>
                  <p className="text-sm font-semibold capitalize text-slate-900 dark:text-white">
                    {insight.metrics.trend}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {insight.recommendations.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Recommendations:
                  </p>
                  {insight.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {insights.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles size={16} className="text-green-600" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Success</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {insights.filter(i => i.type === 'success').length}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Lightbulb size={16} className="text-blue-600" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Opportunities</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {insights.filter(i => i.type === 'opportunity').length}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-amber-600" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Warnings</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {insights.filter(i => i.type === 'warning').length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Tooltip Component
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-64 whitespace-normal">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  )
}

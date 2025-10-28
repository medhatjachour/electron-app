/**
 * Financial Health Component
 * 
 * Overall business health dashboard:
 * - Health score (0-100)
 * - Key indicators
 * - Alerts & recommendations
 */

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Package, DollarSign, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'

type FinancialHealth = {
  score: number
  indicators: {
    profitMargin: { value: number; status: 'good' | 'fair' | 'poor' }
    inventoryTurnover: { value: number; status: 'good' | 'fair' | 'poor' }
    growthRate: { value: number; status: 'good' | 'fair' | 'poor' }
    cashPosition: { value: number; status: 'good' | 'fair' | 'poor' }
  }
  alerts: string[]
  recommendations: string[]
}

export default function FinancialHealthDashboard() {
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<FinancialHealth | null>(null)

  useEffect(() => {
    loadHealth()
  }, [])

  const loadHealth = async () => {
    try {
      setLoading(true)
      // @ts-ignore
      const data = await window.api['health:financial']()
      setHealth(data)
    } catch (error) {
      console.error('Error loading financial health:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!health) {
    return null
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-yellow-500 to-amber-600'
    return 'from-red-500 to-rose-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500'
      case 'fair':
        return 'bg-yellow-500'
      case 'poor':
        return 'bg-red-500'
      default:
        return 'bg-slate-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'good':
        return 'Healthy'
      case 'fair':
        return 'Moderate'
      case 'poor':
        return 'Needs Attention'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Financial Health</h3>
          <Tooltip text="Comprehensive business health assessment based on profit margin, inventory turnover, growth rate, and cash position. Score of 80+ is excellent, 60-79 is good, below 60 needs attention.">
            <HelpCircle size={16} className="text-slate-400 hover:text-slate-600 cursor-help" />
          </Tooltip>
        </div>
        
        <button
          onClick={loadHealth}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Health Score */}
      <div className={`relative mb-8 rounded-2xl bg-gradient-to-br ${getScoreBgColor(health.score)} p-10 text-white overflow-hidden`}>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm mb-2 font-medium">Overall Health Score</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-7xl font-bold tracking-tight">{health.score}</span>
              <span className="text-4xl font-medium mb-3 opacity-80">/100</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {health.score >= 80 ? (
                <span className="text-2xl">🎉</span>
              ) : health.score >= 60 ? (
                <span className="text-2xl">👍</span>
              ) : (
                <span className="text-2xl">⚠️</span>
              )}
              <p className="text-white/90 text-lg font-medium">
                {health.score >= 80 
                  ? 'Excellent! Your business is thriving.'
                  : health.score >= 60
                  ? 'Good! Room for improvement.'
                  : 'Action needed for better health.'}
              </p>
            </div>
          </div>
          
          {/* Circular Progress Indicator */}
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(health.score / 100) * 351.86} 351.86`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/90 text-xs font-bold">
                {health.score >= 80 ? 'A+' : health.score >= 60 ? 'B' : 'C'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-8 -mb-8 blur-xl"></div>
      </div>

      {/* Key Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Profit Margin */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-slate-600 dark:text-slate-400" />
              <h4 className="font-medium text-slate-900 dark:text-white">Profit Margin</h4>
              <Tooltip text="Measures profitability. Higher is better. Good: >20%, Fair: 10-20%, Poor: <10%">
                <HelpCircle size={14} className="text-slate-400 opacity-60 cursor-help" />
              </Tooltip>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              health.indicators.profitMargin.status === 'good'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : health.indicators.profitMargin.status === 'fair'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {getStatusText(health.indicators.profitMargin.status)}
            </div>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {health.indicators.profitMargin.value.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getStatusColor(health.indicators.profitMargin.status)}`}
              style={{ width: `${Math.min(100, health.indicators.profitMargin.value)}%` }}
            ></div>
          </div>
        </div>

        {/* Inventory Turnover */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-slate-600 dark:text-slate-400" />
              <h4 className="font-medium text-slate-900 dark:text-white">Inventory Turnover</h4>
              <Tooltip text="How quickly inventory sells and is replaced. Higher is better. Good: >5x, Fair: 3-5x, Poor: <3x">
                <HelpCircle size={14} className="text-slate-400 opacity-60 cursor-help" />
              </Tooltip>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              health.indicators.inventoryTurnover.status === 'good'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : health.indicators.inventoryTurnover.status === 'fair'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {getStatusText(health.indicators.inventoryTurnover.status)}
            </div>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {health.indicators.inventoryTurnover.value.toFixed(1)}x
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getStatusColor(health.indicators.inventoryTurnover.status)}`}
              style={{ width: `${Math.min(100, (health.indicators.inventoryTurnover.value / 10) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Growth Rate */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-slate-600 dark:text-slate-400" />
              <h4 className="font-medium text-slate-900 dark:text-white">Growth Rate</h4>
              <Tooltip text="Revenue growth compared to previous period. Good: >10%, Fair: 0-10%, Poor: negative">
                <HelpCircle size={14} className="text-slate-400 opacity-60 cursor-help" />
              </Tooltip>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              health.indicators.growthRate.status === 'good'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : health.indicators.growthRate.status === 'fair'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {getStatusText(health.indicators.growthRate.status)}
            </div>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {health.indicators.growthRate.value >= 0 ? '+' : ''}
              {health.indicators.growthRate.value.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getStatusColor(health.indicators.growthRate.status)}`}
              style={{ width: `${Math.min(100, Math.abs(health.indicators.growthRate.value))}%` }}
            ></div>
          </div>
        </div>

        {/* Cash Position */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-slate-600 dark:text-slate-400" />
              <h4 className="font-medium text-slate-900 dark:text-white">Cash Position</h4>
              <Tooltip text="Available cash balance. Good: sufficient reserves, Fair: moderate, Poor: low reserves">
                <HelpCircle size={14} className="text-slate-400 opacity-60 cursor-help" />
              </Tooltip>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              health.indicators.cashPosition.status === 'good'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : health.indicators.cashPosition.status === 'fair'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {getStatusText(health.indicators.cashPosition.status)}
            </div>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              ${health.indicators.cashPosition.value.toFixed(0)}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getStatusColor(health.indicators.cashPosition.status)}`}
              style={{ width: `${Math.min(100, (health.indicators.cashPosition.value / 20000) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {health.alerts.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-slate-900 dark:text-white mb-3">⚠️ Alerts</h4>
          <div className="space-y-2">
            {health.alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
              >
                <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-900 dark:text-amber-200">{alert}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {health.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white mb-3">💡 Recommendations</h4>
          <div className="space-y-2">
            {health.recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <CheckCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-900 dark:text-blue-200">{rec}</p>
              </div>
            ))}
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

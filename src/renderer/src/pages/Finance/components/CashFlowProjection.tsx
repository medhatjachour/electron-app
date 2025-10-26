/**
 * Cash Flow Projection Component
 * 
 * Displays cash flow forecasts with:
 * - Burn rate calculation
 * - Runway estimation
 * - Inflow vs Outflow tracking
 * - Cumulative cash position
 */

import { useState, useEffect } from 'react'
import { DollarSign, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

type CashFlowData = {
  projections: Array<{
    date: string
    expectedInflow: number
    expectedOutflow: number
    netCashFlow: number
    cumulativeCash: number
  }>
  burnRate: number
  runway: number | null
  recommendation: string
}

export default function CashFlowProjection() {
  const [loading, setLoading] = useState(true)
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    loadCashFlow()
  }, [days])

  const loadCashFlow = async () => {
    try {
      setLoading(true)
      // @ts-ignore
      const data = await window.api['forecast:cashflow']({ days })
      setCashFlow(data)
    } catch (error) {
      console.error('Error loading cash flow:', error)
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

  if (!cashFlow) {
    return null
  }

  const isHealthy = cashFlow.burnRate === 0 || cashFlow.runway === null || cashFlow.runway > 90
  const isCritical = cashFlow.runway !== null && cashFlow.runway < 30
  const totalInflow = cashFlow.projections.reduce((sum, p) => sum + p.expectedInflow, 0)
  const totalOutflow = cashFlow.projections.reduce((sum, p) => sum + p.expectedOutflow, 0)
  const netPosition = totalInflow - totalOutflow

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign size={20} className="text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Cash Flow Projection</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {[7, 14, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                days === d
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg p-4">
          <p className="text-sm mb-2">Expected Inflow</p>
          <p className="text-2xl font-bold">${totalInflow.toFixed(0)}</p>
          <p className="text-xs mt-1">${(totalInflow / days).toFixed(0)}/day</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-4">
          <p className="text-sm mb-2">Expected Outflow</p>
          <p className="text-2xl font-bold">${totalOutflow.toFixed(0)}</p>
          <p className="text-xs mt-1">${(totalOutflow / days).toFixed(0)}/day</p>
        </div>

        <div className={`rounded-lg p-4 ${
          netPosition >= 0 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
        }`}>
          <p className="text-sm mb-2">Net Position</p>
          <p className="text-2xl font-bold">
            {netPosition >= 0 ? '+' : ''}${netPosition.toFixed(0)}
          </p>
          <p className="text-xs mt-1">{netPosition >= 0 ? 'Positive' : 'Negative'} flow</p>
        </div>

        <div className={`rounded-lg p-4 ${
          isCritical 
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            : isHealthy
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isCritical ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            <p className="text-sm">Runway</p>
          </div>
          <p className="text-2xl font-bold">
            {cashFlow.runway !== null ? `${cashFlow.runway}` : '∞'}
          </p>
          <p className="text-xs mt-1">{cashFlow.runway !== null ? 'days' : 'Sustainable'}</p>
        </div>
      </div>

      {/* Recommendation Alert */}
      {cashFlow.recommendation && (
        <div className={`rounded-lg p-4 mb-6 ${
          cashFlow.recommendation.includes('⚠️')
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-start gap-3">
            {cashFlow.recommendation.includes('⚠️') ? (
              <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
            ) : (
              <CheckCircle size={20} className="text-green-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                cashFlow.recommendation.includes('⚠️')
                  ? 'text-amber-900 dark:text-amber-200'
                  : 'text-green-900 dark:text-green-200'
              }`}>
                {cashFlow.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Burn Rate Info */}
      {cashFlow.burnRate > 0 && (
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingDown size={20} className="text-red-600" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Burn Rate</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Average daily cash consumption</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">${cashFlow.burnRate.toFixed(0)}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">per day</p>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Chart */}
      <div>
        <h4 className="font-medium text-slate-900 dark:text-white mb-4">Daily Projection</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {cashFlow.projections.slice(0, Math.min(days, 30)).map((projection, index) => {
            const maxValue = Math.max(
              ...cashFlow.projections.map(p => Math.max(p.expectedInflow, p.expectedOutflow))
            )
            const inflowPercentage = (projection.expectedInflow / maxValue) * 100
            const outflowPercentage = (projection.expectedOutflow / maxValue) * 100
            const isPositive = projection.netCashFlow >= 0

            return (
              <div key={index} className="group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 w-24">
                    {new Date(projection.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  
                  <div className="flex-1 space-y-1">
                    {/* Inflow */}
                    <div className="relative h-4">
                      <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      <div 
                        className="absolute left-0 bg-green-500 rounded-full h-4 flex items-center justify-end pr-2"
                        style={{ width: `${inflowPercentage}%` }}
                      >
                        <span className="text-xs font-medium text-white">
                          +${projection.expectedInflow.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Outflow */}
                    <div className="relative h-4">
                      <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      <div 
                        className="absolute left-0 bg-red-500 rounded-full h-4 flex items-center justify-end pr-2"
                        style={{ width: `${outflowPercentage}%` }}
                      >
                        <span className="text-xs font-medium text-white">
                          -${projection.expectedOutflow.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`text-right w-24 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    <p className="text-sm font-bold">
                      {isPositive ? '+' : ''}${projection.netCashFlow.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Cumulative on hover */}
                <div className="hidden group-hover:block text-xs text-slate-500 pl-28">
                  Cumulative: ${projection.cumulativeCash.toFixed(0)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400">Expected Inflow</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400">Expected Outflow</span>
        </div>
      </div>
    </div>
  )
}

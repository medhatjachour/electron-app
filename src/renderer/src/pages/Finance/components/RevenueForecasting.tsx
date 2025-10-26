/**
 * Revenue Forecasting Component
 * 
 * Displays AI-powered revenue predictions with:
 * - 30-day forecast chart
 * - Trend analysis
 * - Confidence intervals
 * - Growth projections
 */

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertCircle, Calendar } from 'lucide-react'

type ForecastData = {
  predictions: Array<{
    date: string
    predictedRevenue: number
    confidence: number
    lowerBound: number
    upperBound: number
  }>
  trend: 'up' | 'down' | 'stable'
  trendStrength: number
  seasonalityDetected: boolean
  growthRate: number
}

export default function RevenueForecasting() {
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    loadForecast()
  }, [days])

  const loadForecast = async () => {
    try {
      setLoading(true)
      // @ts-ignore
      const data = await window.api['forecast:revenue']({ days, historicalDays: 90 })
      setForecast(data)
    } catch (error) {
      console.error('Error loading forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!forecast || forecast.predictions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={20} className="text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Revenue Forecast</h3>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Not enough historical data to generate forecast
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Need at least 7 days of sales data
          </p>
        </div>
      </div>
    )
  }

  const getTrendIcon = () => {
    switch (forecast.trend) {
      case 'up':
        return <TrendingUp size={20} className="text-green-600" />
      case 'down':
        return <TrendingDown size={20} className="text-red-600" />
      default:
        return <Minus size={20} className="text-slate-600" />
    }
  }

  const getTrendColor = () => {
    switch (forecast.trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'down':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20'
    }
  }

  const totalPredictedRevenue = forecast.predictions.reduce((sum, p) => sum + p.predictedRevenue, 0)
  const avgDailyRevenue = totalPredictedRevenue / forecast.predictions.length

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp size={20} className="text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Revenue Forecast</h3>
        </div>
        
        {/* Time Range Selector */}
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
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-slate-600 dark:text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Forecast Period</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{days} days</p>
        </div>

        <div className={`rounded-lg p-4 ${getTrendColor()}`}>
          <div className="flex items-center gap-2 mb-2">
            {getTrendIcon()}
            <p className="text-sm">Trend</p>
          </div>
          <p className="text-2xl font-bold capitalize">{forecast.trend}</p>
          <p className="text-xs mt-1">Strength: {forecast.trendStrength.toFixed(0)}%</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg p-4">
          <p className="text-sm mb-2">Growth Rate</p>
          <p className="text-2xl font-bold">{forecast.growthRate >= 0 ? '+' : ''}{forecast.growthRate.toFixed(1)}%</p>
          <p className="text-xs mt-1">Last 30 days</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg p-4">
          <p className="text-sm mb-2">Predicted Revenue</p>
          <p className="text-2xl font-bold">${totalPredictedRevenue.toFixed(0)}</p>
          <p className="text-xs mt-1">${avgDailyRevenue.toFixed(0)}/day avg</p>
        </div>
      </div>

      {/* Seasonality Alert */}
      {forecast.seasonalityDetected && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">Seasonal Pattern Detected</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Your sales show weekly patterns. Consider planning inventory and staffing accordingly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Chart */}
      <div>
        <h4 className="font-medium text-slate-900 dark:text-white mb-4">Daily Predictions</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {forecast.predictions.slice(0, days > 30 ? 30 : days).map((prediction, index) => {
            const maxRevenue = Math.max(...forecast.predictions.map(p => p.upperBound))
            const percentage = (prediction.predictedRevenue / maxRevenue) * 100
            const confidenceColor = prediction.confidence > 80 ? 'bg-green-500' : prediction.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
            
            return (
              <div key={index} className="group">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24">
                    {new Date(prediction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  
                  <div className="flex-1 relative">
                    {/* Confidence band */}
                    <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 rounded-full h-8"></div>
                    <div 
                      className="absolute left-0 bg-slate-300 dark:bg-slate-600 rounded-full h-8 opacity-30"
                      style={{ width: `${(prediction.upperBound / maxRevenue) * 100}%` }}
                    ></div>
                    
                    {/* Predicted value */}
                    <div 
                      className={`absolute left-0 ${confidenceColor} rounded-full h-8 transition-all flex items-center justify-end pr-3 group-hover:opacity-90`}
                      style={{ width: `${percentage}%` }}
                    >
                      <span className="text-xs font-medium text-white">
                        ${prediction.predictedRevenue.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${confidenceColor}`}></div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 w-12">
                      {prediction.confidence}%
                    </span>
                  </div>
                </div>
                
                {/* Bounds on hover */}
                <div className="hidden group-hover:block text-xs text-slate-500 pl-28 mt-1">
                  Range: ${prediction.lowerBound.toFixed(0)} - ${prediction.upperBound.toFixed(0)}
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
          <span className="text-xs text-slate-600 dark:text-slate-400">High Confidence (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400">Medium (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400">Low (&lt;60%)</span>
        </div>
      </div>
    </div>
  )
}

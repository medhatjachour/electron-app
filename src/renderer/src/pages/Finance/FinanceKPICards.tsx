/**
 * FinanceKPICards Component
 * Displays financial key performance indicators
 */

import { memo } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, Target, Activity } from 'lucide-react'
import type { FinancialMetrics } from './types'

interface FinanceKPICardsProps {
  metrics: FinancialMetrics
}

function FinanceKPICards({ metrics }: FinanceKPICardsProps) {
  const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  
  const kpis = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      change: formatPercent(metrics.revenueGrowth),
      icon: DollarSign,
      isPositive: metrics.revenueGrowth >= 0,
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(metrics.netProfit),
      subtitle: `Margin: ${metrics.profitMargin.toFixed(1)}%`,
      icon: TrendingUp,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Orders',
      value: metrics.numberOfOrders.toLocaleString(),
      change: formatPercent(metrics.orderGrowth),
      icon: ShoppingCart,
      isPositive: metrics.orderGrowth >= 0,
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(metrics.averageOrderValue),
      subtitle: `${metrics.averageItemsPerOrder.toFixed(1)} items/order`,
      icon: Target,
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-600'
    },
    {
      title: 'ROI',
      value: `${metrics.roi.toFixed(1)}%`,
      subtitle: `Turnover: ${metrics.inventoryTurnover.toFixed(2)}x`,
      icon: Activity,
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-600 dark:text-rose-400',
      iconColor: 'text-rose-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
              {kpi.change && (
                <span className={`text-sm font-medium ${kpi.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {kpi.change}
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {kpi.title}
            </h3>
            <p className={`text-2xl font-bold ${kpi.textColor} mb-1`}>
              {kpi.value}
            </p>
            {kpi.subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {kpi.subtitle}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default memo(FinanceKPICards)

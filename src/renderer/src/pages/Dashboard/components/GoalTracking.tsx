/**
 * GoalTracking Component
 * Track monthly revenue, sales, and custom goals
 */

import { useState, useEffect } from 'react'
import { Target, TrendingUp, Edit2, Plus } from 'lucide-react'

type Goal = {
  id: string
  name: string
  target: number
  current: number
  period: 'daily' | 'weekly' | 'monthly'
  type: 'revenue' | 'sales' | 'customers'
}

export default function GoalTracking() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      name: 'Monthly Revenue',
      target: 50000,
      current: 0,
      period: 'monthly',
      type: 'revenue'
    },
    {
      id: '2',
      name: 'Weekly Sales',
      target: 100,
      current: 0,
      period: 'weekly',
      type: 'sales'
    },
    {
      id: '3',
      name: 'New Customers',
      target: 50,
      current: 0,
      period: 'monthly',
      type: 'customers'
    }
  ])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGoalProgress()
  }, [])

  const loadGoalProgress = async () => {
    try {
      setLoading(true)
      
      // Get current month sales
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const endOfMonth = new Date()
      endOfMonth.setHours(23, 59, 59, 999)

      // @ts-ignore
      const financeData = await window.api['search:finance']({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString()
      })

      if (financeData) {
        setGoals(prev => prev.map(goal => {
          if (goal.type === 'revenue') {
            return { ...goal, current: financeData.currentMetrics.revenue || 0 }
          }
          if (goal.type === 'sales') {
            return { ...goal, current: financeData.currentMetrics.transactions || 0 }
          }
          return goal
        }))
      }
    } catch (error) {
      console.error('Error loading goal progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600 dark:text-green-400'
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-400'
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Target size={18} className="text-primary" />
          Goal Tracking
        </h3>
        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <Plus size={16} className="text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const percentage = (goal.current / goal.target) * 100
            const isCompleted = percentage >= 100

            return (
              <div key={goal.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {goal.name}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {goal.period}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {goal.type === 'revenue' && `$${goal.current.toFixed(0)} / $${goal.target.toFixed(0)}`}
                      {goal.type === 'sales' && `${goal.current} / ${goal.target} transactions`}
                      {goal.type === 'customers' && `${goal.current} / ${goal.target} customers`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${getProgressTextColor(percentage)}`}>
                      {percentage.toFixed(0)}%
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                      <Edit2 size={14} className="text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(percentage)} transition-all duration-500 rounded-full ${
                      isCompleted ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {isCompleted && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                    <TrendingUp size={12} />
                    Goal achieved! 🎉
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

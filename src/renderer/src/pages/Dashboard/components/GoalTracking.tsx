/**
 * GoalTracking Component
 * Track monthly revenue, sales, and custom goals
 */

import { useState, useEffect } from 'react'
import { Target, TrendingUp, Edit2, Plus, X, Save } from 'lucide-react'

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
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    target: 0,
    period: 'monthly' as 'daily' | 'weekly' | 'monthly',
    type: 'revenue' as 'revenue' | 'sales' | 'customers'
  })

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

  const handleAddGoal = () => {
    setEditingGoal(null)
    setFormData({
      name: '',
      target: 0,
      period: 'monthly',
      type: 'revenue'
    })
    setShowModal(true)
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      target: goal.target,
      period: goal.period,
      type: goal.type
    })
    setShowModal(true)
  }

  const handleSaveGoal = () => {
    if (!formData.name || formData.target <= 0) {
      alert('Please fill in all fields with valid values')
      return
    }

    if (editingGoal) {
      // Update existing goal
      setGoals(prev => prev.map(g => 
        g.id === editingGoal.id 
          ? { ...g, ...formData, target: Number(formData.target) }
          : g
      ))
    } else {
      // Add new goal
      const newGoal: Goal = {
        id: Date.now().toString(),
        name: formData.name,
        target: Number(formData.target),
        current: 0,
        period: formData.period,
        type: formData.type
      }
      setGoals(prev => [...prev, newGoal])
    }

    setShowModal(false)
    setEditingGoal(null)
    
    // Reload progress after saving
    setTimeout(() => loadGoalProgress(), 500)
  }

  return (
    <>
      {/* Goal Tracking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingGoal ? 'Edit Goal' : 'Add New Goal'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Goal Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Monthly Revenue"
                />
              </div>

              {/* Target Value */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  value={formData.target || ''}
                  onChange={(e) => setFormData({ ...formData, target: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., 50000"
                  min="0"
                />
              </div>

              {/* Period */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="revenue">Revenue</option>
                  <option value="sales">Sales (Transactions)</option>
                  <option value="customers">Customers</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSaveGoal}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingGoal ? 'Update Goal' : 'Add Goal'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Tracking Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Target size={18} className="text-primary" />
            Goal Tracking
          </h3>
          <button 
            onClick={handleAddGoal}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Add new goal"
          >
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
                    <button 
                      onClick={() => handleEditGoal(goal)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      title="Edit goal"
                    >
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
    </>
  )
}

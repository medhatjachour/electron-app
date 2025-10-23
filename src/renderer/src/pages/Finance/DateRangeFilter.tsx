/**
 * DateRangeFilter Component
 * Allows users to select date range for financial data
 */

import { memo } from 'react'
import { Calendar } from 'lucide-react'
import type { DateRangeType } from './types'

interface DateRangeFilterProps {
  dateRange: DateRangeType
  onDateRangeChange: (range: DateRangeType) => void
  customStartDate: string
  customEndDate: string
  onCustomStartChange: (date: string) => void
  onCustomEndChange: (date: string) => void
}

function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  customStartDate,
  customEndDate,
  onCustomStartChange,
  onCustomEndChange
}: DateRangeFilterProps) {
  const ranges: { value: DateRangeType; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Date Range</h3>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => onDateRangeChange(range.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === range.value
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {dateRange === 'custom' && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomStartChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomEndChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(DateRangeFilter)

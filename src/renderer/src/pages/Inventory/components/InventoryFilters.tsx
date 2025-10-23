/**
 * InventoryFilters Component
 * Advanced filtering controls
 */

import { X } from 'lucide-react'
import type { InventoryFilters } from '../types'

interface Props {
  categories: string[]
  filters: InventoryFilters
  onFiltersChange: (filters: InventoryFilters) => void
}

export default function InventoryFilters({ categories, filters, onFiltersChange }: Props) {
  const updateFilter = (key: keyof InventoryFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    updateFilter('categories', newCategories)
  }

  const toggleStockStatus = (status: 'out' | 'low' | 'normal' | 'high') => {
    const newStatuses = filters.stockStatus.includes(status)
      ? filters.stockStatus.filter(s => s !== status)
      : [...filters.stockStatus, status]
    updateFilter('stockStatus', newStatuses)
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      categories: [],
      stockStatus: [],
      priceRange: { min: 0, max: Infinity },
      stockRange: { min: 0, max: Infinity }
    })
  }

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.stockStatus.length > 0 ||
    filters.priceRange.min > 0 ||
    filters.priceRange.max < Infinity ||
    filters.stockRange.min > 0 ||
    filters.stockRange.max < Infinity

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Advanced Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <X size={14} />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Categories ({filters.categories.length} selected)
          </label>
          <div className="space-y-1.5 max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2">
            {categories.map(category => (
              <label key={category} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Stock Status Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Stock Status
          </label>
          <div className="space-y-1.5">
            {[
              { value: 'high' as const, label: 'High Stock', color: 'text-success' },
              { value: 'normal' as const, label: 'Normal', color: 'text-blue-600' },
              { value: 'low' as const, label: 'Low Stock', color: 'text-accent' },
              { value: 'out' as const, label: 'Out of Stock', color: 'text-error' }
            ].map(status => (
              <label key={status.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filters.stockStatus.includes(status.value)}
                  onChange={() => toggleStockStatus(status.value)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-2 focus:ring-primary"
                />
                <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Price Range
          </label>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange.min || ''}
              onChange={(e) => updateFilter('priceRange', { ...filters.priceRange, min: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary transition-all"
              min="0"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange.max === Infinity ? '' : filters.priceRange.max}
              onChange={(e) => updateFilter('priceRange', { ...filters.priceRange, max: Number(e.target.value) || Infinity })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary transition-all"
              min="0"
            />
          </div>
        </div>

        {/* Stock Range Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Stock Quantity
          </label>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.stockRange.min || ''}
              onChange={(e) => updateFilter('stockRange', { ...filters.stockRange, min: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary transition-all"
              min="0"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.stockRange.max === Infinity ? '' : filters.stockRange.max}
              onChange={(e) => updateFilter('stockRange', { ...filters.stockRange, max: Number(e.target.value) || Infinity })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary transition-all"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

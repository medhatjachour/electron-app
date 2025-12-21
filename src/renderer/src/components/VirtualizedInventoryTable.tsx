/**
 * VirtualizedInventoryTable Component
 * High-performance table using react-window for virtual scrolling
 * Handles 1000+ inventory items without DOM performance issues
 */

import { FixedSizeList } from 'react-window'
import { Package2, Image as ImageIcon, ArrowUpDown } from 'lucide-react'
import type { InventoryItem } from '../../../shared/types'
import type { InventorySortOptions, SortField } from '../pages/Inventory/types'

interface Props {
  items: InventoryItem[]
  loading: boolean
  sortOptions: InventorySortOptions
  onSortChange: (field: SortField) => void
  onItemClick: (item: InventoryItem) => void
}

const ROW_HEIGHT = 80
const CONTAINER_HEIGHT = 600

export default function VirtualizedInventoryTable({
  items,
  loading,
  sortOptions,
  onSortChange,
  onItemClick
}: Props) {
  const handleSort = (field: SortField) => {
    onSortChange(field)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortOptions.field !== field) return <ArrowUpDown size={14} className="opacity-30" />
    return (
      <ArrowUpDown
        size={14}
        className={sortOptions.direction === 'desc' ? 'rotate-180' : ''}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Package2 className="mx-auto mb-4 animate-pulse text-primary" size={48} />
          <p className="text-slate-600 dark:text-slate-400">Loading inventory...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Package2 className="mx-auto mb-4 text-slate-400" size={48} />
          <p className="text-slate-600 dark:text-slate-400">No items found</p>
        </div>
      </div>
    )
  }

  const Row = ({ index, style }: any) => {
    const item = items[index]

    const stockStatusColor =
      item.stockStatus === 'out'
        ? 'text-red-600 dark:text-red-400'
        : item.stockStatus === 'low'
          ? 'text-orange-600 dark:text-orange-400'
          : 'text-green-600 dark:text-green-400'

    return (
      <div
        style={style}
        onClick={() => onItemClick(item)}
        className="flex items-center gap-4 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700"
      >
        {/* Image */}
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
          {item.images?.[0] ? (
            <img
              src={item.images[0].imageData}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageIcon className="text-slate-400" size={20} />
          )}
        </div>

        {/* SKU */}
        <div className="w-32 flex-shrink-0">
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {item.baseSKU}
          </span>
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {item.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
        </div>

        {/* Variants */}
        <div className="w-20 flex-shrink-0 text-center">
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {item.variantCount || 0}
          </span>
        </div>

        {/* Stock */}
        <div className="w-24 flex-shrink-0 text-right">
          <span className={`text-sm font-semibold ${stockStatusColor}`}>
            {item.totalStock}
          </span>
        </div>

        {/* Value */}
        <div className="w-28 flex-shrink-0 text-right">
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            ${item.stockValue?.toFixed(2) || '0.00'}
          </span>
        </div>

        {/* Updated */}
        <div className="w-32 flex-shrink-0 text-right">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(item.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Table Header */}
      <div className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="w-12 flex-shrink-0">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Image
            </span>
          </div>

          <div className="w-32 flex-shrink-0">
            <button
              onClick={() => handleSort('baseSKU')}
              className="flex items-center justify-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors w-full"
            >
              SKU
              <SortIcon field="baseSKU" />
            </button>
          </div>

          <div className="flex-1">
            <button
              onClick={() => handleSort('name')}
              className="flex items-center justify-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              Product
              <SortIcon field="name" />
            </button>
          </div>

          <div className="w-20 flex-shrink-0 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mx-auto">
              Variants
            </div>
          </div>

          <div className="w-24 flex-shrink-0 text-right">
            <button
              onClick={() => handleSort('totalStock')}
              className="flex items-center justify-end gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors ml-auto"
            >
              Stock
              <SortIcon field="totalStock" />
            </button>
          </div>

          <div className="w-28 flex-shrink-0 text-right">
            <button
              onClick={() => handleSort('stockValue')}
              className="flex items-center justify-end gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors ml-auto"
            >
              Value
              <SortIcon field="stockValue" />
            </button>
          </div>

          <div className="w-32 flex-shrink-0 text-right">
            <button
              onClick={() => handleSort('updatedAt')}
              className="flex items-center justify-end gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors ml-auto"
            >
              Last Updated
              <SortIcon field="updatedAt" />
            </button>
          </div>
        </div>
      </div>

      {/* Virtualized List */}
      <FixedSizeList
        height={CONTAINER_HEIGHT}
        itemCount={items.length}
        itemSize={ROW_HEIGHT}
        width="100%"
        className="scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
      >
        {Row}
      </FixedSizeList>
    </div>
  )
}

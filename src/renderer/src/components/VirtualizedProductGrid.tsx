/**
 * VirtualizedProductGrid Component
 * High-performance product grid using react-window for virtual scrolling
 * Handles 1000+ products without DOM performance issues
 */

import { FixedSizeGrid } from 'react-window'
import { Package, Eye, Edit, Trash2 } from 'lucide-react'

// Use any to avoid type conflicts - component is agnostic to product structure
interface Product {
  id: string
  name: string
  baseSKU: string
  category: string
  basePrice: number
  hasVariants?: boolean
  images?: Array<{ imageData: string }>
  variants?: Array<{ stock: number }>
  totalStock?: number
}

interface Props {
  products: Product[]
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  showImages?: boolean
}

const COLUMN_COUNT = 3
const COLUMN_WIDTH = 380
const ROW_HEIGHT = 420
const CONTAINER_WIDTH = 1180

export default function VirtualizedProductGrid({
  products,
  onView,
  onEdit,
  onDelete,
  showImages = false
}: Props) {
  const rowCount = Math.ceil(products.length / COLUMN_COUNT)

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * COLUMN_COUNT + columnIndex
    const product = products[index]

    if (!product) return null

    const firstImage = product.images?.[0]?.imageData
    const totalStock = product.hasVariants
      ? product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0
      : 0

    const stockStatus =
      totalStock === 0 ? 'out' : totalStock <= 10 ? 'low' : totalStock <= 50 ? 'normal' : 'high'

    const statusColors = {
      out: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      low: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }

    return (
      <div style={{ ...style, padding: '12px' }}>
        <div className="glass-card overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
          {/* Product Image */}
          <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
            {showImages && firstImage ? (
              <img
                src={firstImage}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={64} className="text-slate-400 dark:text-slate-600" />
              </div>
            )}

            {/* Stock Badge */}
            <div className="absolute top-3 right-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[stockStatus]}`}
              >
                {totalStock} in stock
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 truncate">
              {product.name}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              SKU: {product.baseSKU}
            </p>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {product.category}
              </span>
              {product.hasVariants && (
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                  {product.variants?.length || 0} variants
                </span>
              )}
            </div>

            <div className="text-2xl font-bold text-primary mb-4 mt-auto">
              ${product.basePrice.toFixed(2)}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onView(product)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                <Eye size={16} />
                <span className="text-sm font-medium">View</span>
              </button>

              <button
                onClick={() => onEdit(product)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                <Edit size={16} />
                <span className="text-sm font-medium">Edit</span>
              </button>

              <button
                onClick={() => onDelete(product)}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Package className="mx-auto mb-4 text-slate-400" size={64} />
        <p className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No products found
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Try adjusting your filters or add new products
        </p>
      </div>
    )
  }

  return (
    <FixedSizeGrid
      columnCount={COLUMN_COUNT}
      columnWidth={COLUMN_WIDTH}
      height={800}
      rowCount={rowCount}
      rowHeight={ROW_HEIGHT}
      width={CONTAINER_WIDTH}
      className="scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
    >
      {Cell}
    </FixedSizeGrid>
  )
}

/**
 * ProductActions Component
 * Toolbar with action buttons for product management
 */

import { memo } from 'react'
import { Plus, Upload, Download, Barcode, RefreshCcw } from 'lucide-react'

interface ProductActionsProps {
  onAdd: () => void
  onImport: () => void
  onExport: () => void
  onScan: () => void
  onRefresh: () => void
  productsCount: number
}

function ProductActions({
  onAdd,
  onImport,
  onExport,
  onScan,
  onRefresh,
  productsCount
}: Readonly<ProductActionsProps>) {
  return (
    <div className="w-full flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Product Catalog
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your inventory • {productsCount} products
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          title="Refresh products"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onScan}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          title="Scan barcode"
        >
          <Barcode className="w-4 h-4" />
          <span className="hidden md:inline">Scan</span>
        </button>

        <button
          onClick={onImport}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          title="Import products"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden md:inline">Import</span>
        </button>

        <button
          onClick={onExport}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          title="Export products"
        >
          <Download className="w-4 h-4" />
          <span className="hidden md:inline">Export</span>
        </button>

        <button
          onClick={onAdd}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>
    </div>
  )
}

export default memo(ProductActions)

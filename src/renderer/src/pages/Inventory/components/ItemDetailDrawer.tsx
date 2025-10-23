/**
 * ItemDetailDrawer Component
 * Slide-out drawer showing detailed product information
 */

import { useState, useEffect } from 'react'
import { X, Edit, Trash2, Copy, Package, DollarSign, Calendar, History, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { InventoryItem, StockMovement } from 'src/shared/types'

interface Props {
  item: InventoryItem
  onClose: () => void
  onRefresh: () => void
}

export default function ItemDetailDrawer({ item, onClose, onRefresh }: Props) {
  const { canEdit, canDelete } = useAuth()
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    loadStockHistory()
  }, [item.id])

  const loadStockHistory = async () => {
    try {
      setLoadingHistory(true)
      // @ts-ignore
      const history = await (globalThis as any).api?.inventory?.getStockHistory(item.id)
      setStockHistory(history || [])
    } catch (error) {
      console.error('Error loading stock history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleEdit = () => {
    // TODO: Navigate to edit page
    console.log('Edit item:', item.id)
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return
    
    try {
      // @ts-ignore
      await (globalThis as any).api?.products?.delete(item.id)
      onRefresh()
      onClose()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const handleDuplicate = () => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate item:', item.id)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end animate-in fade-in duration-200">
      {/* Drawer */}
      <div className="w-full max-w-2xl h-full bg-white dark:bg-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-secondary p-6 text-white z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{item.name}</h2>
              <p className="text-white/80 text-sm">SKU: {item.baseSKU}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {canEdit && (
              <>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={handleDuplicate}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
              </>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors flex items-center gap-2 text-sm ml-auto"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
            {!canEdit && !canDelete && (
              <div className="px-4 py-2 bg-white/10 rounded-lg text-sm text-white/60 italic">
                View Only • No Edit Permissions
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Images */}
          {item.images.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Images</h3>
              <div className="grid grid-cols-4 gap-3">
                {item.images.map((image) => (
                  <div key={image.id} className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <img src={image.imageData} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.images.length === 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center">
              <ImageIcon className="mx-auto mb-2 text-slate-400" size={32} />
              <p className="text-sm text-slate-500 dark:text-slate-400">No images available</p>
            </div>
          )}

          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Category</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.category}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Base Price</p>
                <p className="text-sm font-bold text-primary">${item.basePrice.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Base Cost</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">${item.baseCost.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Stock</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.totalStock} units</p>
              </div>
            </div>

            {item.description && (
              <div className="mt-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{item.description}</p>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Financial Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-blue-600" />
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Stock Value</p>
                </div>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">${item.stockValue.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-success" />
                  <p className="text-xs text-success font-medium">Retail Value</p>
                </div>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">${item.retailValue.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-purple-600" />
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Potential Profit</p>
                </div>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  ${(item.retailValue - item.stockValue).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Variants ({item.variantCount})
            </h3>
            {item.hasVariants && item.variants.length > 0 ? (
              <div className="space-y-2">
                {item.variants.map((variant) => (
                  <div key={variant.id} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {[variant.color, variant.size].filter(Boolean).join(' • ')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">SKU: {variant.sku}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        variant.stock === 0 
                          ? 'bg-error/20 text-error' 
                          : variant.stock < 10
                          ? 'bg-accent/20 text-accent'
                          : 'bg-success/20 text-success'
                      }`}>
                        {variant.stock} in stock
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-lg font-bold text-primary">${variant.price.toFixed(2)}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Value: ${(variant.price * variant.stock).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 text-center">
                <Package className="mx-auto mb-2 text-slate-400" size={24} />
                <p className="text-sm text-slate-500 dark:text-slate-400">No variants configured</p>
              </div>
            )}
          </div>

          {/* Stock Movement History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History size={18} className="text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Stock Movement History</h3>
            </div>
            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : stockHistory.length > 0 ? (
              <div className="space-y-2">
                {stockHistory.map((movement) => (
                  <div key={movement.id} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                          {movement.type}
                        </p>
                        {movement.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{movement.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar size={12} className="text-slate-400" />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(movement.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        movement.quantity < 0 ? 'bg-red-100 dark:bg-red-900/20 text-error' : 'bg-green-100 dark:bg-green-900/20 text-success'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 text-center">
                <History className="mx-auto mb-2 text-slate-400" size={24} />
                <p className="text-sm text-slate-500 dark:text-slate-400">No movement history available</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Created</p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Last Updated</p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

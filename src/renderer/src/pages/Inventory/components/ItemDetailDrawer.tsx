/**
 * ItemDetailDrawer Component
 * Slide-out drawer showing detailed product information
 * Enhanced with optimistic updates for delete operations
 */

import { useState, useEffect, SyntheticEvent } from 'react'
import { X, Edit, Trash2, Copy, Package, DollarSign, Calendar, History, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { InventoryItem, StockMovement } from '@/shared/types'
import logger from '../../../../../shared/utils/logger'

interface Props {
  item: InventoryItem
  onClose: () => void
  onRefresh: () => void
  onDelete?: (id: string) => Promise<void>
  isDeleting?: boolean
}

export default function ItemDetailDrawer({ item, onClose, onRefresh, onDelete, isDeleting = false }: Props) {
  const { canEdit, canDelete } = useAuth()
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadStockHistory()
    // Reset image state when item changes
    setImageErrors(new Set())
    setImageLoading(new Set(item.images?.map(img => img.id?.toString() || '') || []))
  }, [item.id])

  const loadStockHistory = async () => {
    try {
      setLoadingHistory(true)
      // @ts-ignore
      const history = await (globalThis as any).api?.inventory?.getStockHistory(item.id)
      setStockHistory(history || [])
    } catch (error) {
      logger.error('Error loading stock history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleImageLoad = (imageId: string) => {
    setImageLoading(prev => {
      const next = new Set(prev)
      next.delete(imageId)
      return next
    })
  }

  const handleImageError = (imageId: string, e: SyntheticEvent<HTMLImageElement>) => {
    logger.warn(`Failed to load image: ${imageId}`)
    setImageErrors(prev => new Set(prev).add(imageId))
    setImageLoading(prev => {
      const next = new Set(prev)
      next.delete(imageId)
      return next
    })
  }

  const handleEdit = () => {
    // Navigate to products page with edit mode
    window.location.hash = `/products?edit=${item.id}`
    onClose()
  }

  const handleDelete = async () => {
    const confirmMessage = `⚠️ Delete Product: ${item.name}?\n\nThis will permanently delete:\n- Product information\n- All ${item.variantCount} variants\n- ${item.images.length} images\n\nThis action CANNOT be undone!`
    
    if (!confirm(confirmMessage)) return
    
    // Use the optimistic delete callback if provided
    if (onDelete) {
      await onDelete(item.id)
      onClose() // Close drawer immediately after delete
      return
    }
    
    // Fallback to direct API call (legacy)
    try {
      // @ts-ignore
      const result = await (globalThis as any).api?.products?.delete(item.id)
      
      if (result?.success) {
        logger.success(`Successfully deleted "${item.name}"`)
        alert(`✅ Successfully deleted "${item.name}"`)
        onRefresh()
        onClose()
      } else {
        logger.error('Failed to delete product:', result?.message)
        alert(`❌ Failed to delete product:\n${result?.message || 'Unknown error'}`)
      }
    } catch (error) {
      logger.error('Error deleting item:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`❌ Error deleting product:\n${errorMessage}`)
    }
  }

  const handleDuplicate = () => {
    // Navigate to products page with duplicate mode
    window.location.hash = `/products?duplicate=${item.id}`
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      onClick={(e) => {
        // Close drawer when clicking backdrop
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        // Close drawer on Escape key
        if (e.key === 'Escape') onClose()
      }}
    >
      {/* Drawer */}
      <div 
        className="w-full max-w-2xl h-full bg-white dark:bg-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-secondary p-6 text-white z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 id="drawer-title" className="text-2xl font-bold mb-1">{item.name}</h2>
              <p className="text-white/80 text-sm">SKU: {item.baseSKU}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close item details"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2" role="toolbar" aria-label="Item actions">
            {canEdit && (
              <>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  aria-label={`Edit ${item.name}`}
                >
                  <Edit size={16} aria-hidden="true" />
                  Edit
                </button>
                <button
                  onClick={handleDuplicate}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  aria-label={`Duplicate ${item.name}`}
                >
                  <Copy size={16} aria-hidden="true" />
                  Duplicate
                </button>
              </>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors flex items-center gap-2 text-sm ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isDeleting ? `Deleting ${item.name}` : `Delete ${item.name}`}
                aria-busy={isDeleting}
              >
                <Trash2 size={16} className={isDeleting ? 'animate-pulse' : ''} aria-hidden="true" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            {!canEdit && !canDelete && (
              <output className="px-4 py-2 bg-white/10 rounded-lg text-sm text-white/60 italic">
                View Only • No Edit Permissions
              </output>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Images */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <ImageIcon size={16} />
              Product Images {item.images?.length > 0 && `(${item.images.length})`}
            </h3>
            {item.images && item.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {item.images.map((image, index) => {
                  const imageId = image.id?.toString() || `img-${index}`
                  const hasError = imageErrors.has(imageId)
                  const isLoading = imageLoading.has(imageId)

                  return (
                    <div 
                      key={imageId} 
                      className="relative aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden group"
                    >
                      {hasError ? (
                        // Error state - show fallback
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 dark:bg-slate-800">
                          <AlertCircle className="text-slate-400 mb-2" size={32} />
                          <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">
                            Failed to load
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Loading skeleton */}
                          {isLoading && (
                            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
                          )}
                          
                          {/* Actual image */}
                          <img 
                            src={image.imageData} 
                            alt={`${item.name} ${index + 1}`} 
                            className={`w-full h-full object-cover transition-all duration-300 ${
                              isLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-110'
                            }`}
                            loading="lazy"
                            onLoad={() => handleImageLoad(imageId)}
                            onError={() => handleImageError(imageId, {} as SyntheticEvent<HTMLImageElement>)}
                          />
                          
                          {/* Hover overlay */}
                          {!isLoading && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">
                                Image {index + 1}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                <ImageIcon className="mx-auto mb-2 text-slate-400" size={32} />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No images available</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add images in the product edit page</p>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Category</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.category || 'Uncategorized'}</p>
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

          {/* Metadata - Enhanced Date Display */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Timeline</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Created Date
                </p>
                <p className="text-sm text-slate-900 dark:text-white font-semibold">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : ''}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Last Updated
                </p>
                <p className="text-sm text-slate-900 dark:text-white font-semibold">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : ''}
                </p>
              </div>
            </div>
            
            {/* Additional Metadata */}
            <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Product ID</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-mono break-all">{item.id}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.id)
                    alert('✅ Product ID copied to clipboard')
                  }}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                  title="Copy ID"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

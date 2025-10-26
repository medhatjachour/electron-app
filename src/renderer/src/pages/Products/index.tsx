/**
 * Products Page - Backend Search Integration
 * Clean, modular architecture with backend filtering
 * Features fast search, pagination, and filtering via backend
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { ipc } from '../../utils/ipc'
import { useBackendSearch, useFilterMetadata } from '../../hooks/useBackendSearch'
import { useToast } from '../../contexts/ToastContext'
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext'
import { useDebounce } from '../../hooks/useDebounce'
import Modal from '../../components/ui/Modal'
import ProductFormWrapper from './ProductFormWrapper'
import ProductActions from './ProductActions'
import ProductFilters from './ProductFilters'
import ProductGrid from './ProductGrid'
import type { Product, ProductFilters as Filters } from './types'

export default function Products() {
  const toast = useToast()
  const { settings } = useDisplaySettings()

  // Load filter metadata
  const { metadata: filterMetadata } = useFilterMetadata()

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    category: '',
    color: '',
    size: '',
    store: '',
    stockStatus: ''
  })

  // Pagination
  const itemsPerPage = 12

  // Debounce search query (300ms delay)
  const debouncedSearch = useDebounce(filters.searchQuery, 300)

  // Memoize filters object to prevent unnecessary re-renders
  const searchFilters = useMemo(() => ({
    query: debouncedSearch,
    categoryIds: filters.category ? [filters.category] : undefined,
    colors: filters.color ? [filters.color] : undefined,
    sizes: filters.size ? [filters.size] : undefined,
    storeId: filters.store || undefined,
    stockStatus: filters.stockStatus ? 
      filters.stockStatus === 'in-stock' ? ['low', 'normal', 'high'] as any :
      filters.stockStatus === 'low-stock' ? ['low'] as any :
      filters.stockStatus === 'out-of-stock' ? ['out'] as any :
      undefined : undefined
  }), [debouncedSearch, filters.category, filters.color, filters.size, filters.store, filters.stockStatus])

  // Memoize sort options
  const searchSort = useMemo(() => ({
    field: 'createdAt' as const,
    direction: 'desc' as const  // Newest first
  }), [])

  // Backend search with filters
  const {
    data: products,
    loading,
    totalCount,
    pagination,
    refetch
  } = useBackendSearch<Product>({
    endpoint: 'search:products',
    filters: searchFilters,
    sort: searchSort,
    options: {
      debounceMs: 300,
      limit: itemsPerPage,
      includeImages: settings.showImagesInProductCards
    }
  })

  // Calculate totalStock for each product from variants
  const productsWithStock = useMemo(() => {
    return products.map(product => {
      // If totalStock is already calculated by backend, use it
      if (typeof product.totalStock === 'number') {
        return product
      }
      
      // Calculate total stock from all variants
      let totalStock = 0
      if (product.variants && product.variants.length > 0) {
        totalStock = product.variants.reduce((sum, variant) => {
          return sum + (typeof variant.stock === 'number' ? variant.stock : 0)
        }, 0)
      }
      
      return {
        ...product,
        totalStock
      }
    })
  }, [products])

  // Extract filter options from metadata
  const filterOptions = useMemo(() => {
    if (!filterMetadata) {
      return {
        categories: [],
        colors: [],
        sizes: [],
        stores: []
      }
    }
    
    return {
      categories: (filterMetadata.categories || []).map((cat: any) => cat.name),
      colors: filterMetadata.colors || [],
      sizes: filterMetadata.sizes || [],
      stores: [] // Will be loaded separately
    }
  }, [filterMetadata])

  // Store list for filters
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([])

  // Load stores once on mount
  useEffect(() => {
    const loadStores = async () => {
      try {
        const data = await ipc.stores.getAll()
        setStores(data.filter((s: any) => s.status === 'active').map((s: any) => ({
          id: s.id,
          name: s.name
        })))
      } catch (error) {
        console.error('Failed to load stores:', error)
      }
    }
    loadStores()
  }, [])

  const handleFiltersChange = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    pagination.setPage(1) // Reset to first page when filters change
  }, [pagination])

  const handleClearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      category: '',
      color: '',
      size: '',
      store: '',
      stockStatus: ''
    })
    pagination.setPage(1)
  }, [pagination])

  const handleView = useCallback(async (product: Product) => {
    // Fetch full product details with images
    try {
      const fullProduct = await ipc.products.getById(product.id)
      
      // Calculate total stock from variants
      const totalStock = fullProduct.variants && fullProduct.variants.length > 0
        ? fullProduct.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
        : 0
      
      setSelectedProduct({ ...fullProduct, totalStock })
      setShowViewModal(true)
    } catch (error) {
      console.error('Failed to load product details:', error)
      toast.error('Failed to load product details')
    }
  }, [toast])

  const handleEdit = useCallback(async (product: Product) => {
    // Fetch full product details with images
    try {
      const fullProduct = await ipc.products.getById(product.id)
      setSelectedProduct(fullProduct)
      setShowEditModal(true)
    } catch (error) {
      console.error('Failed to load product details:', error)
      toast.error('Failed to load product details')
    }
  }, [toast])

  const handleDelete = useCallback(async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return

    try {
      await ipc.products.delete(product.id)
      toast.success('Product deleted successfully')
      refetch() // Refetch to reload fresh data
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast.error('Failed to delete product')
    }
  }, [toast, refetch])

  const handleImport = useCallback(() => {
    toast.info('Import feature coming soon')
  }, [toast])

  const handleExport = useCallback(() => {
    // Export to CSV
    const csv = [
      ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock'].join(','),
      ...productsWithStock.map(p => [
        p.name,
        p.baseSKU,
        p.category,
        p.basePrice,
        p.baseCost,
        p.totalStock || 0
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Products exported successfully')
  }, [productsWithStock, toast])

  const handleScan = useCallback(() => {
    toast.info('Barcode scanner feature coming soon')
  }, [toast])

  const handleFormSuccess = useCallback(() => {
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedProduct(null)
    refetch() // Refetch to reload fresh data
  }, [refetch])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 mx-auto">
      {/* Actions Toolbar */}
      <ProductActions
        onAdd={() => setShowAddModal(true)}
        onImport={handleImport}
        onExport={handleExport}
        onScan={handleScan}
        onRefresh={refetch}
        productsCount={totalCount}
      />

      {/* Filters */}
      <ProductFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        categories={filterOptions.categories}
        colors={filterOptions.colors}
        sizes={filterOptions.sizes}
        stores={stores}
        showAdvanced={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      {/* Products Grid */}
      <ProductGrid
        products={productsWithStock}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing {((pagination.currentPage - 1) * itemsPerPage) + 1} to {Math.min(pagination.currentPage * itemsPerPage, totalCount)} of {totalCount} products
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={pagination.prevPage}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => pagination.setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          pagination.currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={pagination.nextPage}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

      {/* Add Product Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Product">
        <ProductFormWrapper
          onSuccess={handleFormSuccess}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Product">
        <ProductFormWrapper
          product={selectedProduct}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* View Product Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Product Details">
        {selectedProduct && (
          <div className="space-y-4">
            {/* Product Images Gallery */}
            {selectedProduct.images && selectedProduct.images.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Images ({selectedProduct.images.length})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProduct.images.map((image: any, idx: number) => (
                    <img
                      key={idx}
                      src={image.imageData}
                      alt={`${selectedProduct.name} ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Name</div>
                <p className="text-lg font-semibold">{selectedProduct.name}</p>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SKU</div>
                <p className="text-lg font-semibold">{selectedProduct.baseSKU}</p>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Category</div>
                <p className="text-lg font-semibold">{selectedProduct.category || 'Uncategorized'}</p>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Price</div>
                <p className="text-lg font-semibold">${selectedProduct.basePrice.toFixed(2)}</p>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Cost</div>
                <p className="text-lg font-semibold">${selectedProduct.baseCost.toFixed(2)}</p>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total Stock</div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{selectedProduct.totalStock || 0}</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    (selectedProduct.totalStock || 0) === 0 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : (selectedProduct.totalStock || 0) <= 10
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {(selectedProduct.totalStock || 0) === 0 
                      ? 'Out of Stock' 
                      : (selectedProduct.totalStock || 0) <= 10 
                      ? 'Low Stock' 
                      : 'In Stock'}
                  </span>
                </div>
              </div>
            </div>
            {selectedProduct.description && (
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Description</div>
                <p className="text-slate-900 dark:text-white">{selectedProduct.description}</p>
              </div>
            )}
            {selectedProduct.hasVariants && selectedProduct.variants && selectedProduct.variants.length > 0 && (
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Variants</div>
                <div className="space-y-2">
                  {selectedProduct.variants.map((variant, idx) => (
                    <div key={variant.id || idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <span className="font-medium">{variant.color} {variant.size}</span>
                        <span className="text-sm text-slate-500 ml-2">SKU: {variant.sku}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${variant.price.toFixed(2)}</div>
                        <div className="text-sm text-slate-500">Stock: {variant.stock}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

/**
 * Products Page - Refactored
 * Clean, modular architecture with separated concerns
 */

import { useState, useEffect } from 'react'
import { ipc } from '../../utils/ipc'
import { useToast } from '../../contexts/ToastContext'
import Modal from '../../components/ui/Modal'
import ProductFormWrapper from './ProductFormWrapper'
import ProductActions from './ProductActions'
import ProductFilters from './ProductFilters'
import ProductGrid from './ProductGrid'
import { useProductFilters } from './useProductFilters'
import type { Product, ProductFilters as Filters } from './types'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Apply filters using custom hook
  const { filteredProducts, filterOptions } = useProductFilters(products, filters)

  // Sort products from latest to oldest
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime()
    const dateB = new Date(b.createdAt || 0).getTime()
    return dateB - dateA
  })

  // Paginate products
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

  // Store list for filters
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    loadProducts()
    loadStores()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await ipc.products.getAll()
      
      // Calculate total stock for each product
      const productsWithStock = data.map((product: any) => ({
        ...product,
        totalStock: product.hasVariants 
          ? product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0
          : 0
      }))
      
      setProducts(productsWithStock)
      toast.success(`Loaded ${productsWithStock.length} products`)
    } catch (error) {
      console.error('Failed to load products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

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

  const handleFiltersChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      color: '',
      size: '',
      store: '',
      stockStatus: ''
    })
    setCurrentPage(1)
  }

  const handleView = (product: Product) => {
    setSelectedProduct(product)
    setShowViewModal(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return

    try {
      await ipc.products.delete(product.id)
      toast.success('Product deleted successfully')
      loadProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast.error('Failed to delete product')
    }
  }

  const handleImport = () => {
    toast.info('Import feature coming soon')
  }

  const handleExport = () => {
    // Export to CSV
    const csv = [
      ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock'].join(','),
      ...filteredProducts.map(p => [
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
  }

  const handleScan = () => {
    toast.info('Barcode scanner feature coming soon')
  }

  const handleFormSuccess = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedProduct(null)
    loadProducts()
  }

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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Actions Toolbar */}
      <ProductActions
        onAdd={() => setShowAddModal(true)}
        onImport={handleImport}
        onExport={handleExport}
        onScan={handleScan}
        onRefresh={loadProducts}
        productsCount={products.length}
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
        products={paginatedProducts}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} products
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      currentPage === pageNum
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
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
            {selectedProduct.images && selectedProduct.images.length > 0 && (
              <img
                src={selectedProduct.images[0].imageData}
                alt={selectedProduct.name}
                className="w-full h-64 object-cover rounded-lg"
              />
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
                <p className="text-lg font-semibold">{selectedProduct.category}</p>
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
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Stock</div>
                <p className="text-lg font-semibold">{selectedProduct.totalStock || 0}</p>
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

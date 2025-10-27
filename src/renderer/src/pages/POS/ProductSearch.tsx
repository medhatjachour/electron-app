/**
 * Product search and display component for POS
 * Now uses backend filtering for better performance and accuracy
 */

import { useState, useMemo } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { useBackendSearch, useFilterMetadata } from '../../hooks/useBackendSearch'
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext'
import { useDebounce } from '../../hooks/useDebounce'
import type { Product, ProductVariant } from './types'

type Props = {
  onAddToCart: (product: Product, variant?: ProductVariant) => void
  cartOpen?: boolean
}

type SortOption = 'name' | 'price-low' | 'price-high' | 'stock-low' | 'stock-high'

export default function ProductSearch({ onAddToCart, cartOpen = false }: Readonly<Props>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const { settings } = useDisplaySettings()
  
  // Filter states
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock'>('in-stock')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 })
  const [sortBy, setSortBy] = useState<SortOption>('name')
  
  const ITEMS_PER_PAGE = 50

  // Load filter metadata (categories, colors, sizes, price range)
  const { metadata: filterMetadata } = useFilterMetadata()

  // Debounce search query for better performance (300ms delay like Products/Inventory)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Memoize filters object to prevent unnecessary re-renders
  const searchFilters = useMemo(() => ({
    query: debouncedSearchQuery,
    categoryIds: selectedCategoryIds,
    stockStatus: stockFilter === 'all' ? undefined : 
                 stockFilter === 'in-stock' ? ['low', 'normal', 'high'] as any : 
                 ['low'] as any,
    priceRange: priceRange.min > 0 || priceRange.max < 10000 ? priceRange : undefined,
    colors: selectedColors.length > 0 ? selectedColors : undefined,
    sizes: selectedSizes.length > 0 ? selectedSizes : undefined
  }), [debouncedSearchQuery, selectedCategoryIds, stockFilter, priceRange, selectedColors, selectedSizes])

  // Memoize sort options
  const sortOptions = useMemo(() => ({
    field: sortBy === 'name' ? 'name' as const :
           sortBy === 'price-low' || sortBy === 'price-high' ? 'basePrice' as const :
           'createdAt' as const,
    direction: (sortBy === 'price-high' || sortBy === 'stock-high' ? 'desc' : 'asc') as 'asc' | 'desc'
  }), [sortBy])

  // Backend search with filters - Optimized for POS speed
  const {
    data: products,
    loading,
    totalCount,
    pagination
  } = useBackendSearch<Product>({
    endpoint: 'search:products',
    filters: searchFilters,
    sort: sortOptions,
    options: {
      debounceMs: 0,  // Already debounced above with useDebounce hook
      limit: ITEMS_PER_PAGE,
      includeImages: settings.showImagesInPOSCards
    }
  })

  // Extract filter options from metadata
  const filterOptions = useMemo(() => {
    if (!filterMetadata) {
      return {
        categories: [],
        colors: [],
        sizes: [],
        maxPrice: 10000
      }
    }
    
    return {
      categories: (filterMetadata.categories || []).map((cat: any) => cat.name),
      colors: filterMetadata.colors || [],
      sizes: filterMetadata.sizes || [],
      maxPrice: filterMetadata.priceRange?.max || 10000
    }
  }, [filterMetadata])

  // Products are already filtered by backend
  const filteredProducts = products

  // Products are already paginated by backend
  const paginatedProducts = filteredProducts

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredProducts.length > 0) {
      onAddToCart(filteredProducts[0])
      setSearchQuery('')
    }
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategoryIds([])
    setSelectedColors([])
    setSelectedSizes([])
    setStockFilter('in-stock')
    setPriceRange({ min: 0, max: filterOptions.maxPrice })
    setSortBy('name')
  }

  const hasActiveFilters = selectedCategoryIds.length > 0 || selectedColors.length > 0 || 
                          selectedSizes.length > 0 || stockFilter !== 'in-stock' || 
                          priceRange.min > 0 || priceRange.max < filterOptions.maxPrice

  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    onAddToCart(product, variant)
    setShowVariantModal(false)
    setSelectedProduct(null)
  }

  const openVariantModal = (product: Product) => {
    setSelectedProduct(product)
    setShowVariantModal(true)
  }

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      {/* Compact Search Bar with Inline Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search products... (Press Enter to add first result)"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
            />
          </div>

          {/* Quick Filters - Inline */}
          <div className="flex gap-2 flex-wrap">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategoryIds[0] || ''}
                onChange={(e) => setSelectedCategoryIds(e.target.value ? [e.target.value] : [])}
                className="pl-3 pr-8 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:border-primary focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer min-w-[140px]"
              >
                <option value="">📁 All Categories</option>
                {filterOptions.categories.map(cat => (
                  <option key={cat} value={cat}>📁 {cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* Stock Filter */}
            <div className="relative">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as 'all' | 'in-stock' | 'low-stock')}
                className="pl-3 pr-8 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:border-primary focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer min-w-[130px]"
              >
                <option value="all">📦 All Stock</option>
                <option value="in-stock">✅ In Stock</option>
                <option value="low-stock">⚠️ Low Stock</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="pl-3 pr-8 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:border-primary focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer min-w-[130px]"
              >
                <option value="name">🔤 Name</option>
                <option value="price-low">💰 Price ↓</option>
                <option value="price-high">💰 Price ↑</option>
                <option value="stock-low">📊 Stock ↓</option>
                <option value="stock-high">📊 Stock ↑</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* More Filters Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium ${
                showFilters || hasActiveFilters
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Filter size={16} />
              More
              {hasActiveFilters && !showFilters && (
                <span className="w-2 h-2 bg-white rounded-full"></span>
              )}
            </button>

            {/* Clear All Button */}
            {(hasActiveFilters || searchQuery) && (
              <button 
                onClick={clearAllFilters}
                className="px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center gap-2 text-sm font-medium"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters - Dropdown Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Color Filter */}
              {filterOptions.colors.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Color
                  </label>
                  <div className="relative">
                    <select
                      value={selectedColors[0] || ''}
                      onChange={(e) => setSelectedColors(e.target.value ? [e.target.value] : [])}
                      className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm hover:border-primary focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="">All Colors</option>
                      {filterOptions.colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>
              )}

              {/* Size Filter */}
              {filterOptions.sizes.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Size
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSizes[0] || ''}
                      onChange={(e) => setSelectedSizes(e.target.value ? [e.target.value] : [])}
                      className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm hover:border-primary focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="">All Sizes</option>
                      {filterOptions.sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Price Range: ${priceRange.min} - ${priceRange.max}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: Math.max(0, Number(e.target.value)) }))}
                    className="w-20 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary transition-all"
                    min="0"
                    max={priceRange.max}
                    placeholder="Min"
                  />
                  <span className="text-slate-400 text-sm">—</span>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: Math.min(filterOptions.maxPrice, Number(e.target.value)) }))}
                    className="w-20 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary transition-all"
                    min={priceRange.min}
                    max={filterOptions.maxPrice}
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">{totalCount}</span>
            {totalCount === 1 ? 'product' : 'products'}
            {hasActiveFilters && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">filtered</span>}
          </p>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={pagination.prevPage}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                ←
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={pagination.nextPage}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Product Grid - Adapts to cart visibility */}
      <div className={`
        grid gap-4
        ${cartOpen 
          ? 'grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'  // Cart open: 2 cols default, 3 on XL, 4 on 2XL
          : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'  // Cart closed: More columns
        }
      `}>
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Searching products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-400 mb-4">
              <Search size={48} className="mx-auto opacity-30" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-medium mb-2">
              {searchQuery || hasActiveFilters ? 'No products found' : 'Start searching'}
            </p>
            <p className="text-sm text-slate-500">
              {searchQuery || hasActiveFilters 
                ? 'Try adjusting your search or filters' 
                : 'Use the search bar above to find products'}
            </p>
          </div>
        ) : (
          paginatedProducts.map((product) => (
            <div key={product.id} className="glass-card p-4">
              {/* Product Image */}
              <div className="w-full aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-3 overflow-hidden">
                {product.images[0] ? (
                  <img
                    src={product.images[0].imageData}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">
                    📦
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{product.name}</h3>
              
              {/* Simple Product - Direct Add */}
              {!product.hasVariants ? (
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={product.totalStock === 0}
                  className={`w-full mt-2 ${
                    product.totalStock === 0 
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' 
                      : 'btn-primary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>${product.basePrice.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      product.totalStock === 0 
                        ? 'bg-error/20 text-error' 
                        : product.totalStock < 10
                        ? 'bg-accent/20 text-accent'
                        : 'bg-white/20'
                    }`}>
                      {product.totalStock === 0 ? 'Out of Stock' : `${product.totalStock} left`}
                    </span>
                  </div>
                </button>
              ) : (
                /* Product with Variants - Show Quick Access */
                <div className="space-y-2 mt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quick Add:</p>
                  {product.variants.slice(0, 2).map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => handleAddToCart(product, variant)}
                      disabled={variant.stock === 0}
                      className={`w-full px-3 py-2 text-left text-xs rounded-lg transition-all ${
                        variant.stock === 0
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border border-primary/20 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="truncate flex-1 font-medium text-slate-800 dark:text-slate-200">
                          {[variant.color, variant.size].filter(Boolean).join(' • ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">${variant.price.toFixed(2)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            variant.stock === 0 
                              ? 'bg-error/20 text-error' 
                              : variant.stock < 10
                              ? 'bg-accent/20 text-accent'
                              : 'bg-success/20 text-success'
                          }`}>
                            {variant.stock === 0 ? 'Out' : variant.stock}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                  {product.variants.length > 2 && (
                    <button
                      onClick={() => openVariantModal(product)}
                      className="w-full px-3 py-2 text-sm rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      <span>View All {product.variants.length} Options</span>
                      <ChevronDown size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{selectedProduct.name}</h2>
                  <p className="text-white/80 text-sm">{selectedProduct.category}</p>
                  <p className="text-white/90 mt-2 text-sm">Select a variant to add to cart</p>
                </div>
                <button
                  onClick={() => setShowVariantModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body - Variants Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedProduct.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleAddToCart(selectedProduct, variant)}
                    disabled={variant.stock === 0}
                    className={`p-4 rounded-xl text-left transition-all ${
                      variant.stock === 0
                        ? 'bg-slate-100 dark:bg-slate-700/50 opacity-60 cursor-not-allowed'
                        : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 hover:from-primary/10 hover:to-secondary/10 border-2 border-transparent hover:border-primary/40 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {variant.color && (
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {variant.color}
                            </span>
                          )}
                          {variant.size && (
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {variant.size}
                            </span>
                          )}
                        </div>
                        {variant.sku && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            SKU: {variant.sku}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        variant.stock === 0 
                          ? 'bg-error/20 text-error' 
                          : variant.stock < 10
                          ? 'bg-accent/20 text-accent'
                          : 'bg-success/20 text-success'
                      }`}>
                        {variant.stock === 0 ? 'Out of Stock' : `${variant.stock} in stock`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-600">
                      <span className="text-2xl font-bold text-primary">
                        ${variant.price.toFixed(2)}
                      </span>
                      {variant.stock > 0 && (
                        <span className="text-xs bg-primary text-white px-3 py-1.5 rounded-full font-medium">
                          Add to Cart →
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {selectedProduct.variants.filter(v => v.stock > 0).length} of {selectedProduct.variants.length} variants available
                </span>
                <button
                  onClick={() => setShowVariantModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

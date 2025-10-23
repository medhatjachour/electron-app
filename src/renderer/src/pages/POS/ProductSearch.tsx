/**
 * Product search and display component for POS
 */

import { useState, useMemo, useEffect } from 'react'
import { Search, Barcode, Filter, X } from 'lucide-react'
import Pagination from '../../components/Pagination'
import type { Product, ProductVariant } from './types'

type Props = {
  products: Product[]
  loading: boolean
  onAddToCart: (product: Product, variant?: ProductVariant) => void
}

type SortOption = 'name' | 'price-low' | 'price-high' | 'stock-low' | 'stock-high'

export default function ProductSearch({ products, loading, onAddToCart }: Readonly<Props>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock'>('all')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 })
  const [sortBy, setSortBy] = useState<SortOption>('name')
  
  const ITEMS_PER_PAGE = 50

  // Extract unique categories, colors, and sizes
  const filterOptions = useMemo(() => {
    const categories = new Set<string>()
    const colors = new Set<string>()
    const sizes = new Set<string>()
    let maxPrice = 0

    products.forEach(product => {
      if (product.category) categories.add(product.category)
      if (product.basePrice > maxPrice) maxPrice = product.basePrice
      
      if (product.hasVariants && product.variants) {
        product.variants.forEach(variant => {
          if (variant.color) colors.add(variant.color)
          if (variant.size) sizes.add(variant.size)
          if (variant.price > maxPrice) maxPrice = variant.price
        })
      }
    })

    return {
      categories: Array.from(categories).sort(),
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort(),
      maxPrice: Math.ceil(maxPrice)
    }
  }, [products])

  // Initialize price range
  useEffect(() => {
    if (priceRange.max === 0 && filterOptions.maxPrice > 0) {
      setPriceRange({ min: 0, max: filterOptions.maxPrice })
    }
  }, [filterOptions.maxPrice, priceRange.max])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = p.name.toLowerCase().includes(query)
        const matchesCategory = p.category.toLowerCase().includes(query)
        if (!matchesName && !matchesCategory) return false
      }

      // Category filter
      if (selectedCategory && p.category !== selectedCategory) return false

      // Stock filter
      const stock = p.totalStock || 0
      if (stockFilter === 'in-stock' && stock === 0) return false
      if (stockFilter === 'low-stock' && (stock === 0 || stock > 10)) return false

      // Price filter
      const price = p.basePrice
      if (price < priceRange.min || price > priceRange.max) return false

      // Color/Size filters (for variant products)
      if (p.hasVariants && p.variants) {
        if (selectedColor) {
          const hasColor = p.variants.some(v => v.color === selectedColor)
          if (!hasColor) return false
        }
        if (selectedSize) {
          const hasSize = p.variants.some(v => v.size === selectedSize)
          if (!hasSize) return false
        }
      }

      return true
    })

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.basePrice - b.basePrice)
        break
      case 'price-high':
        filtered.sort((a, b) => b.basePrice - a.basePrice)
        break
      case 'stock-low':
        filtered.sort((a, b) => (a.totalStock || 0) - (b.totalStock || 0))
        break
      case 'stock-high':
        filtered.sort((a, b) => (b.totalStock || 0) - (a.totalStock || 0))
        break
      case 'name':
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return filtered
  }, [products, searchQuery, selectedCategory, selectedColor, selectedSize, stockFilter, priceRange, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedColor, selectedSize, stockFilter, priceRange, sortBy])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredProducts.length > 0) {
      onAddToCart(filteredProducts[0])
      setSearchQuery('')
    }
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedColor('')
    setSelectedSize('')
    setStockFilter('all')
    setPriceRange({ min: 0, max: filterOptions.maxPrice })
    setSortBy('name')
  }

  const hasActiveFilters = selectedCategory || selectedColor || selectedSize || stockFilter !== 'all' || 
                          priceRange.min > 0 || priceRange.max < filterOptions.maxPrice

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, SKU, or category... (Press Enter to add first result)"
            className="input-field pl-10 pr-4 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
            showFilters || hasActiveFilters
              ? 'bg-primary text-white border-primary'
              : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Filter size={20} />
          Filters
          {hasActiveFilters && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
              Active
            </span>
          )}
        </button>
        <button 
          className="btn-secondary flex items-center gap-2 px-4"
          onClick={() => setSearchQuery('')}
        >
          <Barcode size={20} />
          Clear Search
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Advanced Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X size={16} />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as 'all' | 'in-stock' | 'low-stock')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock Only</option>
                <option value="low-stock">Low Stock (≤10)</option>
              </select>
            </div>

            {/* Color Filter */}
            {filterOptions.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color
                </label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">All Colors</option>
                  {filterOptions.colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Size Filter */}
            {filterOptions.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Size
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">All Sizes</option>
                  {filterOptions.sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="name">Name (A-Z)</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
                <option value="stock-low">Stock (Low to High)</option>
                <option value="stock-high">Stock (High to Low)</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Price Range: ${priceRange.min} - ${priceRange.max}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: Math.max(0, Number(e.target.value)) }))}
                  className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  min="0"
                  max={priceRange.max}
                />
                <span className="text-slate-500">to</span>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Math.min(filterOptions.maxPrice, Number(e.target.value)) }))}
                  className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  min={priceRange.min}
                  max={filterOptions.maxPrice}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          {hasActiveFilters && ' (filtered)'}
        </p>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredProducts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemName="products"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">
              {products.length === 0 ? 'No products available. Add products first!' : 'No products found.'}
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
                /* Product with Variants */
                <div className="space-y-2 mt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Select variant:</p>
                  {product.variants.slice(0, 3).map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => onAddToCart(product, variant)}
                      disabled={variant.stock === 0}
                      className={`w-full px-2 py-1 text-left text-xs rounded transition-colors ${
                        variant.stock === 0
                          ? 'bg-slate-200 dark:bg-slate-600 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-primary/20'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="truncate flex-1">
                          {[variant.color, variant.size].filter(Boolean).join(' - ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">${variant.price.toFixed(2)}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
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
                  {product.variants.length > 3 && (
                    <p className="text-xs text-slate-400 text-center">
                      +{product.variants.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

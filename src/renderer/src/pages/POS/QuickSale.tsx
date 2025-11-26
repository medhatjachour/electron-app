/**
 * QuickSale Component
 * Fast table-based POS interface for quick product search and sales
 * Optimized for large datasets (1M+ products) with virtualization
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, ShoppingCart, Trash2, X, User, DollarSign, Percent } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

type Product = {
  id: string
  name: string
  baseSKU: string
  basePrice: number
  totalStock: number
  imageUrl?: string
  category?: string
}

type CartItem = {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  discount: number
  subtotal: number
}

type Customer = {
  id: string
  name: string
  email: string
}

export default function QuickSale() {
  const { showToast } = useToast()
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  
  // Calculated totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)
  const totalDiscount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity * item.discount / 100), 0)
  const total = subtotal - totalDiscount

  // Load customers
  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const result = await window.api.customers.getAll()
      // Handle the response structure { customers: [], totalCount, hasMore }
      if (result && Array.isArray(result.customers)) {
        setCustomers(result.customers)
      } else if (Array.isArray(result)) {
        // Fallback for direct array response
        setCustomers(result)
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      setCustomers([])
    }
  }

  // Debounced search with dropdown
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      setSelectedIndex(-1)
      return
    }

    const timer = setTimeout(async () => {
      await performSearch(searchQuery)
    }, 150) // Faster debounce for better UX

    return () => clearTimeout(timer)
  }, [searchQuery])

  const performSearch = async (query: string) => {
    setIsSearching(true)
    try {
      // Backend search via IPC
      const results = await window.api.products.search({
        query: query.trim(),
        limit: 20 // Limit for dropdown
      })
      setSearchResults(results || [])
      setShowDropdown(results && results.length > 0)
      setSelectedIndex(-1) // Reset selection
    } catch (error) {
      console.error('Search error:', error)
      showToast('Search failed', 'error')
      setSearchResults([])
      setShowDropdown(false)
      setSelectedIndex(-1)
    } finally {
      setIsSearching(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Add product to cart
  const addToCart = useCallback((product: Product) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id)
      
      if (existingIndex >= 0) {
        // Increment quantity if already in cart
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          subtotal: updated[existingIndex].price * (updated[existingIndex].quantity + 1)
        }
        return updated
      } else {
        // Add new item
        return [...prev, {
          productId: product.id,
          name: product.name,
          sku: product.baseSKU,
          price: product.basePrice,
          quantity: 1,
          discount: 0,
          subtotal: product.basePrice
        }]
      }
    })
    
    // Clear search after adding
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
    setSelectedIndex(-1)
    searchInputRef.current?.focus()
    
    showToast('Added to cart', 'success')
  }, [showToast])

  // Handle keyboard navigation in search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          const selectedProduct = searchResults[selectedIndex]
          if (selectedProduct.totalStock > 0) {
            addToCart(selectedProduct)
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  // Update cart item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCartItems(prev => prev.map(item => 
      item.productId === productId
        ? { ...item, quantity, subtotal: item.price * quantity }
        : item
    ))
  }

  // Update cart item discount
  const updateDiscount = (productId: string, discount: number) => {
    const validDiscount = Math.max(0, Math.min(100, discount))
    setCartItems(prev => prev.map(item => 
      item.productId === productId
        ? { ...item, discount: validDiscount }
        : item
    ))
  }

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId))
  }

  // Clear cart
  const clearCart = () => {
    if (cartItems.length === 0) return
    
    if (confirm('Clear all items from cart?')) {
      setCartItems([])
      setSelectedCustomer(null)
      showToast('Cart cleared', 'info')
    }
  }

  // Complete sale
  const completeSale = async () => {
    if (cartItems.length === 0) {
      showToast('Cart is empty', 'error')
      return
    }

    try {
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      if (!currentUser.id) {
        showToast('User not authenticated', 'error')
        return
      }

      // Prepare sale data using the saleTransactions API
      const saleData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        transactionData: {
          userId: currentUser.id,
          paymentMethod: 'cash', // Default payment method
          customerName: selectedCustomer?.name,
          customerId: selectedCustomer?.id,
          subtotal,
          tax: 0, // Can be calculated if needed
          total
        }
      }

      // Submit sale via IPC
      await window.api.saleTransactions.create(saleData)
      
      showToast('Sale completed successfully!', 'success')
      
      // Reset
      setCartItems([])
      setSelectedCustomer(null)
      setSearchQuery('')
      setSearchResults([])
      
    } catch (error) {
      console.error('Sale error:', error)
      showToast('Failed to complete sale', 'error')
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with '/'
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      // Clear search with Escape
      if (e.key === 'Escape') {
        if (showDropdown) {
          setShowDropdown(false)
          setSearchQuery('')
        } else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDropdown])

  return (
    <div className="h-full flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-900">
      {/* Search Bar with Dropdown - Compact */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="Search products... (Press '/' to focus)"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            autoComplete="off"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {/* Dropdown Results */}
          {showDropdown && searchResults.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-80 overflow-auto z-50"
            >
              {searchResults.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.totalStock === 0}
                  className={`w-full px-3 py-2 flex items-center gap-2 transition-colors text-left border-b border-slate-100 dark:border-slate-700 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === selectedIndex
                      ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <ShoppingCart size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{product.baseSKU}</p>
                      {product.category && (
                        <>
                          <span className="text-xs text-slate-400">•</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{product.category}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      product.totalStock === 0 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : product.totalStock < 10
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {product.totalStock}
                    </span>
                    <span className="text-base font-semibold text-primary">
                      ${product.basePrice.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section - Takes Most of the Screen */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col min-h-0">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Cart ({cartItems.length})
            </h3>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
            >
              <Trash2 size={14} />
              Clear
            </button>
          )}
        </div>

        <div className="overflow-auto flex-1">
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
              <p>Cart is empty</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Product</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Price</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Disc%</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {cartItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-3 py-2">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.sku}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-14 px-2 py-1 text-sm text-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900 dark:text-white">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => updateDiscount(item.productId, parseFloat(e.target.value) || 0)}
                        className="w-12 px-1 py-1 text-sm text-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
                      ${(item.subtotal - (item.price * item.quantity * item.discount / 100)).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Cart Footer - Compact */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
          {/* Customer Selection - Compact */}
          <div className="flex items-center gap-2">
            <User size={16} className="text-slate-400 flex-shrink-0" />
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customer = customers.find(c => c.id === e.target.value)
                setSelectedCustomer(customer || null)
              }}
              className="flex-1 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Totals - Compact */}
          <div className="space-y-1 py-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                <span>Discount:</span>
                <span>-${totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white pt-1">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex gap-2">
            <button
              onClick={clearCart}
              disabled={cartItems.length === 0}
              className="flex-1 px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={completeSale}
              disabled={cartItems.length === 0}
              className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-1.5"
            >
              <DollarSign size={18} />
              Complete Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { Search, Barcode, ShoppingCart, CreditCard, DollarSign, Receipt, X, Trash2, Check } from 'lucide-react'
import { ipc } from '../utils/ipc'

type ProductVariant = {
  id: string
  color?: string
  size?: string
  sku: string
  price: number
  stock: number
}

type Product = {
  id: string
  name: string
  basePrice: number
  category: string
  hasVariants: boolean
  variants: ProductVariant[]
  images: { imageData: string }[]
  totalStock: number
}

type CartItem = {
  id: string
  variantId?: string
  name: string
  variant?: string
  price: number
  quantity: number
}

export default function POS(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Load products from database
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await ipc.products.getAll()
      const productsWithStock = data.map((p: any) => ({
        ...p,
        totalStock: p.hasVariants 
          ? p.variants.reduce((sum: number, v: any) => sum + v.stock, 0)
          : 0
      }))
      setProducts(productsWithStock)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  , [cart])

  const tax = subtotal * 0.1
  const total = subtotal + tax

  const addToCart = (product: Product, variant?: ProductVariant) => {
    const price = variant ? variant.price : product.basePrice
    const variantLabel = variant 
      ? [variant.color, variant.size].filter(Boolean).join(' - ')
      : undefined
    
    const itemId = variant ? `${product.id}-${variant.id}` : product.id
    
    setCart(prev => {
      const existing = prev.find(item => item.id === itemId)
      if (existing) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { 
        id: itemId, 
        variantId: variant?.id,
        name: product.name, 
        variant: variantLabel,
        price, 
        quantity: 1 
      }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta
          return { ...item, quantity: Math.max(1, newQty) }
        }
        return item
      }).filter(item => item.quantity > 0)
    })
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
    setPaymentMethod(null)
    setShowCheckout(false)
  }

  const completeSale = () => {
    if (!paymentMethod || cart.length === 0) return
    
    // Show success animation
    setShowSuccess(true)
    
    // Clear cart after animation
    setTimeout(() => {
      setShowSuccess(false)
      clearCart()
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredProducts.length > 0) {
      addToCart(filteredProducts[0])
      setSearchQuery('')
    }
  }

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-card p-8 max-w-md w-full text-center animate-scale-up">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={48} className="text-success" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sale Complete!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Total: ${total.toFixed(2)}</p>
            <p className="text-sm text-slate-500">Payment: {paymentMethod === 'cash' ? 'Cash' : 'Card'}</p>
          </div>
        </div>
      )}

      {/* Products Area */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search products or scan barcode... (Press Enter to add first result)"
              className="input-field pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>
          <button 
            className="btn-secondary flex items-center gap-2 px-6"
            onClick={() => setSearchQuery('')}
          >
            <Barcode size={20} />
            Clear
          </button>
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
            filteredProducts.map((product) => (
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
                    onClick={() => addToCart(product)}
                    className="w-full mt-2 btn-primary"
                  >
                    <div className="flex items-center justify-between">
                      <span>${product.basePrice.toFixed(2)}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                        {product.totalStock} left
                      </span>
                    </div>
                  </button>
                ) : (
                  /* Product with Variants - Show variant buttons */
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Select variant:</p>
                    {product.variants.slice(0, 3).map(variant => (
                      <button
                        key={variant.id}
                        onClick={() => addToCart(product, variant)}
                        className="w-full px-2 py-1 text-left text-xs rounded bg-slate-100 dark:bg-slate-700 hover:bg-primary/20 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate">
                            {[variant.color, variant.size].filter(Boolean).join(' - ')}
                          </span>
                          <span className="font-semibold">${variant.price.toFixed(2)}</span>
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

      {/* Cart Sidebar */}
      <div className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-6 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart size={24} />
            Cart
            {cart.length > 0 && (
              <span className="text-sm bg-primary text-white px-2 py-1 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors"
              title="Clear cart"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto mb-4">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 mt-12">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
              <p>Cart is empty</p>
              <p className="text-sm mt-2">Click products to add them</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="glass-card p-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                    {item.variant && (
                      <div className="text-xs text-secondary mb-1">
                        {item.variant}
                      </div>
                    )}
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-error hover:bg-error/10 p-1 rounded transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax (10%):</span>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total:</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {cart.length > 0 && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Method:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-success text-white border-success shadow-lg scale-105'
                        : 'border-slate-300 dark:border-slate-600 hover:border-success hover:bg-success/10'
                    }`}
                  >
                    <DollarSign size={20} />
                    Cash
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-primary text-white border-primary shadow-lg scale-105'
                        : 'border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/10'
                    }`}
                  >
                    <CreditCard size={20} />
                    Card
                  </button>
                </div>
              </div>

              <button
                onClick={completeSale}
                disabled={!paymentMethod}
                className={`w-full py-4 text-lg font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  paymentMethod
                    ? 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-xl hover:scale-105 active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Receipt size={24} />
                Complete Sale - ${total.toFixed(2)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

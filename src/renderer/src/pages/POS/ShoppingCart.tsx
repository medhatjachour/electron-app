/**
 * Shopping cart display and management component
 */

import { ShoppingCart as CartIcon, X, Trash2 } from 'lucide-react'
import type { CartItem } from './types'

type Props = {
  cart: CartItem[]
  totalItems: number
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveFromCart: (id: string) => void
  onClearCart: () => void
}

export default function ShoppingCart({ 
  cart, 
  totalItems,
  onUpdateQuantity, 
  onRemoveFromCart, 
  onClearCart 
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CartIcon size={24} />
          Cart
          {cart.length > 0 && (
            <span className="text-sm bg-primary text-white px-2 py-1 rounded-full">
              {totalItems}
            </span>
          )}
        </h2>
        {cart.length > 0 && (
          <button
            onClick={onClearCart}
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
            <CartIcon size={48} className="mx-auto mb-2 opacity-20" />
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
                  <div className="text-xs text-slate-500 mt-1">
                    {item.stock} units available
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFromCart(item.id)}
                  className="text-error hover:bg-error/10 p-1 rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-bold"
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  disabled={item.quantity >= item.stock}
                  className={`w-8 h-8 rounded-lg font-bold transition-colors ${
                    item.quantity >= item.stock
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                  title={item.quantity >= item.stock ? 'Max stock reached' : 'Add one more'}
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

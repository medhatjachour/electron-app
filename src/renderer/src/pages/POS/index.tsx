/**
 * Point of Sale (POS) Main Component
 * Modular architecture with separated concerns:
 * - ProductSearch: Product browsing and selection
 * - ShoppingCart: Cart display and management
 * - CustomerSelect: Customer search and selection
 * - PaymentSection: Payment method and checkout
 * - SuccessModal: Success feedback
 * - usePOS: Business logic and state management
 */

import { useState } from 'react'
import ProductSearch from './ProductSearch'
import ShoppingCart from './ShoppingCart'
import CustomerSelect from './CustomerSelect'
import PaymentSection from './PaymentSection'
import SuccessModal from './SuccessModal'
import { usePOS } from './usePOS'

export default function POS(): JSX.Element {
  const {
    customers,
    cart,
    selectedCustomer,
    customerQuery,
    paymentMethod,
    showSuccess,
    subtotal,
    tax,
    total,
    totalItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    completeSale,
    setSelectedCustomer,
    setCustomerQuery,
    setPaymentMethod,
  } = usePOS()

  const [cartOpen, setCartOpen] = useState(true)

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      <SuccessModal show={showSuccess} total={total} paymentMethod={paymentMethod} />

      {/* Main Product Area */}
      <div className="flex-1 flex flex-col">
        <ProductSearch 
          onAddToCart={addToCart}
          cartOpen={cartOpen}
        />
      </div>

      {/* Backdrop Overlay (visible when cart is open) */}
      {cartOpen && (
        <div 
          role="button"
          tabIndex={0}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden"
          onClick={() => setCartOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setCartOpen(false)}
          aria-label="Close cart overlay"
        />
      )}

      {/* Floating Cart Toggle Button (when closed) */}
      {!cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open shopping cart"
        >
          <div className="relative">
            {/* Cart Icon with Badge */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300 group-hover:shadow-primary/50">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            
            {/* Item Count Badge */}
            {totalItems > 0 && (
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center shadow-lg animate-bounce">
                {totalItems}
              </div>
            )}
            
            {/* Ripple Effect */}
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
            View Cart ({totalItems} items)
            <div className="absolute top-full right-4 -mt-1 w-2 h-2 bg-slate-900 transform rotate-45"></div>
          </div>
        </button>
      )}

      {/* Cart Sidebar Panel - Optimized width based on screen size */}
      <div 
        className={`
          fixed lg:relative right-0 top-0 h-full z-50
          w-full sm:w-96 lg:w-80 xl:w-96 2xl:w-[28rem]
          bg-white dark:bg-slate-800 
          border-l border-slate-200 dark:border-slate-700
          shadow-2xl lg:shadow-none
          transform transition-all duration-300 ease-out
          ${cartOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}
          flex flex-col
        `}
      >
        {/* Cart Header with Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Shopping Cart</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          
          {/* Enhanced Close Button with visual feedback */}
          <button
            onClick={() => setCartOpen(false)}
            className="group relative p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-105 active:scale-95 lg:hidden"
            aria-label="Close cart (or click outside)"
            title="Close cart"
          >
            <svg className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Desktop: Collapse/Expand Button */}
          <button
            onClick={() => setCartOpen(!cartOpen)}
            className="hidden lg:block group relative p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95"
            aria-label={cartOpen ? "Minimize cart" : "Expand cart"}
            title={cartOpen ? "Minimize cart for more space" : "Expand cart"}
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {cartOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          <ShoppingCart
            cart={cart}
            totalItems={totalItems}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onClearCart={clearCart}
          />

          {cart.length > 0 && (
            <>
              <CustomerSelect
                customers={customers}
                selectedCustomer={selectedCustomer}
                customerQuery={customerQuery}
                onSelectCustomer={setSelectedCustomer}
                onQueryChange={setCustomerQuery}
              />

              <PaymentSection
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onCompleteSale={completeSale}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

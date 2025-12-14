/**
 * Point of Sale (POS) Main Component
 * Modular architecture with separated concerns:
 * - ProductSearch: Product browsing and selection (Grid View)
 * - QuickSale: Fast table-based sale interface (Quick Sale View)
 * - ShoppingCart: Cart display and management
 * - CustomerSelect: Customer search and selection
 * - PaymentSection: Payment method and checkout
 * - SuccessModal: Success feedback
 * - usePOS: Business logic and state management
 */

import { useState, useRef, useEffect } from 'react'
import { Grid, Zap } from 'lucide-react'
import ProductSearch from './ProductSearch'
import QuickSale from './QuickSale'
import ShoppingCart from './ShoppingCart'
import CustomerSelect from './CustomerSelect'
import PaymentSection from './PaymentSection'
import SuccessModal from './SuccessModal'
import AddCustomerModal from './AddCustomerModal'
import DiscountModal from '../../components/DiscountModal'
import { usePOS } from './usePOS'
import { useLanguage } from '../../contexts/LanguageContext'
import type { Customer } from './types'

type ViewMode = 'grid' | 'quick'

export default function POS(): JSX.Element {
  const {
    customers,
    cart,
    customerQuery: sharedCustomerQuery,
    paymentMethod,
    showSuccess,
    showDiscountModal,
    discountingItem,
    subtotal,
    tax,
    total,
    totalItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    completeSale,
    completeSaleFromQuickView,
    setCustomerQuery: setSharedCustomerQuery,
    setPaymentMethod,
    refreshCustomers,
    canApplyDiscount,
    openDiscountModal,
    handleApplyDiscount,
    setShowDiscountModal,
  } = usePOS()

  const [cartOpen, setCartOpen] = useState(false)
  const [showCheckoutOptions, setShowCheckoutOptions] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  
  // Grid view has its own local customer state (like QuickSale does)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerQuery, setCustomerQuery] = useState('')

  // Clear local customer state when sale is completed successfully
  useEffect(() => {
    if (showSuccess) {
      setSelectedCustomer(null)
      setCustomerQuery('')
    }
  }, [showSuccess])

  const handleCustomerAdded = (newCustomer: Customer) => {
    console.log('👤 Customer added in POS:', newCustomer)
    // Refresh customers list and select the new customer immediately
    refreshCustomers()
    setSelectedCustomer(newCustomer)
    // Don't clear the query - leave it so the customer name shows
    // The CustomerSelect component will display selectedCustomer.name
  }
  
  // Wrapper to call completeSale with the local customer
  const handleCompleteSale = () => {
    console.log('🎯 Complete sale with customer:', selectedCustomer)
    completeSale(selectedCustomer)
  }

  const { t, language } = useLanguage()

  // Quick checkout with cash, no customer
  const handleQuickCheckout = async () => {
    if (cart.length === 0) {
      alert(t('cartIsEmpty'))
      return
    }
    setPaymentMethod('cash')
    setSelectedCustomer(null)
    setCustomerQuery('')
    // Small delay to ensure state is updated
    setTimeout(() => {
      completeSale()
    }, 100)
  }

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900 relative">
      <SuccessModal show={showSuccess} total={total} paymentMethod={paymentMethod} />
      <AddCustomerModal 
        show={showAddCustomerModal} 
        onClose={() => setShowAddCustomerModal(false)}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Main Content Area - Left Side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* View Mode Tabs */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-100 dark:bg-slate-700 text-primary font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Grid size={18} />
              {t('gridView')}
            </button>
            <button
              onClick={() => setViewMode('quick')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                viewMode === 'quick'
                  ? 'bg-slate-100 dark:bg-slate-700 text-primary font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Zap size={18} />
              {t('quickSale')}
            </button>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'grid' ? (
          <ProductSearch 
            onAddToCart={addToCart}
            cartOpen={cartOpen}
          />
        ) : (
          <QuickSale onCompleteSale={completeSaleFromQuickView} />
        )}
      </div>

      {/* Backdrop Overlay (visible when cart is open) - Only in Grid View */}
      {cartOpen && viewMode === 'grid' && (
        <div 
          role="button"
          tabIndex={0}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden"
          onClick={() => setCartOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setCartOpen(false)}
          aria-label={t('closeCartOverlay')}
        />
      )}

      {/* Floating Cart Toggle Button (when closed) - Only in Grid View */}
      {!cartOpen && viewMode === 'grid' && (
        <button
          onClick={() => setCartOpen(true)}
          className={`fixed bottom-6 z-50 group ${language === 'ar' ? 'left-6' : 'right-6'}`}
          aria-label={t('openShoppingCart')}
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
          <div className={`absolute bottom-full mb-2 px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl ${language === 'ar' ? 'left-0' : 'right-0'}`}>
            {t('viewCart')} ({totalItems} {t('items')})
            <div className={`absolute top-full -mt-1 w-2 h-2 bg-slate-900 transform rotate-45 ${language === 'ar' ? 'left-4' : 'right-4'}`}></div>
          </div>
        </button>
      )}

      {/* Cart Sidebar Panel - Right Side with Fixed Sections - Only in Grid View */}
      {viewMode === 'grid' && (
        <div 
          className={`
            fixed lg:relative top-0 h-full z-10
            w-full sm:w-[420px] lg:w-[380px] xl:w-[420px] 2xl:w-[480px]
            bg-white dark:bg-slate-800 
            shadow-2xl lg:shadow-none
            transform transition-all duration-300 ease-out
            flex flex-col
            ${language === 'ar' 
              ? 'left-0 border-r border-slate-200 dark:border-slate-700' 
              : 'right-0 border-l border-slate-200 dark:border-slate-700'
            }
            ${cartOpen 
              ? 'translate-x-0' 
              : language === 'ar' 
                ? '-translate-x-full lg:hidden' 
                : 'translate-x-full lg:hidden'
            }
          `}
        >
        {/* Compact Header with Close/Minimize Button */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-primary bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('currentOrder')}</h2>
            </div>
          </div>
          
          {/* Close/Minimize Button - Works on all screen sizes */}
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
            aria-label={t('minimizeCart')}
            title={`${t('minimizeCart')} (${t('moreSpaceForProducts')})`}
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={language === 'ar' ? "M11 19l-7-7 7-7" : "M13 5l7 7-7 7"} />
            </svg>
          </button>
        </div>

        {/* Main Content Area - Scrollable with fixed sections */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Cart Items - Takes full space now */}
          <div className="flex-1 overflow-auto">
            <ShoppingCart
              cart={cart}
              totalItems={totalItems}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
              onClearCart={clearCart}
              canApplyDiscount={canApplyDiscount}
              onApplyDiscount={openDiscountModal}
            />
          </div>

          {/* Checkout Buttons - Always visible at bottom */}
          {cart.length > 0 && (
            <div className="border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              {showCheckoutOptions ? (
                // Full Checkout Options (Customer + Payment)
                <>
                  {/* Customer Selection - Compact */}
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <CustomerSelect
                      customers={customers}
                      selectedCustomer={selectedCustomer}
                      customerQuery={customerQuery}
                      onSelectCustomer={setSelectedCustomer}
                      onQueryChange={setCustomerQuery}
                      onAddNewCustomer={() => setShowAddCustomerModal(true)}
                    />
                  </div>

                  {/* Payment Section */}
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <PaymentSection
                      paymentMethod={paymentMethod}
                      onPaymentMethodChange={setPaymentMethod}
                      subtotal={subtotal}
                      tax={tax}
                      total={total}
                      onCompleteSale={handleCompleteSale}
                    />
                  </div>

                  {/* Back to Simple View */}
                  <div className="px-4 py-2">
                    <button
                      onClick={() => setShowCheckoutOptions(false)}
                      className="w-full py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {t('backToQuickCheckout')}
                    </button>
                  </div>
                </>
              ) : (
                // Quick Checkout Buttons
                <div className="p-4 space-y-2">
                  {/* Order Summary - Compact */}
                  <div className="space-y-1 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>{t('subtotal')}:</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>{t('tax')} ({(parseFloat(localStorage.getItem('taxRate') || '10'))}%):</span>
                      <span className="font-semibold">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-300 dark:border-slate-600">
                      <span className="text-base font-bold text-slate-900 dark:text-white">{t('total')}:</span>
                      <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quick Cash Checkout */}
                  <button
                    onClick={handleQuickCheckout}
                    className="w-full py-3 text-base font-bold rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-success to-emerald-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('quickCheckoutCash')}
                  </button>

                  {/* More Options Button */}
                  <button
                    onClick={() => setShowCheckoutOptions(true)}
                    className="w-full py-3 text-sm font-semibold rounded-lg border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t('moreOptionsCustomerCard')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Discount Modal */}
      {discountingItem && (
        <DiscountModal
          isOpen={showDiscountModal}
          onClose={() => setShowDiscountModal(false)}
          onApply={handleApplyDiscount}
          productName={`${discountingItem.name}${discountingItem.variant ? ` (${discountingItem.variant})` : ''}`}
          originalPrice={discountingItem.price}
          maxDiscountPercentage={parseFloat(localStorage.getItem('maxDiscountPercentage') || '50')}
          maxDiscountAmount={parseFloat(localStorage.getItem('maxDiscountAmount') || '100')}
          requireReason={true}
        />
      )}
    </div>
  )
}

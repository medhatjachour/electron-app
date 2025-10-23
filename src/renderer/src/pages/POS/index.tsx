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

import ProductSearch from './ProductSearch'
import ShoppingCart from './ShoppingCart'
import CustomerSelect from './CustomerSelect'
import PaymentSection from './PaymentSection'
import SuccessModal from './SuccessModal'
import { usePOS } from './usePOS'

export default function POS(): JSX.Element {
  const {
    products,
    customers,
    loading,
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

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900">
      <SuccessModal show={showSuccess} total={total} paymentMethod={paymentMethod} />

      <ProductSearch 
        products={products}
        loading={loading}
        onAddToCart={addToCart}
      />

      {/* Cart Sidebar */}
      <div className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-6 flex flex-col shadow-2xl">
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
  )
}

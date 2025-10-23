/**
 * Payment method selection and checkout component
 */

import { DollarSign, CreditCard, Receipt } from 'lucide-react'
import type { PaymentMethod } from './types'

type Props = {
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  subtotal: number
  tax: number
  total: number
  onCompleteSale: () => void
}

export default function PaymentSection({
  paymentMethod,
  onPaymentMethodChange,
  subtotal,
  tax,
  total,
  onCompleteSale
}: Props) {
  return (
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

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Method:</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onPaymentMethodChange('cash')}
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
            onClick={() => onPaymentMethodChange('card')}
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
        onClick={onCompleteSale}
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
    </div>
  )
}

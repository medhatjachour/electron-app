/**
 * Payment Methods Settings Panel
 */

import { CreditCard, DollarSign, Smartphone, Gift } from 'lucide-react'
import type { PaymentMethodSettings } from './types'

type Props = {
  settings: PaymentMethodSettings
  onChange: (settings: PaymentMethodSettings) => void
}

export default function PaymentMethodsSettings({ settings, onChange }: Props) {
  const handleToggle = (field: keyof PaymentMethodSettings) => {
    onChange({ ...settings, [field]: !settings[field] })
  }

  const paymentMethods = [
    { key: 'cash' as const, label: 'Cash', icon: DollarSign, description: 'Accept cash payments' },
    { key: 'credit' as const, label: 'Credit Card', icon: CreditCard, description: 'Accept credit card payments' },
    { key: 'debit' as const, label: 'Debit Card', icon: CreditCard, description: 'Accept debit card payments' },
    { key: 'mobile' as const, label: 'Mobile Payment', icon: Smartphone, description: 'Apple Pay, Google Pay, etc.' },
    { key: 'giftCard' as const, label: 'Gift Card', icon: Gift, description: 'Accept store gift cards' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Payment Methods
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Enable or disable payment methods accepted in your store
        </p>
      </div>

      <div className="space-y-4">
        {paymentMethods.map(({ key, label, icon: Icon, description }) => (
          <div
            key={key}
            className="glass-card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                settings[key] ? 'bg-primary/20 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                <Icon size={24} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{label}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{description}</div>
              </div>
            </div>
            <button
              onClick={() => handleToggle(key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings[key] ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings[key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Note:</strong> At least one payment method must be enabled. Cash is recommended as a fallback option.
        </p>
      </div>
    </div>
  )
}

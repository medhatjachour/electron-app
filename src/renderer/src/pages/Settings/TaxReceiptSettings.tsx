/**
 * Tax & Receipt Settings Panel
 */

import type { TaxReceiptSettings } from './types'

type Props = {
  settings: TaxReceiptSettings
  onChange: (settings: TaxReceiptSettings) => void
}

export default function TaxReceiptSettings({ settings, onChange }: Props) {
  const handleChange = (field: keyof TaxReceiptSettings, value: string | number | boolean) => {
    onChange({ ...settings, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Tax & Receipt Settings
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Configure tax rates and receipt printing options
        </p>
      </div>

      {/* Tax Rate */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Tax Rate (%) *
        </label>
        <input
          type="number"
          className="input-field"
          value={settings.taxRate}
          onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
          placeholder="10"
          min="0"
          max="100"
          step="0.01"
        />
        <p className="text-xs text-slate-500">
          Enter the tax rate as a percentage (e.g., 10 for 10%)
        </p>
      </div>

      {/* Receipt Header */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Receipt Header
        </label>
        <textarea
          className="input-field resize-none"
          rows={3}
          value={settings.receiptHeader}
          onChange={(e) => handleChange('receiptHeader', e.target.value)}
          placeholder="Thank you for shopping with us!"
          maxLength={200}
        />
        <p className="text-xs text-slate-500">
          Text displayed at the top of receipts (max 200 characters)
        </p>
      </div>

      {/* Receipt Footer */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Receipt Footer
        </label>
        <textarea
          className="input-field resize-none"
          rows={3}
          value={settings.receiptFooter}
          onChange={(e) => handleChange('receiptFooter', e.target.value)}
          placeholder="Please visit us again!"
          maxLength={200}
        />
        <p className="text-xs text-slate-500">
          Text displayed at the bottom of receipts (max 200 characters)
        </p>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          Receipt Options
        </h4>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
            checked={settings.autoPrint}
            onChange={(e) => handleChange('autoPrint', e.target.checked)}
          />
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              Auto-print receipts
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Automatically print receipt after each sale
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
            checked={settings.includeLogo}
            onChange={(e) => handleChange('includeLogo', e.target.checked)}
          />
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              Include store logo
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Display your store logo on receipts
            </div>
          </div>
        </label>
      </div>
    </div>
  )
}

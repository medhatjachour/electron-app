/**
 * Tax & Receipt Settings Panel
 */

import { useLanguage } from '../../contexts/LanguageContext'
import type { TaxReceiptSettings } from './types'

type Props = {
  settings: TaxReceiptSettings
  onChange: (settings: TaxReceiptSettings) => void
}

export default function TaxReceiptSettings({ settings, onChange }: Props) {
  const { t } = useLanguage()
  const handleChange = (field: keyof TaxReceiptSettings, value: string | number | boolean) => {
    onChange({ ...settings, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {t('taxReceiptSettings')}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {t('configureTaxReceipt')}
        </p>
      </div>

      {/* Tax Rate */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('salesTaxRate')} *
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            className="w-32 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            value={settings.taxRate}
            onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
            placeholder="10"
            min="0"
            max="100"
            step="0.1"
          />
          <span className="text-slate-600 dark:text-slate-400 font-medium">%</span>
        </div>
        <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">{t('example')}:</span> ${settings.taxRate.toFixed(2)} {t('taxOnSale')} $100.00 {t('taxSaleExample')}
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {t('taxRateApplied')}
        </p>
      </div>

      {/* Refund Period */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('refundReturnPeriod')} *
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            className="w-32 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            value={settings.refundPeriodDays}
            onChange={(e) => handleChange('refundPeriodDays', Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="30"
            min="0"
            max="365"
          />
          <span className="text-slate-600 dark:text-slate-400 font-medium">{t('days')}</span>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">{t('notice')}:</span> {t('refundsAllowedWithin')} {settings.refundPeriodDays} {t('daysAfterPurchase')}
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {t('setToZeroDisable')}
        </p>
      </div>

      {/* Receipt Header */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('receiptHeader')}
        </label>
        <textarea
          className="input-field resize-none"
          rows={3}
          value={settings.receiptHeader}
          onChange={(e) => handleChange('receiptHeader', e.target.value)}
          placeholder={t('receiptHeaderPlaceholder')}
          maxLength={200}
        />
        <p className="text-xs text-slate-500">
          {t('receiptHeaderDesc')}
        </p>
      </div>

      {/* Receipt Footer */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('receiptFooter')}
        </label>
        <textarea
          className="input-field resize-none"
          rows={3}
          value={settings.receiptFooter}
          onChange={(e) => handleChange('receiptFooter', e.target.value)}
          placeholder={t('receiptFooterPlaceholder')}
          maxLength={200}
        />
        <p className="text-xs text-slate-500">
          {t('receiptFooterDesc')}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          {t('receiptOptions')}
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
              {t('autoPrintReceipts')}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {t('autoPrintReceiptsDesc')}
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
              {t('includeStoreLogo')}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {t('includeStoreLogoDesc')}
            </div>
          </div>
        </label>
      </div>

      {/* Discount Settings */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
            {t('discountSettings')}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('configureDiscountPermissions')}
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
            checked={settings.allowDiscounts}
            onChange={(e) => handleChange('allowDiscounts', e.target.checked)}
          />
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {t('allowDiscounts')}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {t('allowDiscountsDesc')}
            </div>
          </div>
        </label>

        {settings.allowDiscounts && (
          <>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('maximumDiscountPercent')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="w-32 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                  value={settings.maxDiscountPercentage}
                  onChange={(e) => 
                    handleChange('maxDiscountPercentage', Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))
                  }
                  placeholder="50"
                  min="0"
                  max="100"
                  step="1"
                />
                <span className="text-slate-600 dark:text-slate-400 font-medium">%</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('maxDiscountPercentDesc')}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('maximumDiscountAmount')}
              </label>
              <div className="flex items-center gap-3">
                <span className="text-slate-600 dark:text-slate-400 font-medium">$</span>
                <input
                  type="number"
                  className="w-32 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                  value={settings.maxDiscountAmount}
                  onChange={(e) => 
                    handleChange('maxDiscountAmount', Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  placeholder="100"
                  min="0"
                  step="1"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('maxDiscountAmountDesc')}
              </p>
            </div>

            {/* Require Discount Reason - Always Required */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {t('discountReasonRequired')}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                    {t('discountReasonRequiredDesc')}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

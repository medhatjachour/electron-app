import React from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, generateReceiptNumber } from '../utils/receipt'

type ReceiptProps = {
  open: boolean
  onClose: () => void
  data: any // sale transaction or financial transaction
  type?: 'sale' | 'purchase'
}

export default function Receipt({ open, onClose, data, type = 'sale' }: ReceiptProps) {
  // Optionally, you can import a logo image or use a static path
  const STORE_LOGO = (data: any) => (data?.storeLogo || '/logo.png')

  // Egyptian receipt style constants
  const STORE_AR = (data: any) => (data?.storeNameAr || 'بيزفلو')
  const STORE_EN = (data: any) => (data?.storeName || 'BizFlow')
  const ADDRESS_AR = (data: any) => (data?.storeAddressAr || 'شارع التحرير، القاهرة')
  const ADDRESS_EN = (data: any) => (data?.storeAddress || 'Tahrir St, Cairo')
  const TAX_AR = (data: any) => (data?.storeTaxAr || 'ضريبة: 123456789')
  const TAX_EN = (data: any) => (data?.storeTax || 'Tax: 123456789')
  const PHONE_AR = (data: any) => (data?.storePhoneAr || 'هاتف: 01000000000')
  const PHONE_EN = (data: any) => (data?.storePhone || 'Phone: 01000000000')
  const THANKS_AR = 'شكراً لزيارتكم!'
  const THANKS_EN = 'Thank you for your visit!'

  if (!open || !data) return null

  const receiptNumber = (data as any).receiptNumber || generateReceiptNumber(type === 'sale' ? 'S' : 'P')
  const date = new Date((data as any).createdAt || Date.now())

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:bg-transparent print:p-0">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 overflow-y-auto print:shadow-none print:rounded-none print:p-2 print:max-w-full border border-slate-200 dark:border-slate-700"
        id="receipt-print-area"
        style={{ minWidth: 320, maxWidth: 400 }}
      >
        {/* Header: Logo, Store Info */}
        <div className="flex flex-col items-center mb-3 border-b pb-2">
          <img
            src={STORE_LOGO(data)}
            alt="Store Logo"
            className="h-14 mb-2 print:mb-1 rounded shadow-sm bg-white"
            style={{ objectFit: 'contain', maxHeight: 56 }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <div className="font-extrabold text-lg tracking-wide text-center text-primary dark:text-primary-300">
            {STORE_AR(data)} / {STORE_EN(data)}
          </div>
          <div className="text-xs text-slate-500 text-center">{ADDRESS_AR(data)} / {ADDRESS_EN(data)}</div>
          <div className="text-xs text-slate-500 text-center">{PHONE_AR(data)} / {PHONE_EN(data)}</div>
        </div>
        {/* Receipt Info */}
        <div className="flex flex-col items-center mb-2">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {type === 'sale' ? 'إيصال بيع / Sales Receipt' : 'إيصال شراء / Purchase Receipt'}
          </h3>
          <div className="text-xs text-slate-500">رقم الإيصال / Receipt #: <span className="font-mono">{receiptNumber}</span></div>
          <div className="text-xs text-slate-500">التاريخ / Date: {date.toLocaleString()}</div>
          {type === 'sale' && (data as any).customerName && (
            <div className="text-xs text-slate-700 font-medium">العميل / Customer: {(data as any).customerName}</div>
          )}
          {type === 'purchase' && (data as any).supplierName && (
            <div className="text-xs text-slate-700 font-medium">المورد / Supplier: {(data as any).supplierName}</div>
          )}
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 text-sm print:text-xs">
          {(data.items || []).map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-end mb-1">
              <div>
                <div className="font-semibold text-slate-800 dark:text-white">{item.product?.nameAr || item.product?.name || item.nameAr || item.name || 'Item'}</div>
                <div className="text-xs text-slate-500">{item.variant?.variantSKU || item.baseSKU || item.product?.baseSKU || ''}</div>
                <div className="text-xs text-slate-400">{item.quantity} × {formatCurrency(item.finalPrice || item.price)}</div>
              </div>
              <div className="font-bold text-slate-900 dark:text-primary">{formatCurrency(item.total || item.price * item.quantity)}</div>
            </div>
          ))}
          <div className="mt-3 border-t pt-3 space-y-2">
            <div className="flex justify-between">
              <div className="text-sm text-slate-600">المجموع / Subtotal</div>
              <div className="font-semibold">{formatCurrency((data as any).subtotal || 0)}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-sm text-slate-600">ضريبة / Tax</div>
              <div className="font-semibold">{formatCurrency((data as any).tax || 0)}</div>
            </div>
            {(data as any).items && (data as any).items.some((it: any) => it.refundedQuantity) && (
              <div className="flex justify-between text-red-600">
                <div className="text-sm">مرتجع / Refunded</div>
                <div className="font-semibold">-{formatCurrency((data as any).items.reduce((s: any, it: any) => s + ((it.refundedQuantity || 0) * (it.price || 0)), 0))}</div>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <div className="text-lg font-bold text-primary dark:text-primary-300">الإجمالي / Total</div>
              <div className="text-lg font-bold text-primary dark:text-primary-300">{formatCurrency((data as any).total || 0)}</div>
            </div>
            <div className="text-sm text-slate-500">الدفع / Payment: {(data as any).paymentMethod || 'cash'}</div>
          </div>
          <div className="text-center mt-4 text-sm font-semibold text-slate-700 dark:text-white">
            {THANKS_AR} / {THANKS_EN}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 print:hidden justify-center">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => {
                const printContent = document.getElementById('receipt-print-area')?.innerHTML || ''
                const w = window.open('', '_blank')
                if (w) {
                  w.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace,sans-serif;font-size:12px;margin:0;padding:0;}@media print{.no-print{display:none}}</style></head><body>${printContent}</body></html>`)
                  w.document.close()
                  w.focus()
                  setTimeout(() => w.print(), 300)
                }
              }}
            >
              Print
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-600 text-white rounded shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={() => {
                const text = document.getElementById('receipt-print-area')?.innerText || ''
                navigator.clipboard.writeText(text)
              }}
            >
              Copy
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              onClick={() => {
                const doc = new jsPDF({ unit: 'mm', format: [58, 100] })
                doc.setFont('courier', 'normal')
                doc.setFontSize(10)
                doc.text(`${STORE_AR(data)} / ${STORE_EN(data)}`, 4, 8)
                doc.text(`${ADDRESS_AR(data)} / ${ADDRESS_EN(data)}`, 4, 13)
                doc.text(`${TAX_AR(data)} / ${TAX_EN(data)}`, 4, 18)
                doc.text(`${PHONE_AR(data)} / ${PHONE_EN(data)}`, 4, 23)
                doc.text(`الكاشير: ${(data as any).cashierNameAr || '---'} / Cashier: ${(data as any).cashierName || '---'}`, 4, 28)
                doc.text(`التاريخ: ${date.toLocaleDateString()} / Date: ${date.toLocaleDateString()}`, 4, 33)
                doc.text(`رقم الإيصال: ${receiptNumber} / Receipt #: ${receiptNumber}`, 4, 38)
                autoTable(doc, {
                  startY: 42,
                  margin: { left: 4, right: 4 },
                  body: (data.items || []).map((item: any) => [item.product?.nameAr || item.product?.name || item.nameAr || item.name, item.quantity, item.finalPrice || item.price]),
                  columns: [
                    { header: 'المنتج', dataKey: 'nameAr' },
                    { header: 'Qty', dataKey: 'quantity' },
                    { header: 'السعر', dataKey: 'price' }
                  ],
                  styles: { fontSize: 8, font: 'courier' }
                })
                doc.text(`الإجمالي: ${(data as any).total} جنيه / Total: EGP ${(data as any).total}`, 4, doc.lastAutoTable.finalY + 6)
                doc.text(`طريقة الدفع: ${(data as any).paymentMethodAr || (data as any).paymentMethod} / Payment: ${(data as any).paymentMethod}`, 4, doc.lastAutoTable.finalY + 11)
                doc.text(`${THANKS_AR} / ${THANKS_EN}`, 4, doc.lastAutoTable.finalY + 16)
                doc.save(`receipt_${receiptNumber}.pdf`)
              }}
            >
              Save PDF
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-yellow-600 text-white rounded shadow hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              onClick={async () => {
                // Send receipt data to main process for ESC/POS printing
                if (window.electron && window.electron.ipcRenderer) {
                  const result = await window.electron.ipcRenderer.invoke('print-escpos-receipt', {
                    ...data,
                    type,
                    receiptNumber,
                    createdAt: date,
                  })
                  if (!result.success) {
                    alert('ESC/POS print failed: ' + result.error)
                  }
                } else {
                  alert('ESC/POS printing not available in this environment.')
                }
              }}
            >
              Print to Thermal Printer
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function formatCurrency(value: number, locale = 'en-US', currency = 'USD') {
  return value.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 2 })
}

export function generateReceiptNumber(prefix = 'R') {
  // Simple human-friendly receipt number using timestamp and random suffix
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.floor(Math.random() * 9000 + 1000).toString()
  return `${prefix}-${ts}-${rand}`
}

export function calculateTotals(items: any[]) {
  const subtotal = items.reduce((sum, it) => sum + (it.total || 0), 0)
  const refunded = items.reduce((sum, it) => sum + ((it.refundedQuantity || 0) * (it.price || 0)), 0)
  const tax = 0 // tax is usually on transaction, so caller provides it
  const total = subtotal - refunded
  return { subtotal, refunded, tax, total }
}

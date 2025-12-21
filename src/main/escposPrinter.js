// Main process: escpos thermal printer integration for Electron
// This file sets up IPC and printing logic for direct ESC/POS printing

const { ipcMain } = require('electron')
const escpos = require('escpos')
// For USB printers, use escpos.USB; for network, use escpos.Network
// You may need to install escpos-usb: npm install escpos escpos-usb

// Example: USB printer
// const device = new escpos.USB()
// const printer = new escpos.Printer(device)

// Example: Network printer
// const device = new escpos.Network('192.168.0.100')
// const printer = new escpos.Printer(device)

ipcMain.handle('print-escpos-receipt', async (event, receiptData) => {
  try {
    // TODO: Replace with your actual printer connection
    const device = new escpos.USB()
    const printer = new escpos.Printer(device)
    device.open(() => {
      printer
        .align('ct')
        .style('b')
        .size(1, 1)
        .text(`${receiptData.storeNameAr || ''} / ${receiptData.storeName || ''}`)
        .text(`${receiptData.storeAddressAr || ''} / ${receiptData.storeAddress || ''}`)
        .text(`${receiptData.storePhoneAr || ''} / ${receiptData.storePhone || ''}`)
        .text('-----------------------------')
        .text(`${receiptData.type === 'sale' ? 'إيصال بيع / Sales Receipt' : 'إيصال شراء / Purchase Receipt'}`)
        .text(`رقم الإيصال / Receipt #: ${receiptData.receiptNumber}`)
        .text(`التاريخ / Date: ${new Date(receiptData.createdAt).toLocaleString()}`)
      if (receiptData.customerName) printer.text(`العميل / Customer: ${receiptData.customerName}`)
      if (receiptData.supplierName) printer.text(`المورد / Supplier: ${receiptData.supplierName}`)
      printer.text('-----------------------------')
      ;(receiptData.items || []).forEach(item => {
        printer.text(`${item.name} x${item.quantity}  ${item.finalPrice || item.price}`)
      })
      printer.text('-----------------------------')
      printer.text(`المجموع / Subtotal: ${receiptData.subtotal}`)
      printer.text(`ضريبة / Tax: ${receiptData.tax}`)
      printer.text(`الإجمالي / Total: ${receiptData.total}`)
      printer.text(`الدفع / Payment: ${receiptData.paymentMethod}`)
      printer.text('-----------------------------')
      printer.text('شكراً لزيارتكم! / Thank you for your visit!')
      printer.cut()
      printer.close()
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

/**
 * Thermal Printer Service
 * Handles ESC/POS thermal printer communication for Egyptian receipts
 * Supports USB and Network printers with Arabic encoding
 */

import escpos from 'escpos'
import USB from 'escpos-usb'
import Network from 'escpos-network'
import iconv from 'iconv-lite'

export interface PrinterSettings {
  printerType: 'none' | 'usb' | 'network' | 'html'
  printerName?: string
  printerIP?: string
  paperWidth: '58mm' | '80mm'
  printLogo?: boolean
  printQRCode?: boolean
  printBarcode?: boolean
  openCashDrawer?: boolean
}

export interface ReceiptData {
  // Store info
  storeName: string
  storeAddress: string
  storePhone: string
  storeEmail?: string
  taxNumber: string
  commercialRegister?: string
  
  // Transaction info
  receiptNumber: string
  date: Date
  paymentMethod: string
  
  // Items
  items: Array<{
    name: string
    quantity: number
    price: number
    total: number
    discountType?: string
    discountValue?: number
    finalPrice?: number
  }>
  
  // Totals
  subtotal: number
  tax: number
  taxRate: number
  total: number
  
  // Optional
  customerName?: string
  notes?: string
}

export class ThermalPrinterService {
  /**
   * Format Egyptian receipt with ESC/POS commands and Arabic encoding
   */
  static formatEgyptianReceipt(data: ReceiptData, settings: PrinterSettings): Buffer {
    const ESC = '\x1B'
    const GS = '\x1D'
    const width = settings.paperWidth === '80mm' ? 48 : 32 // Characters per line
    
    let receipt = ''
    
    // Initialize printer
    receipt += ESC + '@' // Initialize
    receipt += ESC + 't' + '\x06' // Set character code table to Windows-1256 (Arabic)
    
    // Store name (center, bold, double size)
    receipt += ESC + 'a' + '\x01' // Center align
    receipt += ESC + 'E' + '\x01' // Bold on
    receipt += GS + '!' + '\x11'  // Double width and height
    receipt += data.storeName + '\n'
    receipt += GS + '!' + '\x00'  // Normal size
    receipt += ESC + 'E' + '\x00' // Bold off
    receipt += '\n'
    
    // Store address
    receipt += data.storeAddress + '\n'
    receipt += 'ت: ' + data.storePhone + '\n'
    if (data.storeEmail) {
      receipt += data.storeEmail + '\n'
    }
    receipt += '\n'
    
    // Tax number (required by Egyptian law)
    receipt += 'الرقم الضريبي: ' + data.taxNumber + '\n'
    if (data.commercialRegister) {
      receipt += 'س.ت: ' + data.commercialRegister + '\n'
    }
    receipt += '='.repeat(width) + '\n'
    
    // Receipt number and date
    receipt += ESC + 'a' + '\x00' // Left align
    receipt += 'رقم الفاتورة: ' + data.receiptNumber + '\n'
    receipt += 'التاريخ: ' + data.date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + '\n'
    
    if (data.customerName) {
      receipt += 'العميل: ' + data.customerName + '\n'
    }
    
    receipt += '='.repeat(width) + '\n'
    
    // Column headers
    const colWidth = settings.paperWidth === '80mm' ? 
      { name: 20, qty: 4, price: 10, total: 12 } :
      { name: 12, qty: 3, price: 7, total: 8 }
    
    receipt += 'الصنف'.padEnd(colWidth.name) + 
               'الكمية'.padEnd(colWidth.qty) + 
               'السعر'.padEnd(colWidth.price) + 
               'المجموع'.padEnd(colWidth.total) + '\n'
    receipt += '-'.repeat(width) + '\n'
    
    // Items
    for (const item of data.items) {
      // item.price is the FINAL price after discount
      // Calculate original price based on discount type
      let originalPrice = item.price
      let discount = 0
      const hasDiscount = item.discountType && item.discountType !== 'NONE' && item.discountValue && item.discountValue > 0
      
      if (hasDiscount && item.discountValue) {
        if (item.discountType === 'PERCENTAGE') {
          // If final = original * (1 - discount%), then original = final / (1 - discount%)
          originalPrice = item.price / (1 - item.discountValue / 100)
          discount = (originalPrice * item.quantity) - (item.price * item.quantity)
        } else {
          // Fixed discount: original = final + discount
          originalPrice = item.price + (item.discountValue / item.quantity)
          discount = item.discountValue
        }
      }
      
      const name = item.name.substring(0, colWidth.name - 1).padEnd(colWidth.name)
      const qty = item.quantity.toString().padEnd(colWidth.qty)
      const price = originalPrice.toFixed(2).padEnd(colWidth.price)
      const total = (originalPrice * item.quantity).toFixed(2).padEnd(colWidth.total)
      
      receipt += name + qty + price + total + ' ج.م\n'
      
      // Add discount line if applicable
      if (hasDiscount) {
        const finalTotal = item.price * item.quantity
        
        receipt += '  خصم '.padEnd(colWidth.name) + 
                   ' '.padEnd(colWidth.qty) + 
                   (item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : 'ثابت').padEnd(colWidth.price) + 
                   `-${discount.toFixed(2)}`.padEnd(colWidth.total) + ' ج.م\n'
        receipt += '  بعد الخصم: '.padEnd(colWidth.name + colWidth.qty + colWidth.price) + 
                   finalTotal.toFixed(2).padEnd(colWidth.total) + ' ج.م\n'
      }
    }
    
    receipt += '='.repeat(width) + '\n'
    
    // Subtotal
    receipt += ESC + 'a' + '\x02' // Right align
    receipt += 'الإجمالي الفرعي:    ' + data.subtotal.toFixed(2) + ' ج.م\n'
    
    // Tax (14% in Egypt)
    receipt += 'ضريبة القيمة المضافة (' + data.taxRate + '%): ' + data.tax.toFixed(2) + ' ج.م\n'
    receipt += '-'.repeat(width) + '\n'
    
    // Total (bold, large)
    receipt += ESC + 'E' + '\x01' // Bold on
    receipt += GS + '!' + '\x11'  // Double size
    receipt += 'الإجمالي:           ' + data.total.toFixed(2) + ' ج.م\n'
    receipt += GS + '!' + '\x00'  // Normal size
    receipt += ESC + 'E' + '\x00' // Bold off
    receipt += '='.repeat(width) + '\n'
    
    // Payment method
    receipt += ESC + 'a' + '\x01' // Center align
    receipt += 'طريقة الدفع: ' + data.paymentMethod + '\n'
    receipt += '\n'
    
    // Footer message
    receipt += '        شكراً لزيارتكم\n'
    receipt += '     نسعد بخدمتكم دائماً\n'
    receipt += '\n\n'
    
    // Optional QR code (for digital receipt)
    if (settings.printQRCode) {
      // QR code with receipt number
      receipt += GS + '(k' + '\x04\x00\x31\x41\x32\x00' // QR model
      receipt += GS + '(k' + '\x03\x00\x31\x43\x08' // Error correction
      receipt += GS + '(k' + String.fromCharCode(data.receiptNumber.length + 3, 0) + '\x31\x50\x30'
      receipt += data.receiptNumber
      receipt += GS + '(k' + '\x03\x00\x31\x51\x30' // Print QR
      receipt += '\n\n'
    }
    
    // Cut paper
    receipt += GS + 'V' + '\x41' + '\x03' // Partial cut
    
    // Open cash drawer (if enabled)
    if (settings.openCashDrawer) {
      receipt += ESC + 'p' + '\x00' + '\x19' + '\xFA' // Open drawer
    }
    
    // Convert to Windows-1256 encoding for Arabic support
    return iconv.encode(receipt, 'windows-1256')
  }

  /**
   * Detect USB printers
   */
  static async detectUSBPrinters(): Promise<any[]> {
    try {
      // @ts-ignore - USB.findPrinter() exists but types may not be perfect
      const devices = USB.findPrinter()
      return devices || []
    } catch (error) {
      console.error('Error detecting USB printers:', error)
      return []
    }
  }

  /**
   * Print to USB thermal printer
   */
  static async printUSB(receiptBuffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const device = new USB()
        const printer = new escpos.Printer(device)

        device.open((error: any) => {
          if (error) {
            reject(new Error(`Failed to open USB printer: ${error.message}`))
            return
          }

          try {
            printer
              .raw(receiptBuffer)
              .close()
            
            resolve()
          } catch (printError: any) {
            reject(new Error(`Print failed: ${printError.message}`))
          }
        })
      } catch (error: any) {
        reject(new Error(`USB printer error: ${error.message}`))
      }
    })
  }

  /**
   * Print to network thermal printer (most common in Egyptian shops)
   */
  static async printNetwork(receiptBuffer: Buffer, printerIP: string, port: number = 9100): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const device = new Network(printerIP, port)
        const printer = new escpos.Printer(device)

        device.open((error: any) => {
          if (error) {
            reject(new Error(`Failed to connect to printer at ${printerIP}:${port}`))
            return
          }

          try {
            printer
              .raw(receiptBuffer)
              .close()
            
            resolve()
          } catch (printError: any) {
            reject(new Error(`Print failed: ${printError.message}`))
          }
        })
      } catch (error: any) {
        reject(new Error(`Network printer error: ${error.message}`))
      }
    })
  }

  /**
   * Test printer connection
   */
  static async testPrinter(settings: PrinterSettings): Promise<{ success: boolean; message: string }> {
    try {
      const testReceipt = this.formatEgyptianReceipt({
        storeName: 'اختبار الطابعة',
        storeAddress: 'Test Address',
        storePhone: '0123456789',
        taxNumber: '123-456-789',
        receiptNumber: 'TEST-001',
        date: new Date(),
        paymentMethod: 'نقدي',
        items: [
          { name: 'منتج تجريبي', quantity: 1, price: 10, total: 10 }
        ],
        subtotal: 10,
        tax: 1.4,
        taxRate: 14,
        total: 11.4
      }, settings)

      if (settings.printerType === 'usb') {
        await this.printUSB(testReceipt)
      } else if (settings.printerType === 'network' && settings.printerIP) {
        await this.printNetwork(testReceipt, settings.printerIP)
      } else {
        throw new Error('Invalid printer configuration')
      }

      return { success: true, message: 'Test print successful!' }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }
}

/**
 * Thermal Printer Service
 * Handles thermal printer communication for Egyptian receipts
 * Uses node-thermal-printer for raw ESC/POS commands
 */

import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer'

export interface PrinterSettings {
  printerType: 'none' | 'usb' | 'network' | 'html'
  printerName?: string
  printerIP?: string
  paperWidth: '58mm' | '80mm'
  receiptBottomSpacing?: number
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
   * Print to CUPS printer using lp command
   */
  private static async printToCUPS(printerName: string, data: string): Promise<void> {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    const fs = require('fs').promises
    const path = require('path')
    const os = require('os')

    // Create temp file with UTF-8 encoding
    const tempFile = path.join(os.tmpdir(), `receipt-${Date.now()}.txt`)
    // Write with UTF-8 BOM to ensure proper encoding
    const utf8BOM = '\uFEFF'
    await fs.writeFile(tempFile, utf8BOM + data, 'utf8')

    try {
      // Print using lp command without raw option to allow CUPS to handle encoding
      await execAsync(`lp -d ${printerName} "${tempFile}"`)
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFile)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Format receipt as plain text for CUPS
   */
  private static formatReceiptText(data: ReceiptData, settings: PrinterSettings): string {
    const width = settings.paperWidth === '80mm' ? 48 : 32
    const line = '='.repeat(width)
    const dashes = '-'.repeat(width)
    
    let text = '\n'
    
    // Store name (centered)
    text += data.storeName.toUpperCase() + '\n'
    text += data.storeAddress + '\n'
    text += `Tel: ${data.storePhone}\n`
    if (data.storeEmail) text += data.storeEmail + '\n'
    text += '\n'
    
    // Tax info
    text += dashes + '\n'
    text += `Tax No: ${data.taxNumber}\n`
    if (data.commercialRegister) text += `CR: ${data.commercialRegister}\n`
    text += dashes + '\n'
    text += '\n'
    
    // Receipt info
    text += `Receipt: ${data.receiptNumber}\n`
    text += `Date: ${data.date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}\n`
    if (data.customerName) text += `Customer: ${data.customerName}\n`
    
    // Items Table
    text += dashes + '\n'
    text += 'Total     Price   Qty   Item\n'
    text += dashes + '\n'
    
    // Items with discount calculation matching preview
    data.items.forEach(item => {
      const hasDiscount = item.discountType && item.discountType !== 'NONE' && item.discountValue > 0
      
      // Calculate original price (item.price is final price after discount)
      let originalPrice = item.price
      let itemDiscount = 0
      
      if (hasDiscount) {
        if (item.discountType === 'PERCENTAGE') {
          originalPrice = item.price / (1 - item.discountValue / 100)
          itemDiscount = (originalPrice * item.quantity) - (item.price * item.quantity)
        } else {
          originalPrice = item.price + (item.discountValue / item.quantity)
          itemDiscount = item.discountValue
        }
      }
      
      const originalTotal = originalPrice * item.quantity
      const finalTotal = item.price * item.quantity
      
      // Item row with original price
      const name = item.name.substring(0, 20)
      text += `${originalTotal.toFixed(2).padStart(8)}  ${originalPrice.toFixed(2).padStart(7)}  ${item.quantity.toString().padStart(3)}  ${name}\n`
      
      // Discount row if applicable
      if (hasDiscount) {
        const discountLabel = item.discountType === 'PERCENTAGE' 
          ? `Disc ${item.discountValue}%` 
          : 'Fixed Disc'
        text += `-${itemDiscount.toFixed(2).padStart(7)} EGP     ${discountLabel}\n`
        text += `After Disc: ${finalTotal.toFixed(2)} EGP\n`
      }
      
      text += dashes + '\n'
    })
    
    // Totals
    text += '\n'
    text += `Subtotal:           ${data.subtotal.toFixed(2)} EGP\n`
    text += `VAT (${data.taxRate}%):        ${data.tax.toFixed(2)} EGP\n`
    text += line + '\n'
    text += `TOTAL:              ${data.total.toFixed(2)} EGP\n`
    text += line + '\n'
    text += '\n'
    
    // Payment
    text += `Payment Method: ${data.paymentMethod}\n`
    text += '\n'
    text += dashes + '\n'
    text += 'Thank you for your visit!\n'
    text += 'We are happy to serve you\n'
    
    // Add blank lines for easy tearing (configurable spacing)
    const blankLines = settings.receiptBottomSpacing ?? 4
    text += '\n'.repeat(blankLines)
    
    return text
  }
  private static createPrinter(settings: PrinterSettings): ThermalPrinter {
    let printerInterface: string
    
    if (settings.printerType === 'network' && settings.printerIP) {
      printerInterface = `tcp://${settings.printerIP}:9100`
    } else if (settings.printerName) {
      // Check if it's a USB URI (usb://...)
      if (settings.printerName.startsWith('usb://')) {
        printerInterface = settings.printerName
      }
      // If it starts with /, it's a device path
      else if (settings.printerName.startsWith('/')) {
        printerInterface = settings.printerName
      }
      // Otherwise it's a CUPS printer name
      else {
        printerInterface = `printer:${settings.printerName}`
      }
    } else {
      printerInterface = '/dev/usb/lp0'
    }

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON, // ESC/POS compatible
      interface: printerInterface,
      removeSpecialCharacters: false,
      lineCharacter: '-',
      width: settings.paperWidth === '80mm' ? 48 : 32
    })
    return printer
  }

  /**
   * Print receipt
   */
  static async printReceipt(data: ReceiptData, settings: PrinterSettings): Promise<void> {
    try {
      // Check if using CUPS printer (non-device path)
      if (settings.printerType === 'usb' && settings.printerName && 
          !settings.printerName.startsWith('/') && !settings.printerName.startsWith('tcp://')) {
        // Use CUPS lp command
        const text = this.formatReceiptText(data, settings)
        await this.printToCUPS(settings.printerName, text)
        return
      }

      // Auto-detect if printer name is empty or default
      if (settings.printerType === 'usb' && (!settings.printerName || settings.printerName === '/dev/usb/lp0')) {
        const detectedPrinters = await this.detectUSBPrinters()
        
        if (detectedPrinters.length > 0) {
          const firstPrinter = detectedPrinters[0]
          settings.printerName = firstPrinter.path
          
          // Save to localStorage (will be picked up by renderer)
          // Note: This runs in main process, need to send back to renderer
        } else {
          throw new Error('No USB thermal printers detected. Please connect your printer and try again.')
        }
      }

      // Otherwise use node-thermal-printer for direct device access
      const printer = this.createPrinter(settings)

      // Initialize
      printer.alignCenter()
      printer.bold(true)
      printer.setTextSize(1, 1)
      printer.println(data.storeName)
      printer.bold(false)
      printer.setTextNormal()
      printer.newLine()

      // Store info
      printer.println(data.storeAddress)
      printer.println(`Tel: ${data.storePhone}`)
      if (data.storeEmail) {
        printer.println(data.storeEmail)
      }
      printer.newLine()

      // Tax number
      printer.println(`Tax No: ${data.taxNumber}`)
      if (data.commercialRegister) {
        printer.println(`Reg: ${data.commercialRegister}`)
      }
      printer.drawLine()
      printer.newLine()

      // Receipt info
      printer.alignLeft()
      printer.println(`Receipt: ${data.receiptNumber}`)
      printer.println(`Date: ${data.date.toLocaleString()}`)
      if (data.customerName) {
        printer.println(`Customer: ${data.customerName}`)
      }
      printer.drawLine()

      // Items header
      printer.println('Item                Qty   Price   Total')
      printer.drawLine()

      // Items
      data.items.forEach(item => {
        const name = item.name.substring(0, 20).padEnd(20)
        const qty = item.quantity.toString().padStart(3)
        const price = item.price.toFixed(2).padStart(7)
        const total = item.total.toFixed(2).padStart(7)
        printer.println(`${name}${qty}${price}${total}`)

        // Discount
        if (item.discountType && item.discountType !== 'NONE' && item.discountValue) {
          const discountText = item.discountType === 'PERCENTAGE'
            ? `  Discount: -${item.discountValue}%`
            : `  Discount: -$${item.discountValue.toFixed(2)}`
          printer.println(discountText)
        }
      })

      printer.drawLine()

      // Totals
      printer.println(`Subtotal:${' '.repeat(27)}$${data.subtotal.toFixed(2)}`)
      printer.println(`Tax (${data.taxRate}%):${' '.repeat(24)}$${data.tax.toFixed(2)}`)
      
      printer.bold(true)
      printer.setTextSize(1, 1)
      printer.println(`TOTAL:${' '.repeat(30)}$${data.total.toFixed(2)}`)
      printer.bold(false)
      printer.setTextNormal()
      printer.drawLine()

      // Payment method
      printer.alignCenter()
      printer.newLine()
      printer.println(`Payment: ${data.paymentMethod}`)
      printer.newLine()
      printer.println('Thank you!')
      printer.println('Please come again')

      // Feed and cut (configurable spacing)
      const blankLines = settings.receiptBottomSpacing ?? 4
      for (let i = 0; i < blankLines; i++) {
        printer.newLine()
      }
      
      if (settings.openCashDrawer) {
        printer.openCashDrawer()
      }
      
      printer.cut()

      // Execute print
      await printer.execute()
    } catch (error: any) {
      console.error('❌ Print error:', error)
      throw new Error(`Failed to print: ${error.message}`)
    }
  }

  /**
   * Test printer
   */
  static async testPrinter(settings: PrinterSettings): Promise<{ success: boolean; message: string }> {
    try {
      // Check if using CUPS printer
      if (settings.printerType === 'usb' && settings.printerName && 
          !settings.printerName.startsWith('/') && !settings.printerName.startsWith('tcp://')) {
        // Use CUPS lp command for test
        const testText = '\n' +
          'PRINTER TEST\n' +
          '================================\n' +
          '\n' +
          `Date: ${new Date().toLocaleString()}\n` +
          `Paper Width: ${settings.paperWidth}\n` +
          `Printer Type: ${settings.printerType}\n` +
          `Printer: ${settings.printerName}\n` +
          '\n' +
          '================================\n' +
          '\n' +
          'Test Successful!\n' +
          'ZKT eco ZKP8012\n' +
          '\n\n\n\n'

        await this.printToCUPS(settings.printerName, testText)
        
        return {
          success: true,
          message: 'Test print sent successfully via CUPS. Check printer output.'
        }
      }

      // Otherwise use node-thermal-printer
      const printer = this.createPrinter(settings)

      // Check if printer is connected
      const isConnected = await printer.isPrinterConnected()
      
      if (!isConnected) {
        return {
          success: false,
          message: 'Printer not connected. Check USB cable or IP address.'
        }
      }

      printer.alignCenter()
      printer.bold(true)
      printer.setTextSize(1, 1)
      printer.println('PRINTER TEST')
      printer.bold(false)
      printer.setTextNormal()
      printer.newLine()
      printer.drawLine()
      printer.newLine()

      printer.alignLeft()
      printer.println(`Date: ${new Date().toLocaleString()}`)
      printer.println(`Paper Width: ${settings.paperWidth}`)
      printer.println(`Printer Type: ${settings.printerType}`)
      if (settings.printerIP) {
        printer.println(`Printer IP: ${settings.printerIP}`)
      }
      if (settings.printerName) {
        printer.println(`Printer: ${settings.printerName}`)
      }
      printer.newLine()
      printer.drawLine()
      printer.newLine()

      printer.alignCenter()
      printer.bold(true)
      printer.println('Test Successful!')
      printer.bold(false)
      printer.println('ZKT eco ZKP8012')

      printer.newLine()
      printer.newLine()
      printer.newLine()
      printer.cut()

      await printer.execute()

      return {
        success: true,
        message: 'Test print sent successfully. Check printer output.'
      }
    } catch (error: any) {
      console.error('❌ Test print failed:', error)
      const errorMessage = error.message || error.toString()
      console.error('Full error:', errorMessage)
      
      return {
        success: false,
        message: `Test failed: ${errorMessage}. Check printer path, permissions, and connection.`
      }
    }
  }

  /**
   * Auto-detect USB thermal printers
   */
  static async detectUSBPrinters(): Promise<Array<{ path: string; name: string }>> {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    const printers: Array<{ path: string; name: string }> = []

    try {
      // Get CUPS printers with lpstat -a
      try {
        const { stdout } = await execAsync('lpstat -a 2>/dev/null || true')
        const lines = stdout.split('\n')
        
        for (const line of lines) {
          const match = line.match(/^(\S+)\s+/)
          if (match) {
            const printerName = match[1]
            printers.push({
              path: printerName,
              name: `${printerName} (CUPS Printer)`
            })
          }
        }
      } catch (error) {
        // lpstat command not available, silently fail
      }

      // If no printers found, return default
      if (printers.length === 0) {
        return [
          { path: 'ZKP8012', name: 'ZKP8012 (Default)' }
        ]
      }

      return printers
    } catch (error) {
      console.error('Error detecting USB printers:', error)
      return [
        { path: 'ZKP8012', name: 'ZKP8012 (Default)' }
      ]
    }
  }

  /**
   * Get available printers (for compatibility)
   */
  static async getAvailablePrinters(): Promise<string[]> {
    const detectedPrinters = await this.detectUSBPrinters()
    return detectedPrinters.map(p => p.path)
  }
}

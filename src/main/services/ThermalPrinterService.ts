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
   * Print to CUPS printer using lp command with raw ESC/POS data
   */
  private static async printToCUPS(printerName: string, data: string, settings: PrinterSettings): Promise<void> {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    const fs = require('fs').promises
    const path = require('path')
    const os = require('os')

    // Create temp file with ESC/POS commands + text data + cut command
    const tempFile = path.join(os.tmpdir(), `receipt-${Date.now()}.bin`)
    
    // ESC/POS initialization commands
    const initCommand = Buffer.from([0x1B, 0x40]) // ESC @ - Initialize printer
    
    // Set left margin to 0 (GS L)
    const leftMargin = Buffer.from([0x1D, 0x4C, 0x00, 0x00])
    
    // Set print area width based on paper width
    // GS W - Set printing area width
    // For 80mm paper: 576 dots (0x40, 0x02) at 203 DPI
    // For 58mm paper: 384 dots (0x80, 0x01) at 203 DPI
    let printWidth: Buffer
    if (settings.paperWidth === '80mm') {
      printWidth = Buffer.from([0x1D, 0x57, 0x40, 0x02]) // 576 dots for 80mm
    } else {
      printWidth = Buffer.from([0x1D, 0x57, 0x80, 0x01]) // 384 dots for 58mm
    }
    
    const textBuffer = Buffer.from(data, 'utf8')
    
    // Add ESC/POS cut command: GS V 0 (Full cut)
    const cutCommand = Buffer.from([0x1D, 0x56, 0x00])
    
    // Combine all commands
    const fullBuffer = Buffer.concat([initCommand, leftMargin, printWidth, textBuffer, cutCommand])
    
    await fs.writeFile(tempFile, fullBuffer)

    try {
      // Print using lp command with raw option for ESC/POS commands
      await execAsync(`lp -d ${printerName} -o raw "${tempFile}"`)
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
   * Format receipt as plain text for thermal printing
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
    if (data.commercialRegister) text += `Comm Reg: ${data.commercialRegister}\n`
    text += dashes + '\n'
    text += '\n'
    
    // Receipt info
    text += `Receipt #: ${data.receiptNumber}\n`
    text += `Date: ${data.date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}\n`
    if (data.customerName) text += `Customer: ${data.customerName}\n`
    text += dashes + '\n'
    
    // Items with discount calculation
    data.items.forEach(item => {
      const hasDiscount = item.discountType && item.discountType !== 'NONE' && item.discountValue !== undefined && item.discountValue > 0
      
      let originalPrice = item.price
      let itemDiscount = 0
      
      if (hasDiscount && item.discountValue !== undefined) {
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
      
      // Item details
      text += item.name + '\n'
      text += `${item.quantity} x ${originalPrice.toFixed(2)} = ${originalTotal.toFixed(2)} EGP\n`
      
      if (hasDiscount) {
        const discountLabel = item.discountType === 'PERCENTAGE' 
          ? `Discount ${item.discountValue}%` 
          : 'Fixed Discount'
        text += `${discountLabel}: -${itemDiscount.toFixed(2)} EGP\n`
        text += `After Discount: ${finalTotal.toFixed(2)} EGP\n`
      }
      
      text += dashes + '\n'
    })
    
    // Totals
    text += '\n'
    text += `Subtotal: ${data.subtotal.toFixed(2)} EGP\n`
    text += `VAT (${data.taxRate}%): ${data.tax.toFixed(2)} EGP\n`
    text += line + '\n'
    text += `TOTAL: ${data.total.toFixed(2)} EGP\n`
    text += line + '\n'
    text += '\n'
    
    // Payment
    text += `Payment: ${data.paymentMethod}\n`
    text += '\n'
    text += 'Thank you for your visit!\n'
    text += 'We appreciate your business\n'
    
    // Add blank lines for easy tearing
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
   * Format and print receipt
   */
  private static async formatAndPrintReceipt(printer: ThermalPrinter, data: ReceiptData, settings: PrinterSettings): Promise<void> {
    
    // Store info
    printer.alignCenter()
    printer.bold(true)
    printer.setTextSize(1, 1)
    printer.println(data.storeName.toUpperCase())
    printer.bold(false)
    printer.setTextNormal()
    printer.println(data.storeAddress)
    printer.println(`Tel: ${data.storePhone}`)
    if (data.storeEmail) {
      printer.println(data.storeEmail)
    }
    printer.newLine()

    // Tax info
    printer.drawLine()
    printer.println(`Tax No: ${data.taxNumber}`)
    if (data.commercialRegister) {
      printer.println(`Comm Reg: ${data.commercialRegister}`)
    }
    printer.drawLine()
    printer.newLine()

    // Receipt info
    printer.alignLeft()
    printer.println(`Receipt #: ${data.receiptNumber}`)
    printer.println(`Date: ${data.date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`)
    if (data.customerName) {
      printer.println(`Customer: ${data.customerName}`)
    }
    printer.drawLine()

    // Items with discount calculation
    data.items.forEach(item => {
      const hasDiscount = item.discountType && item.discountType !== 'NONE' && item.discountValue !== undefined && item.discountValue > 0
      
      let originalPrice = item.price
      let itemDiscount = 0
      
      if (hasDiscount && item.discountValue !== undefined) {
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
      
      // Item name and details
      printer.println(item.name)
      printer.println(`${item.quantity} x ${originalPrice.toFixed(2)} = ${originalTotal.toFixed(2)} EGP`)
      
      if (hasDiscount && item.discountValue !== undefined) {
        const discountLabel = item.discountType === 'PERCENTAGE' 
          ? `Discount ${item.discountValue}%` 
          : 'Fixed Discount'
        printer.println(`${discountLabel}: -${itemDiscount.toFixed(2)} EGP`)
        printer.println(`After Discount: ${finalTotal.toFixed(2)} EGP`)
      }
      
      printer.drawLine()
    })

    // Totals
    printer.newLine()
    printer.println(`Subtotal: ${data.subtotal.toFixed(2)} EGP`)
    printer.println(`VAT (${data.taxRate}%): ${data.tax.toFixed(2)} EGP`)
    printer.drawLine()
    printer.bold(true)
    printer.setTextSize(1, 1)
    printer.println(`TOTAL: ${data.total.toFixed(2)} EGP`)
    printer.bold(false)
    printer.setTextNormal()
    printer.drawLine()

    // Payment
    printer.alignCenter()
    printer.newLine()
    printer.println(`Payment: ${data.paymentMethod}`)
    printer.newLine()
    printer.println('Thank you for your visit!')
    printer.println('We appreciate your business')

    // Add spacing
    const blankLines = settings.receiptBottomSpacing ?? 4
    for (let i = 0; i < blankLines; i++) {
      printer.newLine()
    }
    
    if (settings.openCashDrawer) {
      printer.openCashDrawer()
    }
    
    printer.cut()
    await printer.execute()
  }

  /**
   * Print receipt
   */
  static async printReceipt(data: ReceiptData, settings: PrinterSettings): Promise<void> {
    try {
      // For CUPS printers, use direct CUPS printing
      if (settings.printerType === 'usb' && settings.printerName && 
          !settings.printerName.startsWith('/') && !settings.printerName.startsWith('tcp://')) {
        
        const text = this.formatReceiptText(data, settings)
        await this.printToCUPS(settings.printerName, text, settings)
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
          throw new Error('No thermal printers detected. Please connect your printer and configure it in Settings → Tax & Receipt Settings.')
        }
      }

      // Otherwise use node-thermal-printer for direct device access
      const printer = this.createPrinter(settings)
      await this.formatAndPrintReceipt(printer, data, settings)
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

        await this.printToCUPS(settings.printerName, testText, settings)
        
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

      // Return detected printers or empty array
      return printers
    } catch (error) {
      console.error('Error detecting USB printers:', error)
      return []
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

import { ipcMain } from 'electron'
import { ThermalPrinterService, ReceiptData, PrinterSettings } from '../../services/ThermalPrinterService'

/**
 * Receipt printing IPC handlers
 */

export function registerReceiptHandlers(): void {
  // Print receipt
  ipcMain.handle('receipt:print', async (_event, data: {
    receiptData: ReceiptData
    settings: PrinterSettings
  }) => {
    try {
      const { receiptData, settings } = data
      
      // Format receipt
      const receiptBuffer = ThermalPrinterService.formatEgyptianReceipt(receiptData, settings)
      
      // Print based on printer type
      if (settings.printerType === 'usb') {
        await ThermalPrinterService.printUSB(receiptBuffer)
      } else if (settings.printerType === 'network' && settings.printerIP) {
        await ThermalPrinterService.printNetwork(receiptBuffer, settings.printerIP)
      } else if (settings.printerType === 'html') {
        // For HTML/PDF printing, return the buffer as base64
        return {
          success: true,
          buffer: receiptBuffer.toString('base64')
        }
      } else {
        throw new Error('No printer configured')
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('Print error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to print receipt'
      }
    }
  })

  // Detect USB printers
  ipcMain.handle('receipt:detectPrinters', async () => {
    try {
      const printers = await ThermalPrinterService.detectUSBPrinters()
      return { success: true, printers }
    } catch (error: any) {
      console.error('Detect printers error:', error)
      return { 
        success: false, 
        error: error.message,
        printers: [] 
      }
    }
  })

  // Test printer connection
  ipcMain.handle('receipt:testPrint', async (_event, settings: PrinterSettings) => {
    try {
      const result = await ThermalPrinterService.testPrinter(settings)
      return result
    } catch (error: any) {
      console.error('Test print error:', error)
      return { 
        success: false, 
        message: error.message || 'Test print failed'
      }
    }
  })
}

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
      
      // Validate settings to prevent injection
      if (settings.printerName && typeof settings.printerName !== 'string') {
        throw new Error('Invalid printer name type')
      }
      if (settings.printerIP && typeof settings.printerIP !== 'string') {
        throw new Error('Invalid printer IP type')
      }
      
      console.log('📄 Receipt print requested:', {
        type: settings.printerType,
        name: settings.printerName,
        items: receiptData.items?.length || 0
      })
      
      // Auto-detect USB printer if not configured
      if (settings.printerType === 'usb' && (!settings.printerName || settings.printerName === '/dev/usb/lp0')) {
        console.log('🔍 Auto-detecting USB printer...')
        const printers = await ThermalPrinterService.detectUSBPrinters()
        
        if (printers.length > 0) {
          const detectedPrinter = printers[0]
          console.log('✅ Auto-detected:', detectedPrinter.name, '→', detectedPrinter.path)
          settings.printerName = detectedPrinter.path
          
          // Return detected printer info to save in UI
          await ThermalPrinterService.printReceipt(receiptData, settings)
          
          return { 
            success: true, 
            detectedPrinter: detectedPrinter.path,
            message: `Printer auto-detected: ${detectedPrinter.name}`
          }
        } else {
          return {
            success: false,
            error: 'No USB thermal printers found. Please connect your printer and try again.'
          }
        }
      }
      
      // Use updated ThermalPrinterService
      await ThermalPrinterService.printReceipt(receiptData, settings)
      
      console.log('✅ Receipt printed successfully')
      return { success: true }
    } catch (error: any) {
      console.error('❌ Receipt print error:', error)
      
      // If print fails with USB, try auto-detection as fallback
      if (data.settings.printerType === 'usb') {
        console.log('🔄 Print failed, attempting auto-detection...')
        try {
          const printers = await ThermalPrinterService.detectUSBPrinters()
          
          if (printers.length > 0) {
            const detectedPrinter = printers[0]
            console.log('✅ Auto-detected:', detectedPrinter.name)
            data.settings.printerName = detectedPrinter.path
            
            // Retry print with detected printer
            await ThermalPrinterService.printReceipt(data.receiptData, data.settings)
            
            return { 
              success: true,
              detectedPrinter: detectedPrinter.path,
              message: `Printer auto-detected and recovered: ${detectedPrinter.name}`
            }
          }
        } catch (retryError) {
          console.error('❌ Auto-detection failed:', retryError)
        }
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to print receipt'
      }
    }
  })

  // Get available printers with auto-detection
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

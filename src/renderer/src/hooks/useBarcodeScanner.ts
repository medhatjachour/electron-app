/**
 * Barcode Scanner Hook
 * Listens for barcode scanner input and triggers callback
 * Handles rapid scanning without lag
 */

import { useEffect, useRef, useCallback } from 'react'

type BarcodeScannerOptions = {
  onScan: (barcode: string) => void | Promise<void>
  minLength?: number // Minimum barcode length (default: 3)
  maxLength?: number // Maximum barcode length (default: 50)
  timeout?: number // Timeout between keystrokes in ms (default: 100)
  prefix?: string // Expected prefix (optional)
  suffix?: string // Expected suffix like Enter key (default: 'Enter')
  preventDuplicates?: boolean // Prevent duplicate scans within short time
  duplicateTimeout?: number // Time window for duplicate prevention (default: 1000ms)
}

export function useBarcodeScanner(options: BarcodeScannerOptions) {
  const {
    onScan,
    minLength = 3,
    maxLength = 50,
    timeout = 100,
    prefix,
    suffix = 'Enter',
    preventDuplicates = true,
    duplicateTimeout = 1000
  } = options

  const buffer = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScannedRef = useRef<string>('')
  const lastScanTimeRef = useRef<number>(0)
  const isProcessingRef = useRef<boolean>(false)

  const processBarcode = useCallback(async (barcode: string) => {
    // Trim whitespace
    const trimmedBarcode = barcode.trim()

    // Validate length
    if (trimmedBarcode.length < minLength || trimmedBarcode.length > maxLength) {
      return
    }

    // Check for prefix if specified
    if (prefix && !trimmedBarcode.startsWith(prefix)) {
      return
    }

    // Remove prefix if present
    const finalBarcode = prefix ? trimmedBarcode.slice(prefix.length) : trimmedBarcode

    // Prevent duplicates within time window
    if (preventDuplicates) {
      const now = Date.now()
      if (
        finalBarcode === lastScannedRef.current &&
        now - lastScanTimeRef.current < duplicateTimeout
      ) {
        return
      }
      lastScannedRef.current = finalBarcode
      lastScanTimeRef.current = now
    }

    // Prevent concurrent processing
    if (isProcessingRef.current) {
      return
    }

    try {
      isProcessingRef.current = true
      await onScan(finalBarcode)
    } finally {
      isProcessingRef.current = false
    }
  }, [onScan, minLength, maxLength, prefix, preventDuplicates, duplicateTimeout])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea (except our barcode detection)
      const target = event.target as HTMLElement
      const isInputField = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Allow barcode scanner to work even in input fields
      // Barcode scanners type very fast, so we can detect them
      
      // Clear timeout on each keystroke
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Handle Enter key (or custom suffix)
      if (event.key === suffix) {
        event.preventDefault()
        
        if (buffer.current.length >= minLength) {
          processBarcode(buffer.current)
        }
        
        buffer.current = ''
        return
      }

      // Ignore modifier keys
      if (
        event.key === 'Shift' ||
        event.key === 'Control' ||
        event.key === 'Alt' ||
        event.key === 'Meta' ||
        event.key === 'Tab' ||
        event.key === 'Escape'
      ) {
        return
      }

      // Ignore if it's a shortcut (Ctrl/Cmd + key)
      if (event.ctrlKey || event.metaKey) {
        buffer.current = ''
        return
      }

      // Add character to buffer
      if (event.key.length === 1) {
        // If typing in input field, only accumulate if typing very fast (barcode scanner)
        if (isInputField) {
          // Check typing speed - barcode scanners type in < 50ms per character
          const now = Date.now()
          const timeSinceLastKey = now - lastScanTimeRef.current
          
          if (timeSinceLastKey > 50 && buffer.current.length === 0) {
            // Normal human typing, ignore
            return
          }          
          // Update last key time for next keystroke
          lastScanTimeRef.current = now        }

        buffer.current += event.key

        // Prevent buffer overflow
        if (buffer.current.length > maxLength) {
          buffer.current = ''
          return
        }

        // Set timeout to clear buffer if no more input
        timeoutRef.current = setTimeout(() => {
          buffer.current = ''
        }, timeout)
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [processBarcode, timeout, suffix, minLength, maxLength])

  return {
    // Expose method to manually trigger scan (useful for testing)
    manualScan: processBarcode
  }
}

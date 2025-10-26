/**
 * useToast Hook
 * 
 * Provides toast notification functionality with multiple toasts support
 * 
 * @example
 * ```tsx
 * const toast = useToast()
 * 
 * toast.success('Item saved!')
 * toast.error('Failed to delete item')
 * toast.info('Loading data...')
 * toast.warning('Low stock alert')
 * ```
 */

import { useState, useCallback } from 'react'
import type { ToastType } from '../components/ui/Toast'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
}

interface UseToastReturn {
  toasts: ToastItem[]
  show: (type: ToastType, message: string, description?: string, duration?: number) => void
  success: (message: string, description?: string, duration?: number) => void
  error: (message: string, description?: string, duration?: number) => void
  info: (message: string, description?: string, duration?: number) => void
  warning: (message: string, description?: string, duration?: number) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

let globalToastId = 0

/**
 * Hook for managing toast notifications
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  /**
   * Show a toast notification
   */
  const show = useCallback((
    type: ToastType,
    message: string,
    description?: string,
    duration: number = 5000
  ) => {
    const id = `toast-${++globalToastId}`
    
    setToasts(prev => [...prev, {
      id,
      type,
      message,
      description,
      duration
    }])
  }, [])

  /**
   * Show a success toast
   */
  const success = useCallback((message: string, description?: string, duration?: number) => {
    show('success', message, description, duration)
  }, [show])

  /**
   * Show an error toast
   */
  const error = useCallback((message: string, description?: string, duration?: number) => {
    show('error', message, description, duration)
  }, [show])

  /**
   * Show an info toast
   */
  const info = useCallback((message: string, description?: string, duration?: number) => {
    show('info', message, description, duration)
  }, [show])

  /**
   * Show a warning toast
   */
  const warning = useCallback((message: string, description?: string, duration?: number) => {
    show('warning', message, description, duration)
  }, [show])

  /**
   * Dismiss a specific toast
   */
  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  /**
   * Dismiss all toasts
   */
  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    show,
    success,
    error,
    info,
    warning,
    dismiss,
    dismissAll
  }
}

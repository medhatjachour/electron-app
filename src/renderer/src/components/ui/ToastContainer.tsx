/**
 * ToastContainer Component
 * 
 * Container for displaying multiple toast notifications
 * Automatically positions toasts in the top-right corner
 */

import Toast, { type ToastProps } from './Toast'

interface ToastContainerProps {
  readonly toasts: Omit<ToastProps, 'onClose'>[]
  readonly onClose: (id: string) => void
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-[9999] pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="flex flex-col gap-3 items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  )
}

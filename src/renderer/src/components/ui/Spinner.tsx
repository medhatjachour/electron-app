/**
 * Spinner Component
 * 
 * Loading spinner for inline and overlay use
 * Multiple sizes and variants
 * 
 * @example
 * ```tsx
 * <Spinner size="sm" />
 * <Spinner size="lg" variant="primary" />
 * <Spinner className="text-white" />
 * ```
 */

import { cn } from '@renderer/utils/cn'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  /**
   * Size of the spinner
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Color variant
   */
  variant?: 'primary' | 'secondary' | 'white' | 'current'
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Accessible label
   */
  label?: string
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const variantClasses = {
  primary: 'text-primary',
  secondary: 'text-slate-600 dark:text-slate-400',
  white: 'text-white',
  current: 'text-current'
}

export function Spinner({
  size = 'md',
  variant = 'primary',
  className = '',
  label = 'Loading...'
}: Readonly<SpinnerProps>) {
  return (
    <output
      aria-label={label}
      aria-live="polite"
      className={cn('inline-block', className)}
    >
      <Loader2
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </output>
  )
}

/**
 * Centered spinner for full-page or container loading
 */
export function SpinnerCenter({
  size = 'lg',
  variant = 'primary',
  label = 'Loading...'
}: Readonly<Omit<SpinnerProps, 'className'>>) {
  return (
    <output className="flex items-center justify-center p-8">
      <Spinner size={size} variant={variant} label={label} />
    </output>
  )
}

/**
 * Overlay spinner that covers the parent container
 */
export function SpinnerOverlay({
  size = 'lg',
  variant = 'white',
  label = 'Loading...',
  className = ''
}: Readonly<SpinnerProps>) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm',
        className
      )}
      aria-label={label}
    >
      <Spinner size={size} variant={variant} label={label} />
    </div>
  )
}

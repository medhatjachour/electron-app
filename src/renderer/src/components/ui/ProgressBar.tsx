/**
 * ProgressBar Component
 * 
 * Animated progress indicator
 * Supports determinate and indeterminate modes
 * 
 * @example
 * ```tsx
 * <ProgressBar value={75} max={100} />
 * <ProgressBar indeterminate />
 * <ProgressBar value={uploadProgress} label="Uploading..." showPercentage />
 * ```
 */

import { cn } from '@renderer/utils/cn'

interface ProgressBarProps {
  /**
   * Current progress value (0-max)
   */
  value?: number
  /**
   * Maximum value
   */
  max?: number
  /**
   * Indeterminate (animated) mode
   */
  indeterminate?: boolean
  /**
   * Show percentage text
   */
  showPercentage?: boolean
  /**
   * Label text
   */
  label?: string
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Color variant
   */
  variant?: 'primary' | 'success' | 'warning' | 'error'
  /**
   * Additional CSS classes
   */
  className?: string
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
}

const variantClasses = {
  primary: 'bg-primary',
  success: 'bg-green-600',
  warning: 'bg-amber-600',
  error: 'bg-red-600'
}

export function ProgressBar({
  value = 0,
  max = 100,
  indeterminate = false,
  showPercentage = false,
  label,
  size = 'md',
  variant = 'primary',
  className = ''
}: Readonly<ProgressBarProps>) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2 text-sm text-slate-700 dark:text-slate-300">
          {label && <span>{label}</span>}
          {showPercentage && !indeterminate && (
            <span className="font-medium">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      
      <progress
        className={cn(
          'w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden appearance-none',
          '[&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-bar]:dark:bg-slate-700 [&::-webkit-progress-bar]:rounded-full',
          `[&::-webkit-progress-value]:${variantClasses[variant]} [&::-webkit-progress-value]:rounded-full`,
          `[&::-moz-progress-bar]:${variantClasses[variant]} [&::-moz-progress-bar]:rounded-full`,
          sizeClasses[size]
        )}
        value={indeterminate ? undefined : value}
        max={max}
        aria-label={label || 'Progress'}
      >
        {!indeterminate && `${Math.round(percentage)}%`}
      </progress>
    </div>
  )
}

/**
 * Circular progress indicator
 */
export function CircularProgress({
  value = 0,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = 'primary',
  showPercentage = false,
  className = ''
}: Omit<ProgressBarProps, 'indeterminate' | 'label' | 'size'> & {
  size?: number
  strokeWidth?: number
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const colors = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600'
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className={cn('transform -rotate-90', colors[variant])}
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-20"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      
      {/* Hidden progress element for accessibility */}
      <progress
        className="sr-only"
        value={value}
        max={max}
        aria-label="Progress"
      />
      
      {showPercentage && (
        <span className="absolute text-sm font-semibold text-slate-900 dark:text-white">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

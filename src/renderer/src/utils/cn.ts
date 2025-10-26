/**
 * cn - Class Names Utility
 * 
 * Combines multiple class names, handling conditionals and removing falsy values
 * Lightweight alternative to clsx/classnames
 * 
 * @example
 * ```tsx
 * cn('base', isActive && 'active', 'other')
 * // => 'base active other'
 * 
 * cn('base', { active: true, disabled: false })
 * // => 'base active'
 * ```
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[]

export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
}

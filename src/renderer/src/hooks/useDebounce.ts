/**
 * useDebounce Hook
 * 
 * Delays updating a value until after a specified delay has elapsed since the last change.
 * Essential for search inputs to avoid excessive API calls.
 * 
 * Usage:
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 300)
 * 
 * useEffect(() => {
 *   // This runs 300ms after user stops typing
 *   performSearch(debouncedSearch)
 * }, [debouncedSearch])
 * ```
 */

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up the timeout
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes before delay completes
    return () => {
      clearTimeout(timeoutId)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * useThrottle Hook
 * 
 * Limits the rate at which a value can update.
 * Different from debounce - executes immediately, then prevents updates for the delay period.
 * 
 * Usage:
 * ```tsx
 * const [scrollPosition, setScrollPosition] = useState(0)
 * const throttledPosition = useThrottle(scrollPosition, 100)
 * ```
 */
export function useThrottle<T>(value: T, interval: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const [lastUpdated, setLastUpdated] = useState<number>(0) // Start at 0 to allow first update

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdated

    if (lastUpdated === 0 || timeSinceLastUpdate >= interval) {
      setThrottledValue(value)
      setLastUpdated(now)
      return () => {} // No-op cleanup when immediate update
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value)
        setLastUpdated(Date.now())
      }, interval - timeSinceLastUpdate)

      return () => clearTimeout(timeoutId)
    }
  }, [value, interval, lastUpdated])

  return throttledValue
}

/**
 * useDebouncedCallback Hook
 * 
 * Returns a memoized debounced version of a callback function.
 * The callback will only be called after the specified delay has elapsed since the last invocation.
 * 
 * Usage:
 * ```tsx
 * const debouncedSearch = useDebouncedCallback(
 *   (query: string) => performSearch(query),
 *   300
 * )
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(newTimeoutId)
  }
}

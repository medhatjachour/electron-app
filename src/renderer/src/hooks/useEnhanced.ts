/**
 * Custom React Hooks with Performance Optimization
 * Senior Engineer Pattern: Reusable Business Logic
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { authz, Permission, auditLogger } from '../services/security'
import { useAuth } from '../contexts/AuthContext'

/**
 * usePermission Hook
 * Check if current user has permission
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) return false
    // Cast user.role to Role enum
    const role = user.role as any
    return authz.hasPermission(role, permission)
  }, [user, permission])
}

/**
 * usePermissions Hook
 * Check multiple permissions at once
 */
export function usePermissions(permissions: Permission[]): {
  hasAny: boolean
  hasAll: boolean
  check: (permission: Permission) => boolean
} {
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) {
      return { hasAny: false, hasAll: false, check: () => false }
    }

    const role = user.role as any

    return {
      hasAny: authz.hasAnyPermission(role, permissions),
      hasAll: authz.hasAllPermissions(role, permissions),
      check: (permission: Permission) => authz.hasPermission(role, permission),
    }
  }, [user, permissions])
}

/**
 * useDebounce Hook
 * Debounce rapid changes (search input, etc.)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * useThrottle Hook
 * Throttle frequent calls (scroll, resize, etc.)
 */
export function useThrottle<T>(value: T, delay: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, delay - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return throttledValue
}

/**
 * useLocalStorage Hook with Encryption
 * Secure localStorage access
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  encrypted: boolean = false
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (!item) return initialValue

      if (encrypted) {
        // Import encryption service
        const { encryption } = require('../services/security')
        const decrypted = encryption.decryptObject(item) as T
        return decrypted
      }

      return JSON.parse(item)
    } catch (error) {
      console.error('useLocalStorage get failed:', error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value)

        if (encrypted) {
          const { encryption } = require('../services/security')
          const encrypted = encryption.encryptObject(value)
          window.localStorage.setItem(key, encrypted)
        } else {
          window.localStorage.setItem(key, JSON.stringify(value))
        }
      } catch (error) {
        console.error('useLocalStorage set failed:', error)
      }
    },
    [key, encrypted]
  )

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error('useLocalStorage remove failed:', error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * useAsync Hook
 * Handle async operations with loading/error states
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = []
): {
  data: T | null
  loading: boolean
  error: Error | null
  execute: () => Promise<void>
  reset: () => void
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await asyncFunction()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [asyncFunction])

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return { data, loading, error, execute, reset }
}

/**
 * useAuditLog Hook
 * Automatically log user actions
 */
export function useAuditLog(
  action: string,
  autoLog: boolean = false
): (details: Record<string, any>) => void {
  const { user } = useAuth()

  const log = useCallback(
    (details: Record<string, any>) => {
      auditLogger.log(action, details, user?.id)
    },
    [action, user]
  )

  useEffect(() => {
    if (autoLog) {
      log({ autoLogged: true })
    }
  }, [autoLog, log])

  return log
}

/**
 * useIntersectionObserver Hook
 * Lazy load elements when visible (performance optimization)
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return isIntersecting
}

/**
 * useMediaQuery Hook
 * Responsive design helper
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

/**
 * useOnlineStatus Hook
 * Detect online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * usePrevious Hook
 * Keep track of previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

/**
 * useUpdateEffect Hook
 * useEffect that skips first render
 */
export function useUpdateEffect(effect: () => void | (() => void), deps: any[]): void {
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    return effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/**
 * useWindowSize Hook
 * Track window dimensions
 */
export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

/**
 * useClickOutside Hook
 * Detect clicks outside element (for dropdowns, modals)
 */
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: () => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler()
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

/**
 * useInterval Hook
 * Declarative interval
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

/**
 * useCopyToClipboard Hook
 * Copy text to clipboard with feedback
 */
export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
  const [isCopied, setIsCopied] = useState(false)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setIsCopied(false)
    }
  }, [])

  return [isCopied, copy]
}

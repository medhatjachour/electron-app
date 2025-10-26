/**
 * React Performance Utilities
 * 
 * Memoization helpers and performance optimization utilities
 */

import React, { useRef, useEffect, useMemo, useCallback, DependencyList, useState } from 'react'

/**
 * Deep comparison for dependencies
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  
  if (keysA.length !== keysB.length) return false
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false
    }
  }
  
  return true
}

/**
 * useMemo with deep comparison
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T }>()
  
  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() }
  }
  
  return ref.current.value
}

/**
 * useCallback with deep comparison
 */
export function useDeepCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: DependencyList
): T {
  const ref = useRef<{ deps: DependencyList; callback: T }>()
  
  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, callback }
  }
  
  return ref.current.callback
}

/**
 * Debounced value hook
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
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
 * Throttled value hook
 */
export function useThrottle<T>(value: T, interval: number = 300): T {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastRan = useRef(Date.now())
  
  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= interval) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, interval - (Date.now() - lastRan.current))
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, interval])
  
  return throttledValue
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  
  useEffect(() => {
    ref.current = value
  }, [value])
  
  return ref.current
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
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
 * Lazy load component when visible
 */
export function useLazyLoad(ref: React.RefObject<Element>) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const isVisible = useIntersectionObserver(ref, {
    threshold: 0.1,
    rootMargin: '50px'
  })
  
  useEffect(() => {
    if (isVisible && !shouldLoad) {
      setShouldLoad(true)
    }
  }, [isVisible, shouldLoad])
  
  return shouldLoad
}

/**
 * Measure component render time
 */
export function useRenderTime(componentName: string, enabled: boolean = process.env.NODE_ENV === 'development') {
  const renderCount = useRef(0)
  const startTime = useRef(0)
  
  if (enabled) {
    renderCount.current++
    startTime.current = performance.now()
  }
  
  useEffect(() => {
    if (enabled) {
      const endTime = performance.now()
      const duration = endTime - startTime.current
      console.log(`[${componentName}] Render #${renderCount.current}: ${duration.toFixed(2)}ms`)
    }
  })
}

/**
 * Memoized selector hook
 */
export function useSelector<T, R>(
  data: T,
  selector: (data: T) => R,
  deps: DependencyList = []
): R {
  return useMemo(() => selector(data), [data, ...deps])
}

/**
 * Stable callback that doesn't change reference
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  return useCallback(((...args) => callbackRef.current(...args)) as T, [])
}

/**
 * Batch state updates
 */
export function useBatchedState<T>(initialState: T): [T, (updater: (prev: T) => T) => void] {
  const [state, setState] = useState(initialState)
  const pendingUpdates = useRef<Array<(prev: T) => T>>([])
  const rafId = useRef<number>()
  
  const batchedSetState = useCallback((updater: (prev: T) => T) => {
    pendingUpdates.current.push(updater)
    
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        setState(prev => {
          let newState = prev
          for (const update of pendingUpdates.current) {
            newState = update(newState)
          }
          return newState
        })
        pendingUpdates.current = []
        rafId.current = undefined
      })
    }
  }, [])
  
  return [state, batchedSetState]
}

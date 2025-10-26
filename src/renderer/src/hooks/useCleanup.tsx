/**
 * Resource Cleanup Utilities
 * 
 * Helpers for proper cleanup of resources, preventing memory leaks
 */

import { useEffect, useRef } from 'react'

/**
 * Abort Controller hook for canceling async operations
 */
export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Create new AbortController
    abortControllerRef.current = new AbortController()

    // Cleanup: abort on unmount
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return abortControllerRef.current
}

/**
 * Cleanup hook that runs on unmount
 */
export function useCleanup(cleanup: () => void) {
  useEffect(() => {
    return cleanup
  }, [cleanup])
}

/**
 * Interval hook with auto-cleanup
 */
export function useInterval(callback: () => void, delay: number | null) {
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
 * Timeout hook with auto-cleanup
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setTimeout(() => savedCallback.current(), delay)
    
    return () => clearTimeout(id)
  }, [delay])
}

/**
 * Event listener hook with auto-cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement | null = window
) {
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    if (!element) return

    const eventListener = (event: Event) => savedHandler.current(event as WindowEventMap[K])
    
    element.addEventListener(eventName, eventListener)
    
    return () => {
      element.removeEventListener(eventName, eventListener)
    }
  }, [eventName, element])
}

/**
 * ResizeObserver hook with auto-cleanup
 */
export function useResizeObserver(
  ref: React.RefObject<HTMLElement>,
  callback: (entry: ResizeObserverEntry) => void
) {
  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        callback(entry)
      }
    })

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref, callback])
}

/**
 * MutationObserver hook with auto-cleanup
 */
export function useMutationObserver(
  ref: React.RefObject<HTMLElement>,
  callback: MutationCallback,
  options?: MutationObserverInit
) {
  useEffect(() => {
    if (!ref.current) return

    const observer = new MutationObserver(callback)
    
    observer.observe(ref.current, options)

    return () => {
      observer.disconnect()
    }
  }, [ref, callback, options])
}

/**
 * Async operation hook with abort support
 */
export function useAsyncOperation<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  useEffect(() => {
    const abortController = new AbortController()
    
    async function execute() {
      setLoading(true)
      setError(null)

      try {
        const result = await operation(abortController.signal)
        if (!abortController.signal.aborted) {
          setData(result)
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    execute()

    return () => {
      abortController.abort()
    }
  }, deps)

  return { data, loading, error }
}

/**
 * WebSocket hook with auto-cleanup
 */
export function useWebSocket(url: string | null) {
  const [socket, setSocket] = React.useState<WebSocket | null>(null)
  const [readyState, setReadyState] = React.useState<number>(WebSocket.CLOSED)

  useEffect(() => {
    if (!url) return

    const ws = new WebSocket(url)

    ws.onopen = () => setReadyState(WebSocket.OPEN)
    ws.onclose = () => setReadyState(WebSocket.CLOSED)
    ws.onerror = () => setReadyState(WebSocket.CLOSED)

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [url])

  return { socket, readyState }
}

/**
 * Animation frame hook with auto-cleanup
 */
export function useAnimationFrame(callback: (deltaTime: number) => void, deps: React.DependencyList = []) {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current
        callback(deltaTime)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, deps)
}

/**
 * Media query hook with auto-cleanup
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia(query)
    
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    
    mediaQuery.addEventListener('change', handler)

    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [query])

  return matches
}

/**
 * Cleanup manager for multiple resources
 */
export class CleanupManager {
  private cleanupFunctions: Array<() => void> = []

  /**
   * Add cleanup function
   */
  add(cleanup: () => void): void {
    this.cleanupFunctions.push(cleanup)
  }

  /**
   * Execute all cleanup functions
   */
  cleanup(): void {
    for (const cleanup of this.cleanupFunctions) {
      try {
        cleanup()
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }
    this.cleanupFunctions = []
  }
}

/**
 * Resource pool for reusable resources
 */
export class ResourcePool<T> {
  private available: T[] = []
  private inUse: Set<T> = new Set()
  private factory: () => T
  private cleanup: (resource: T) => void

  constructor(factory: () => T, cleanup: (resource: T) => void, initialSize: number = 0) {
    this.factory = factory
    this.cleanup = cleanup

    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory())
    }
  }

  /**
   * Acquire resource from pool
   */
  acquire(): T {
    let resource: T
    
    if (this.available.length > 0) {
      resource = this.available.pop()!
    } else {
      resource = this.factory()
    }
    
    this.inUse.add(resource)
    return resource
  }

  /**
   * Release resource back to pool
   */
  release(resource: T): void {
    if (this.inUse.has(resource)) {
      this.inUse.delete(resource)
      this.available.push(resource)
    }
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    for (const resource of this.available) {
      this.cleanup(resource)
    }
    for (const resource of this.inUse) {
      this.cleanup(resource)
    }
    this.available = []
    this.inUse.clear()
  }
}

/**
 * Import React for hooks
 */
import React from 'react'

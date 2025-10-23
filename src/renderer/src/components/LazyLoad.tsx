import { Suspense, ComponentType, lazy } from 'react'
import LoadingSpinner from 'src/renderer/components/ui/LoadingSpinner'

/**
 * Higher-order component for lazy loading with suspense boundary
 * Provides fallback loading state while component loads
 */
export function withLazyLoad<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc)

  return function LazyLoadWrapper(props: P) {
    return (
      <Suspense fallback={fallback || <LoadingFallback />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    )
  }
}

/**
 * Default loading fallback component
 */
function LoadingFallback(): JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Preload a lazy component for better UX
 * Call this on route hover or beforeunload events
 */
export function preloadComponent(importFunc: () => Promise<any>): void {
  importFunc().catch((error) => {
    console.error('Failed to preload component:', error)
  })
}

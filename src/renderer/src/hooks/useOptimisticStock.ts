/**
 * useOptimisticStock Hook
 * 
 * Specialized hook for optimistic stock updates
 * Provides immediate feedback when updating stock levels
 * 
 * @example
 * ```tsx
 * const { updateStock, isUpdating } = useOptimisticStock({
 *   onSuccess: () => toast.success('Stock updated'),
 *   onError: (err) => toast.error(err.message)
 * })
 * 
 * await updateStock(variantId, newStock, currentStock)
 * ```
 */

import { useCallback } from 'react'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import logger from '../../../shared/utils/logger'

interface OptimisticStockOptions {
  onSuccess?: (result: unknown) => void
  onError?: (error: Error) => void
}

interface UseOptimisticStockReturn {
  updateStock: (
    variantId: string,
    newStock: number,
    currentStock: number,
    onOptimisticUpdate: (stock: number) => void
  ) => Promise<unknown>
  isUpdating: boolean
  error: Error | null
  clearError: () => void
}

/**
 * Hook for optimistic stock updates
 */
export function useOptimisticStock(
  options: OptimisticStockOptions = {}
): UseOptimisticStockReturn {
  const { onSuccess, onError } = options

  const { execute, isOptimistic, error, clearError } = useOptimisticUpdate({
    onSuccess: (result) => {
      logger.success('Stock updated successfully')
      onSuccess?.(result)
    },
    onError: (err) => {
      logger.error('Stock update failed:', err)
      onError?.(err)
    }
  })

  /**
   * Update stock level with optimistic UI
   */
  const updateStock = useCallback(
    async (
      variantId: string,
      newStock: number,
      currentStock: number,
      onOptimisticUpdate: (stock: number) => void
    ) => {
      return execute({
        operation: async () => {
          // @ts-ignore
          const result = await (globalThis as any).api?.inventory?.updateStock({
            variantId,
            stock: newStock
          })

          if (!result?.success) {
            throw new Error(result?.message || 'Failed to update stock')
          }

          return result
        },
        optimisticUpdate: () => {
          // Immediately update UI to new stock level
          onOptimisticUpdate(newStock)
        },
        rollback: () => {
          // Restore previous stock level if update fails
          onOptimisticUpdate(currentStock)
        },
        description: `update stock for variant ${variantId}`
      })
    },
    [execute]
  )

  return {
    updateStock,
    isUpdating: isOptimistic,
    error,
    clearError
  }
}

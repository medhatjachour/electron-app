/**
 * useProductFilters Hook
 * Handles product filtering and search logic
 */

import { useMemo } from 'react'
import type { Product, ProductFilters } from './types'

export function useProductFilters(products: Product[], filters: ProductFilters) {
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesName = product.name.toLowerCase().includes(query)
        const matchesSKU = product.baseSKU.toLowerCase().includes(query)
        if (!matchesName && !matchesSKU) return false
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false
      }

      // Color filter
      if (filters.color && product.hasVariants) {
        const hasColor = product.variants?.some(v => v.color === filters.color)
        if (!hasColor) return false
      }

      // Size filter
      if (filters.size && product.hasVariants) {
        const hasSize = product.variants?.some(v => v.size === filters.size)
        if (!hasSize) return false
      }

      // Stock status filter
      if (filters.stockStatus) {
        const stock = product.totalStock || 0
        switch (filters.stockStatus) {
          case 'in-stock':
            if (stock <= 0) return false
            break
          case 'low-stock':
            if (stock > 10 || stock === 0) return false
            break
          case 'out-of-stock':
            if (stock > 0) return false
            break
        }
      }

      return true
    })
  }, [products, filters])

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const categories = new Set<string>()
    const colors = new Set<string>()
    const sizes = new Set<string>()

    products.forEach(product => {
      if (product.category) categories.add(product.category)
      
      if (product.hasVariants && product.variants) {
        product.variants.forEach(variant => {
          if (variant.color) colors.add(variant.color)
          if (variant.size) sizes.add(variant.size)
        })
      }
    })

    return {
      categories: Array.from(categories).sort(),
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort()
    }
  }, [products])

  return { filteredProducts, filterOptions }
}

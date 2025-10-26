/**
 * useCategories Hook
 * Access product categories from localStorage
 */

import { useState, useEffect } from 'react'

export interface Category {
  id: string
  name: string
  description?: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    loadCategories()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'productCategories') {
        loadCategories()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const loadCategories = () => {
    const stored = localStorage.getItem('productCategories')
    if (stored) {
      try {
        setCategories(JSON.parse(stored))
      } catch {
        setCategories(getDefaultCategories())
      }
    } else {
      setCategories(getDefaultCategories())
    }
  }

  const getDefaultCategories = (): Category[] => {
    return [
      { id: '1', name: 'Electronics', description: 'Electronic devices and accessories' },
      { id: '2', name: 'Clothing', description: 'Apparel and fashion items' },
      { id: '3', name: 'Food & Beverages', description: 'Food products and drinks' },
      { id: '4', name: 'Home & Garden', description: 'Home improvement and garden supplies' },
      { id: '5', name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' }
    ]
  }

  const getCategoryNames = () => categories.map(c => c.name)

  return {
    categories,
    categoryNames: getCategoryNames(),
    refreshCategories: loadCategories
  }
}

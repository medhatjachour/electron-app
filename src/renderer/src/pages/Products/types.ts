/**
 * Products Domain Types
 * Centralized type definitions for product management
 */

export interface ProductVariant {
  id: string
  productId: string
  color?: string
  size?: string
  sku: string
  price: number
  stock: number
}

export interface ProductImage {
  id: string
  productId: string
  imageData: string
  order: number
}

export interface Product {
  id: string
  name: string
  baseSKU: string
  category: string
  description?: string
  basePrice: number
  baseCost: number
  hasVariants: boolean
  images?: ProductImage[]
  variants?: ProductVariant[]
  totalStock?: number
  createdAt?: string
  updatedAt?: string
}

export interface ProductFormData {
  name: string
  baseSKU: string
  category: string
  description: string
  basePrice: number
  baseCost: number
  baseStock: number
  storeId: string
  images: string[]
  hasVariants: boolean
  variants: ProductVariant[]
}

export interface ProductFormErrors {
  name?: string
  baseSKU?: string
  category?: string
  basePrice?: string
  baseCost?: string
}

export interface ProductFilters {
  searchQuery: string
  category: string
  color: string
  size: string
  store: string
  stockStatus: string
}

export interface VariantFormData {
  color: string
  size: string
  sku: string
  price: number
  stock: number
}

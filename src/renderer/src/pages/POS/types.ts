/**
 * Type definitions for POS module
 */

export type ProductVariant = {
  id: string
  color?: string
  size?: string
  sku: string
  price: number
  stock: number
}

export type Product = {
  id: string
  name: string
  basePrice: number
  category: string
  hasVariants: boolean
  variants: ProductVariant[]
  images: { imageData: string }[]
  totalStock: number
}

export type CartItem = {
  id: string
  productId: string // Original product ID for database operations
  variantId?: string
  name: string
  variant?: string
  price: number
  quantity: number
  stock: number // Available stock for this item
  // Product snapshot for validation during checkout
  productSnapshot?: Product
  variantSnapshot?: ProductVariant
}

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
}

export type PaymentMethod = 'cash' | 'card' | null

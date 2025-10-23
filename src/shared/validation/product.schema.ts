/**
 * Product validation schemas using Zod
 */

import { z } from 'zod'

// Product Variant Schema
export const ProductVariantSchema = z.object({
  id: z.string().optional(),
  color: z.string().min(1, 'Color is required').max(50),
  size: z.string().min(1, 'Size is required').max(20),
  sku: z.string().min(1, 'SKU is required').max(50),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().int().min(0, 'Stock must be non-negative')
})

// Product Creation Schema
export const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  category: z.string().min(1, 'Category is required').max(50),
  basePrice: z.number().min(0, 'Base price must be positive'),
  hasVariants: z.boolean(),
  variants: z.array(ProductVariantSchema).optional(),
  images: z.array(z.string()).max(5, 'Maximum 5 images allowed').optional(),
  description: z.string().max(500).optional()
})

// Product Update Schema
export const ProductUpdateSchema = ProductCreateSchema.partial().extend({
  id: z.string().min(1, 'Product ID is required')
})

// Product Filter Schema
export const ProductFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  store: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  inStock: z.boolean().optional()
})

// Export types
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>
export type ProductFilterInput = z.infer<typeof ProductFilterSchema>

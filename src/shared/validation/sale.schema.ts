/**
 * Sale validation schemas using Zod
 */

import { z } from 'zod'

// Sale Creation Schema
export const SaleCreateSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().nullable().optional(),
  userId: z.string().min(1, 'User ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(1000, 'Quantity too large'),
  price: z.number().min(0, 'Price must be positive'),
  total: z.number().min(0, 'Total must be positive'),
  paymentMethod: z.enum(['cash', 'card'], {
    message: 'Payment method must be cash or card'
  }),
  customerName: z.string().max(100).nullable().optional(),
  status: z.enum(['completed', 'pending', 'refunded']).default('completed')
})

// Sale Refund Schema
export const SaleRefundSchema = z.object({
  saleId: z.string().min(1, 'Sale ID is required'),
  reason: z.string().max(500).optional()
})

// Sale Filter Schema
export const SaleFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  userId: z.string().optional(),
  productId: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card']).optional(),
  status: z.enum(['completed', 'pending', 'refunded']).optional(),
  minTotal: z.number().min(0).optional(),
  maxTotal: z.number().min(0).optional()
})

// Cart Item Schema (for POS)
export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  name: z.string(),
  variant: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  stock: z.number().int().min(0)
})

// Export types
export type SaleCreateInput = z.infer<typeof SaleCreateSchema>
export type SaleRefundInput = z.infer<typeof SaleRefundSchema>
export type SaleFilterInput = z.infer<typeof SaleFilterSchema>
export type CartItemInput = z.infer<typeof CartItemSchema>

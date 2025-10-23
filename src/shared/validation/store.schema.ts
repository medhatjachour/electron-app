/**
 * Store validation schemas using Zod
 */

import { z } from 'zod'

// Store Creation Schema
export const StoreCreateSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(50),
  country: z.string().min(1, 'Country is required').max(50),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number too long')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address').max(100).optional(),
  managerId: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active')
})

// Store Update Schema
export const StoreUpdateSchema = StoreCreateSchema.partial().extend({
  id: z.string().min(1, 'Store ID is required')
})

// Export types
export type StoreCreateInput = z.infer<typeof StoreCreateSchema>
export type StoreUpdateInput = z.infer<typeof StoreUpdateSchema>

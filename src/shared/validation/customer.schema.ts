/**
 * Customer validation schemas using Zod
 */

import { z } from 'zod'

// Customer Creation Schema
export const CustomerCreateSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100),
  email: z.string().email('Invalid email address').max(100),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number too long')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  address: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  notes: z.string().max(500).optional()
})

// Customer Update Schema
export const CustomerUpdateSchema = CustomerCreateSchema.partial().extend({
  id: z.string().min(1, 'Customer ID is required')
})

// Customer Search Schema
export const CustomerSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().int().min(1).max(100).default(5)
})

// Export types
export type CustomerCreateInput = z.infer<typeof CustomerCreateSchema>
export type CustomerUpdateInput = z.infer<typeof CustomerUpdateSchema>
export type CustomerSearchInput = z.infer<typeof CustomerSearchSchema>

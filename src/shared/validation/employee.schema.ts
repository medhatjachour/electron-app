/**
 * Employee validation schemas using Zod
 */

import { z } from 'zod'

// Employee Creation Schema
export const EmployeeCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address').max(100),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number too long')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  position: z.string().min(1, 'Position is required').max(50),
  department: z.string().max(50).optional(),
  salary: z.number().min(0, 'Salary must be positive').optional(),
  hireDate: z.date().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  storeId: z.string().optional()
})

// Employee Update Schema
export const EmployeeUpdateSchema = EmployeeCreateSchema.partial().extend({
  id: z.string().min(1, 'Employee ID is required')
})

// Export types
export type EmployeeCreateInput = z.infer<typeof EmployeeCreateSchema>
export type EmployeeUpdateInput = z.infer<typeof EmployeeUpdateSchema>

/**
 * Settings validation schemas using Zod
 */

import { z } from 'zod'

// Store Settings Schema
export const StoreSettingsSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20)
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'], {
    message: 'Please select a valid currency'
  }),
  timezone: z.string().min(1, 'Timezone is required')
})

// Tax Receipt Settings Schema
export const TaxReceiptSettingsSchema = z.object({
  taxRate: z.number().min(0, 'Tax rate must be positive').max(100, 'Tax rate cannot exceed 100%'),
  receiptHeader: z.string().max(200).optional(),
  receiptFooter: z.string().max(200).optional(),
  autoPrint: z.boolean().default(false),
  includeLogo: z.boolean().default(true)
})

// Notification Settings Schema
export const NotificationSettingsSchema = z.object({
  enableNotifications: z.boolean().default(true),
  lowStockAlert: z.boolean().default(true),
  lowStockThreshold: z.number().int().min(0).default(10),
  salesNotifications: z.boolean().default(true),
  emailNotifications: z.boolean().default(false),
  emailAddress: z.string().email().optional()
})

// Payment Method Settings Schema
export const PaymentMethodSettingsSchema = z.object({
  cash: z.boolean().default(true),
  credit: z.boolean().default(true),
  debit: z.boolean().default(true),
  mobile: z.boolean().default(false),
  giftCard: z.boolean().default(false)
})

// User Profile Settings Schema
export const UserProfileSettingsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address').max(100),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20)
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .optional(),
  avatar: z.string().url().optional()
})

// Security Settings Schema
export const SecuritySettingsSchema = z.object({
  currentPassword: z.string().min(4, 'Current password is required'),
  newPassword: z.string().min(4, 'Password must be at least 4 characters'),
  confirmPassword: z.string().min(4, 'Please confirm your password'),
  twoFactorEnabled: z.boolean().default(false),
  sessionTimeout: z.number().int().min(5).max(1440).default(30) // minutes
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

// Backup Settings Schema
export const BackupSettingsSchema = z.object({
  autoBackup: z.boolean().default(false),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  backupLocation: z.string().min(1, 'Backup location is required').optional(),
  keepBackups: z.number().int().min(1).max(30).default(7)
})

// All Settings Schema
export const AllSettingsSchema = z.object({
  store: StoreSettingsSchema,
  taxReceipt: TaxReceiptSettingsSchema,
  notifications: NotificationSettingsSchema,
  paymentMethods: PaymentMethodSettingsSchema,
  userProfile: UserProfileSettingsSchema,
  security: SecuritySettingsSchema.partial(),
  backup: BackupSettingsSchema
})

// Export types
export type StoreSettingsInput = z.infer<typeof StoreSettingsSchema>
export type TaxReceiptSettingsInput = z.infer<typeof TaxReceiptSettingsSchema>
export type NotificationSettingsInput = z.infer<typeof NotificationSettingsSchema>
export type PaymentMethodSettingsInput = z.infer<typeof PaymentMethodSettingsSchema>
export type UserProfileSettingsInput = z.infer<typeof UserProfileSettingsSchema>
export type SecuritySettingsInput = z.infer<typeof SecuritySettingsSchema>
export type BackupSettingsInput = z.infer<typeof BackupSettingsSchema>
export type AllSettingsInput = z.infer<typeof AllSettingsSchema>

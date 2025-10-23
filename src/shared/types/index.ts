/**
 * Shared Type Definitions
 * Centralized type system for the entire application
 */

// ==================== Base Types ====================

export type UUID = string

export type Timestamp = string | Date

export type Role = 'admin' | 'sales' | 'inventory' | 'finance'

export type PaymentMethod = 'cash' | 'card' | 'digital'

export type TransactionType = 'income' | 'expense'

export type SaleStatus = 'completed' | 'refunded' | 'pending'

// ==================== Entity Interfaces ====================

export interface User {
  id: UUID
  username: string
  role: Role
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Product {
  id: UUID
  name: string
  baseSKU: string
  category: string
  description?: string
  basePrice: number
  baseCost: number
  hasVariants: boolean
  images?: ProductImage[]
  variants?: ProductVariant[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface ProductVariant {
  id: UUID
  productId: UUID
  color?: string
  size?: string
  sku: string
  price: number
  stock: number
  product?: Product
}

export interface ProductImage {
  id: UUID
  productId: UUID
  imageData: string  // base64 encoded
  order: number
}

export interface Customer {
  id: UUID
  name: string
  email?: string
  phone?: string
  address?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Sale {
  id: UUID
  productId: UUID
  variantId?: UUID
  userId: UUID
  storeId?: UUID
  quantity: number
  price: number
  total: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  customerName?: string
  createdAt: Timestamp
  product?: Product
  variant?: ProductVariant
  user?: User
  store?: Store
}

export interface Store {
  id: UUID
  name: string
  address: string
  phone: string
  manager: string
  openingTime: string
  closingTime: string
  isActive: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Transaction {
  id: UUID
  type: TransactionType
  amount: number
  description: string
  userId: UUID
  category?: string
  createdAt: Timestamp
  user?: User
}

export interface Employee {
  id: UUID
  userId: UUID
  fullName: string
  position: string
  department: string
  salary: number
  startDate: string
  phone?: string
  email?: string
  user?: User
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// ==================== Request/Response DTOs ====================

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  user?: User
  message?: string
}

export interface CreateProductRequest {
  name: string
  baseSKU: string
  category: string
  description?: string
  basePrice: number
  baseCost: number
  hasVariants: boolean
  images?: string[]
  variants?: Omit<ProductVariant, 'id' | 'productId'>[]
}

export interface CreateSaleRequest {
  productId: UUID
  variantId?: UUID
  userId: UUID
  storeId?: UUID
  quantity: number
  price: number
  total: number
  paymentMethod: PaymentMethod
  customerName?: string
}

export interface UpdateStockRequest {
  variantId: UUID
  quantity: number
  operation: 'add' | 'subtract' | 'set'
}

// ==================== API Response Wrapper ====================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// ==================== Filter/Query Types ====================

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  searchQuery?: string
}

export interface SaleFilters {
  startDate?: Timestamp
  endDate?: Timestamp
  userId?: UUID
  storeId?: UUID
  status?: SaleStatus
  paymentMethod?: PaymentMethod
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ==================== Statistics Types ====================

export interface SalesStats {
  totalSales: number
  totalRevenue: number
  averageOrderValue: number
  salesByPaymentMethod: Record<PaymentMethod, number>
  salesByStatus: Record<SaleStatus, number>
}

export interface InventoryStats {
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalValue: number
}

export interface FinanceStats {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  transactionsByCategory: Record<string, number>
}

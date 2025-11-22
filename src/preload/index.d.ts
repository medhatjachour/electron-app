import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  auth: {
    login: (username: string, password: string) => Promise<any>
  }
  dashboard: {
    getMetrics: () => Promise<any>
  }
  sales: {
    getAll: () => Promise<any>
    create: (data: {
      productId: string
      userId: string
      quantity: number
      total: number
    }) => Promise<any>
  }
  customers: {
    getAll: () => Promise<any>
  }
  inventory: {
    getProducts: () => Promise<any>
    addProduct: (data: {
      name: string
      sku: string
      price: number
      stock: number
    }) => Promise<any>
    getAll: () => Promise<any>
    getMetrics: () => Promise<any>
    getTopStocked: (limit?: number) => Promise<any>
    getLowStock: (threshold?: number) => Promise<any>
    getOutOfStock: () => Promise<any>
    search: (query: string) => Promise<any>
    getStockHistory: (productId: string) => Promise<any>
    updateStock: (data: { variantId: string; stock: number }) => Promise<any>
  }
  finance: {
    addTransaction: (data: {
      type: 'income' | 'expense'
      amount: number
      description: string
      userId: string
    }) => Promise<any>
    getTransactions: (data: { startDate: Date; endDate: Date }) => Promise<any>
  }
  products: {
    getAll: () => Promise<any>
    create: (productData: any) => Promise<any>
    update: (data: { id: string; productData: any }) => Promise<any>
    delete: (id: string) => Promise<any>
    getById: (id: string) => Promise<any>
  }
  categories: {
    getAll: () => Promise<any>
    getById: (id: string) => Promise<any>
    create: (categoryData: { name: string; description?: string; icon?: string; color?: string }) => Promise<any>
    update: (data: { id: string; categoryData: { name: string; description?: string; icon?: string; color?: string } }) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  users: {
    getAll: () => Promise<any>
    getById: (id: string) => Promise<any>
    create: (userData: {
      username: string
      password: string
      fullName?: string | null
      email?: string | null
      phone?: string | null
      role: string
    }) => Promise<any>
    update: (id: string, updateData: {
      fullName?: string | null
      email?: string | null
      phone?: string | null
      role?: string
      isActive?: boolean
    }) => Promise<any>
    changePassword: (id: string, newPassword: string) => Promise<any>
    delete: (id: string) => Promise<any>
    updateLastLogin: (id: string) => Promise<any>
  }
  employees: {
    getAll: () => Promise<any>
    getById: (id: string) => Promise<any>
    create: (employeeData: {
      name: string
      role: string
      email: string
      phone: string
      salary: number
    }) => Promise<any>
    update: (id: string, employeeData: {
      name?: string
      role?: string
      email?: string
      phone?: string
      salary?: number
      performance?: number
    }) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  reports: {
    getSalesData: (options: { startDate: Date; endDate: Date }) => Promise<any>
    getInventoryData: (options: { startDate: Date; endDate: Date }) => Promise<any>
    getFinancialData: (options: { startDate: Date; endDate: Date }) => Promise<any>
    getCustomerData: (options: { startDate: Date; endDate: Date }) => Promise<any>
    getQuickInsights: () => Promise<any>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}

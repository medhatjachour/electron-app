import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  auth: {
    login: (username: string, password: string) =>
      ipcRenderer.invoke('auth:login', { username, password }),
    // create a new user account (username, password, role)
    create: (username: string, password: string, role: string = 'sales') =>
      ipcRenderer.invoke('auth:create', { username, password, role })
  },
  dashboard: {
    getMetrics: () => ipcRenderer.invoke('dashboard:getMetrics')
  },
  sales: {
    getAll: () => ipcRenderer.invoke('sales:getAll'),
    create: (data: {
      productId: string
      variantId?: string
      userId: string
      quantity: number
      price: number
      total: number
      paymentMethod?: string
      customerName?: string
    }) => ipcRenderer.invoke('sales:create', data),
    refund: (saleId: string) => ipcRenderer.invoke('sales:refund', saleId)
  },
  saleTransactions: {
    create: (data: {
      items: Array<{
        productId: string
        variantId?: string
        quantity: number
        price: number
      }>
      transactionData: {
        userId: string
        paymentMethod: string
        customerName?: string
        subtotal: number
        tax: number
        total: number
      }
    }) => ipcRenderer.invoke('saleTransactions:create', data),
    getAll: () => ipcRenderer.invoke('saleTransactions:getAll'),
    getById: (id: string) => ipcRenderer.invoke('saleTransactions:getById', id),
    refund: (id: string) => ipcRenderer.invoke('saleTransactions:refund', id),
    getByDateRange: (data: { startDate: string; endDate: string }) =>
      ipcRenderer.invoke('saleTransactions:getByDateRange', data)
  },
  customers: {
    getAll: () => ipcRenderer.invoke('customers:getAll')
  },
  inventory: {
    getProducts: () => ipcRenderer.invoke('inventory:getProducts'),
    addProduct: (data: {
      name: string
      sku: string
      price: number
      stock: number
    }) => ipcRenderer.invoke('inventory:addProduct', data),
    // New inventory management APIs
    getAll: (options?: {
      includeImages?: boolean
      category?: string
      searchTerm?: string
    }) => ipcRenderer.invoke('inventory:getAll', options),
    getMetrics: () => ipcRenderer.invoke('inventory:getMetrics'),
    getTopStocked: (limit?: number) => ipcRenderer.invoke('inventory:getTopStocked', limit),
    getLowStock: (threshold?: number) => ipcRenderer.invoke('inventory:getLowStock', threshold),
    getOutOfStock: () => ipcRenderer.invoke('inventory:getOutOfStock'),
    search: (query: string) => ipcRenderer.invoke('inventory:search', query),
    getStockHistory: (productId: string) => ipcRenderer.invoke('inventory:getStockHistory', productId),
    updateStock: (data: { variantId: string; stock: number }) => 
      ipcRenderer.invoke('inventory:updateStock', data)
  },
  finance: {
    addTransaction: (data: {
      type: 'income' | 'expense'
      amount: number
      description: string
      userId: string
    }) => ipcRenderer.invoke('finance:addTransaction', data),
    getTransactions: (data: { startDate: Date; endDate: Date }) =>
      ipcRenderer.invoke('finance:getTransactions', data),
    getStats: () => ipcRenderer.invoke('finance:getStats')
  },
  products: {
    getAll: (options?: { 
      includeImages?: boolean
      limit?: number
      offset?: number
      searchTerm?: string
      category?: string
    }) => ipcRenderer.invoke('products:getAll', options),
    getById: (id: string) => ipcRenderer.invoke('products:getById', id),
    getStats: () => ipcRenderer.invoke('products:getStats'),
    search: (term: string) => ipcRenderer.invoke('products:search', term),
    create: (productData: any) => ipcRenderer.invoke('products:create', productData),
    update: (data: { id: string; productData: any }) => ipcRenderer.invoke('products:update', data),
    delete: (id: string) => ipcRenderer.invoke('products:delete', id),
    // Batch operations
    batchCreate: (products: any[]) => ipcRenderer.invoke('products:batchCreate', products),
    batchUpdate: (updates: Array<{ id: string; data: any }>) => ipcRenderer.invoke('products:batchUpdate', updates),
    batchDelete: (ids: string[]) => ipcRenderer.invoke('products:batchDelete', ids)
  },
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    getById: (id: string) => ipcRenderer.invoke('categories:getById', id),
    create: (categoryData: { name: string; description?: string; icon?: string; color?: string }) => 
      ipcRenderer.invoke('categories:create', categoryData),
    update: (data: { id: string; categoryData: { name: string; description?: string; icon?: string; color?: string } }) => 
      ipcRenderer.invoke('categories:update', data),
    delete: (id: string) => ipcRenderer.invoke('categories:delete', id)
  },
  employees: {
    getAll: () => ipcRenderer.invoke('employees:getAll'),
    getById: (id: string) => ipcRenderer.invoke('employees:getById', id),
    create: (employeeData: {
      name: string
      role: string
      email: string
      phone: string
      salary: number
    }) => ipcRenderer.invoke('employees:create', employeeData),
    update: (id: string, employeeData: {
      name?: string
      role?: string
      email?: string
      phone?: string
      salary?: number
      performance?: number
    }) => ipcRenderer.invoke('employees:update', { id, employeeData }),
    delete: (id: string) => ipcRenderer.invoke('employees:delete', id)
  },
  users: {
    getAll: () => ipcRenderer.invoke('users:getAll'),
    getById: (id: string) => ipcRenderer.invoke('users:getById', id),
    create: (userData: {
      username: string
      password: string
      fullName?: string | null
      email?: string | null
      phone?: string | null
      role: string
    }) => ipcRenderer.invoke('users:create', userData),
    update: (id: string, updateData: {
      fullName?: string | null
      email?: string | null
      phone?: string | null
      role?: string
      isActive?: boolean
    }) => ipcRenderer.invoke('users:update', id, updateData),
    changePassword: (id: string, newPassword: string) => 
      ipcRenderer.invoke('users:changePassword', id, newPassword),
    delete: (id: string) => ipcRenderer.invoke('users:delete', id),
    updateLastLogin: (id: string) => ipcRenderer.invoke('users:updateLastLogin', id)
  },
  reports: {
    getSalesData: (options: { startDate: string; endDate: string; filters?: any }) =>
      ipcRenderer.invoke('reports:getSalesData', options),
    getInventoryData: (options: { filters?: any }) =>
      ipcRenderer.invoke('reports:getInventoryData', options),
    getFinancialData: (options: { startDate: string; endDate: string }) =>
      ipcRenderer.invoke('reports:getFinancialData', options),
    getCustomerData: (options: { startDate: string; endDate: string }) =>
      ipcRenderer.invoke('reports:getCustomerData', options),
    getQuickInsights: () =>
      ipcRenderer.invoke('reports:getQuickInsights')
  },
  // Universal backend search
  'search:products': (options: any) => ipcRenderer.invoke('search:products', options),
  'search:inventory': (options: any) => ipcRenderer.invoke('search:inventory', options),
  'search:getFilterMetadata': () => ipcRenderer.invoke('search:getFilterMetadata'),
  'search:sales': (options: any) => ipcRenderer.invoke('search:sales', options),
  'search:finance': (options: any) => ipcRenderer.invoke('search:finance', options),
  // Prediction & Analytics
  'forecast:revenue': (options: { days?: number; historicalDays?: number }) => 
    ipcRenderer.invoke('forecast:revenue', options),
  'forecast:cashflow': (options: { days?: number }) => 
    ipcRenderer.invoke('forecast:cashflow', options),
  'insights:products': (options: { limit?: number }) => 
    ipcRenderer.invoke('insights:products', options),
  'health:financial': () => 
    ipcRenderer.invoke('health:financial')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

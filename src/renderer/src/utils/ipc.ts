// IPC utility functions for renderer process

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>
      }
    }
  }
}

// Check if we're in Electron environment
const isElectron = typeof window !== 'undefined' && window.electron?.ipcRenderer

// Fallback mock implementation for development
const mockIPC = {
  products: {
    getAll: async () => {
      const stored = localStorage.getItem('products')
      return stored ? JSON.parse(stored) : []
    },
    create: async (data: any) => {
      const products = JSON.parse(localStorage.getItem('products') || '[]')
      const newProduct = {
        id: Date.now().toString(),
        ...data,
        images: data.images.map((img: string) => ({ imageData: img })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      products.push(newProduct)
      localStorage.setItem('products', JSON.stringify(products))
      return { success: true, product: newProduct }
    },
    update: async ({ id, productData }: any) => {
      const products = JSON.parse(localStorage.getItem('products') || '[]')
      const index = products.findIndex((p: any) => p.id === id)
      if (index !== -1) {
        products[index] = {
          ...products[index],
          ...productData,
          images: productData.images.map((img: string) => 
            typeof img === 'string' ? { imageData: img } : img
          ),
          updatedAt: new Date().toISOString()
        }
        localStorage.setItem('products', JSON.stringify(products))
        return { success: true, product: products[index] }
      }
      return { success: false, message: 'Product not found' }
    },
    delete: async (id: string) => {
      const products = JSON.parse(localStorage.getItem('products') || '[]')
      const filtered = products.filter((p: any) => p.id !== id)
      localStorage.setItem('products', JSON.stringify(filtered))
      return { success: true }
    }
  },
  stores: {
    getAll: async () => JSON.parse(localStorage.getItem('stores') || '[]'),
    create: async (data: any) => {
      const stores = JSON.parse(localStorage.getItem('stores') || '[]')
      const newStore = { id: Date.now().toString(), ...data }
      stores.push(newStore)
      localStorage.setItem('stores', JSON.stringify(stores))
      return { success: true, store: newStore }
    },
    update: async ({ id, storeData }: any) => {
      const stores = JSON.parse(localStorage.getItem('stores') || '[]')
      const index = stores.findIndex((s: any) => s.id === id)
      if (index !== -1) {
        stores[index] = { ...stores[index], ...storeData }
        localStorage.setItem('stores', JSON.stringify(stores))
        return { success: true, store: stores[index] }
      }
      return { success: false, message: 'Store not found' }
    },
    delete: async (id: string) => {
      const stores = JSON.parse(localStorage.getItem('stores') || '[]')
      const filtered = stores.filter((s: any) => s.id !== id)
      localStorage.setItem('stores', JSON.stringify(filtered))
      return { success: true }
    }
  },
  employees: {
    getAll: async () => JSON.parse(localStorage.getItem('employees') || '[]'),
    create: async (data: any) => {
      const employees = JSON.parse(localStorage.getItem('employees') || '[]')
      const newEmployee = { id: Date.now().toString(), ...data }
      employees.push(newEmployee)
      localStorage.setItem('employees', JSON.stringify(employees))
      return { success: true, employee: newEmployee }
    }
  },
  customers: {
    getAll: async () => JSON.parse(localStorage.getItem('customers') || '[]'),
    create: async (data: any) => {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]')
      const newCustomer = { id: Date.now().toString(), ...data }
      customers.push(newCustomer)
      localStorage.setItem('customers', JSON.stringify(customers))
      return { success: true, customer: newCustomer }
    }
  },
  sales: {
    getAll: async () => JSON.parse(localStorage.getItem('sales') || '[]'),
    create: async (data: any) => {
      const sales = JSON.parse(localStorage.getItem('sales') || '[]')
      const newSale = {
        id: `S-${Date.now().toString().slice(-6)}`,
        ...data,
        createdAt: new Date().toISOString(),
        product: { name: 'Mock Product' },
        user: { username: 'Demo User' }
      }
      sales.unshift(newSale)
      localStorage.setItem('sales', JSON.stringify(sales))
      return { success: true, sale: newSale }
    },
    refund: async (saleId: string) => {
      const sales = JSON.parse(localStorage.getItem('sales') || '[]')
      const sale = sales.find((s: any) => s.id === saleId)
      if (sale) {
        sale.status = 'refunded'
        localStorage.setItem('sales', JSON.stringify(sales))
        return { success: true, sale }
      }
      return { success: false, message: 'Sale not found' }
    }
  }
}

export const ipc = isElectron ? {
  // Product operations
  products: {
    getAll: () => window.electron.ipcRenderer.invoke('products:getAll'),
    create: (data: any) => window.electron.ipcRenderer.invoke('products:create', data),
    update: (id: string, data: any) => window.electron.ipcRenderer.invoke('products:update', { id, productData: data }),
    delete: (id: string) => window.electron.ipcRenderer.invoke('products:delete', id)
  },
  
  // Store operations
  stores: {
    getAll: () => window.electron.ipcRenderer.invoke('stores:getAll'),
    create: (data: any) => window.electron.ipcRenderer.invoke('stores:create', data),
    update: (id: string, data: any) => window.electron.ipcRenderer.invoke('stores:update', { id, storeData: data }),
    delete: (id: string) => window.electron.ipcRenderer.invoke('stores:delete', id)
  },
  
  // Employee operations
  employees: {
    getAll: () => window.electron.ipcRenderer.invoke('employees:getAll'),
    create: (data: any) => window.electron.ipcRenderer.invoke('employees:create', data)
  },
  
  // Customer operations
  customers: {
    getAll: () => window.electron.ipcRenderer.invoke('customers:getAll'),
    create: (data: any) => window.electron.ipcRenderer.invoke('customers:create', data)
  },
  
  // Sales operations
  sales: {
    getAll: () => window.electron.ipcRenderer.invoke('sales:getAll'),
    create: (data: any) => window.electron.ipcRenderer.invoke('sales:create', data),
    refund: (saleId: string) => window.electron.ipcRenderer.invoke('sales:refund', saleId)
  }
} : mockIPC

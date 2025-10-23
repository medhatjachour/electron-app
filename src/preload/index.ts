import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  auth: {
    login: (username: string, password: string) =>
      ipcRenderer.invoke('auth:login', { username, password })
  },
  dashboard: {
    getMetrics: () => ipcRenderer.invoke('dashboard:getMetrics')
  },
  sales: {
    getAll: () => ipcRenderer.invoke('sales:getAll'),
    create: (data: {
      productId: string
      userId: string
      quantity: number
      total: number
    }) => ipcRenderer.invoke('sales:create', data)
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
    getAll: () => ipcRenderer.invoke('inventory:getAll'),
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
      ipcRenderer.invoke('finance:getTransactions', data)
  },
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    create: (productData: any) => ipcRenderer.invoke('products:create', productData),
    update: (data: { id: string; productData: any }) => ipcRenderer.invoke('products:update', data),
    delete: (id: string) => ipcRenderer.invoke('products:delete', id)
  }
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

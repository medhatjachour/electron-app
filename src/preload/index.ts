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
    create: (data: {
      productId: string
      userId: string
      quantity: number
      total: number
    }) => ipcRenderer.invoke('sales:create', data)
  },
  inventory: {
    getProducts: () => ipcRenderer.invoke('inventory:getProducts'),
    addProduct: (data: {
      name: string
      sku: string
      price: number
      stock: number
    }) => ipcRenderer.invoke('inventory:addProduct', data)
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

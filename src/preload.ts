import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './shared/types';

export const api = {
  // Auth
  auth: {
    login: (username: string, password: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTH.LOGIN, username, password),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH.LOGOUT),
  },
  
  // Products
  products: {
    create: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS.CREATE, data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS.UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS.DELETE, id),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS.GET_ALL),
    getLowStock: () => ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS.GET_LOW_STOCK),
  },
  
  // Sales
  sales: {
    create: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.SALES.CREATE, data),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SALES.GET_ALL),
    getByDateRange: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SALES.GET_BY_DATE_RANGE, startDate, endDate),
  },
  
  // Transactions
  transactions: {
    create: (data: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.TRANSACTIONS.CREATE, data),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.TRANSACTIONS.GET_ALL),
    getByDateRange: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(
        IPC_CHANNELS.TRANSACTIONS.GET_BY_DATE_RANGE,
        startDate,
        endDate
      ),
  },
};

contextBridge.exposeInMainWorld('api', api);
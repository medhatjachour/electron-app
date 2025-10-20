export interface User {
  id: string;
  username: string;
  role: Role;
}

export enum Role {
  admin = 'admin',
  sales = 'sales',
  inventory = 'inventory',
  finance = 'finance'
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export interface Sale {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  total: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  userId: string;
  createdAt: string;
}

export enum TransactionType {
  income = 'income',
  expense = 'expense'
}

// IPC Channel Names
export const IPC_CHANNELS = {
  AUTH: {
    LOGIN: 'auth:login',
    LOGOUT: 'auth:logout',
  },
  PRODUCTS: {
    CREATE: 'products:create',
    UPDATE: 'products:update',
    DELETE: 'products:delete',
    GET_ALL: 'products:getAll',
    GET_LOW_STOCK: 'products:getLowStock',
  },
  SALES: {
    CREATE: 'sales:create',
    GET_ALL: 'sales:getAll',
    GET_BY_DATE_RANGE: 'sales:getByDateRange',
  },
  TRANSACTIONS: {
    CREATE: 'transactions:create',
    GET_ALL: 'transactions:getAll',
    GET_BY_DATE_RANGE: 'transactions:getByDateRange',
  },
} as const;
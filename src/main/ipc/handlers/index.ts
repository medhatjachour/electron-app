/**
 * IPC Handlers Index
 * Centralizes registration of all domain-specific handlers
 */

import path from 'node:path'
import { registerAuthHandlers } from './auth.handlers'
import { registerDashboardHandlers } from './dashboard.handlers'
import { registerSalesHandlers } from './sales.handlers'
import { registerInventoryHandlers } from './inventory.handlers'
import { registerFinanceHandlers } from './finance.handlers'
import { registerProductsHandlers } from './products.handlers'
import { registerStoresHandlers } from './stores.handlers'
import { registerEmployeesHandlers } from './employees.handlers'
import { registerCustomersHandlers } from './customers.handlers'

// Initialize Prisma client
let prisma: any = null
try {
  // In built app, __dirname is out/main (handlers get bundled into main/index.js)
  // Go up 1 level to out/, then into generated/prisma
  const prismaPath = path.resolve(__dirname, '..', 'generated', 'prisma')
  
  const { PrismaClient } = require(prismaPath)
  if (PrismaClient) {
    prisma = new PrismaClient()
    console.log('[Database] ✅ Prisma client initialized successfully')
  }
} catch (e) {
  console.warn('[Database] ⚠️  Prisma client not available; using mock fallbacks')
}

if (!prisma) {
  console.warn('[Dev Mode] 🔄 Prisma client disabled - IPC handlers using mock data')
}

/**
 * Register all IPC handlers
 * Call this function once during Electron app initialization
 */
export function registerAllHandlers() {
  console.log('🔧 Starting IPC handler registration...')
  
  registerAuthHandlers(prisma)
  console.log('  ✓ Auth handlers registered')
  
  registerDashboardHandlers(prisma)
  console.log('  ✓ Dashboard handlers registered')
  
  registerSalesHandlers(prisma)
  console.log('  ✓ Sales handlers registered')
  
  registerInventoryHandlers(prisma)
  console.log('  ✓ Inventory handlers registered')
  
  registerFinanceHandlers(prisma)
  console.log('  ✓ Finance handlers registered')
  
  registerProductsHandlers(prisma)
  console.log('  ✓ Products handlers registered')
  
  registerStoresHandlers(prisma)
  console.log('  ✓ Stores handlers registered')
  
  registerEmployeesHandlers(prisma)
  console.log('  ✓ Employees handlers registered')
  
  registerCustomersHandlers(prisma)
  console.log('  ✓ Customers handlers registered')
  
  console.log('✅ All IPC handlers registered successfully')
}

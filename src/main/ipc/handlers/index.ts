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
import { registerCategoriesHandlers } from './categories.handlers'
import { registerStoresHandlers } from './stores.handlers'
import { registerEmployeesHandlers } from './employees.handlers'
import { registerCustomersHandlers } from './customers.handlers'
import { registerSearchHandlers } from './search.handlers'

// Initialize Prisma client
let prisma: any = null
try {
  // In built app, __dirname is out/main (handlers get bundled into main/index.js)
  // Go up 1 level to out/, then into generated/prisma
  const prismaPath = path.resolve(__dirname, '..', 'generated', 'prisma')
  
  console.log('[Database] Attempting to load Prisma from:', prismaPath)
  
  const { PrismaClient } = require(prismaPath)
  if (PrismaClient) {
    const isDev = process.env.NODE_ENV === 'development'
    
    // Database paths
    const dbPath = isDev 
      ? path.resolve(process.cwd(), 'prisma', 'dev.db')
      : String.raw`C:\electron-app-data\database.db`
    
    console.log('[Database] Database path:', dbPath)
    
    prisma = new PrismaClient({
      datasources: {
        db: {
          // SQLite optimization: WAL mode for better concurrency, increased timeout
          url: `file:${dbPath}?connection_limit=1&timeout=60000&journal_mode=WAL`
        }
      },
      log: ['error'], // Only log errors, disable query logging
      // Increase transaction timeout from default 5s to 30s
      // This prevents "Transaction already closed" errors for complex operations
      transactionOptions: {
        maxWait: 30000, // Max time to wait for a transaction slot (30s)
        timeout: 30000, // Max time a transaction can run (30s)
        isolationLevel: 'Serializable' // Ensure data consistency
      }
    })
    
    console.log('[Database] ✅ Prisma client initialized successfully')
  }
} catch (e) {
  console.error('[Database] ⚠️  Error initializing Prisma:', e)
  console.warn('[Database] Using mock fallbacks')
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
  
  registerCategoriesHandlers(prisma)
  console.log('  ✓ Categories handlers registered')
  
  registerStoresHandlers(prisma)
  console.log('  ✓ Stores handlers registered')
  
  registerEmployeesHandlers(prisma)
  console.log('  ✓ Employees handlers registered')
  
  registerCustomersHandlers(prisma)
  console.log('  ✓ Customers handlers registered')
  
  registerSearchHandlers(prisma)
  console.log('  ✓ Search handlers registered')
  
  console.log('✅ All IPC handlers registered successfully')
}

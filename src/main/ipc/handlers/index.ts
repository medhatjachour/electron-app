/**
 * IPC Handlers Index
 * Centralizes registration of all domain-specific handlers
 */

import path from 'node:path'
import { getDatabasePath } from '../../database/init'
import { seedProductionDatabase } from '../../database/seed-production'
import { registerAuthHandlers } from './auth.handlers'
import { registerDashboardHandlers } from './dashboard.handlers'
import { registerSalesHandlers } from './sales.handlers'
import { registerSaleTransactionHandlers } from './sale-transactions.handlers'
import { registerInventoryHandlers } from './inventory.handlers'
import { registerFinanceHandlers } from './finance.handlers'
import { registerProductsHandlers } from './products.handlers'
import { registerCategoriesHandlers } from './categories.handlers'
import { registerStoresHandlers } from './stores.handlers'
import { registerEmployeesHandlers } from './employees.handlers'
import { registerCustomersHandlers } from './customers.handlers'
import { registerSearchHandlers } from './search.handlers'
import { registerUserHandlers } from './user.handlers'
import { registerReportsHandlers } from './reports.handlers'
import { registerAnalyticsHandlers } from './analytics.handlers'

// Initialize Prisma client
let isSeeded = false
let prisma: any = null
try {
  // In dev mode, use generated Prisma from src/generated/prisma
  // In production, use the packed src/generated/prisma (unpacked by electron-builder)
  const isDev = process.env.NODE_ENV === 'development'
  let PrismaClient
  
  if (isDev) {
    const prismaPath = path.resolve(process.cwd(), 'src', 'generated', 'prisma')
    console.log('[Database] [DEV] Loading Prisma from:', prismaPath)
    PrismaClient = require(prismaPath).PrismaClient
  } else {
    // In production, use the unpacked src/generated/prisma
    // __dirname in production is: /opt/BizFlow/resources/app.asar/out/main
    const prismaPath = path.resolve(__dirname, '..', '..', '..', 'app.asar.unpacked', 'src', 'generated', 'prisma')
    console.log('[Database] [PROD] Loading Prisma from:', prismaPath)
    PrismaClient = require(prismaPath).PrismaClient
  }
  if (PrismaClient) {
    // Use centralized database path function
    const dbPath = getDatabasePath()
    
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
    
    // Auto-seed on first connection (production only)
    const isProd = process.env.NODE_ENV !== 'development'
    if (isProd && !isSeeded) {
      // Defer seeding to avoid blocking app startup
      setTimeout(async () => {
        try {
          await seedProductionDatabase(prisma)
          isSeeded = true
        } catch (error) {
          console.error('[Database] Failed to seed database:', error)
        }
      }, 1000)
    }
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
  
  registerSaleTransactionHandlers(prisma)
  console.log('  ✓ Sale Transaction handlers registered')
  
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
  
  registerUserHandlers(prisma)
  console.log('  ✓ User management handlers registered')
  
  registerReportsHandlers(prisma)
  console.log('  ✓ Reports handlers registered')
  
  // Register analytics handlers (self-contained with own Prisma instance)
  registerAnalyticsHandlers()
  
  console.log('✅ All IPC handlers registered successfully')
}

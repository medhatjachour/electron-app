/**
 * IPC Handlers Entry Point
 * 
 * This file now delegates to modular domain-specific handlers.
 * All handlers have been split into separate files in the handlers/ directory
 * for better maintainability and separation of concerns.
 * 
 * Handler modules:
 * - auth.handlers.ts - Authentication
 * - dashboard.handlers.ts - Dashboard metrics
 * - sales.handlers.ts - Sales transactions
 * - inventory.handlers.ts - Legacy inventory (simple products)
 * - finance.handlers.ts - Financial transactions
 * - products.handlers.ts - Full product management (with variants & images)
 * - stores.handlers.ts - Store management
 * - employees.handlers.ts - Employee management
 * - customers.handlers.ts - Customer management
 */

// Import handlers index to auto-register all handlers
import './handlers'

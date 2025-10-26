/**
 * Database initialization for production builds
 * Creates empty database in C:\electron-app-data on first run
 */

import * as fs from 'fs'
import * as path from 'path'

export function initializeDatabase(): void {
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    console.log('[DB Init] Running in development mode, using project database')
    return
  }

  // Production: Use C:\electron-app-data directory
  const appDataPath = String.raw`C:\electron-app-data`
  const dbPath = path.join(appDataPath, 'database.db')
  
  console.log('[DB Init] Production mode - App data directory:', appDataPath)
  console.log('[DB Init] Database path:', dbPath)
  
  try {
    // Ensure C:\electron-app-data directory exists
    if (!fs.existsSync(appDataPath)) {
      console.log('[DB Init] Creating app data directory...')
      fs.mkdirSync(appDataPath, { recursive: true })
    }

    // Check if database already exists
    if (fs.existsSync(dbPath)) {
      console.log('[DB Init] Database already exists')
      return
    }

    console.log('[DB Init] First run detected - Creating new empty database...')
    
    // Create empty database file
    fs.writeFileSync(dbPath, '')
    console.log('[DB Init] ✅ Empty database created successfully at:', dbPath)
    
    // Note: Prisma will create tables automatically on first connection
    // using the schema from out/generated/prisma/schema.prisma
    console.log('[DB Init] Database initialized. Schema will be created on first use.')
    
  } catch (error) {
    console.error('[DB Init] ❌ Error initializing database:', error)
    console.error('[DB Init] Make sure you have write permissions to C:\\')
    throw error
  }
}

/**
 * Get database path for the current environment
 */
export function getDatabasePath(): string {
  const isDev = process.env.NODE_ENV === 'development'
  return isDev 
    ? path.resolve(process.cwd(), 'prisma', 'dev.db')
    : String.raw`C:\electron-app-data\database.db`
}

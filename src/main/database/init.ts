/**
 * Database initialization for production builds
 * Uses Electron's userData directory for proper cross-platform support
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { app } from 'electron'

/**
 * Initialize database file and directory structure
 * Creates empty database on first run in production
 */
export async function initializeDatabase(): Promise<void> {
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    console.log('[DB Init] Running in development mode, using project database')
    
    // Check if dev database exists and has tables
    const devDbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
    if (!fs.existsSync(devDbPath) || fs.statSync(devDbPath).size < 1024) {
      console.log('[DB Init] 🔧 Dev database missing or empty, initializing...')
      await initializeDevelopmentDatabase(devDbPath)
    }
    
    return
  }

  // Production: Use Electron's userData directory (cross-platform)
  const appDataPath = app.getPath('userData')
  const dbPath = path.join(appDataPath, 'database.db')
  
  console.log('[DB Init] Production mode - App data directory:', appDataPath)
  console.log('[DB Init] Database path:', dbPath)
  
  try {
    // Ensure app data directory exists
    if (!fs.existsSync(appDataPath)) {
      console.log('[DB Init] Creating app data directory...')
      fs.mkdirSync(appDataPath, { recursive: true })
    }

    // Check if database already exists
    const isFirstRun = !fs.existsSync(dbPath)
    
    if (!isFirstRun) {
      console.log('[DB Init] Database already exists')
      return
    }

    console.log('[DB Init] 🎉 First run detected - Creating new database with schema...')
    
    // Copy the template.db from resources to initialize with schema (recommended)
    const templateDbPath = path.join(process.resourcesPath, 'prisma', 'template.db')

    if (fs.existsSync(templateDbPath)) {
      console.log('[DB Init] Copying template database from resources...')
      fs.copyFileSync(templateDbPath, dbPath)
      console.log('[DB Init] ✅ Database initialized from template')
    } else {
      // Fallback: create empty file (application will attempt to seed but schema may need initialization)
      console.log('[DB Init] Template not found, creating empty database...')
      fs.writeFileSync(dbPath, '')
      console.log('[DB Init] ⚠️ Empty database created - schema may need to be initialized. Run create-template-db before packaging to include a working template.')
    }
    
    console.log('[DB Init] ℹ️ Default admin user: username="0000", password="0000"')
    
  } catch (error) {
    console.error('[DB Init] ❌ Error initializing database:', error)
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
    : path.join(app.getPath('userData'), 'database.db')
}

/**
 * Initialize development database with schema and default admin user
 */
async function initializeDevelopmentDatabase(dbPath: string): Promise<void> {
  try {
    // Ensure prisma directory exists
    const prismaDir = path.dirname(dbPath)
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true })
    }

    console.log('[DB Init] 🔧 Creating database schema...')
    console.log('[DB Init] ℹ️  This will run "prisma db push" - please wait...')
    
    // Run Prisma DB push to create schema (non-blocking)
    const { spawn } = require('node:child_process')
    
    const pushProcess = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss', '--skip-generate'], {
      cwd: process.cwd(),
      shell: true,
      env: { ...process.env, DATABASE_URL: `file:${dbPath}` }
    })

    // Wait for the push to complete
    await new Promise<void>((resolve, reject) => {
      let output = ''
      
      pushProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString()
        output += text
        if (text.includes('Your database is now in sync')) {
          console.log('[DB Init] ✅ Schema created successfully')
        }
      })

      pushProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString()
        // Prisma outputs info to stderr too, so don't treat all as errors
        if (!text.includes('Prisma schema loaded') && !text.includes('Datasource')) {
          console.error('[DB Init] Warning:', text)
        }
      })

      pushProcess.on('close', (code: number) => {
        if (code === 0 || output.includes('Your database is now in sync')) {
          resolve()
        } else {
          reject(new Error(`Prisma push failed with code ${code}`))
        }
      })

      pushProcess.on('error', reject)
    })

    // Now create the setup admin user
    console.log('[DB Init] Creating default setup admin user...')
    
    // Import Prisma and bcrypt dynamically
    const bcrypt = require('bcryptjs')
    const { PrismaClient } = require(path.join(process.cwd(), 'src', 'generated', 'prisma'))
    
    const setupPrisma = new PrismaClient({
      datasources: { db: { url: `file:${dbPath}` } }
    })

    try {
      const existing = await setupPrisma.user.count()
      if (existing > 0) {
        console.log('[DB Init] ℹ️  Users already exist, skipping setup user creation')
      } else {
        const passwordHash = await bcrypt.hash('setup123', 10)
        await setupPrisma.user.create({
          data: {
            username: 'setup',
            passwordHash: passwordHash,
            role: 'admin',
            fullName: 'Setup Administrator',
            email: 'setup@bizflow.local',
            isActive: true
          }
        })
        
        console.log('[DB Init] ✅ Created setup admin user')
        console.log('[DB Init] 📝 Login credentials:')
        console.log('[DB Init]    Username: setup')
        console.log('[DB Init]    Password: setup123')
        console.log('[DB Init] ⚠️  IMPORTANT: Use this account ONLY to create your permanent admin, then delete it!')
      }
    } finally {
      await setupPrisma.$disconnect()
    }

    console.log('[DB Init] 🎉 Database initialization complete!')
    
  } catch (error) {
    console.error('[DB Init] ❌ Failed to initialize database:', error)
    console.error('[DB Init] 💡 You can manually run: npm run prisma:push && npm run prisma:seed')
    throw error
  }
}

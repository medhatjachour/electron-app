import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Import IPC handlers registration function
import { registerAllHandlers } from './ipc/handlers/index'
import { initializeDatabase } from './database/init'

// Setup logging to file
const logDir = join(app.getPath('userData'), 'logs')
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true })
}
const logFile = join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`)

// Save original console methods BEFORE overriding
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

function logToFile(level: string, ...args: any[]) {
  const timestamp = new Date().toISOString()
  const message = args.map(a => {
    try {
      return typeof a === 'string' ? a : JSON.stringify(a)
    } catch {
      return String(a)
    }
  }).join(' ')
  const logMessage = `[${timestamp}] [${level}] ${message}\n`
  
  try {
    appendFileSync(logFile, logMessage)
  } catch (err) {
    originalConsoleError('Failed to write to log file:', err)
  }
}

// Override console methods to also log to file
console.log = (...args) => {
  originalConsoleLog(...args)
  logToFile('INFO', ...args)
}

console.error = (...args) => {
  originalConsoleError(...args)
  logToFile('ERROR', ...args)
}

console.warn = (...args) => {
  originalConsoleWarn(...args)
  logToFile('WARN', ...args)
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true // TEMPORARILY ENABLED FOR DEBUGGING - TODO: Change back to false after fixing white screen
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Set a clear, branded window title
  try {
    mainWindow.setTitle('BizFlow')
  } catch (err) {
    console.warn('Could not set window title:', err)
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // TEMPORARILY DISABLED - Enable DevTools for debugging white screen
  // TODO: Uncomment after fixing the issue
  // // Prevent opening DevTools via keyboard shortcuts
  // mainWindow.webContents.on('before-input-event', (event, input) => {
  //   const key = input.key?.toLowerCase?.() || ''
  //   // Block F12 or Ctrl+Shift+I / Command+Option+I
  //   if (key === 'f12' || ((input.control || input.meta) && input.shift && key === 'i')) {
  //     event.preventDefault()
  //   }
  // })
  
  // TEMPORARY: Auto-open DevTools to see console errors
  mainWindow.webContents.openDevTools({ mode: 'detach' })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  // Load renderer: prefer dev URL in development, otherwise load local file.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    console.log('[Main] Loading renderer from URL:', process.env['ELECTRON_RENDERER_URL'])
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']).catch(err => {
      console.error('[Main] Failed to load renderer URL:', err)
    })
  } else {
    const indexPath = join(__dirname, '../renderer/index.html')
    // Safety: check file exists before loading to avoid white screen + silent fail
    try {
      if (!existsSync(indexPath)) {
        console.error('[Main] Renderer index.html not found at:', indexPath)
        // Print a small error HTML to help users debug a missing build
        const errorHtml = `<!doctype html><html><body><h2>Missing renderer build</h2><p>Expected file not found: ${indexPath}</p></body></html>`
        mainWindow.loadURL('data:text/html,' + encodeURIComponent(errorHtml))
      } else {
        mainWindow.loadFile(indexPath).catch(err => {
          console.error('[Main] Failed to load index.html:', err)
          const errorHtml = `<!doctype html><html><body><h2>Renderer failed to load</h2><pre>${String(err)}</pre></body></html>`
          mainWindow.loadURL('data:text/html,' + encodeURIComponent(errorHtml))
        })
      }
    } catch (err) {
      console.error('[Main] Error while attempting to load renderer:', err)
      const errorHtml = `<!doctype html><html><body><h2>Renderer load error</h2><pre>${String(err)}</pre></body></html>`
      mainWindow.loadURL('data:text/html,' + encodeURIComponent(errorHtml))
    }
  }

  // Log any renderer errors
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('[Renderer] Page failed to load:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Renderer] Process gone:', details.reason, details.exitCode)
  })

  // Console message logging for debugging
  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    console.log(`[Renderer Console] ${message}`)
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.bizflow.app')

  console.log('[Main] Starting application...')
  console.log('[Main] Environment:', is.dev ? 'development' : 'production')
  console.log('[Main] User data path:', app.getPath('userData'))

  try {
    // Initialize database (create in userData on first run)
    console.log('[Main] Initializing database...')
    await initializeDatabase()

    // Register all IPC handlers BEFORE creating windows
    console.log('[Main] Registering IPC handlers...')
    registerAllHandlers()

    console.log('[Main] ✅ Setup complete, creating window...')
  } catch (error) {
    console.error('[Main] ❌ Setup failed:', error)
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled rejection at:', promise, 'reason:', reason)
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

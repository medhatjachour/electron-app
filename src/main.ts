import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
// Import PrismaClient dynamically to avoid crash when `prisma generate` hasn't been run
import bcrypt from 'bcryptjs';
import { IPC_CHANNELS } from './shared/types';

let prisma: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require('@prisma/client')
  const PrismaClient = pkg?.PrismaClient || pkg?.default
  if (PrismaClient) {
    prisma = new PrismaClient()
  }
} catch (e) {
  console.warn('Prisma client not available (did you run `prisma generate`?). Falling back to mock handlers.')
}
let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/out/index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Auth Handlers
ipcMain.handle(IPC_CHANNELS.AUTH.LOGIN, async (_, username: string, password: string) => {
  if (prisma) {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) throw new Error('User not found')

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) throw new Error('Invalid password')

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    }
  }

  // Mock fallback
  return { id: '1', username, role: 'admin' }
})

// Product Handlers
ipcMain.handle(IPC_CHANNELS.PRODUCTS.CREATE, async (_, data) => {
  if (prisma) return await prisma.product.create({ data })
  return { id: 'p_mock', ...data }
})

ipcMain.handle(IPC_CHANNELS.PRODUCTS.GET_ALL, async () => {
  if (prisma) return await prisma.product.findMany()
  return [{ id: 'p1', name: 'Product A', sku: 'A-1', price: 10, stock: 100 }]
})

ipcMain.handle(IPC_CHANNELS.PRODUCTS.GET_LOW_STOCK, async () => {
  if (prisma) return await prisma.product.findMany({ where: { stock: { lt: 10 } } })
  return [{ id: 'p2', name: 'Product B', sku: 'B-1', price: 20, stock: 5 }]
})

// Sales Handlers
ipcMain.handle(IPC_CHANNELS.SALES.CREATE, async (_, data) => {
  if (prisma) {
    const { productId, quantity, userId } = data
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Product not found')
    if (product.stock < quantity) throw new Error('Insufficient stock')

    const sale = await prisma.$transaction([
      prisma.sale.create({ data: { productId, userId, quantity, total: product.price * quantity } }),
      prisma.product.update({ where: { id: productId }, data: { stock: { decrement: quantity } } })
    ])

    return sale[0]
  }

  return { id: 's_mock', ...data, createdAt: new Date() }
})

ipcMain.handle(IPC_CHANNELS.SALES.GET_BY_DATE_RANGE, async (_, startDate, endDate) => {
  if (prisma) {
    return await prisma.sale.findMany({
      where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } },
      include: { product: true, user: { select: { username: true, role: true } } }
    })
  }

  return []
})

// Transaction Handlers
ipcMain.handle(IPC_CHANNELS.TRANSACTIONS.CREATE, async (_, data) => {
  if (prisma) return await prisma.transaction.create({ data })
  return { id: 't_mock', ...data }
})

ipcMain.handle(IPC_CHANNELS.TRANSACTIONS.GET_BY_DATE_RANGE, async (_, startDate, endDate) => {
  if (prisma) {
    return await prisma.transaction.findMany({ where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }, include: { user: { select: { username: true, role: true } } } })
  }
  return []
})
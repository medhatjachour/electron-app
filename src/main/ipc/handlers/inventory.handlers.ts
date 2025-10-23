/**
 * Inventory IPC Handlers
 * Handles legacy inventory operations
 * NOTE: For full product management with variants and images, use products.handlers.ts
 */

import { ipcMain } from 'electron'

export function registerInventoryHandlers(prisma: any) {
  ipcMain.handle('inventory:getProducts', async () => {
    try {
      if (prisma) {
        const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })
        return products
      }
      return [
        { id: 'p1', name: 'Product A', sku: 'A-1', price: 10, stock: 100 }, 
        { id: 'p2', name: 'Product B', sku: 'B-1', price: 20, stock: 5 }
      ]
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  })

  ipcMain.handle('inventory:addProduct', async (_, { name, sku, price, stock }) => {
    try {
      if (prisma) {
        const product = await prisma.product.create({ data: { name, sku, price, stock } })
        return { success: true, product }
      }
      return { success: true, product: { id: 'p_mock', name, sku, price, stock } }
    } catch (error) {
      console.error('Error adding product:', error)
      throw error
    }
  })
}

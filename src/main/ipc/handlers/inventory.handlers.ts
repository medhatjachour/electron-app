/**
 * Inventory IPC Handlers
 * Enhanced with service layer for better architecture
 * Uses Repository pattern via InventoryService
 */

import { ipcMain } from 'electron'
import { InventoryService } from '../../services/InventoryService'

export function registerInventoryHandlers(prisma: any) {
  const inventoryService = InventoryService.getInstance(prisma)

  // Get all inventory items with enriched data
  ipcMain.handle('inventory:getAll', async () => {
    try {
      // Include images for inventory modal display
      return await inventoryService.getAllInventory({ includeImages: true })
    } catch (error) {
      console.error('Error fetching inventory:', error)
      throw error
    }
  })

  // Get inventory metrics
  ipcMain.handle('inventory:getMetrics', async () => {
    try {
      return await inventoryService.getInventoryMetrics()
    } catch (error) {
      console.error('Error fetching metrics:', error)
      throw error
    }
  })

  // Get top stocked items
  ipcMain.handle('inventory:getTopStocked', async (_, limit: number = 5) => {
    try {
      return await inventoryService.getTopStockedItems(limit)
    } catch (error) {
      console.error('Error fetching top stocked items:', error)
      throw error
    }
  })

  // Get low stock items
  ipcMain.handle('inventory:getLowStock', async (_, threshold: number = 10) => {
    try {
      return await inventoryService.getLowStockItems(threshold)
    } catch (error) {
      console.error('Error fetching low stock items:', error)
      throw error
    }
  })

  // Get out of stock items
  ipcMain.handle('inventory:getOutOfStock', async () => {
    try {
      return await inventoryService.getOutOfStockItems()
    } catch (error) {
      console.error('Error fetching out of stock items:', error)
      throw error
    }
  })

  // Search inventory
  ipcMain.handle('inventory:search', async (_, query: string) => {
    try {
      return await inventoryService.searchInventory(query)
    } catch (error) {
      console.error('Error searching inventory:', error)
      throw error
    }
  })

  // Get stock movement history
  ipcMain.handle('inventory:getStockHistory', async (_, productId: string) => {
    try {
      return await inventoryService.getStockMovementHistory(productId)
    } catch (error) {
      console.error('Error fetching stock history:', error)
      throw error
    }
  })

  // Update variant stock
  ipcMain.handle('inventory:updateStock', async (_, { variantId, stock }: { variantId: string, stock: number }) => {
    try {
      await inventoryService.updateVariantStock(variantId, stock)
      return { success: true }
    } catch (error) {
      console.error('Error updating stock:', error)
      throw error
    }
  })

  // Legacy handler for backward compatibility
  ipcMain.handle('inventory:getProducts', async () => {
    try {
      return await inventoryService.getAllInventory()
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  })
}

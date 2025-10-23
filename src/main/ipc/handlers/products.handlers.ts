/**
 * Products IPC Handlers
 * Handles full product management with variants and images
 */

import { ipcMain } from 'electron'

export function registerProductsHandlers(prisma: any) {
  // Get all products with variants and images
  ipcMain.handle('products:getAll', async () => {
    try {
      if (prisma) {
        const products = await prisma.product.findMany({
          include: {
            images: { orderBy: { order: 'asc' } },
            variants: { orderBy: { createdAt: 'asc' } }
          },
          orderBy: { createdAt: 'desc' }
        })
        return products
      }
      return []
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  })

  // Create product with variants and images
  ipcMain.handle('products:create', async (_, productData) => {
    try {
      if (prisma) {
        const { images, variants, baseStock, ...product } = productData
        
        const newProduct = await prisma.product.create({
          data: {
            ...product,
            images: images?.length ? {
              create: images.map((img: string, idx: number) => ({
                imageData: img,
                order: idx
              }))
            } : undefined,
            variants: variants?.length ? {
              create: variants.map((v: any) => ({
                color: v.color,
                size: v.size,
                sku: v.sku,
                price: v.price,
                stock: v.stock
              }))
            } : undefined
          },
          include: {
            images: true,
            variants: true
          }
        })
        
        return { success: true, product: newProduct }
      }
      return { success: false, message: 'Database not available' }
    } catch (error: any) {
      console.error('Error creating product:', error)
      return { success: false, message: error.message }
    }
  })

  // Update product
  ipcMain.handle('products:update', async (_, { id, productData }) => {
    try {
      if (prisma) {
        const { images, variants, baseStock, ...product } = productData
        
        // Delete existing images and variants, then recreate
        await prisma.productImage.deleteMany({ where: { productId: id } })
        await prisma.productVariant.deleteMany({ where: { productId: id } })
        
        const updated = await prisma.product.update({
          where: { id },
          data: {
            ...product,
            images: images?.length ? {
              create: images.map((img: string, idx: number) => ({
                imageData: img,
                order: idx
              }))
            } : undefined,
            variants: variants?.length ? {
              create: variants.map((v: any) => ({
                color: v.color,
                size: v.size,
                sku: v.sku,
                price: v.price,
                stock: v.stock
              }))
            } : undefined
          },
          include: {
            images: true,
            variants: true
          }
        })
        
        return { success: true, product: updated }
      }
      return { success: false, message: 'Database not available' }
    } catch (error: any) {
      console.error('Error updating product:', error)
      return { success: false, message: error.message }
    }
  })

  // Delete product
  ipcMain.handle('products:delete', async (_, id) => {
    try {
      if (prisma) {
        await prisma.product.delete({ where: { id } })
        return { success: true }
      }
      return { success: false, message: 'Database not available' }
    } catch (error: any) {
      console.error('Error deleting product:', error)
      return { success: false, message: error.message }
    }
  })
}

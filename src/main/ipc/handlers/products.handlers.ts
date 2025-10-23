/**
 * Products IPC Handlers
 * High-performance product management with optimized queries for large datasets
 * 
 * Performance Optimizations:
 * - Images excluded by default to prevent serialization errors
 * - Pagination support for smooth scrolling with thousands of products
 * - Newest products first for better UX
 * - Selective field loading
 * - Non-blocking async operations
 */

import { ipcMain } from 'electron'

export function registerProductsHandlers(prisma: any) {
  /**
   * Get all products - OPTIMIZED for large datasets
   * Excludes images by default, shows newest first, limits to 500 items
   */
  ipcMain.handle('products:getAll', async (_, options = {}) => {
    try {
      if (!prisma) return []

      const { 
        includeImages = false,
        limit = 500,
        offset = 0,
        searchTerm = '',
        category = ''
      } = options

      // Build where clause
      const where: any = {}
      if (searchTerm) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { baseSKU: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      }
      if (category) {
        where.category = category
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          // Only load images if explicitly requested
          images: includeImages ? { 
            orderBy: { order: 'asc' },
            take: 1 // Only first image for list view
          } : false,
          variants: { 
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              sku: true,
              color: true,
              size: true,
              price: true,
              stock: true,
              createdAt: true,
              updatedAt: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }, // NEWEST FIRST
        take: limit,
        skip: offset
      })

      // Calculate total count for pagination
      const totalCount = await prisma.product.count({ where })

      return {
        products,
        totalCount,
        hasMore: offset + limit < totalCount
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  })

  /**
   * Get single product with all details including images
   * Used when viewing/editing product details
   */
  ipcMain.handle('products:getById', async (_, id: string) => {
    try {
      if (!prisma) return null

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          images: { orderBy: { order: 'asc' } },
          variants: { orderBy: { createdAt: 'asc' } },
          store: true
        }
      })

      return product
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  })

  /**
   * Create product - optimized with transaction
   */
  ipcMain.handle('products:create', async (_, productData) => {
    try {
      if (!prisma) {
        return { success: false, message: 'Database not available' }
      }

      const { images, variants, baseStock, ...product } = productData
      
      // Use transaction for atomic operation
      const newProduct = await prisma.$transaction(async (tx: any) => {
        return await tx.product.create({
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
            variants: true,
            store: true
          }
        })
      })
      
      return { success: true, product: newProduct }
    } catch (error: any) {
      console.error('Error creating product:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * Update product - optimized with transaction
   */
  ipcMain.handle('products:update', async (_, { id, productData }) => {
    try {
      if (!prisma) {
        return { success: false, message: 'Database not available' }
      }

      const { images, variants, baseStock, ...product } = productData
      
      // Use transaction for atomic operation
      const updated = await prisma.$transaction(async (tx: any) => {
        // Delete existing images and variants
        await tx.productImage.deleteMany({ where: { productId: id } })
        await tx.productVariant.deleteMany({ where: { productId: id } })
        
        // Update product with new data
        return await tx.product.update({
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
            variants: true,
            store: true
          }
        })
      })
      
      return { success: true, product: updated }
    } catch (error: any) {
      console.error('Error updating product:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * Delete product - with cascade cleanup
   */
  ipcMain.handle('products:delete', async (_, id) => {
    try {
      if (!prisma) {
        return { success: false, message: 'Database not available' }
      }

      // Prisma will cascade delete images and variants automatically
      await prisma.product.delete({ where: { id } })
      
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting product:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * Get product statistics for dashboard
   * Uses raw SQL for performance
   */
  ipcMain.handle('products:getStats', async () => {
    try {
      if (!prisma) return null

      const [totalProducts] = await prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*) as count FROM Product
      `

      const [totalVariants] = await prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*) as count FROM ProductVariant
      `

      const [lowStock] = await prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(DISTINCT productId) as count
        FROM ProductVariant
        WHERE stock > 0 AND stock <= 10
      `

      return {
        totalProducts: Number(totalProducts.count || 0),
        totalVariants: Number(totalVariants.count || 0),
        lowStockCount: Number(lowStock.count || 0)
      }
    } catch (error) {
      console.error('Error fetching product stats:', error)
      throw error
    }
  })

  /**
   * Search products - optimized for autocomplete
   */
  ipcMain.handle('products:search', async (_, searchTerm: string) => {
    try {
      if (!prisma || !searchTerm) return []

      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { baseSKU: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          baseSKU: true,
          category: true,
          basePrice: true
        },
        take: 20, // Limit for autocomplete
        orderBy: { createdAt: 'desc' }
      })

      return products
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  })
}

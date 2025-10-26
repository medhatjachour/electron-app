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
 * - Caching for stats queries
 */

import { ipcMain } from 'electron'
import { cacheService, CacheKeys } from '../../services/CacheService'

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
   * Invalidates cache after creation
   */
  ipcMain.handle('products:create', async (_, productData) => {
    try {
      if (!prisma) {
        return { success: false, message: 'Database not available' }
      }

      const { images, variants, baseStock, category, ...product } = productData
      
      // If category is provided as a string (old format), we need to find or create the category
      let categoryId = product.categoryId
      
      if (category && !categoryId) {
        // Legacy support: category provided as string name
        const existingCategory = await prisma.category.findFirst({
          where: { name: category }
        })
        
        if (existingCategory) {
          categoryId = existingCategory.id
        } else {
          // Create new category if it doesn't exist
          const newCategory = await prisma.category.create({
            data: { name: category }
          })
          categoryId = newCategory.id
        }
      }
      
      // Use transaction for atomic operation
      const newProduct = await prisma.$transaction(async (tx: any) => {
        return await tx.product.create({
          data: {
            ...product,
            categoryId, // Use the resolved categoryId
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
            } : product.hasVariants === false && baseStock !== undefined ? {
              // Auto-create default variant for simple products
              create: [{
                sku: product.baseSKU,
                color: 'Default',
                size: 'Default',
                price: product.basePrice,
                stock: baseStock
              }]
            } : undefined
          },
          include: {
            images: true,
            variants: true,
            store: true,
            category: true
          }
        })
      })
      
      // Invalidate product-related caches
      cacheService.invalidatePattern('products:*')
      cacheService.invalidatePattern('inventory:*')
      
      return { success: true, product: newProduct }
    } catch (error: any) {
      console.error('Error creating product:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * Update product - optimized with transaction
   * Invalidates cache after update
   */
  ipcMain.handle('products:update', async (_, { id, productData }) => {
    try {
      if (!prisma) {
        return { success: false, message: 'Database not available' }
      }

      const { images, variants, baseStock, category, ...product } = productData
      
      // If category is provided as a string (old format), we need to find or create the category
      let categoryId = product.categoryId
      
      if (category && !categoryId) {
        // Legacy support: category provided as string name
        const existingCategory = await prisma.category.findFirst({
          where: { name: category }
        })
        
        if (existingCategory) {
          categoryId = existingCategory.id
        } else {
          // Create new category if it doesn't exist
          const newCategory = await prisma.category.create({
            data: { name: category }
          })
          categoryId = newCategory.id
        }
      }
      
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
            categoryId, // Use the resolved categoryId
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
            } : product.hasVariants === false && baseStock !== undefined ? {
              // Auto-create default variant for simple products
              create: [{
                sku: product.baseSKU,
                color: 'Default',
                size: 'Default',
                price: product.basePrice,
                stock: baseStock
              }]
            } : undefined
          },
          include: {
            images: true,
            variants: true,
            store: true,
            category: true
          }
        })
      })
      
      // Invalidate caches
      cacheService.invalidatePattern('products:*')
      cacheService.invalidatePattern('inventory:*')
      cacheService.delete(CacheKeys.productById(id))
      
      return { success: true, product: updated }
    } catch (error: any) {
      console.error('Error updating product:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * Delete product - with cascade cleanup
   * Invalidates cache after deletion
   */
  ipcMain.handle('products:delete', async (_, id) => {
    try {
      if (!prisma) {
        return { success: false, message: 'Database not available' }
      }

      // Check if product has any sales
      const salesCount = await prisma.sale.count({
        where: { productId: id }
      })

      if (salesCount > 0) {
        return { 
          success: false, 
          message: `Cannot delete product with ${salesCount} sales. Archive it instead.` 
        }
      }

      // Prisma will cascade delete images and variants automatically
      await prisma.product.delete({ where: { id } })
      
      // Invalidate caches
      cacheService.invalidatePattern('products:*')
      cacheService.invalidatePattern('inventory:*')
      cacheService.delete(CacheKeys.productById(id))
      
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting product:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * Get product statistics for dashboard
   * Uses raw SQL for performance + caching
   */
  ipcMain.handle('products:getStats', async () => {
    try {
      if (!prisma) return null

      // Try cache first
      return await cacheService.getOrCompute(
        CacheKeys.PRODUCT_STATS,
        async () => {
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
        },
        60 * 1000 // Cache for 1 minute
      )
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

  /**
   * Search products with pagination and filters - OPTIMIZED for POS
   * Supports server-side filtering, sorting, and pagination
   */
  ipcMain.handle('products:searchPaginated', async (_, options = {}) => {
    try {
      if (!prisma) return { products: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false } }

      const { 
        searchTerm = '',
        category = '',
        stockStatus = [],
        priceMin,
        priceMax,
        sortBy = 'name',
        sortOrder = 'asc',
        page = 1,
        limit = 50,
        includeImages = false 
      } = options
      
      // Build where clause
      const where: any = {}
      
      // Search filter
      if (searchTerm) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { baseSKU: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      }
      
      // Category filter
      if (category) {
        where.category = category
      }
      
      // Price range filter
      if (priceMin !== undefined || priceMax !== undefined) {
        where.basePrice = {}
        if (priceMin !== undefined) where.basePrice.gte = priceMin
        if (priceMax !== undefined) where.basePrice.lte = priceMax
      }
      
      // Stock status filter (requires checking variants)
      if (stockStatus.length > 0) {
        if (stockStatus.includes('out')) {
          // Products with all variants out of stock
          where.variants = { none: { stock: { gt: 0 } } }
        } else if (stockStatus.includes('low')) {
          // Products with low stock (1-10 units)
          where.variants = { some: { stock: { lte: 10, gt: 0 } } }
        } else if (stockStatus.includes('normal') || stockStatus.includes('high')) {
          // Products with normal/high stock (> 10 units)
          where.variants = { some: { stock: { gt: 10 } } }
        }
      }
      
      // Execute query with pagination
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            images: includeImages ? { 
              orderBy: { order: 'asc' },
              take: 1 
            } : false,
            variants: {
              select: {
                id: true,
                color: true,
                size: true,
                sku: true,
                price: true,
                stock: true
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: (page - 1) * limit
        }),
        prisma.product.count({ where })
      ])
      
      // Calculate total pages
      const totalPages = Math.ceil(total / limit)
      
      return {
        products: products.map(p => ({
          ...p,
          totalStock: p.variants.reduce((sum: number, v: any) => sum + v.stock, 0)
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      }
    } catch (error) {
      console.error('Error searching products with pagination:', error)
      throw error
    }
  })

  /**
   * Get available categories - OPTIMIZED
   * Returns unique list of categories
   */
  ipcMain.handle('products:getCategories', async () => {
    try {
      if (!prisma) return []

      const categories = await prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' }
      })

      return categories.map(c => c.category).filter(Boolean)
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  })

  /**
   * Batch create products - for bulk imports
   * Performance: Single transaction for all products
   */
  ipcMain.handle('products:batchCreate', async (_, productsData: any[]) => {
    try {
      if (!prisma) {
        return { success: false, message: 'Database not available' }
      }

      if (!productsData?.length) {
        return { success: false, message: 'No products provided' }
      }

      // Use transaction to create all products atomically
      const results = await prisma.$transaction(
        productsData.map((productData) => {
          const { images, variants, baseStock, ...product } = productData
          
          return prisma.product.create({
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
            }
          })
        })
      )

      // Invalidate caches
      cacheService.invalidatePattern('products:*')
      cacheService.invalidatePattern('inventory:*')

      return { 
        success: true, 
        created: results.length,
        message: `Successfully created ${results.length} products`
      }
    } catch (error: any) {
      console.error('Error batch creating products:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * Batch update products - for bulk edits
   */
  ipcMain.handle('products:batchUpdate', async (_, updates: Array<{ id: string; data: any }>) => {
    try {
      if (!prisma) {
        return { success: false, message: 'Database not available' }
      }

      if (!updates?.length) {
        return { success: false, message: 'No updates provided' }
      }

      // Use transaction for atomicity
      const results = await prisma.$transaction(
        updates.map(({ id, data }) => {
          return prisma.product.update({
            where: { id },
            data
          })
        })
      )

      // Invalidate caches
      cacheService.invalidatePattern('products:*')
      cacheService.invalidatePattern('inventory:*')
      updates.forEach(({ id }) => cacheService.delete(CacheKeys.productById(id)))

      return { 
        success: true, 
        updated: results.length,
        message: `Successfully updated ${results.length} products`
      }
    } catch (error: any) {
      console.error('Error batch updating products:', error)
      return { success: false, message: error.message }
    }
  })

  /**
   * Batch delete products
   */
  ipcMain.handle('products:batchDelete', async (_, ids: string[]) => {
    try {
      if (!prisma) {
        return { success: false, message: 'Database not available' }
      }

      if (!ids?.length) {
        return { success: false, message: 'No IDs provided' }
      }

      // Delete all products in one operation
      const result = await prisma.product.deleteMany({
        where: {
          id: { in: ids }
        }
      })

      // Invalidate caches
      cacheService.invalidatePattern('products:*')
      cacheService.invalidatePattern('inventory:*')
      ids.forEach(id => cacheService.delete(CacheKeys.productById(id)))

      return { 
        success: true, 
        deleted: result.count,
        message: `Successfully deleted ${result.count} products`
      }
    } catch (error: any) {
      console.error('Error batch deleting products:', error)
      return { success: false, message: error.message }
    }
  })
}

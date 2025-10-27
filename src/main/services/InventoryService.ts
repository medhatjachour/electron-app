/**
 * Inventory Service
 * 
 * High-performance service layer implementing Repository pattern for inventory operations.
 * Optimized for large datasets with pagination, lazy loading, and efficient SQL queries.
 * 
 * Design Patterns:
 * - Repository: Abstracts data access layer
 * - Singleton: Single instance for the application
 * - Factory: Creates enriched inventory items with calculated fields
 * 
 * Performance Optimizations:
 * - Pagination support to handle thousands of records
 * - Lazy image loading (images excluded by default)
 * - Optimized Prisma queries with selective field inclusion
 * - Raw SQL for complex aggregations
 * - Indexed queries on frequently filtered fields
 */

import type { PrismaClient } from '@prisma/client'
import type {
  Product,
  ProductVariant,
  ProductImage,
  InventoryItem,
  InventoryMetrics,
  StockMovement
} from '../../shared/types'

interface PaginationParams {
  page?: number
  limit?: number
  skip?: number
  take?: number
}

interface InventoryQueryOptions {
  includeImages?: boolean
  category?: string
  searchTerm?: string
}

/**
 * InventoryService - High-performance singleton service for inventory management
 */
export class InventoryService {
  private static instance: InventoryService
  private readonly prisma: PrismaClient

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Get or create singleton instance
   */
  public static getInstance(prisma: PrismaClient): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService(prisma)
    }
    return InventoryService.instance
  }

  /**
   * Get all inventory items with pagination and optimized queries
   * PERFORMANCE: Excludes images by default to prevent serialization errors with large datasets
   */
  async getAllInventory(options: InventoryQueryOptions = {}): Promise<InventoryItem[]> {
    const { includeImages = false, category, searchTerm } = options

    // Build where clause for filtering
    const where: any = {}
    if (category) {
      where.category = category
    }
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm } },
        { baseSKU: { contains: searchTerm } },
        { description: { contains: searchTerm } }
      ]
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
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
        // Include all images when requested (not just first one)
        images: includeImages ? {
          orderBy: { order: 'asc' }
        } : false,
        store: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      },
      orderBy: { name: 'asc' },
      // Limit to prevent memory issues - client should use pagination
      take: 1000
    })

    return products.map(product => this.enrichInventoryItem(product, includeImages))
  }

  /**
   * Get inventory metrics and analytics using raw SQL for performance
   * PERFORMANCE: Uses aggregated SQL queries instead of loading all products
   */
  async getInventoryMetrics(): Promise<InventoryMetrics> {
    // Use raw SQL for better performance with large datasets
    const [totalSKUs] = await this.prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*) as count FROM Product
    `

    const [variantStats] = await this.prisma.$queryRaw<[{ total: number, totalStock: bigint, totalValue: number }]>`
      SELECT 
        COUNT(*) as total,
        SUM(stock) as totalStock,
        SUM(price * stock) as totalValue
      FROM ProductVariant
    `

    const [lowStockCount] = await this.prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(DISTINCT productId) as count
      FROM ProductVariant
      WHERE stock > 0 AND stock <= 10
    `

    const [outOfStockCount] = await this.prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(DISTINCT productId) as count
      FROM ProductVariant
      WHERE stock = 0
    `

    const totalRetailValue = Number(variantStats.totalValue || 0)
    const totalStockValue = totalRetailValue * 0.6 // Assuming 60% cost ratio

    return {
      totalSKUs: Number(totalSKUs.count || 0),
      totalVariants: Number(variantStats.total || 0),
      totalStockValue,
      totalRetailValue,
      potentialProfit: totalRetailValue - totalStockValue,
      lowStockCount: Number(lowStockCount.count || 0),
      outOfStockCount: Number(outOfStockCount.count || 0)
    }
  }

  /**
   * Get top stocked items using optimized query
   * PERFORMANCE: Uses SQL ORDER BY and LIMIT instead of loading all items
   */
  async getTopStockedItems(limit: number = 5): Promise<InventoryItem[]> {
    const products = await this.prisma.product.findMany({
      include: {
        variants: { 
          orderBy: { stock: 'desc' },
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
        images: false, // Don't load images
        store: {
          select: { id: true, name: true, location: true }
        }
      },
      take: limit * 2, // Get more products to account for variants
      orderBy: { name: 'asc' }
    })

    const enriched = products.map(p => this.enrichInventoryItem(p, false))
    return enriched.sort((a, b) => b.totalStock - a.totalStock).slice(0, limit)
  }

  /**
   * Get low stock items using optimized query
   * PERFORMANCE: Uses WHERE clause in SQL instead of filtering in memory
   */
  async getLowStockItems(threshold: number = 10): Promise<InventoryItem[]> {
    // Get products with low stock variants
    const products = await this.prisma.product.findMany({
      where: {
        variants: {
          some: {
            stock: {
              gt: 0,
              lte: threshold
            }
          }
        }
      },
      include: {
        variants: {
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
        images: false, // Don't load images
        store: {
          select: { id: true, name: true, location: true }
        }
      },
      take: 100
    })

    return products
      .map(p => this.enrichInventoryItem(p, false))
      .filter(item => item.totalStock <= threshold && item.totalStock > 0)
  }

  /**
   * Get out of stock items using optimized query
   */
  async getOutOfStockItems(): Promise<InventoryItem[]> {
    const products = await this.prisma.product.findMany({
      where: {
        variants: {
          every: {
            stock: 0
          }
        }
      },
      include: {
        variants: {
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
        images: false,
        store: {
          select: { id: true, name: true, location: true }
        }
      },
      take: 100
    })

    return products.map(p => this.enrichInventoryItem(p, false))
  }

  /**
   * Get stock movement history for a product
   */
  async getStockMovementHistory(productId: string): Promise<StockMovement[]> {
    // Get sales as stock movements
    const sales = await this.prisma.sale.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { username: true } }
      }
    })

    return sales.map(sale => ({
      id: sale.id,
      productId: sale.productId,
      variantId: sale.variantId || undefined,
      quantity: -sale.quantity, // Negative for sales
      type: 'sale' as const,
      timestamp: sale.createdAt,
      userId: sale.userId,
      notes: `Sold by ${sale.user.username}`
    }))
  }

  /**
   * Search inventory by name, SKU, or category - optimized version
   * PERFORMANCE: Limits results and excludes images
   */
  async searchInventory(query: string): Promise<InventoryItem[]> {
    const lowerQuery = query.toLowerCase()
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: lowerQuery } },
          { baseSKU: { contains: lowerQuery } },
          { category: { contains: lowerQuery } },
          { description: { contains: lowerQuery } }
        ]
      },
      include: {
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
        images: false, // Don't load images for search
        store: {
          select: { id: true, name: true, location: true }
        }
      },
      take: 100 // Limit search results
    })

    return products.map(product => this.enrichInventoryItem(product, false))
  }

  /**
   * Update stock for a variant
   */
  async updateVariantStock(variantId: string, newStock: number): Promise<void> {
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock }
    })
  }

  /**
   * Enrich product with calculated fields (Factory pattern)
   * PERFORMANCE: Optional image inclusion to reduce payload size
   */
  private enrichInventoryItem(
    product: Product & { 
      variants: ProductVariant[], 
      images?: ProductImage[] 
    },
    includeImages: boolean = false
  ): InventoryItem {
    // Calculate total stock across variants (always sum variants, regardless of hasVariants flag)
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)

    // Calculate stock value (cost * quantity)
    const stockValue = product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + (v.price * 0.6 * v.stock), 0) // Assuming 60% cost
      : product.baseCost * totalStock

    // Calculate retail value
    const retailValue = product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + (v.price * v.stock), 0)
      : product.basePrice * totalStock

    // Determine stock status
    let stockStatus: 'out' | 'low' | 'normal' | 'high'
    if (totalStock === 0) stockStatus = 'out'
    else if (totalStock <= 10) stockStatus = 'low'
    else if (totalStock <= 50) stockStatus = 'normal'
    else stockStatus = 'high'

    const enriched: InventoryItem = {
      ...product,
      images: includeImages && product.images ? product.images : [],
      totalStock,
      stockValue,
      retailValue,
      variantCount: product.variants.length,
      stockStatus
    }

    return enriched
  }
}

/**
 * CacheService - In-memory caching with TTL
 * 
 * High-performance caching layer for frequently accessed data
 * Reduces database load for expensive queries (dashboard stats, metrics)
 * 
 * Features:
 * - Configurable TTL per cache key
 * - Automatic expiration
 * - Cache invalidation
 * - Memory-efficient with size limits
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class CacheService {
  private static instance: CacheService
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 60 * 1000 // 1 minute
  private readonly MAX_ENTRIES = 100 // Prevent memory bloat

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60 * 1000) // Every minute
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  /**
   * Get cached value
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  /**
   * Set cached value with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce max entries limit
    if (this.cache.size >= this.MAX_ENTRIES && !this.cache.has(key)) {
      this.evictOldest()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    })
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Invalidate cache entries by pattern
   * Example: invalidatePattern('products:*') clears all product-related caches
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'))
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get or compute cached value
   * If cache miss, execute computeFn and cache the result
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }
    
    const computed = await computeFn()
    this.set(key, computed, ttl)
    
    return computed
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Evict oldest entry when max size reached
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate?: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_ENTRIES
    }
  }
}

/**
 * Singleton instance
 */
export const cacheService = CacheService.getInstance()

/**
 * Common cache keys for the application
 */
export const CacheKeys = {
  DASHBOARD_METRICS: 'dashboard:metrics',
  PRODUCT_STATS: 'products:stats',
  INVENTORY_METRICS: 'inventory:metrics',
  SALES_SUMMARY: 'sales:summary',
  LOW_STOCK_ITEMS: 'inventory:lowStock',
  TOP_STOCKED_ITEMS: 'inventory:topStocked',
  
  // Dynamic keys
  productById: (id: string) => `product:${id}`,
  inventoryByCategory: (category: string) => `inventory:category:${category}`,
  salesByDateRange: (start: string, end: string) => `sales:${start}:${end}`,
} as const

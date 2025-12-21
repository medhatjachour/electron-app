/**
 * Method Decorators
 * 
 * Reusable decorators for cross-cutting concerns
 * Logging, caching, validation, error handling
 */

import { logger } from '../utils/logger'

/**
 * Log method calls with execution time
 */
export function Log(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: unknown[]) {
    const className = target?.constructor?.name || 'Unknown'
    const start = Date.now()
    
    logger.info(`[${className}.${propertyKey}] Called`, { args })
    
    try {
      const result = await originalMethod.apply(this, args)
      const duration = Date.now() - start
      
      logger.info(`[${className}.${propertyKey}] Completed`, { duration })
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      
      logger.error(`[${className}.${propertyKey}] Failed`, { error, duration })
      
      throw error
    }
  }
}

/**
 * Cache method results
 */
export function Cache(ttl: number = 60000): MethodDecorator {
  const cache = new Map<string, { value: unknown; expires: number }>()

  return function (_target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = `${String(propertyKey)}:${JSON.stringify(args)}`
      const now = Date.now()
      
      // Check cache
      const cached = cache.get(cacheKey)
      if (cached && cached.expires > now) {
        logger.debug('Cache hit', { method: String(propertyKey), key: cacheKey })
        return cached.value
      }
      
      // Execute method
      const result = await originalMethod.apply(this, args)
      
      // Store in cache
      cache.set(cacheKey, {
        value: result,
        expires: now + ttl
      })
      
      logger.debug('Cache set', { method: String(propertyKey), key: cacheKey, ttl })
      
      return result
    }
  }
}

/**
 * Validate method arguments
 */
export function Validate(schema: (args: unknown[]) => boolean): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const className = target?.constructor?.name || 'Unknown'
      
      if (!schema(args)) {
        const error = new Error(`Validation failed for ${className}.${String(propertyKey)}`)
        logger.error('Validation failed', { method: String(propertyKey), args })
        throw error
      }
      
      return await originalMethod.apply(this, args)
    }
  }
}

/**
 * Retry method on failure
 */
export function Retry(maxAttempts: number = 3, delay: number = 1000): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const className = target?.constructor?.name || 'Unknown'
      let lastError: unknown

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args)
        } catch (error) {
          lastError = error
          
          if (attempt < maxAttempts) {
            logger.warn(`[${className}.${String(propertyKey)}] Retry ${attempt}/${maxAttempts}`, { error })
            await new Promise(resolve => setTimeout(resolve, delay * attempt))
          }
        }
      }
      
      logger.error(`[${className}.${String(propertyKey)}] Failed after ${maxAttempts} attempts`, { error: lastError })
      throw lastError
    }
  }
}

/**
 * Measure method execution time
 */
export function Measure(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: unknown[]) {
    const className = target?.constructor?.name || 'Unknown'
    const start = performance.now()
    
    try {
      const result = await originalMethod.apply(this, args)
      const duration = performance.now() - start
      
      logger.info(`[${className}.${propertyKey}] Execution time: ${duration.toFixed(2)}ms`)
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      logger.error(`[${className}.${propertyKey}] Failed after ${duration.toFixed(2)}ms`, { error })
      
      throw error
    }
  }
}

/**
 * Debounce method calls
 */
export function Debounce(delay: number = 300): MethodDecorator {
  return function (_target: unknown, _propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value
    let timeout: NodeJS.Timeout | null = null

    descriptor.value = function (...args: unknown[]) {
      if (timeout) {
        clearTimeout(timeout)
      }

      return new Promise((resolve, reject) => {
        timeout = setTimeout(async () => {
          try {
            const result = await originalMethod.apply(this, args)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }, delay)
      })
    }
  }
}

/**
 * Throttle method calls
 */
export function Throttle(delay: number = 1000): MethodDecorator {
  return function (_target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value
    let lastCall = 0

    descriptor.value = async function (...args: unknown[]) {
      const now = Date.now()
      
      if (now - lastCall < delay) {
        logger.debug('Throttled', { method: String(propertyKey), delay })
        return
      }
      
      lastCall = now
      return await originalMethod.apply(this, args)
    }
  }
}

/**
 * Handle errors gracefully
 */
export function HandleErrors(fallbackValue?: unknown): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const className = target?.constructor?.name || 'Unknown'
      
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        logger.error(`[${className}.${String(propertyKey)}] Error handled`, { error })
        return fallbackValue
      }
    }
  }
}

/**
 * Ensure method is called only once
 */
export function Once(_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): void {
  const originalMethod = descriptor.value
  let called = false
  let result: unknown

  descriptor.value = async function (...args: unknown[]) {
    if (called) {
      return result
    }
    
    result = await originalMethod.apply(this, args)
    called = true
    
    return result
  }
}

/**
 * Require authentication/authorization
 */
export function Authorize(requiredRole?: string): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const className = target?.constructor?.name || 'Unknown'
      
      // In real implementation, check auth context
      // For now, just log
      logger.debug(`[${className}.${String(propertyKey)}] Authorization check`, { requiredRole })
      
      return await originalMethod.apply(this, args)
    }
  }
}

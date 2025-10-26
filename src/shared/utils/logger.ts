/**
 * Logger Utility
 * Centralized logging with environment-aware output
 */

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV

export const logger = {
  /**
   * Info level logging - general information
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('ℹ️', ...args)
    }
  },

  /**
   * Success level logging - successful operations
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('✅', ...args)
    }
  },

  /**
   * Error level logging - always logged, even in production
   */
  error: (...args: any[]) => {
    console.error('❌', ...args)
    // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
  },

  /**
   * Warning level logging
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('⚠️', ...args)
    }
  },

  /**
   * Debug level logging - only when DEBUG flag is set
   */
  debug: (...args: any[]) => {
    if (isDevelopment && process.env.DEBUG) {
      console.debug('🐛', ...args)
    }
  },

  /**
   * Trace level logging - detailed debugging
   */
  trace: (...args: any[]) => {
    if (isDevelopment && process.env.DEBUG) {
      console.trace('🔍', ...args)
    }
  }
}

export default logger

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Create a proper localStorage mock
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
}

// Setup localStorage before each test
beforeEach(() => {
  global.localStorage = createLocalStorageMock() as Storage
  
  // Ensure timer functions are available globally
  global.setTimeout = global.setTimeout || setTimeout
  global.clearTimeout = global.clearTimeout || clearTimeout
  global.setInterval = global.setInterval || setInterval
  global.clearInterval = global.clearInterval || clearInterval
})

// Mock window.api (IPC)
global.window = global.window || {}
;(global.window as any).api = {
  saleTransactions: {
    create: vi.fn()
  },
  products: {
    getAll: vi.fn()
  },
  customers: {
    getAll: vi.fn()
  }
}

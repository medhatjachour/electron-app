/**
 * Custom hook for POS state management and business logic
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ipc } from '../../utils/ipc'
import type { Product, Customer, CartItem, PaymentMethod } from './types'

export function usePOS() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerQuery, setCustomerQuery] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Load initial data
  useEffect(() => {
    loadProducts()
    loadCustomers()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      // OPTIMIZED: Load products without images for fast POS performance
      const response = await ipc.products.getAll({
        includeImages: false,
        limit: 500 // Load first 500 products
      })
      
      const data = response.products || response || []
      const productsWithStock = data.map((p: any) => ({
        ...p,
        totalStock: p.hasVariants 
          ? p.variants.reduce((sum: number, v: any) => sum + v.stock, 0)
          : 0,
        images: p.images || []
      }))
      setProducts(productsWithStock)
    } catch (error) {
      console.error('Failed to load products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await ipc.customers.getAll()
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
    }
  }

  // Cart calculations
  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  , [cart])

  const tax = subtotal * 0.1
  const total = subtotal + tax

  const totalItems = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0)
  , [cart])

  // Cart operations
  const addToCart = useCallback((product: Product, variant?: any) => {
    const availableStock = variant ? variant.stock : product.totalStock
    
    if (availableStock <= 0) {
      alert(`${product.name} is out of stock!`)
      return
    }
    
    const price = variant ? variant.price : product.basePrice
    const variantLabel = variant 
      ? [variant.color, variant.size].filter(Boolean).join(' - ')
      : undefined
    
    const itemId = variant ? `${product.id}-${variant.id}` : product.id
    
    setCart(prev => {
      const existing = prev.find(item => item.id === itemId)
      
      if (existing) {
        if (existing.quantity >= availableStock) {
          alert(`Only ${availableStock} units of ${product.name}${variantLabel ? ` (${variantLabel})` : ''} available in stock!`)
          return prev
        }
        
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      
      return [...prev, { 
        id: itemId, 
        productId: product.id,
        variantId: variant?.id,
        name: product.name, 
        variant: variantLabel,
        price,
        stock: availableStock,
        quantity: 1 
      }]
    })
  }, [])

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta
          
          if (newQty <= 0) return { ...item, quantity: 0 }
          
          if (newQty > item.stock) {
            alert(`Only ${item.stock} units available in stock!`)
            return item
          }
          
          return { ...item, quantity: newQty }
        }
        return item
      }).filter(item => item.quantity > 0)
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setPaymentMethod(null)
    setCustomerQuery('')
    setSelectedCustomer(null)
  }, [])

  const completeSale = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method (Cash or Card)')
      return
    }
    
    if (cart.length === 0) {
      alert('Cart is empty. Please add items first.')
      return
    }
    
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('⚠️ Session expired!\n\nPlease log out and log in again to continue.')
        return
      }
      
      const user = JSON.parse(userStr)
      if (!user || !user.id) {
        alert('⚠️ Invalid user session!\n\nPlease log out and log in again.')
        return
      }
      
      // Validate stock availability
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId)
        
        if (!product) {
          alert(`Product ${item.name} no longer exists!`)
          return
        }
        
        if (item.variantId) {
          const variant = product.variants.find(v => v.id === item.variantId)
          if (!variant || variant.stock < item.quantity) {
            alert(`Insufficient stock for ${item.name} (${item.variant})!\n\nOnly ${variant?.stock || 0} units available.`)
            return
          }
        } else {
          if (product.totalStock < item.quantity) {
            alert(`Insufficient stock for ${item.name}!\n\nOnly ${product.totalStock} units available.`)
            return
          }
        }
      }
      
      const finalCustomerName = selectedCustomer?.name || customerQuery.trim() || null
      
      // Create sales
      const salePromises = cart.map(async (item) => {
        const saleData = {
          productId: item.productId,
          variantId: item.variantId || null,
          userId: user.id,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          paymentMethod: paymentMethod,
          status: 'completed',
          customerName: finalCustomerName
        }
        
        return await ipc.sales.create(saleData)
      })
      
      await Promise.all(salePromises)
      
      setShowSuccess(true)
      await loadProducts()
      
      setTimeout(() => {
        setShowSuccess(false)
        clearCart()
      }, 2000)
      
    } catch (error) {
      console.error('❌ Failed to complete sale:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (errorMessage.includes('Foreign key constraint failed') || errorMessage.includes('userId')) {
        alert('⚠️ User authentication error!\n\nYour session may be invalid. Please log out and log in again.')
      } else if (errorMessage.includes('stock')) {
        alert('⚠️ Stock error!\n\nOne or more items have insufficient stock.')
        await loadProducts()
      } else {
        alert(`❌ Error completing sale!\n\n${errorMessage}`)
      }
    }
  }

  return {
    // State
    products,
    customers,
    loading,
    cart,
    selectedCustomer,
    customerQuery,
    paymentMethod,
    showSuccess,
    // Calculations
    subtotal,
    tax,
    total,
    totalItems,
    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    completeSale,
    setSelectedCustomer,
    setCustomerQuery,
    setPaymentMethod,
  }
}

/**
 * Custom hook for POS state management and business logic
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ipc } from '../../utils/ipc'
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext'
import type { Product, Customer, CartItem, PaymentMethod } from './types'
import type { DiscountData } from '../../components/DiscountModal'

export function usePOS() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerQuery, setCustomerQuery] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [discountingItem, setDiscountingItem] = useState<CartItem | null>(null)
  const { settings } = useDisplaySettings()
  
  // Get tax rate from settings (default 10%)
  const taxRate = parseFloat(localStorage.getItem('taxRate') || '10') / 100

  // Load initial data
  useEffect(() => {
    loadProducts()
    loadCustomers()
  }, [])



  const loadProducts = async () => {
    try {
      setLoading(true)
      // Load products with or without images based on display settings
      const response = await ipc.products.getAll({
        includeImages: settings.showImagesInPOSCards, // Use display setting
        limit: 500 // Load first 500 products
      })
      
      const data = response.products || response || []
      const productsWithStock = data.map((p: any) => ({
        ...p,
        totalStock: p.variants?.length 
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
      // Handle both array response and object with customers property
      const customersList = Array.isArray(data) ? data : (data?.customers || [])
      setCustomers(Array.isArray(customersList) ? customersList : [])
    } catch (error) {
      console.error('Failed to load customers:', error)
      setCustomers([])
    }
  }

  // Cart calculations
  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + ((item.finalPrice || item.price) * item.quantity), 0)
  , [cart])

  const tax = subtotal * taxRate
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
      
      // Store the product snapshot in cart for validation during checkout
      return [...prev, { 
        id: itemId, 
        productId: product.id,
        variantId: variant?.id,
        name: product.name, 
        variant: variantLabel,
        price,
        stock: availableStock,
        quantity: 1,
        // Discount fields
        discountType: 'NONE',
        discountValue: 0,
        finalPrice: price,
        // Store snapshots for validation
        productSnapshot: product,
        variantSnapshot: variant
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
      
      // Validate stock availability using stored product snapshots
      for (const item of cart) {
        // Use the stored product snapshot instead of searching filtered products
        const product = item.productSnapshot
        
        if (!product) {
          // Fallback: try to find in current products list
          const fallbackProduct = products.find(p => p.id === item.productId)
          if (!fallbackProduct) {
            alert(`Product ${item.name} information is unavailable!\n\nPlease remove it from cart and re-add it.`)
            return
          }
        }
        
        if (item.variantId && item.variantSnapshot) {
          const variant = item.variantSnapshot
          if (variant.stock < item.quantity) {
            alert(`Insufficient stock for ${item.name} (${item.variant})!\n\nOnly ${variant.stock} units available.`)
            return
          }
        } else if (product) {
          if (product.totalStock < item.quantity) {
            alert(`Insufficient stock for ${item.name}!\n\nOnly ${product.totalStock} units available.`)
            return
          }
        }
      }
      
      const finalCustomerName = selectedCustomer?.name || customerQuery.trim() || null
      const finalCustomerId = selectedCustomer?.id || null
      
      // Prepare transaction items
      const items = cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        price: item.finalPrice || item.price,
        // Discount fields
        discountType: item.discountType || 'NONE',
        discountValue: item.discountValue || 0,
        discountReason: item.discountReason,
        discountAppliedBy: item.discountAppliedBy
      }))
      
      // Create single transaction with all items
      const result = await ipc.saleTransactions.create({
        items,
        transactionData: {
          userId: user.id,
          customerId: finalCustomerId,
          paymentMethod: paymentMethod,
          customerName: finalCustomerName,
          subtotal: subtotal,
          tax: tax,
          total: total
        }
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create transaction')
      }
      
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

  // Refresh customers list (for after adding new customer)
  const refreshCustomers = useCallback(() => {
    loadCustomers()
  }, [])

  // Discount functions
  const canApplyDiscount = useCallback(() => {
    const allowDiscounts = localStorage.getItem('allowDiscounts') === 'true'
    return allowDiscounts
  }, [])

  const openDiscountModal = useCallback((item: CartItem) => {
    setDiscountingItem(item)
    setShowDiscountModal(true)
  }, [])

  const calculateFinalPrice = useCallback((price: number, type: string, value: number) => {
    if (type === 'PERCENTAGE') {
      return price - (price * value / 100)
    } else {
      return price - value
    }
  }, [])

  const handleApplyDiscount = useCallback((discountData: DiscountData) => {
    if (!discountingItem) return

    const finalPrice = calculateFinalPrice(
      discountingItem.price,
      discountData.type,
      discountData.value
    )

    const currentUser = localStorage.getItem('userId') || 'unknown'

    setCart(prev => prev.map(item => 
      item.id === discountingItem.id
        ? {
            ...item,
            discountType: discountData.type,
            discountValue: discountData.value,
            finalPrice,
            discountReason: discountData.reason || undefined,
            discountAppliedBy: currentUser
          }
        : item
    ))

    setShowDiscountModal(false)
    setDiscountingItem(null)
  }, [discountingItem, calculateFinalPrice])

  // Wrapper for QuickSale to use the shared completeSale logic
  const completeSaleFromQuickView = useCallback(async (quickCartItems: any[], customer: any, payment: string) => {
    if (!payment) {
      alert('Please select a payment method (Cash or Card)')
      return
    }
    
    if (quickCartItems.length === 0) {
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
      
      const finalCustomerName = customer?.name || null
      const finalCustomerId = customer?.id || null
      
      // Calculate totals from QuickSale cart
      const subtotalCalc = quickCartItems.reduce((sum, item) => sum + ((item.finalPrice || item.price) * item.quantity), 0)
      const taxCalc = subtotalCalc * taxRate
      const totalCalc = subtotalCalc + taxCalc
      
      // Prepare transaction items
      const items = quickCartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        price: item.finalPrice || item.price,
        // Discount fields
        discountType: item.discountType || 'NONE',
        discountValue: item.discountValue || 0,
        discountReason: item.discountReason,
        discountAppliedBy: item.discountAppliedBy
      }))
      
      // Create single transaction with all items
      const result = await ipc.saleTransactions.create({
        items,
        transactionData: {
          userId: user.id,
          customerId: finalCustomerId,
          paymentMethod: payment,
          customerName: finalCustomerName,
          subtotal: subtotalCalc,
          tax: taxCalc,
          total: totalCalc
        }
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create transaction')
      }
      
      setShowSuccess(true)
      await loadProducts()
      
      setTimeout(() => {
        setShowSuccess(false)
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
      throw error // Re-throw so QuickSale knows it failed
    }
  }, [taxRate, loadProducts])

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
    showDiscountModal,
    discountingItem,
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
    completeSaleFromQuickView,
    // Discount actions
    canApplyDiscount,
    openDiscountModal,
    handleApplyDiscount,
    setShowDiscountModal,
    setSelectedCustomer,
    setCustomerQuery,
    setPaymentMethod,
    refreshCustomers,
  }
}

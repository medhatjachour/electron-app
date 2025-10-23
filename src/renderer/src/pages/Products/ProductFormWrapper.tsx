/**
 * ProductFormWrapper Component
 * Manages state and logic for ProductForm (add/edit products)
 */

import { useState, useEffect } from 'react'
import { ipc } from '../../utils/ipc'
import { useToast } from '../../contexts/ToastContext'
import ProductForm from '../../components/ProductForm'
import type { Product } from './types'

type Store = {
  id: string
  name: string
  location: string
}

type FormData = {
  name: string
  baseSKU: string
  category: string
  description: string
  basePrice: number
  baseCost: number
  baseStock: number
  storeId: string
  images: string[]
  hasVariants: boolean
  variants: Array<{
    id: string
    color?: string
    size?: string
    sku: string
    price: number
    stock: number
  }>
}

type FormErrors = {
  name?: string
  baseSKU?: string
  category?: string
  basePrice?: string
  baseCost?: string
  images?: string
}

interface ProductFormWrapperProps {
  product?: Product | null
  onSuccess: () => void
  onCancel: () => void
}

export default function ProductFormWrapper({ product, onSuccess, onCancel }: ProductFormWrapperProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<Store[]>([])

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    baseSKU: '',
    category: '',
    description: '',
    basePrice: 0,
    baseCost: 0,
    baseStock: 0,
    storeId: '',
    images: [],
    hasVariants: false,
    variants: []
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Variant form state
  const [newVariant, setNewVariant] = useState({
    color: '',
    size: '',
    sku: '',
    price: 0,
    stock: 0
  })

  // Load stores
  useEffect(() => {
    loadStores()
  }, [])

  // Load product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        baseSKU: product.baseSKU,
        category: product.category,
        description: product.description || '',
        basePrice: product.basePrice,
        baseCost: product.baseCost,
        baseStock: 0,
        storeId: '',
        images: product.images?.map(img => img.imageData) || [],
        hasVariants: product.hasVariants,
        variants: product.variants?.map(v => ({
          id: v.id,
          color: v.color,
          size: v.size,
          sku: v.sku,
          price: v.price,
          stock: v.stock
        })) || []
      })
    }
  }, [product])

  const loadStores = async () => {
    try {
      const data = await ipc.stores.getAll()
      setStores(data.filter((s: any) => s.status === 'active'))
    } catch (error) {
      console.error('Failed to load stores:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.baseSKU.trim()) {
      newErrors.baseSKU = 'SKU is required'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'Price must be greater than 0'
    }

    if (formData.baseCost < 0) {
      newErrors.baseCost = 'Cost cannot be negative'
    }

    if (formData.images.length > 5) {
      newErrors.images = 'Maximum 5 images allowed'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 5 - formData.images.length
    if (remainingSlots === 0) {
      toast.error('Maximum 5 images allowed')
      return
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    
    filesToProcess.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleAddVariant = () => {
    if (!newVariant.color || !newVariant.size || !newVariant.sku) {
      toast.error('Please fill all variant fields')
      return
    }

    if (newVariant.price <= 0) {
      toast.error('Variant price must be greater than 0')
      return
    }

    if (newVariant.stock < 0) {
      toast.error('Variant stock cannot be negative')
      return
    }

    const variantExists = formData.variants.some(
      v => v.color === newVariant.color && v.size === newVariant.size
    )

    if (variantExists) {
      toast.error('A variant with this color and size already exists')
      return
    }

    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: `temp-${Date.now()}`,
          color: newVariant.color,
          size: newVariant.size,
          sku: newVariant.sku,
          price: newVariant.price,
          stock: newVariant.stock
        }
      ]
    }))

    setNewVariant({
      color: '',
      size: '',
      sku: '',
      price: 0,
      stock: 0
    })

    toast.success('Variant added')
  }

  const handleRemoveVariant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== id)
    }))
    toast.success('Variant removed')
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    if (formData.hasVariants && formData.variants.length === 0) {
      toast.error('Please add at least one variant or disable variants')
      return
    }

    setLoading(true)

    try {
      // Prepare data for API
      const productData = {
        name: formData.name.trim(),
        baseSKU: formData.baseSKU.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        basePrice: formData.basePrice,
        baseCost: formData.baseCost,
        hasVariants: formData.hasVariants,
        images: formData.images,
        variants: formData.hasVariants ? formData.variants.map(v => ({
          color: v.color,
          size: v.size,
          sku: v.sku,
          price: v.price,
          stock: v.stock
        })) : [],
        baseStock: formData.baseStock
      }

      let result
      if (product) {
        // Update existing product
        result = await ipc.products.update(product.id, productData)
      } else {
        // Create new product
        result = await ipc.products.create(productData)
      }

      if (result.success) {
        toast.success(product ? 'Product updated successfully' : 'Product created successfully')
        onSuccess()
      } else {
        toast.error(result.message || 'Failed to save product')
      }
    } catch (error) {
      console.error('Failed to save product:', error)
      toast.error('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <ProductForm
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        stores={stores}
        onImageUpload={handleImageUpload}
        onRemoveImage={handleRemoveImage}
        newVariant={newVariant}
        setNewVariant={setNewVariant}
        onAddVariant={handleAddVariant}
        onRemoveVariant={handleRemoveVariant}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            product ? 'Update Product' : 'Create Product'
          )}
        </button>
      </div>
    </div>
  )
}

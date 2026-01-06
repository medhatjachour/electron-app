/**
 * ProductFormWrapper Component
 * Manages state and logic for ProductForm (add/edit products)
 */

import { useState, useEffect } from 'react'
import { ipc } from '../../utils/ipc'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'
import ProductForm from '../../components/ProductForm'
import StockMovementDialog from '../../components/StockMovementDialog'
import type { Product } from './types'

type Store = {
  id: string
  name: string
  location: string
}

type Category = {
  id: string
  name: string
  description?: string | null
}

type FormData = {
  name: string
  baseSKU: string
  categoryId: string
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
  categoryId?: string
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
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    baseSKU: '',
    categoryId: '',
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

  // Batch variant creation state
  const [batchMode, setBatchMode] = useState(false)
  const [batchVariant, setBatchVariant] = useState({
    colors: [] as string[],
    sizes: [] as string[],
    baseSKU: '',
    price: 0,
    stock: 0
  })

  // Stock movement dialog state
  const [stockMovementDialog, setStockMovementDialog] = useState<{
    isOpen: boolean
    variantId: string | null
    variantIndex: number | null
    productName: string
    variantLabel: string
    currentStock: number
  }>({ 
    isOpen: false, 
    variantId: null, 
    variantIndex: null,
    productName: '', 
    variantLabel: '', 
    currentStock: 0 
  })
  const [colorInput, setColorInput] = useState('')
  const [sizeInput, setSizeInput] = useState('')

  // Load stores and categories
  useEffect(() => {
    loadStores()
    loadCategories()
  }, [])

  // Load product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        baseSKU: product.baseSKU,
        categoryId: product.categoryId || '',
        description: product.description || '',
        basePrice: product.basePrice,
        baseCost: product.baseCost,
        baseStock: 0,
        storeId: '',
        images: product.images?.map(img => img.imageData) || [],
        hasVariants: product.hasVariants,
        variants: product.variants?.map(v => ({
          id: v.id,
          color: v.color || undefined,
          size: v.size || undefined,
          sku: v.sku,
          price: v.price,
          stock: v.stock
        })) || []
      })
    }
  }, [product])

  /**
   * Handle stock movement for existing product variants
   */
  const handleStockMovement = async (data: {
    mode: 'add' | 'set' | 'remove'
    value: number
    reason: string
    notes: string
  }) => {
    try {
      if (!stockMovementDialog.variantId) {
        toast.error('No variant selected')
        return
      }

      // Record the stock movement
      const result = await window.api?.stockMovements?.record({
        variantId: stockMovementDialog.variantId,
        mode: data.mode,
        value: data.value,
        reason: data.reason,
        notes: data.notes,
        userId: user?.id
      })

      if (result?.success) {
        toast.success(`Stock ${data.mode === 'add' ? 'added' : data.mode === 'remove' ? 'removed' : 'updated'} successfully`)
        
        // Update local formData to reflect new stock
        if (stockMovementDialog.variantIndex !== null) {
          const newStock = result.data?.variant?.stock || 0
          setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, idx) => 
              idx === stockMovementDialog.variantIndex ? { ...v, stock: newStock } : v
            )
          }))
        }
        
        setStockMovementDialog(prev => ({ ...prev, isOpen: false }))
      } else {
        toast.error(result?.error || 'Failed to record stock movement')
      }
    } catch (error) {
      console.error('Error recording stock movement:', error)
      toast.error('Failed to record stock movement')
    }
  }

  /**
   * Handle variant price update
   */
  const handleVariantPriceChange = (index: number, newPrice: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, idx) => 
        idx === index ? { ...v, price: newPrice } : v
      )
    }))
  }

  /**
   * Handle variant stock update (for new variants or before save)
   */
  const handleVariantStockChange = (index: number, newStock: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, idx) => 
        idx === index ? { ...v, stock: newStock } : v
      )
    }))
  }

  /**
   * Open stock adjustment dialog for a variant
   */
  const handleOpenStockDialog = (index: number, variant: any) => {
    // Only open dialog for existing variants with valid IDs
    if (product && variant.id && !variant.id.startsWith('temp-')) {
      const variantLabel = [variant.color, variant.size].filter(Boolean).join(' • ')
      setStockMovementDialog({
        isOpen: true,
        variantId: variant.id,
        variantIndex: index,
        productName: product.name,
        variantLabel,
        currentStock: variant.stock
      })
    }
  }

  const loadStores = async () => {
    try {
      const data = await ipc.stores.getAll()
      setStores(data.filter((s: any) => s.status === 'active'))
    } catch (error) {
      console.error('Failed to load stores:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('categories:getAll')
      if (result.success && result.categories) {
        setCategories(result.categories)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
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

    if (!formData.categoryId.trim()) {
      newErrors.categoryId = 'Category is required'
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

    const skuExists = formData.variants.some(
      v => v.sku === newVariant.sku
    )

    if (skuExists) {
      toast.error(`A variant with SKU "${newVariant.sku}" already exists in this product`)
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

  // Batch variant handlers
  const handleAddColor = () => {
    const trimmed = colorInput.trim()
    if (!trimmed) {
      toast.error('Please enter a color')
      return
    }
    if (batchVariant.colors.includes(trimmed)) {
      toast.error('Color already added')
      return
    }
    setBatchVariant(prev => ({
      ...prev,
      colors: [...prev.colors, trimmed]
    }))
    setColorInput('')
  }

  const handleAddSize = () => {
    const trimmed = sizeInput.trim()
    if (!trimmed) {
      toast.error('Please enter a size')
      return
    }
    if (batchVariant.sizes.includes(trimmed)) {
      toast.error('Size already added')
      return
    }
    setBatchVariant(prev => ({
      ...prev,
      sizes: [...prev.sizes, trimmed]
    }))
    setSizeInput('')
  }

  const handleRemoveColor = (color: string) => {
    setBatchVariant(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color)
    }))
  }

  const handleRemoveSize = (size: string) => {
    setBatchVariant(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== size)
    }))
  }

  const handleGenerateBatchVariants = () => {
    // Validation
    if (!batchVariant.baseSKU.trim()) {
      toast.error('Please enter a base SKU')
      return
    }

    if (batchVariant.price <= 0) {
      toast.error('Price must be greater than 0')
      return
    }

    if (batchVariant.stock < 0) {
      toast.error('Stock cannot be negative')
      return
    }

    if (batchVariant.colors.length === 0 && batchVariant.sizes.length === 0) {
      toast.error('Please add at least one color or size')
      return
    }

    // Generate all combinations
    const newVariants: Array<{
      id: string
      color?: string
      size?: string
      sku: string
      price: number
      stock: number
    }> = []

    let counter = 1
    const baseSKU = batchVariant.baseSKU.trim().toUpperCase()

    // If both colors and sizes are provided, create all combinations
    if (batchVariant.colors.length > 0 && batchVariant.sizes.length > 0) {
      batchVariant.colors.forEach(color => {
        batchVariant.sizes.forEach(size => {
          const sku = `${baseSKU}-${counter}`
          newVariants.push({
            id: `temp-${Date.now()}-${counter}`,
            color,
            size,
            sku,
            price: batchVariant.price,
            stock: batchVariant.stock
          })
          counter++
        })
      })
    }
    // If only colors
    else if (batchVariant.colors.length > 0) {
      batchVariant.colors.forEach(color => {
        const sku = `${baseSKU}-${counter}`
        newVariants.push({
          id: `temp-${Date.now()}-${counter}`,
          color,
          sku,
          price: batchVariant.price,
          stock: batchVariant.stock
        })
        counter++
      })
    }
    // If only sizes
    else if (batchVariant.sizes.length > 0) {
      batchVariant.sizes.forEach(size => {
        const sku = `${baseSKU}-${counter}`
        newVariants.push({
          id: `temp-${Date.now()}-${counter}`,
          size,
          sku,
          price: batchVariant.price,
          stock: batchVariant.stock
        })
        counter++
      })
    }

    // Check for duplicate variants
    const existingCombos = new Set(
      formData.variants.map(v => `${v.color || ''}-${v.size || ''}`)
    )
    const duplicates = newVariants.filter(v => 
      existingCombos.has(`${v.color || ''}-${v.size || ''}`)
    )

    if (duplicates.length > 0) {
      toast.error('Some variant combinations already exist')
      return
    }

    // Add all variants
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, ...newVariants]
    }))

    // Reset batch form
    setBatchVariant({
      colors: [],
      sizes: [],
      baseSKU: '',
      price: 0,
      stock: 0
    })
    setColorInput('')
    setSizeInput('')

    toast.success(`${newVariants.length} variants created successfully`)
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
        categoryId: formData.categoryId,
        description: formData.description.trim(),
        basePrice: formData.basePrice,
        baseCost: formData.baseCost,
        hasVariants: formData.hasVariants,
        storeId: formData.storeId || undefined, // Include storeId
        images: formData.images,
        variants: formData.hasVariants ? formData.variants.map(v => ({
          color: v.color,
          size: v.size,
          sku: v.sku,
          price: v.price,
          cost: v.price * 0.6, // Default cost as 60% of price if not specified
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
        categories={categories}
        onImageUpload={handleImageUpload}
        onRemoveImage={handleRemoveImage}
        newVariant={newVariant}
        setNewVariant={setNewVariant}
        onAddVariant={handleAddVariant}
        onRemoveVariant={handleRemoveVariant}
        batchMode={batchMode}
        setBatchMode={setBatchMode}
        batchVariant={batchVariant}
        setBatchVariant={setBatchVariant}
        colorInput={colorInput}
        setColorInput={setColorInput}
        sizeInput={sizeInput}
        setSizeInput={setSizeInput}
        onAddColor={handleAddColor}
        onAddSize={handleAddSize}
        onRemoveColor={handleRemoveColor}
        onRemoveSize={handleRemoveSize}
        onGenerateBatchVariants={handleGenerateBatchVariants}
        isEditMode={!!product}
        onVariantPriceChange={handleVariantPriceChange}
        onVariantStockChange={handleVariantStockChange}
        onOpenStockDialog={handleOpenStockDialog}
      />

      {/* Stock Movement Dialog */}
      <StockMovementDialog
        isOpen={stockMovementDialog.isOpen}
        onClose={() => setStockMovementDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleStockMovement}
        productName={stockMovementDialog.productName}
        variantLabel={stockMovementDialog.variantLabel}
        currentStock={stockMovementDialog.currentStock}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t('loading')}...
            </>
          ) : (
            product ? t('edit') + ' ' + t('productName') : t('add') + ' ' + t('productName')
          )}
        </button>
      </div>
    </div>
  )
}

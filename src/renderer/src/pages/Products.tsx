import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Upload, Download, Barcode, Edit2, Trash2, Eye, Camera, X } from 'lucide-react'
import Modal from '../components/ui/Modal'
import ProductForm from '../components/ProductForm'
import { ipc } from '../utils/ipc'
import { useToast } from '../contexts/ToastContext'

type ProductVariant = {
  id: string
  color?: string
  size?: string
  sku: string
  price: number
  stock: number
}

type Product = {
  id: string
  name: string
  baseSKU: string
  category: string
  description: string
  basePrice: number
  baseCost: number
  images: { imageData: string }[]
  hasVariants: boolean
  variants: ProductVariant[]
  totalStock: number
}

type FormErrors = {
  name?: string
  baseSKU?: string
  category?: string
  basePrice?: string
  baseCost?: string
}

export default function Products(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const toast = useToast()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  
  const [formData, setFormData] = useState({
    name: '',
    baseSKU: '',
    category: '',
    description: '',
    basePrice: 0,
    baseCost: 0,
    baseStock: 0,
    images: [] as string[],
    hasVariants: false,
    variants: [] as ProductVariant[]
  })

  const [newVariant, setNewVariant] = useState({
    color: '',
    size: '',
    sku: '',
    price: 0,
    stock: 0
  })

  // Load products from database
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setDbError(null)
      const data = await ipc.products.getAll()
      const productsWithStock = data.map((p: any) => ({
        ...p,
        totalStock: p.hasVariants 
          ? p.variants.reduce((sum: number, v: any) => sum + v.stock, 0)
          : 0
      }))
      setProducts(productsWithStock)
      
      // Load from localStorage as backup
      const localProducts = localStorage.getItem('products')
      if (localProducts && productsWithStock.length === 0) {
        setProducts(JSON.parse(localProducts))
        toast.warning('Using local backup data - database unavailable')
      }
    } catch (error) {
      console.error('Failed to load products:', error)
      setDbError('Database connection unavailable')
      
      // Fallback to localStorage
      const localProducts = localStorage.getItem('products')
      if (localProducts) {
        setProducts(JSON.parse(localProducts))
        toast.warning('Using local backup data - database unavailable')
      } else {
        toast.error('Failed to load products')
      }
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.baseSKU.trim()) newErrors.baseSKU = 'SKU is required'
    if (!/^[A-Z0-9-]+$/.test(formData.baseSKU)) newErrors.baseSKU = 'SKU must contain only uppercase letters, numbers, and hyphens'
    if (!formData.category) newErrors.category = 'Category is required'
    if (formData.basePrice <= 0) newErrors.basePrice = 'Price must be greater than 0'
    if (formData.baseCost <= 0) newErrors.baseCost = 'Cost must be greater than 0'
    if (formData.baseCost >= formData.basePrice) newErrors.baseCost = 'Cost must be less than price'
    
    // Validate that product has either stock or variants
    if (!formData.hasVariants && formData.baseStock < 0) {
      alert('Please enter stock quantity for simple product')
      return false
    }
    if (formData.hasVariants && formData.variants.length === 0) {
      alert('Please add at least one variant or disable "Has Variants"')
      return false
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddProduct = async () => {
    if (!validateForm()) return
    
    try {
      // For simple products, create a default variant with base stock
      const productData = {
        ...formData,
        images: formData.images,
        variants: formData.hasVariants ? formData.variants : [{
          id: Date.now().toString(),
          sku: formData.baseSKU,
          price: formData.basePrice,
          stock: formData.baseStock
        }]
      }
      
      const result = await ipc.products.create(productData)
      
      if (result.success) {
        await loadProducts()
        
        // Also save to localStorage as backup
        const updatedProducts = [...products, result.product]
        localStorage.setItem('products', JSON.stringify(updatedProducts))
        
        setShowAddModal(false)
        resetForm()
        toast.success('Product added successfully!')
      } else {
        // If database fails, save to localStorage
        const newProduct = {
          id: Date.now().toString(),
          ...productData,
          totalStock: productData.variants.reduce((sum, v) => sum + v.stock, 0)
        }
        const updatedProducts = [...products, newProduct]
        setProducts(updatedProducts)
        localStorage.setItem('products', JSON.stringify(updatedProducts))
        
        setShowAddModal(false)
        resetForm()
        toast.warning('Product saved locally - database unavailable')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product. Please try again.')
    }
  }

  const handleEditProduct = async () => {
    if (!validateForm() || !selectedProduct) return
    
    try {
      const result = await ipc.products.update(selectedProduct.id, {
        ...formData,
        images: formData.images
      })
      
      if (result.success) {
        await loadProducts()
        setShowEditModal(false)
        resetForm()
        setSelectedProduct(null)
        toast.success('Product updated successfully!')
      } else {
        toast.error('Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product. Please try again.')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const result = await ipc.products.delete(id)
      if (result.success) {
        await loadProducts()
        toast.success('Product deleted successfully!')
      } else {
        toast.error('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      baseSKU: '',
      category: '',
      description: '',
      basePrice: 0,
      baseCost: 0,
      baseStock: 0,
      images: [],
      hasVariants: false,
      variants: []
    })
    setNewVariant({ color: '', size: '', sku: '', price: 0, stock: 0 })
    setErrors({})
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      baseSKU: product.baseSKU,
      category: product.category,
      description: product.description,
      basePrice: product.basePrice,
      baseCost: product.baseCost,
      baseStock: product.hasVariants ? 0 : (product.variants[0]?.stock || 0),
      images: product.images.map(img => img.imageData),
      hasVariants: product.hasVariants,
      variants: product.variants
    })
    setShowEditModal(true)
  }

  const openViewModal = (product: Product) => {
    setSelectedProduct(product)
    setShowViewModal(true)
  }

  const addVariant = () => {
    if (!newVariant.sku || (!newVariant.color && !newVariant.size)) {
      alert('Please enter SKU and at least color or size')
      return
    }
    
    const variant: ProductVariant = {
      id: Date.now().toString(),
      color: newVariant.color || undefined,
      size: newVariant.size || undefined,
      sku: newVariant.sku,
      price: newVariant.price,
      stock: newVariant.stock
    }
    
    setFormData({ ...formData, variants: [...formData.variants, variant] })
    setNewVariant({ color: '', size: '', sku: '', price: 0, stock: 0 })
  }

  const removeVariant = (id: string) => {
    setFormData({ ...formData, variants: formData.variants.filter(v => v.id !== id) })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || formData.images.length >= 4) return
    
    Array.from(files).forEach(file => {
      if (formData.images.length >= 4) return
      
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

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    })
  }

  const handleExport = () => {
    const csv = [
      ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock', 'Has Variants'].join(','),
      ...products.map(p => [
        p.name,
        p.baseSKU,
        p.category,
        p.basePrice,
        p.baseCost,
        p.totalStock,
        p.hasVariants ? 'Yes' : 'No'
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Apply filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.baseSKU.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !filterCategory || product.category === filterCategory
    
    const matchesColor = !filterColor || 
      product.variants.some(v => v.color?.toLowerCase().includes(filterColor.toLowerCase()))
    
    const matchesSize = !filterSize ||
      product.variants.some(v => v.size?.toLowerCase().includes(filterSize.toLowerCase()))
    
    return matchesSearch && matchesCategory && matchesColor && matchesSize
  })

  // Get unique values for filters
  const categories = Array.from(new Set(products.map(p => p.category)))
  const colors = Array.from(new Set(products.flatMap(p => p.variants.map(v => v.color).filter(Boolean))))
  const sizes = Array.from(new Set(products.flatMap(p => p.variants.map(v => v.size).filter(Boolean))))

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Products</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your product inventory with variants</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Database Status Alert */}
      {dbError && (
        <div className="glass-card p-4 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">
                {dbError}
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                Your data will be saved locally and synced when the database reconnects.
              </p>
            </div>
            <button 
              onClick={() => setDbError(null)} 
              className="flex-shrink-0 text-yellow-600 dark:text-yellow-500 hover:text-yellow-800 dark:hover:text-yellow-400"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="glass-card p-6 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU, or category..."
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          <button onClick={() => setShowFilterModal(true)} className="btn-secondary flex items-center gap-2">
            <Filter size={20} />
            Filters
            {(filterCategory || filterColor || filterSize) && (
              <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {[filterCategory, filterColor, filterSize].filter(Boolean).length}
              </span>
            )}
          </button>
          <button onClick={() => setShowScanModal(true)} className="btn-secondary flex items-center gap-2">
            <Barcode size={20} />
            Scan
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn-secondary flex items-center gap-2">
            <Upload size={20} />
            Import
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {products.length === 0 ? 'No products yet. Add your first product!' : 'No products match your filters.'}
            </p>
            {products.length === 0 && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                <Plus size={20} className="inline mr-2" />
                Add First Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Variants</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Stock</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      {product.images[0] ? (
                        <img
                          src={product.images[0].imageData}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                          <span className="text-slate-400 text-xs">No image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">{product.baseSKU}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">${product.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {product.hasVariants && product.variants.length > 0 ? (
                        <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-semibold">
                          {product.variants.length} variants
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Simple product</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        product.totalStock < 10 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {product.totalStock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openViewModal(product)}
                          className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-2 hover:bg-secondary/10 text-secondary rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add New Product" size="xl">
        <div className="space-y-4">
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
            newVariant={newVariant}
            setNewVariant={setNewVariant}
            onAddVariant={addVariant}
            onRemoveVariant={removeVariant}
          />
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={handleAddProduct} className="btn-primary flex-1">
              Add Product
            </button>
            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Product" size="xl">
        <div className="space-y-4">
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
            newVariant={newVariant}
            setNewVariant={setNewVariant}
            onAddVariant={addVariant}
            onRemoveVariant={removeVariant}
          />
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={handleEditProduct} className="btn-primary flex-1">
              Save Changes
            </button>
            <button onClick={() => { setShowEditModal(false); resetForm(); }} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* View Product Modal */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedProduct(null); }} title="Product Details" size="xl">
        {selectedProduct && (
          <div className="space-y-6">
            {selectedProduct.images.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Product Images</h4>
                <div className="flex gap-3 overflow-x-auto">
                  {selectedProduct.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.imageData}
                      alt={`Product ${idx + 1}`}
                      className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-700"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Product Name</label>
                <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{selectedProduct.name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Base SKU</label>
                <p className="text-lg font-mono font-semibold text-slate-900 dark:text-white mt-1">{selectedProduct.baseSKU}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Category</label>
                <span className="inline-block mt-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  {selectedProduct.category}
                </span>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Base Price</label>
                <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">${selectedProduct.basePrice.toFixed(2)}</p>
              </div>
            </div>

            {selectedProduct.description && (
              <div>
                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Description</label>
                <p className="text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{selectedProduct.description}</p>
              </div>
            )}

            {selectedProduct.hasVariants && selectedProduct.variants.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Product Variants</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 pb-2 pr-4">Options</th>
                        <th className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 pb-2 pr-4">SKU</th>
                        <th className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 pb-2 pr-4">Price</th>
                        <th className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 pb-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct.variants.map((variant) => (
                        <tr key={variant.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-3 pr-4">
                            <div className="flex gap-2">
                              {variant.color && (
                                <span className="inline-block px-2 py-1 bg-secondary/10 text-secondary rounded text-xs font-semibold">
                                  {variant.color}
                                </span>
                              )}
                              {variant.size && (
                                <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                                  {variant.size}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-4 font-mono text-sm text-slate-700 dark:text-slate-300">{variant.sku}</td>
                          <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">${variant.price.toFixed(2)}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                              variant.stock < 10 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {variant.stock} in stock
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Total Stock: <span className="text-primary">{selectedProduct.totalStock} units</span>
                  </p>
                </div>
              </div>
            )}

            {!selectedProduct.hasVariants && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Stock: <span className={`${selectedProduct.totalStock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedProduct.totalStock} units
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Filter Modal */}
      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter Products" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All Colors</option>
              {colors.map(color => (
                <option key={color} value={color as string}>{color}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Size</label>
            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All Sizes</option>
              {sizes.map(size => (
                <option key={size} value={size as string}>{size}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => { setFilterCategory(''); setFilterColor(''); setFilterSize(''); setShowFilterModal(false); }}
              className="btn-secondary flex-1"
            >
              Clear Filters
            </button>
            <button onClick={() => setShowFilterModal(false)} className="btn-primary flex-1">
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Products">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
            <Upload size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Upload CSV File
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="csv-upload"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  alert(`File selected: ${file.name}. Import functionality coming soon!`)
                }
              }}
            />
            <label htmlFor="csv-upload" className="btn-primary inline-flex items-center gap-2 cursor-pointer">
              <Upload size={20} />
              Choose File
            </label>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">CSV Format:</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              Name, SKU, Category, Price, Cost, Stock
            </p>
          </div>
        </div>
      </Modal>

      {/* Scan Barcode Modal */}
      <Modal isOpen={showScanModal} onClose={() => setShowScanModal(false)} title="Scan Barcode" size="md">
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-xl p-8 aspect-video flex items-center justify-center">
            <div className="text-center">
              <Camera size={64} className="mx-auto text-primary mb-4 animate-pulse" />
              <p className="text-white font-semibold mb-2">Camera Scanner</p>
              <p className="text-slate-400 text-sm">Click below to activate camera</p>
            </div>
          </div>
          <button className="btn-primary w-full flex items-center justify-center gap-2">
            <Camera size={20} />
            Activate Camera
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">OR</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Enter barcode manually:
            </label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="Enter barcode number"
            />
          </div>
          <button className="btn-primary w-full">
            Search Product
          </button>
        </div>
      </Modal>
    </div>
  )
}

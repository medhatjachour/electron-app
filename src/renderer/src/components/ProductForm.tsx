import { X, Plus, Trash2 } from 'lucide-react'

type ProductVariant = {
  id: string
  color?: string
  size?: string
  sku: string
  price: number
  stock: number
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
  variants: ProductVariant[]
}

type FormErrors = {
  name?: string
  baseSKU?: string
  categoryId?: string
  basePrice?: string
  baseCost?: string
  images?: string
}

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

type ProductFormProps = {
  formData: FormData
  setFormData: (data: FormData) => void
  errors: FormErrors
  stores: Store[]
  categories: Category[]
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
  newVariant: { color: string; size: string; sku: string; price: number; stock: number }
  setNewVariant: (v: any) => void
  onAddVariant: () => void
  onRemoveVariant: (id: string) => void
  // Batch variant props
  batchMode: boolean
  setBatchMode: (mode: boolean) => void
  batchVariant: {
    colors: string[]
    sizes: string[]
    baseSKU: string
    price: number
    stock: number
  }
  setBatchVariant: (v: any) => void
  colorInput: string
  setColorInput: (v: string) => void
  sizeInput: string
  setSizeInput: (v: string) => void
  onAddColor: () => void
  onAddSize: () => void
  onRemoveColor: (color: string) => void
  onRemoveSize: (size: string) => void
  onGenerateBatchVariants: () => void
}

export default function ProductForm({
  formData,
  setFormData,
  errors,
  stores,
  categories,
  onImageUpload,
  onRemoveImage,
  newVariant,
  setNewVariant,
  onAddVariant,
  onRemoveVariant,
  batchMode,
  setBatchMode,
  batchVariant,
  setBatchVariant,
  colorInput,
  setColorInput,
  sizeInput,
  setSizeInput,
  onAddColor,
  onAddSize,
  onRemoveColor,
  onRemoveSize,
  onGenerateBatchVariants
}: Readonly<ProductFormProps>): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Product Images */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Product Images
        </label>
        <div className="grid grid-cols-4 gap-3">
          {formData.images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img src={img} alt={`Product ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
              <button
                onClick={() => onRemoveImage(idx)}
                className="absolute -top-2 -right-2 p-1 bg-error text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {formData.images.length < 4 && (
            <label className="w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <Plus size={24} className="text-slate-400" />
              <span className="text-xs text-slate-500 mt-1">Add Image</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onImageUpload}
              />
            </label>
          )}
        </div>
        {errors.images && <p className="text-error text-sm mt-1">{errors.images}</p>}
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`input-field w-full ${errors.name ? 'border-error' : ''}`}
            placeholder="E.g., Running Shoes"
          />
          {errors.name && <p className="text-error text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Base SKU *
          </label>
          <input
            type="text"
            value={formData.baseSKU}
            onChange={(e) => setFormData({ ...formData, baseSKU: e.target.value.toUpperCase() })}
            className={`input-field w-full ${errors.baseSKU ? 'border-error' : ''}`}
            placeholder="E.g., SHOE-001"
          />
          {errors.baseSKU && <p className="text-error text-sm mt-1">{errors.baseSKU}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input-field w-full"
          rows={3}
          placeholder="Product description..."
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Category *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className={`input-field w-full ${errors.categoryId ? 'border-error' : ''}`}
          >
            <option value="">Select category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-error text-sm mt-1">{errors.categoryId}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Store Assignment
          </label>
          <select
            value={formData.storeId}
            onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
            className="input-field w-full"
          >
            <option value="">No Store (All Locations)</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name} - {store.location}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Optional: Assign to specific store
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Base Price * ($)
          </label>
          <input
            type="number"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
            className={`input-field w-full ${errors.basePrice ? 'border-error' : ''}`}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {errors.basePrice && <p className="text-error text-sm mt-1">{errors.basePrice}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Base Cost * ($)
          </label>
          <input
            type="number"
            value={formData.baseCost}
            onChange={(e) => setFormData({ ...formData, baseCost: parseFloat(e.target.value) || 0 })}
            className={`input-field w-full ${errors.baseCost ? 'border-error' : ''}`}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {errors.baseCost && <p className="text-error text-sm mt-1">{errors.baseCost}</p>}
        </div>
        {!formData.hasVariants && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Stock * (Units)
            </label>
            <input
              type="number"
              value={formData.baseStock}
              onChange={(e) => setFormData({ ...formData, baseStock: parseInt(e.target.value) || 0 })}
              className="input-field w-full"
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-slate-500 mt-1">Initial stock quantity</p>
          </div>
        )}
      </div>

      {/* Variants Toggle */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Product Variants</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Add options like colors, sizes, or configurations</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasVariants}
              onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
          </label>
        </div>

        {formData.hasVariants && (
          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            {/* Mode Toggle */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setBatchMode(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !batchMode
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                }`}
              >
                Single Variant
              </button>
              <button
                onClick={() => setBatchMode(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  batchMode
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                }`}
              >
                Batch Variants
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {batchMode ? 'Create multiple variants at once' : 'Add one variant at a time'}
              </span>
            </div>

            {/* Single Variant Mode */}
            {!batchMode && (
              <div className="grid grid-cols-6 gap-3">
                <input
                  type="text"
                  value={newVariant.color}
                  onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                  className="input-field"
                  placeholder="Color (optional)"
                />
                <input
                  type="text"
                  value={newVariant.size}
                  onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                  className="input-field"
                  placeholder="Size (optional)"
                />
                <input
                  type="text"
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value.toUpperCase() })}
                  className="input-field"
                  placeholder="SKU"
                />
                <input
                  type="number"
                  value={newVariant.price || ''}
                  onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="Price"
                  step="0.01"
                />
                <input
                  type="number"
                  value={newVariant.stock || ''}
                  onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="Stock"
                />
                <button
                  onClick={onAddVariant}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            )}

            {/* Batch Variant Mode */}
            {batchMode && (
              <div className="space-y-4">
                {/* Colors Section */}
                <div className="bg-white dark:bg-slate-700 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Colors (Optional)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && onAddColor()}
                      className="input-field flex-1"
                      placeholder="Enter color (e.g., Red, Blue)"
                    />
                    <button
                      onClick={onAddColor}
                      className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {batchVariant.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {batchVariant.colors.map((color) => (
                        <span
                          key={color}
                          className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium flex items-center gap-2"
                        >
                          {color}
                          <button
                            onClick={() => onRemoveColor(color)}
                            className="hover:text-secondary/70"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sizes Section */}
                <div className="bg-white dark:bg-slate-700 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Sizes (Optional)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && onAddSize()}
                      className="input-field flex-1"
                      placeholder="Enter size (e.g., S, M, L, XL)"
                    />
                    <button
                      onClick={onAddSize}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {batchVariant.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {batchVariant.sizes.map((size) => (
                        <span
                          key={size}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center gap-2"
                        >
                          {size}
                          <button
                            onClick={() => onRemoveSize(size)}
                            className="hover:text-primary/70"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Common Fields */}
                <div className="bg-white dark:bg-slate-700 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Common Settings (Applied to All Variants)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Base SKU *
                      </label>
                      <input
                        type="text"
                        value={batchVariant.baseSKU}
                        onChange={(e) => setBatchVariant({ ...batchVariant, baseSKU: e.target.value.toUpperCase() })}
                        className="input-field w-full"
                        placeholder="SKU-BASE"
                      />
                      <p className="text-xs text-slate-500 mt-1">Will be: {batchVariant.baseSKU || 'SKU'}-1, {batchVariant.baseSKU || 'SKU'}-2, etc.</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Price * ($)
                      </label>
                      <input
                        type="number"
                        value={batchVariant.price || ''}
                        onChange={(e) => setBatchVariant({ ...batchVariant, price: parseFloat(e.target.value) || 0 })}
                        className="input-field w-full"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Stock (Units)
                      </label>
                      <input
                        type="number"
                        value={batchVariant.stock || ''}
                        onChange={(e) => setBatchVariant({ ...batchVariant, stock: parseInt(e.target.value) || 0 })}
                        className="input-field w-full"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {(batchVariant.colors.length > 0 || batchVariant.sizes.length > 0) && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                      📦 Will create {
                        batchVariant.colors.length > 0 && batchVariant.sizes.length > 0
                          ? batchVariant.colors.length * batchVariant.sizes.length
                          : batchVariant.colors.length + batchVariant.sizes.length
                      } variants
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {batchVariant.colors.length > 0 && batchVariant.sizes.length > 0
                        ? `All combinations of ${batchVariant.colors.length} colors × ${batchVariant.sizes.length} sizes`
                        : batchVariant.colors.length > 0
                        ? `${batchVariant.colors.length} color variants`
                        : `${batchVariant.sizes.length} size variants`}
                    </p>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={onGenerateBatchVariants}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  <Plus size={18} />
                  Generate All Variants
                </button>
              </div>
            )}

            {/* Variant List */}
            {formData.variants.length > 0 && (
              <div className="space-y-2">
                {formData.variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between bg-white dark:bg-slate-700 p-3 rounded-lg">
                    <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                      {variant.color && (
                        <div>
                          <span className="px-2 py-1 bg-secondary/10 text-secondary rounded text-xs font-semibold">
                            {variant.color}
                          </span>
                        </div>
                      )}
                      {variant.size && (
                        <div>
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                            {variant.size}
                          </span>
                        </div>
                      )}
                      <div className="text-slate-600 dark:text-slate-400 font-mono">{variant.sku}</div>
                      <div className="text-slate-900 dark:text-white font-semibold">${variant.price.toFixed(2)}</div>
                      <div className="text-slate-600 dark:text-slate-400">Stock: {variant.stock}</div>
                    </div>
                    <button
                      onClick={() => onRemoveVariant(variant.id)}
                      className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

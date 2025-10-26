/**
 * Product Factory
 * 
 * Handles complex product creation with variants and images
 * Provides builder pattern for flexible product construction
 */

import type { CreateProductDTO, CreateVariantDTO, CreateImageDTO } from '../dtos/product.dto'

/**
 * Product Builder
 */
export class ProductBuilder {
  private product: Partial<CreateProductDTO> = {
    hasVariants: false,
    variants: [],
    images: []
  }

  /**
   * Set basic product info
   */
  withBasicInfo(name: string, sku: string, category: string): this {
    this.product.name = name
    this.product.baseSKU = sku
    this.product.category = category
    return this
  }

  /**
   * Set product description
   */
  withDescription(description: string): this {
    this.product.description = description
    return this
  }

  /**
   * Set pricing
   */
  withPricing(price: number, cost: number): this {
    this.product.basePrice = price
    this.product.baseCost = cost
    return this
  }

  /**
   * Set store
   */
  withStore(storeId: string): this {
    this.product.storeId = storeId
    return this
  }

  /**
   * Add variant
   */
  addVariant(variant: CreateVariantDTO): this {
    this.product.hasVariants = true
    this.product.variants = this.product.variants || []
    this.product.variants.push(variant)
    return this
  }

  /**
   * Add multiple variants
   */
  withVariants(variants: CreateVariantDTO[]): this {
    this.product.hasVariants = variants.length > 0
    this.product.variants = variants
    return this
  }

  /**
   * Add image
   */
  addImage(imageData: string, order: number): this {
    this.product.images = this.product.images || []
    this.product.images.push({ imageData, order })
    return this
  }

  /**
   * Add multiple images
   */
  withImages(images: CreateImageDTO[]): this {
    this.product.images = images
    return this
  }

  /**
   * Build the product DTO
   */
  build(): CreateProductDTO {
    if (!this.product.name) throw new Error('Product name is required')
    if (!this.product.baseSKU) throw new Error('Product SKU is required')
    if (!this.product.category) throw new Error('Product category is required')
    if (this.product.basePrice === undefined) throw new Error('Product price is required')
    if (this.product.baseCost === undefined) throw new Error('Product cost is required')

    return this.product as CreateProductDTO
  }

  /**
   * Reset builder
   */
  reset(): this {
    this.product = {
      hasVariants: false,
      variants: [],
      images: []
    }
    return this
  }
}

/**
 * Product Factory
 */
export class ProductFactory {
  /**
   * Create simple product without variants
   */
  static createSimple(
    name: string,
    sku: string,
    category: string,
    price: number,
    cost: number,
    stock: number
  ): CreateProductDTO {
    return new ProductBuilder()
      .withBasicInfo(name, sku, category)
      .withPricing(price, cost)
      .addVariant({
        sku,
        price,
        stock,
        color: undefined,
        size: undefined
      })
      .build()
  }

  /**
   * Create product with color variants
   */
  static createWithColors(
    name: string,
    baseSKU: string,
    category: string,
    price: number,
    cost: number,
    colors: Array<{ color: string; stock: number }>
  ): CreateProductDTO {
    const builder = new ProductBuilder()
      .withBasicInfo(name, baseSKU, category)
      .withPricing(price, cost)

    for (const { color, stock } of colors) {
      builder.addVariant({
        sku: `${baseSKU}-${color.toUpperCase()}`,
        price,
        stock,
        color,
        size: undefined
      })
    }

    return builder.build()
  }

  /**
   * Create product with size variants
   */
  static createWithSizes(
    name: string,
    baseSKU: string,
    category: string,
    price: number,
    cost: number,
    sizes: Array<{ size: string; stock: number }>
  ): CreateProductDTO {
    const builder = new ProductBuilder()
      .withBasicInfo(name, baseSKU, category)
      .withPricing(price, cost)

    for (const { size, stock } of sizes) {
      builder.addVariant({
        sku: `${baseSKU}-${size.toUpperCase()}`,
        price,
        stock,
        size,
        color: undefined
      })
    }

    return builder.build()
  }

  /**
   * Create product with color and size matrix
   */
  static createWithMatrix(
    name: string,
    baseSKU: string,
    category: string,
    basePrice: number,
    baseCost: number,
    options: {
      colors: string[]
      sizes: string[]
      stockPerVariant?: number
    }
  ): CreateProductDTO {
    const { colors, sizes, stockPerVariant = 10 } = options
    const builder = new ProductBuilder()
      .withBasicInfo(name, baseSKU, category)
      .withPricing(basePrice, baseCost)

    for (const color of colors) {
      for (const size of sizes) {
        builder.addVariant({
          sku: `${baseSKU}-${color.toUpperCase()}-${size.toUpperCase()}`,
          price: basePrice,
          stock: stockPerVariant,
          color,
          size
        })
      }
    }

    return builder.build()
  }

  /**
   * Create product from template
   */
  static fromTemplate(template: Partial<CreateProductDTO>): ProductBuilder {
    const builder = new ProductBuilder()

    if (template.name && template.baseSKU && template.category) {
      builder.withBasicInfo(template.name, template.baseSKU, template.category)
    }

    if (template.description) {
      builder.withDescription(template.description)
    }

    if (template.basePrice !== undefined && template.baseCost !== undefined) {
      builder.withPricing(template.basePrice, template.baseCost)
    }

    if (template.storeId) {
      builder.withStore(template.storeId)
    }

    if (template.variants) {
      builder.withVariants(template.variants)
    }

    if (template.images) {
      builder.withImages(template.images)
    }

    return builder
  }

  /**
   * Get new builder instance
   */
  static builder(): ProductBuilder {
    return new ProductBuilder()
  }
}

/**
 * Variant Factory
 */
export class VariantFactory {
  /**
   * Create basic variant
   */
  static create(sku: string, price: number, stock: number): CreateVariantDTO {
    return { sku, price, stock }
  }

  /**
   * Create color variant
   */
  static createWithColor(
    sku: string,
    price: number,
    stock: number,
    color: string
  ): CreateVariantDTO {
    return { sku, price, stock, color }
  }

  /**
   * Create size variant
   */
  static createWithSize(
    sku: string,
    price: number,
    stock: number,
    size: string
  ): CreateVariantDTO {
    return { sku, price, stock, size }
  }

  /**
   * Create full variant
   */
  static createFull(
    sku: string,
    price: number,
    stock: number,
    color: string,
    size: string
  ): CreateVariantDTO {
    return { sku, price, stock, color, size }
  }
}

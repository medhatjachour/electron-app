/**
 * Pricing Calculator Component
 * Calculates optimal product pricing based on:
 * - Product costs
 * - Sales volume
 * - Operating expenses (bills, salaries)
 * - Inflation rate
 * - Tax rate
 * - Desired profit margin
 */

import { useState, useEffect } from 'react'
import { Calculator, TrendingUp, TrendingDown, DollarSign, Percent, Users, Zap, AlertCircle, CheckCircle, Download, HelpCircle, Search } from 'lucide-react'
import * as XLSX from 'xlsx'

type Product = {
  id: string
  name: string
  currentPrice: number
  cost: number
  monthlySales: number
}

type OperatingExpenses = {
  monthlyBills: number
  totalSalaries: number
  otherExpenses: number
}

type PricingResult = {
  productId: string
  productName: string
  currentPrice: number
  cost: number
  monthlySales: number
  allocatedExpenses: number
  inflationAdjustment: number
  taxAmount: number
  recommendedPrice: number
  profitPerUnit: number
  profitMargin: number
  monthlyRevenue: number
  monthlyProfit: number
}

export default function PricingCalculator() {
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  
  // Operating Expenses
  const [expenses, setExpenses] = useState<OperatingExpenses>({
    monthlyBills: 0,
    totalSalaries: 0,
    otherExpenses: 0
  })
  
  // Pricing Parameters
  const [inflationRate, setInflationRate] = useState(3.5) // %
  const [taxRate, setTaxRate] = useState(15) // %
  const [desiredProfitMargin, setDesiredProfitMargin] = useState(30) // %
  const [includeExpenses, setIncludeExpenses] = useState(true)
  
  // Results
  const [results, setResults] = useState<PricingResult[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load products with sales data - use inventory search endpoint
      // @ts-ignore
      const inventoryResponse = await window.api['search:inventory']({
        filters: {
          query: '',
          categoryIds: [],
          stockStatus: []
        },
        sort: { field: 'name', direction: 'asc' },
        pagination: {
          page: 1,
          limit: 1000
        },
        includeImages: false,
        includeMetrics: false
      })
      console.log('Inventory API response:', inventoryResponse)
      
      // Extract products from inventory response
      const productsData = inventoryResponse?.items || []
      console.log('Products from inventory:', productsData.length)
      
      // Load employees for salary calculation
      // @ts-ignore
      const employeesData = await window.api.employees.getAll()
      console.log('Employees API response:', employeesData)
      
      // Load all sales
      // @ts-ignore
      const salesData = await window.api.sales.getAll()
      console.log('Sales API response:', salesData)
      
      // Ensure we have arrays
      const safeProductsData = Array.isArray(productsData) ? productsData : []
      const safeEmployeesData = Array.isArray(employeesData) ? employeesData : []
      const safeSalesData = Array.isArray(salesData) ? salesData : []
      
      // Filter sales by last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      
      const filteredSales = safeSalesData.filter((sale: any) => {
        const saleDate = new Date(sale.createdAt)
        return saleDate >= startDate && saleDate <= endDate
      })
      
      console.log('Filtered sales (last 30 days):', filteredSales.length)
      
      // Calculate monthly sales per product
      const salesByProduct = new Map<string, number>()
      filteredSales.forEach((sale: any) => {
        const current = salesByProduct.get(sale.productId) || 0
        salesByProduct.set(sale.productId, current + sale.quantity)
      })
      
      // Format products with sales data
      const formattedProducts: Product[] = safeProductsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        currentPrice: p.basePrice || 0,
        cost: p.baseCost || 0,
        monthlySales: salesByProduct.get(p.id) || 0
      }))
      
      console.log('Formatted products:', formattedProducts.length)
      setProducts(formattedProducts)
      
      // Select all products by default
      setSelectedProducts(new Set(formattedProducts.map(p => p.id)))
      
      // Calculate total salaries
      const totalSalaries = safeEmployeesData.reduce((sum: number, emp: any) => sum + (emp.salary || 0), 0)
      setExpenses(prev => ({ ...prev, totalSalaries }))
      
    } catch (error) {
      console.error('Error loading pricing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePricing = () => {
    setCalculating(true)
    
    try {
      const selectedProductsList = products.filter(p => selectedProducts.has(p.id))
      
      if (selectedProductsList.length === 0) {
        setCalculating(false)
        return
      }
      
      // Calculate total monthly sales volume
      const totalMonthlySales = selectedProductsList.reduce((sum, p) => sum + p.monthlySales, 0)
      
      // Calculate total operating expenses
      const totalExpenses = includeExpenses 
        ? expenses.monthlyBills + expenses.totalSalaries + expenses.otherExpenses
        : 0
      
      // Calculate pricing for each product
      const calculatedResults: PricingResult[] = selectedProductsList.map(product => {
        // 1. Base cost
        let basePrice = product.cost
        
        // 2. Allocate expenses proportionally based on sales volume
        const salesRatio = totalMonthlySales > 0 ? product.monthlySales / totalMonthlySales : 0
        const allocatedExpenses = totalExpenses * salesRatio
        const expensePerUnit = product.monthlySales > 0 ? allocatedExpenses / product.monthlySales : 0
        basePrice += expensePerUnit
        
        // 3. Apply inflation adjustment
        const inflationAdjustment = basePrice * (inflationRate / 100)
        basePrice += inflationAdjustment
        
        // 4. Apply desired profit margin (before tax)
        const profitAmount = basePrice * (desiredProfitMargin / 100)
        basePrice += profitAmount
        
        // 5. Calculate tax on the selling price
        const taxAmount = basePrice * (taxRate / 100)
        const recommendedPrice = basePrice + taxAmount
        
        // Calculate metrics
        const profitPerUnit = recommendedPrice - product.cost - expensePerUnit - taxAmount
        const profitMargin = recommendedPrice > 0 ? (profitPerUnit / recommendedPrice) * 100 : 0
        const monthlyRevenue = recommendedPrice * product.monthlySales
        const monthlyProfit = profitPerUnit * product.monthlySales
        
        return {
          productId: product.id,
          productName: product.name,
          currentPrice: product.currentPrice,
          cost: product.cost,
          monthlySales: product.monthlySales,
          allocatedExpenses: expensePerUnit,
          inflationAdjustment,
          taxAmount,
          recommendedPrice: Math.round(recommendedPrice * 100) / 100, // Round to 2 decimals
          profitPerUnit,
          profitMargin,
          monthlyRevenue,
          monthlyProfit
        }
      })
      
      setResults(calculatedResults)
    } catch (error) {
      console.error('Error calculating pricing:', error)
    } finally {
      setCalculating(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productId)) {
      newSelection.delete(productId)
    } else {
      newSelection.add(productId)
    }
    setSelectedProducts(newSelection)
  }

  const selectAllProducts = () => {
    setSelectedProducts(new Set(products.map(p => p.id)))
  }

  const deselectAllProducts = () => {
    setSelectedProducts(new Set())
  }

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const exportResults = () => {
    if (results.length === 0) return
    
    const exportData = results.map(r => ({
      'Product Name': r.productName,
      'Current Price': `$${r.currentPrice.toFixed(2)}`,
      'Product Cost': `$${r.cost.toFixed(2)}`,
      'Monthly Sales': r.monthlySales,
      'Allocated Expenses': `$${r.allocatedExpenses.toFixed(2)}`,
      'Inflation Adjustment': `$${r.inflationAdjustment.toFixed(2)}`,
      'Tax Amount': `$${r.taxAmount.toFixed(2)}`,
      'Recommended Price': `$${r.recommendedPrice.toFixed(2)}`,
      'Price Change': `$${(r.recommendedPrice - r.currentPrice).toFixed(2)}`,
      'Profit Per Unit': `$${r.profitPerUnit.toFixed(2)}`,
      'Profit Margin': `${r.profitMargin.toFixed(2)}%`,
      'Monthly Revenue': `$${r.monthlyRevenue.toFixed(2)}`,
      'Monthly Profit': `$${r.monthlyProfit.toFixed(2)}`
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pricing Analysis')
    
    const date = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `pricing-analysis-${date}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading pricing data...</p>
        </div>
      </div>
    )
  }

  const totalExpenses = expenses.monthlyBills + expenses.totalSalaries + expenses.otherExpenses
  const totalMonthlyRevenue = results.reduce((sum, r) => sum + r.monthlyRevenue, 0)
  const totalMonthlyProfit = results.reduce((sum, r) => sum + r.monthlyProfit, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Calculator size={28} />
          <h2 className="text-2xl font-bold">Smart Pricing Calculator</h2>
          
          {/* Info Button with Tooltip */}
          <div className="relative group ml-auto">
            <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <HelpCircle size={20} />
            </button>
            
            {/* Tooltip on Hover */}
            <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">How the Calculation Works</h3>
                  <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold min-w-[20px]">1.</span>
                      <span><strong>Base Cost:</strong> Starts with the product's cost price</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold min-w-[20px]">2.</span>
                      <span><strong>Allocated Expenses:</strong> Operating expenses are distributed across products based on sales volume</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold min-w-[20px]">3.</span>
                      <span><strong>Inflation Adjustment:</strong> Adds the inflation rate percentage</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold min-w-[20px]">4.</span>
                      <span><strong>Profit Margin:</strong> Adds your desired profit margin</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold min-w-[20px]">5.</span>
                      <span><strong>Tax:</strong> Applies the tax rate on the final price</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      (Cost + Expenses) × (1 + Inflation%) × (1 + Profit%) × (1 + Tax%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-blue-100">
          Calculate optimal product prices based on costs, expenses, inflation, taxes, and desired profit margins
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Operating Expenses */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={20} className="text-blue-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Operating Expenses</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Monthly Bills (Rent, Utilities, etc.)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={expenses.monthlyBills}
                    onChange={(e) => setExpenses({ ...expenses, monthlyBills: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Total Salaries
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={expenses.totalSalaries}
                    onChange={(e) => setExpenses({ ...expenses, totalSalaries: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Other Expenses
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={expenses.otherExpenses}
                    onChange={(e) => setExpenses({ ...expenses, otherExpenses: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Include in Pricing</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeExpenses}
                      onChange={(e) => setIncludeExpenses(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Total: ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Parameters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Percent size={20} className="text-purple-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Pricing Parameters</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Inflation Rate
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(Number(e.target.value))}
                    min="0"
                    max="20"
                    step="0.5"
                    className="flex-1"
                  />
                  <span className="w-16 text-right font-semibold text-slate-900 dark:text-white">
                    {inflationRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tax Rate
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    min="0"
                    max="30"
                    step="0.5"
                    className="flex-1"
                  />
                  <span className="w-16 text-right font-semibold text-slate-900 dark:text-white">
                    {taxRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Desired Profit Margin
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    value={desiredProfitMargin}
                    onChange={(e) => setDesiredProfitMargin(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="5"
                    className="flex-1"
                  />
                  <span className="w-16 text-right font-semibold text-slate-900 dark:text-white">
                    {desiredProfitMargin.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculatePricing}
            disabled={calculating || selectedProducts.size === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
          >
            {calculating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Calculating...
              </>
            ) : (
              <>
                <Calculator size={20} />
                Calculate Pricing
              </>
            )}
          </button>
        </div>

        {/* Right Column: Products & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-green-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Select Products</h3>
                <span className="text-sm text-slate-500">
                  ({selectedProducts.size} of {products.length} selected)
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAllProducts}
                  className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllProducts}
                  className="text-sm px-3 py-1 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>

            {products.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500">No products found</p>
                <p className="text-sm text-slate-400 mt-1">Add products to your inventory to start calculating prices</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Search size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500">No products match "{searchQuery}"</p>
                <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-500 mb-2">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {filteredProducts.map(product => (
                  <label
                    key={product.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProducts.has(product.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">
                          ${product.currentPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {product.monthlySales} sales/mo
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={18} />
                    <span className="text-sm font-medium opacity-90">Monthly Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">
                    ${totalMonthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} />
                    <span className="text-sm font-medium opacity-90">Monthly Profit</span>
                  </div>
                  <p className="text-2xl font-bold">
                    ${totalMonthlyProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent size={18} />
                    <span className="text-sm font-medium opacity-90">Avg Margin</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {(results.reduce((sum, r) => sum + r.profitMargin, 0) / results.length).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Pricing Results</h3>
                  <button
                    onClick={exportResults}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Product</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Current</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Recommended</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Change</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Margin</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Monthly Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {results.map((result) => {
                        const priceChange = result.recommendedPrice - result.currentPrice
                        const changePercent = result.currentPrice > 0 ? (priceChange / result.currentPrice) * 100 : 0
                        
                        return (
                          <tr key={result.productId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{result.productName}</p>
                                <p className="text-xs text-slate-500">{result.monthlySales} sales/month</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                              ${result.currentPrice.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                ${result.recommendedPrice.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className={`inline-flex items-center gap-1 ${
                                priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {priceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span className="font-medium">
                                  {priceChange >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                result.profitMargin >= 30 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                result.profitMargin >= 15 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                              }`}>
                                {result.profitMargin.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                              ${result.monthlyProfit.toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Breakdown Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How Pricing is Calculated</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Base:</strong> Product cost + allocated operating expenses (proportional to sales volume)</li>
                      <li>• <strong>Inflation:</strong> {inflationRate.toFixed(1)}% adjustment added to cover rising costs</li>
                      <li>• <strong>Profit Margin:</strong> {desiredProfitMargin.toFixed(0)}% added for business profitability</li>
                      <li>• <strong>Tax:</strong> {taxRate.toFixed(1)}% added on final selling price</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Reports IPC Handlers
 * Handles report generation and data aggregation
 */

import { ipcMain } from 'electron'

export function registerReportsHandlers(prisma: any) {
  // Get Sales Report Data
  ipcMain.handle('reports:getSalesData', async (_, { startDate, endDate, filters }) => {
    try {
      if (!prisma) return { success: false, data: null }

      const whereClause: any = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }

      if (filters?.status) {
        whereClause.status = filters.status
      }

      if (filters?.userId) {
        whereClause.userId = filters.userId
      }

      // Get sales with related data
      const sales = await prisma.sale.findMany({
        where: whereClause,
        include: {
          product: {
            include: {
              category: true
            }
          },
          user: {
            select: {
              username: true,
              fullName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Calculate statistics
      const totalSales = sales.length
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
      
      // Group by payment method
      const byPaymentMethod = sales.reduce((acc, sale) => {
        acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total
        return acc
      }, {} as Record<string, number>)

      // Group by category
      const byCategory = sales.reduce((acc, sale) => {
        const category = sale.product?.category?.name || 'Uncategorized'
        acc[category] = (acc[category] || 0) + sale.total
        return acc
      }, {} as Record<string, number>)

      // Top products
      const productSales = sales.reduce((acc, sale) => {
        const productName = sale.product?.name || 'Unknown'
        if (!acc[productName]) {
          acc[productName] = { name: productName, quantity: 0, revenue: 0 }
        }
        acc[productName].quantity += sale.quantity
        acc[productName].revenue += sale.total
        return acc
      }, {} as Record<string, any>)

      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10)

      // Daily breakdown
      const dailySales = sales.reduce((acc, sale) => {
        const date = new Date(sale.createdAt).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, sales: 0, revenue: 0, orders: 0 }
        }
        acc[date].orders += 1
        acc[date].revenue += sale.total
        acc[date].sales += sale.quantity
        return acc
      }, {} as Record<string, any>)

      return {
        success: true,
        data: {
          summary: {
            totalSales,
            totalRevenue,
            averageOrderValue,
            dateRange: { startDate, endDate }
          },
          sales,
          byPaymentMethod,
          byCategory,
          topProducts,
          dailyBreakdown: Object.values(dailySales).sort((a: any, b: any) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        }
      }
    } catch (error) {
      console.error('[Reports] Error generating sales report:', error)
      return { success: false, error: 'Failed to generate sales report' }
    }
  })

  // Get Inventory Report Data
  ipcMain.handle('reports:getInventoryData', async () => {
    try {
      if (!prisma) return { success: false, data: null }

      const products = await prisma.product.findMany({
        include: {
          category: true,
          variants: true,
          images: {
            take: 1,
            orderBy: { order: 'asc' }
          }
        }
      })

      // Calculate total inventory value
      let totalValue = 0
      let totalItems = 0
      let lowStockCount = 0
      let outOfStockCount = 0

      const inventoryData = products.map(product => {
        if (product.hasVariants && product.variants.length > 0) {
          const variantStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
          const variantValue = product.variants.reduce((sum, v) => sum + (v.price * v.stock), 0)
          totalValue += variantValue
          totalItems += variantStock

          const hasLowStock = product.variants.some(v => v.stock < 10 && v.stock > 0)
          const hasOutOfStock = product.variants.some(v => v.stock === 0)
          
          if (hasLowStock) lowStockCount++
          if (hasOutOfStock) outOfStockCount++

          return {
            id: product.id,
            name: product.name,
            sku: product.baseSKU,
            category: product.category?.name || 'Uncategorized',
            stock: variantStock,
            value: variantValue,
            status: hasOutOfStock ? 'Out of Stock' : hasLowStock ? 'Low Stock' : 'In Stock',
            hasVariants: true,
            variants: product.variants.map(v => ({
              sku: v.sku,
              color: v.color,
              size: v.size,
              stock: v.stock,
              price: v.price
            }))
          }
        } else {
          // Calculate from variants if exists, otherwise use base data
          const stock = product.variants[0]?.stock || 0
          const value = stock * product.basePrice
          totalValue += value
          totalItems += stock

          if (stock === 0) outOfStockCount++
          else if (stock < 10) lowStockCount++

          return {
            id: product.id,
            name: product.name,
            sku: product.baseSKU,
            category: product.category?.name || 'Uncategorized',
            stock,
            value,
            status: stock === 0 ? 'Out of Stock' : stock < 10 ? 'Low Stock' : 'In Stock',
            hasVariants: false
          }
        }
      })

      // Group by category
      const byCategory = inventoryData.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { count: 0, value: 0, stock: 0 }
        }
        acc[item.category].count += 1
        acc[item.category].value += item.value
        acc[item.category].stock += item.stock
        return acc
      }, {} as Record<string, any>)

      return {
        success: true,
        data: {
          summary: {
            totalProducts: products.length,
            totalItems,
            totalValue,
            lowStockCount,
            outOfStockCount,
            categories: Object.keys(byCategory).length
          },
          inventory: inventoryData,
          byCategory,
          lowStockItems: inventoryData.filter(item => item.status === 'Low Stock'),
          outOfStockItems: inventoryData.filter(item => item.status === 'Out of Stock')
        }
      }
    } catch (error) {
      console.error('[Reports] Error generating inventory report:', error)
      return { success: false, error: 'Failed to generate inventory report' }
    }
  })

  // Get Financial Report Data
  ipcMain.handle('reports:getFinancialData', async (_, { startDate, endDate }) => {
    try {
      if (!prisma) return { success: false, data: null }

      // Get sales revenue
      const sales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          },
          status: 'completed'
        }
      })

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)

      // Get financial transactions (expenses)
      const transactions = await prisma.financialTransaction.findMany({
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: {
          user: {
            select: {
              username: true,
              fullName: true
            }
          }
        }
      })

      // Get active employees and calculate salary expenses
      const employees = await prisma.employee.findMany({
        where: {
          createdAt: {
            lte: new Date(endDate)
          }
        }
      })

      const totalSalaryExpense = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0)

      // Calculate daily/weekly/monthly salary expenses based on date range
      const startTime = new Date(startDate).getTime()
      const endTime = new Date(endDate).getTime()
      const daysInRange = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24))
      
      let salaryExpenseForPeriod = 0
      if (daysInRange <= 1) {
        // Daily: divide monthly salary by ~30 days
        salaryExpenseForPeriod = totalSalaryExpense / 30
      } else if (daysInRange <= 7) {
        // Weekly: divide monthly by 4.33 weeks
        salaryExpenseForPeriod = totalSalaryExpense / 4.33
      } else {
        // Monthly or longer: use full monthly salary * number of months
        const monthsInRange = daysInRange / 30
        salaryExpenseForPeriod = totalSalaryExpense * monthsInRange
      }

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const expensesFromTransactions = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = expensesFromTransactions + salaryExpenseForPeriod
      const netProfit = totalRevenue + income - totalExpenses
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

      // Daily breakdown
      const dailyFinancials = sales.reduce((acc, sale) => {
        const date = new Date(sale.createdAt).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, expenses: 0, profit: 0 }
        }
        acc[date].revenue += sale.total
        return acc
      }, {} as Record<string, any>)

      // Add expenses to daily breakdown
      transactions.forEach(transaction => {
        const date = new Date(transaction.createdAt).toISOString().split('T')[0]
        if (dailyFinancials[date]) {
          if (transaction.type === 'expense') {
            dailyFinancials[date].expenses += transaction.amount
          } else {
            dailyFinancials[date].revenue += transaction.amount
          }
          dailyFinancials[date].profit = dailyFinancials[date].revenue - dailyFinancials[date].expenses
        }
      })

      // Add daily salary expense proportionally
      const dailySalaryExpense = salaryExpenseForPeriod / Math.max(1, Object.keys(dailyFinancials).length)
      Object.keys(dailyFinancials).forEach(date => {
        dailyFinancials[date].expenses += dailySalaryExpense
        dailyFinancials[date].salaryExpense = dailySalaryExpense
        dailyFinancials[date].profit = dailyFinancials[date].revenue - dailyFinancials[date].expenses
      })

      // Expense breakdown by category (add salary as a category)
      const expensesByDescription = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.description] = (acc[t.description] || 0) + t.amount
          return acc
        }, {} as Record<string, number>)
      
      // Add salary expense as a category
      expensesByDescription['Employee Salaries'] = salaryExpenseForPeriod

      return {
        success: true,
        data: {
          summary: {
            totalRevenue: totalRevenue + income,
            totalExpenses: totalExpenses,
            salaryExpense: salaryExpenseForPeriod,
            otherExpenses: expensesFromTransactions,
            netProfit,
            profitMargin,
            salesCount: sales.length,
            employeeCount: employees.length,
            dateRange: { startDate, endDate }
          },
          transactions,
          dailyBreakdown: Object.values(dailyFinancials).sort((a: any, b: any) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
          expensesByCategory: expensesByDescription
        }
      }
    } catch (error) {
      console.error('[Reports] Error generating financial report:', error)
      return { success: false, error: 'Failed to generate financial report' }
    }
  })

  // Get Customer Report Data
  ipcMain.handle('reports:getCustomerData', async (_, { startDate, endDate }) => {
    try {
      if (!prisma) return { success: false, data: null }

      const customers = await prisma.customer.findMany({
        orderBy: {
          totalSpent: 'desc'
        }
      })

      const totalCustomers = customers.length
      const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0)
      const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0

      // Group by loyalty tier
      const byLoyaltyTier = customers.reduce((acc, customer) => {
        acc[customer.loyaltyTier] = (acc[customer.loyaltyTier] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Get new customers in date range
      const newCustomers = customers.filter(c => {
        const created = new Date(c.createdAt)
        return created >= new Date(startDate) && created <= new Date(endDate)
      })

      // Top customers
      const topCustomers = customers.slice(0, 10).map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalSpent: c.totalSpent,
        loyaltyTier: c.loyaltyTier
      }))

      return {
        success: true,
        data: {
          summary: {
            totalCustomers,
            newCustomers: newCustomers.length,
            totalSpent,
            averageSpent,
            dateRange: { startDate, endDate }
          },
          customers,
          topCustomers,
          byLoyaltyTier
        }
      }
    } catch (error) {
      console.error('[Reports] Error generating customer report:', error)
      return { success: false, error: 'Failed to generate customer report' }
    }
  })

  // Get Quick Insights
  ipcMain.handle('reports:getQuickInsights', async () => {
    try {
      if (!prisma) return { success: false, data: null }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Today's sales
      const todaySales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: today
          },
          status: 'completed'
        }
      })

      const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
      const todayOrders = todaySales.length

      // Low stock items
      const products = await prisma.product.findMany({
        include: {
          variants: true
        }
      })

      let lowStockCount = 0
      products.forEach(product => {
        if (product.hasVariants) {
          const hasLowStock = product.variants.some(v => v.stock < 10 && v.stock > 0)
          if (hasLowStock) lowStockCount++
        }
      })

      // New customers this month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const newCustomers = await prisma.customer.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      })

      return {
        success: true,
        data: {
          todayRevenue,
          todayOrders,
          lowStockItems: lowStockCount,
          newCustomers
        }
      }
    } catch (error) {
      console.error('[Reports] Error getting quick insights:', error)
      return { success: false, error: 'Failed to get quick insights' }
    }
  })
}

import { ipcMain } from 'electron'

/**
 * Sale Transaction Handlers
 * Handles creating transactions with multiple items
 */

export function registerSaleTransactionHandlers(prisma: any) {
  /**
   * Create a new sale transaction with multiple items
   * @param items - Array of { productId, variantId, quantity, price }
   * @param transactionData - { userId, paymentMethod, customerName, subtotal, tax, total }
   */
  ipcMain.handle('saleTransactions:create', async (_, { items, transactionData }) => {
    try {
      if (!prisma) {
        return { success: false, error: 'Database not initialized' }
      }

      // Validate inputs
      if (!items || items.length === 0) {
        return { success: false, error: 'No items provided' }
      }

      if (!transactionData.userId) {
        return { success: false, error: 'User ID required' }
      }

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx: any) => {
        // 1. Create the sale transaction
        const saleTransaction = await tx.saleTransaction.create({
          data: {
            userId: transactionData.userId,
            customerId: transactionData.customerId || null,
            paymentMethod: transactionData.paymentMethod || 'cash',
            status: 'completed',
            customerName: transactionData.customerName || null,
            subtotal: transactionData.subtotal,
            tax: transactionData.tax || 0,
            total: transactionData.total
          }
        })

        // 2. Create all sale items
        const saleItems = await Promise.all(
          items.map((item: any) =>
            tx.saleItem.create({
              data: {
                transactionId: saleTransaction.id,
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
              }
            })
          )
        )

        // 3. Update stock and record stock movements for each item
        await Promise.all(
          items.map(async (item: any) => {
            if (item.variantId) {
              // Get current stock before update
              const variant = await tx.productVariant.findUnique({
                where: { id: item.variantId }
              })
              
              if (variant) {
                const previousStock = variant.stock
                const newStock = previousStock - item.quantity
                
                // Update stock
                await tx.productVariant.update({
                  where: { id: item.variantId },
                  data: { stock: newStock }
                })
                
                // Record stock movement
                await tx.stockMovement.create({
                  data: {
                    variantId: item.variantId,
                    type: 'SALE',
                    quantity: -item.quantity, // Negative for sales
                    previousStock,
                    newStock,
                    referenceId: saleTransaction.id,
                    userId: transactionData.userId,
                    notes: `Sale transaction ${saleTransaction.id}`
                  }
                })
              }
            }
            return Promise.resolve()
          })
        )

        return { transaction: saleTransaction, items: saleItems }
      }, {
        maxWait: 30000,
        timeout: 30000
      })

      // After successful transaction, recalculate customer totalSpent if customerId provided
      if (transactionData.customerId) {
        try {
          const customerTotal = await prisma.saleTransaction.aggregate({
            where: {
              customerId: transactionData.customerId,
              status: 'completed'
            },
            _sum: { total: true }
          })
          
          await prisma.customer.update({
            where: { id: transactionData.customerId },
            data: { totalSpent: customerTotal._sum.total || 0 }
          })
          
        } catch (error) {
          console.error('Error updating customer totalSpent:', error)
          // Don't fail the transaction if this update fails
        }
      }

      return { success: true, ...result }
    } catch (error) {
      console.error('Error creating sale transaction:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  /**
   * Get all sale transactions with items
   */
  ipcMain.handle('saleTransactions:getAll', async () => {
    try {
      if (!prisma) return []

      const transactions = await prisma.saleTransaction.findMany({
        include: {
          user: {
            select: {
              username: true,
              fullName: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  category: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return transactions
    } catch (error) {
      console.error('Error fetching sale transactions:', error)
      throw error
    }
  })

  /**
   * Get sale transaction by ID
   */
  ipcMain.handle('saleTransactions:getById', async (_, id: string) => {
    try {
      if (!prisma) return null

      const transaction = await prisma.saleTransaction.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              username: true,
              fullName: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  baseSKU: true,
                  category: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      return transaction
    } catch (error) {
      console.error('Error fetching sale transaction:', error)
      throw error
    }
  })

  /**
   * Refund a sale transaction
   */
  ipcMain.handle('saleTransactions:refund', async (_, id: string) => {
    try {
      if (!prisma) {
        return { success: false, error: 'Database not initialized' }
      }

      const result = await prisma.$transaction(async (tx: any) => {
        // Get transaction with items
        const transaction = await tx.saleTransaction.findUnique({
          where: { id },
          include: { items: true }
        })

        if (!transaction) {
          throw new Error('Transaction not found')
        }

        if (transaction.status === 'refunded') {
          throw new Error('Transaction already refunded')
        }

        // Update transaction status
        const updated = await tx.saleTransaction.update({
          where: { id },
          data: { status: 'refunded' }
        })

        // Restore stock for each item
        await Promise.all(
          transaction.items.map((item: any) => {
            if (item.variantId) {
              return tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } }
              })
            }
            return Promise.resolve()
          })
        )

        return updated
      })

      // After successful refund, recalculate customer totalSpent if customerId exists
      if (result.customerId) {
        try {
          const customerTotal = await prisma.saleTransaction.aggregate({
            where: {
              customerId: result.customerId,
              status: 'completed'
            },
            _sum: { total: true }
          })
          
          await prisma.customer.update({
            where: { id: result.customerId },
            data: { totalSpent: customerTotal._sum.total || 0 }
          })
          
        } catch (error) {
          console.error('Error updating customer totalSpent after refund:', error)
        }
      }

      return { success: true, transaction: result }
    } catch (error) {
      console.error('Error refunding transaction:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  /**
   * Get transactions by date range
   */
  ipcMain.handle('saleTransactions:getByDateRange', async (_, { startDate, endDate }) => {
    try {
      if (!prisma) return []

      const transactions = await prisma.saleTransaction.findMany({
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: {
          user: {
            select: {
              username: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  category: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return transactions
    } catch (error) {
      console.error('Error fetching transactions by date range:', error)
      throw error
    }
  })
}

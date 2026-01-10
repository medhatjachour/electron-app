/**
 * Purchase Orders Management Component
 *
 * Features:
 * - Purchase order CRUD operations
 * - Order status management (draft, ordered, received, cancelled)
 * - Inventory integration on order receipt
 * - Supplier and product relationship management
 * - Order tracking and metrics
 */

import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, Package, DollarSign, Truck, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'
import { ipc } from '../../../utils/ipc'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table'
import Badge from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import type { PurchaseOrderResponseDTO, CreatePurchaseOrderDTO, UpdatePurchaseOrderDTO, PurchaseOrderSummaryDTO } from '../../../../../shared/dtos/purchase-order.dto'
import type { SupplierResponseDTO } from '../../../../../shared/dtos/supplier.dto'
import type { ProductResponseDTO } from '../../../../../shared/dtos/product.dto'

interface PurchaseOrderFormData {
  supplierId: string
  expectedDate: string
  taxAmount: number
  shippingCost: number
  notes: string
  items: {
    productId: string
    quantity: number
    unitCost: number
  }[]
}

interface PurchaseOrderItemForm {
  productId: string
  quantity: number
  unitCost: number
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'gray', icon: Edit },
  ordered: { label: 'Ordered', color: 'blue', icon: Clock },
  received: { label: 'Received', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'red', icon: XCircle }
} as const

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderResponseDTO[]>([])
  const [suppliers, setSuppliers] = useState<SupplierResponseDTO[]>([])
  const [products, setProducts] = useState<ProductResponseDTO[]>([])
  const [summary, setSummary] = useState<PurchaseOrderSummaryDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderResponseDTO | null>(null)

  // Form states
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplierId: '',
    expectedDate: '',
    taxAmount: 0,
    shippingCost: 0,
    notes: '',
    items: []
  })

  const [itemForm, setItemForm] = useState<PurchaseOrderItemForm>({
    productId: '',
    quantity: 1,
    unitCost: 0
  })

  const { showToast } = useToast()

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setDataError(null)
      const [ordersResult, suppliersResult, productsResult, summaryResult] = await Promise.all([
        ipc.purchaseOrders.getAll(),
        ipc.suppliers.getAll(),
        ipc.products.getAll(),
        ipc.purchaseOrders.getSummary()
      ])

      // Handle purchase orders
      setPurchaseOrders(Array.isArray(ordersResult) ? ordersResult : [])
      
      // Handle suppliers - paginated response
      if (suppliersResult?.success && suppliersResult.data?.data) {
        setSuppliers(Array.isArray(suppliersResult.data.data) ? suppliersResult.data.data : [])
      } else if (Array.isArray(suppliersResult)) {
        setSuppliers(suppliersResult)
      } else {
        console.warn('Unexpected suppliers format:', suppliersResult)
        setSuppliers([])
      }
      
      // Handle products - paginated response
      if (productsResult?.success && productsResult.data?.data) {
        setProducts(Array.isArray(productsResult.data.data) ? productsResult.data.data : [])
      } else if (Array.isArray(productsResult?.data)) {
        setProducts(productsResult.data)
      } else if (Array.isArray(productsResult)) {
        setProducts(productsResult)
      } else {
        console.warn('Unexpected products format:', productsResult)
        setProducts([])
      }
      
      setSummary(summaryResult)
    } catch (error) {
      console.error('Error loading purchase orders data:', error)
      setDataError('Failed to load purchase orders data')
      showToast('error', 'Failed to load purchase orders data')
    } finally {
      setLoading(false)
    }
  }

  // Filter purchase orders
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(order => {
      const matchesSearch = !searchQuery ||
        order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = !statusFilter || order.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [purchaseOrders, searchQuery, statusFilter])

  // Calculate form totals
  const calculateTotal = (items: PurchaseOrderItemForm[], tax: number, shipping: number) => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
    return itemsTotal + tax + shipping
  }

  // Handle create purchase order
  const handleCreateOrder = async () => {
    try {
      if (!formData.supplierId || formData.items.length === 0) {
        showToast('error', 'Please select a supplier and add at least one item')
        return
      }

      const orderData: CreatePurchaseOrderDTO = {
        supplierId: formData.supplierId,
        expectedDate: formData.expectedDate ? new Date(formData.expectedDate) : undefined,
        taxAmount: formData.taxAmount,
        shippingCost: formData.shippingCost,
        notes: formData.notes,
        items: formData.items
      }

      const newOrder = await ipc.purchaseOrders.create(orderData)
      setPurchaseOrders(prev => [newOrder, ...prev])
      setSummary(prev => prev ? { ...prev, total: prev.total + 1, draft: prev.draft + 1 } : null)

      setShowCreateModal(false)
      resetForm()
      showToast('success', 'Purchase order created successfully')
    } catch (error) {
      console.error('Error creating purchase order:', error)
      showToast('error', 'Failed to create purchase order')
    }
  }

  // Handle update purchase order
  const handleUpdateOrder = async () => {
    if (!selectedOrder) return

    try {
      const updateData: UpdatePurchaseOrderDTO = {
        expectedDate: formData.expectedDate ? new Date(formData.expectedDate) : undefined,
        taxAmount: formData.taxAmount,
        shippingCost: formData.shippingCost,
        notes: formData.notes
      }

      const updatedOrder = await ipc.purchaseOrders.update(selectedOrder.id, updateData)
      setPurchaseOrders(prev => prev.map(order =>
        order.id === selectedOrder.id ? updatedOrder : order
      ))

      setShowEditModal(false)
      resetForm()
      showToast('success', 'Purchase order updated successfully')
    } catch (error) {
      console.error('Error updating purchase order:', error)
      showToast('error', 'Failed to update purchase order')
    }
  }

  // Handle receive purchase order
  const handleReceiveOrder = async () => {
    if (!selectedOrder) return

    try {
      const updatedOrder = await ipc.purchaseOrders.receive(selectedOrder.id)
      setPurchaseOrders(prev => prev.map(order =>
        order.id === selectedOrder.id ? updatedOrder : order
      ))

      // Update summary
      setSummary(prev => prev ? {
        ...prev,
        ordered: prev.ordered - 1,
        received: prev.received + 1,
        pendingValue: prev.pendingValue - updatedOrder.totalAmount
      } : null)

      setShowReceiveModal(false)
      setSelectedOrder(null)
      showToast('success', 'Purchase order received and inventory updated')
    } catch (error) {
      console.error('Error receiving purchase order:', error)
      showToast('error', 'Failed to receive purchase order')
    }
  }

  // Handle delete purchase order
  const handleDeleteOrder = async (order: PurchaseOrderResponseDTO) => {
    if (!confirm(`Are you sure you want to delete purchase order ${order.poNumber}?`)) {
      return
    }

    try {
      await ipc.purchaseOrders.delete(order.id)
      setPurchaseOrders(prev => prev.filter(o => o.id !== order.id))

      // Update summary
      setSummary(prev => prev ? {
        ...prev,
        total: prev.total - 1,
        [order.status]: prev[order.status as keyof PurchaseOrderSummaryDTO] as number - 1,
        totalValue: prev.totalValue - order.totalAmount,
        pendingValue: order.status === 'ordered' ? prev.pendingValue - order.totalAmount : prev.pendingValue
      } : null)

      showToast('success', 'Purchase order deleted successfully')
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      showToast('error', 'Failed to delete purchase order')
    }
  }

  // Handle status change
  const handleStatusChange = async (order: PurchaseOrderResponseDTO, newStatus: string) => {
    try {
      const updatedOrder = await ipc.purchaseOrders.update(order.id, { status: newStatus as any })
      setPurchaseOrders(prev => prev.map(o =>
        o.id === order.id ? updatedOrder : o
      ))

      // Update summary
      setSummary(prev => prev ? {
        ...prev,
        [order.status]: prev[order.status as keyof PurchaseOrderSummaryDTO] as number - 1,
        [newStatus]: prev[newStatus as keyof PurchaseOrderSummaryDTO] as number + 1,
        pendingValue: (order.status === 'ordered' && newStatus !== 'ordered') ? prev.pendingValue - order.totalAmount :
                     (order.status !== 'ordered' && newStatus === 'ordered') ? prev.pendingValue + order.totalAmount : prev.pendingValue
      } : null)

      showToast('success', `Purchase order status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating purchase order status:', error)
      showToast('error', 'Failed to update purchase order status')
    }
  }

  // Add item to form
  const addItemToForm = () => {
    if (!itemForm.productId || itemForm.quantity <= 0 || itemForm.unitCost <= 0) {
      showToast('error', 'Please fill in all item details')
      return
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...itemForm }]
    }))

    setItemForm({ productId: '', quantity: 1, unitCost: 0 })
  }

  // Remove item from form
  const removeItemFromForm = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      supplierId: '',
      expectedDate: '',
      taxAmount: 0,
      shippingCost: 0,
      notes: '',
      items: []
    })
    setItemForm({ productId: '', quantity: 1, unitCost: 0 })
    setSelectedOrder(null)
  }

  // Open edit modal
  const openEditModal = (order: PurchaseOrderResponseDTO) => {
    setSelectedOrder(order)
    setFormData({
      supplierId: order.supplierId,
      expectedDate: order.expectedDate ? order.expectedDate.toISOString().split('T')[0] : '',
      taxAmount: order.taxAmount,
      shippingCost: order.shippingCost,
      notes: order.notes || '',
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost
      }))
    })
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading Purchase Orders...</p>
        </div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">{dataError}</p>
          <Button onClick={loadData} variant="primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Orders</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage supplier orders and inventory procurement</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus size={18} />
          Create Order
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Package className="text-blue-500" size={24} />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Orders</p>
                <p className="text-2xl font-bold">{summary.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="text-yellow-500" size={24} />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold">{summary.ordered}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Received</p>
                <p className="text-2xl font-bold">{summary.received}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="text-purple-500" size={24} />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending Value</p>
                <p className="text-2xl font-bold">${summary.pendingValue.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by PO number or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Purchase Orders Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Expected Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status]
              const StatusIcon = statusConfig.icon

              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.poNumber}</TableCell>
                  <TableCell>{order.supplier.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.color as any} className="flex items-center gap-1 w-fit">
                      <StatusIcon size={14} />
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {order.status === 'draft' && (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => openEditModal(order)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleStatusChange(order, 'ordered')}
                          >
                            <Truck size={14} />
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteOrder(order)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                      {order.status === 'ordered' && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowReceiveModal(true)
                          }}
                        >
                          <CheckCircle size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No purchase orders found
          </div>
        )}
      </Card>

      {/* Create Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Create Purchase Order"
        size="lg"
      >
        <div className="space-y-4">
          {/* Supplier Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Supplier</label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          {/* Expected Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Expected Delivery Date</label>
            <Input
              type="date"
              value={formData.expectedDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedDate: e.target.value }))}
            />
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium mb-2">Items</label>
            <div className="space-y-2">
              {formData.items.map((item, index) => {
                const product = products.find(p => p.id === item.productId)
                return (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1">{product?.name || 'Unknown Product'}</span>
                    <span>Qty: {item.quantity}</span>
                    <span>${item.unitCost.toFixed(2)}</span>
                    <Button
                      variant="danger"
                      onClick={() => removeItemFromForm(index)}
                    >
                      <XCircle size={14} />
                    </Button>
                  </div>
                )
              })}
            </div>

            {/* Add Item Form */}
            <div className="flex gap-2 mt-2">
              <select
                value={itemForm.productId}
                onChange={(e) => setItemForm(prev => ({ ...prev, productId: e.target.value }))}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Qty"
                value={itemForm.quantity}
                onChange={(e) => setItemForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                className="w-20"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Unit Cost"
                value={itemForm.unitCost}
                onChange={(e) => setItemForm(prev => ({ ...prev, unitCost: Number(e.target.value) }))}
                className="w-24"
              />
              <Button onClick={addItemToForm}>Add</Button>
            </div>
          </div>

          {/* Tax and Shipping */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tax Amount</label>
              <Input
                type="number"
                step="0.01"
                value={formData.taxAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, taxAmount: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Shipping Cost</label>
              <Input
                type="number"
                step="0.01"
                value={formData.shippingCost}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
              rows={3}
            />
          </div>

          {/* Total */}
          <div className="text-right">
            <p className="text-lg font-bold">
              Total: ${calculateTotal(formData.items, formData.taxAmount, formData.shippingCost).toFixed(2)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateOrder}>
              Create Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          resetForm()
        }}
        title="Edit Purchase Order"
        size="lg"
      >
        {/* Similar content to create modal but for editing */}
        <div className="space-y-4">
          <p>Edit modal content would be similar to create modal</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateOrder}>
              Update Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Receive Order Modal */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => {
          setShowReceiveModal(false)
          setSelectedOrder(null)
        }}
        title="Receive Purchase Order"
      >
        <div className="space-y-4">
          <p>Are you sure you want to mark this purchase order as received? This will update the inventory.</p>
          {selectedOrder && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded">
              <p><strong>PO Number:</strong> {selectedOrder.poNumber}</p>
              <p><strong>Supplier:</strong> {selectedOrder.supplier.name}</p>
              <p><strong>Total Amount:</strong> ${selectedOrder.totalAmount.toFixed(2)}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowReceiveModal(false)
                setSelectedOrder(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReceiveOrder}>
              Receive Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
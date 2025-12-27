/**
 * Suppliers Management Component
 *
 * Features:
 * - Supplier CRUD operations
 * - Product-supplier relationships
 * - Purchase order tracking
 * - Supplier performance metrics
 */

import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Edit, Trash2, Package, DollarSign, ShoppingCart, Users } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'
import { ipc } from '../../../utils/ipc'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table'
import Badge from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import type { SupplierResponseDTO, CreateSupplierDTO, UpdateSupplierDTO } from '../../../../../shared/dtos/supplier.dto'

interface SupplierFormData {
  name: string
  contactName: string
  email: string
  phone: string
  address: string
  paymentTerms: string
  notes: string
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<SupplierResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierResponseDTO | null>(null)
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: '',
    notes: ''
  })

  const toast = useToast()

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const result = await ipc.suppliers.getAll({
        search: searchQuery || undefined,
        pageSize: 100 // Load all for now
      })

      if (result.success) {
        setSuppliers(result.data.data)
      } else {
        toast.error(`Failed to load suppliers: ${result.message}`)
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
      toast.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [searchQuery])

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [suppliers, searchQuery])

  // Handle create supplier
  const handleCreateSupplier = async () => {
    try {
      const createData: CreateSupplierDTO = {
        name: formData.name.trim(),
        contactName: formData.contactName.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        paymentTerms: formData.paymentTerms.trim() || undefined,
        notes: formData.notes.trim() || undefined
      }

      const result = await ipc.suppliers.create(createData)

      if (result.success) {
        toast.success('Supplier created successfully')
        setShowCreateModal(false)
        resetForm()
        loadSuppliers()
      } else {
        toast.error(`Failed to create supplier: ${result.message}`)
      }
    } catch (error) {
      console.error('Error creating supplier:', error)
      toast.error('Failed to create supplier')
    }
  }

  // Handle update supplier
  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return

    try {
      const updateData: UpdateSupplierDTO = {
        name: formData.name.trim(),
        contactName: formData.contactName.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        paymentTerms: formData.paymentTerms.trim() || undefined,
        notes: formData.notes.trim() || undefined
      }

      const result = await ipc.suppliers.update(editingSupplier.id, updateData)

      if (result.success) {
        toast.success('Supplier updated successfully')
        setShowEditModal(false)
        setEditingSupplier(null)
        resetForm()
        loadSuppliers()
      } else {
        toast.error(`Failed to update supplier: ${result.message}`)
      }
    } catch (error) {
      console.error('Error updating supplier:', error)
      toast.error('Failed to update supplier')
    }
  }

  // Handle delete supplier
  const handleDeleteSupplier = async (supplier: SupplierResponseDTO) => {
    if (!confirm(`Are you sure you want to deactivate ${supplier.name}? This will mark them as inactive.`)) {
      return
    }

    try {
      const result = await ipc.suppliers.update(supplier.id, { isActive: false })

      if (result.success) {
        toast.success('Supplier deactivated successfully')
        loadSuppliers()
      } else {
        toast.error(`Failed to deactivate supplier: ${result.message}`)
      }
    } catch (error) {
      console.error('Error deactivating supplier:', error)
      toast.error('Failed to deactivate supplier')
    }
  }

  // Open edit modal
  const openEditModal = (supplier: SupplierResponseDTO) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      paymentTerms: supplier.paymentTerms || '',
      notes: supplier.notes || ''
    })
    setShowEditModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      paymentTerms: '',
      notes: ''
    })
  }

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeSuppliers = suppliers.filter(s => s.isActive)
    const totalPurchaseOrders = suppliers.reduce((sum, s) => sum + s.totalPurchaseOrders, 0)
    const totalPurchased = suppliers.reduce((sum, s) => sum + s.totalPurchased, 0)

    return {
      totalSuppliers: suppliers.length,
      activeSuppliers: activeSuppliers.length,
      totalPurchaseOrders,
      totalPurchased
    }
  }, [suppliers])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading suppliers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Supplier Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage suppliers and their product relationships
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Add Supplier
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Suppliers</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.totalSuppliers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="text-green-600 dark:text-green-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Suppliers</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.activeSuppliers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <ShoppingCart className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Purchase Orders</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.totalPurchaseOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <DollarSign className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Purchased</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${metrics.totalPurchased.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            type="search"
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Purchase Orders</TableHead>
              <TableHead>Total Purchased</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {supplier.name}
                    </div>
                    {supplier.paymentTerms && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {supplier.paymentTerms}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {supplier.contactName && (
                      <div className="font-medium">{supplier.contactName}</div>
                    )}
                    {supplier.email && (
                      <div className="text-slate-500 dark:text-slate-400">{supplier.email}</div>
                    )}
                    {supplier.phone && (
                      <div className="text-slate-500 dark:text-slate-400">{supplier.phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {supplier.productCount} products
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {supplier.totalPurchaseOrders} orders
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    ${supplier.totalPurchased.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={supplier.isActive ? 'success' : 'secondary'}>
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                     
                      variant="secondary"
                      onClick={() => openEditModal(supplier)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                     
                      variant="secondary"
                      onClick={() => handleDeleteSupplier(supplier)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No suppliers found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery ? 'Try adjusting your search terms.' : 'Get started by adding your first supplier.'}
            </p>
          </div>
        )}
      </Card>

      {/* Create Supplier Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Add New Supplier"
      >
        <div className="space-y-4">
          <Input
            label="Supplier Name *"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter supplier name"
            required
          />

          <Input
            label="Contact Name"
            value={formData.contactName}
            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
            placeholder="Enter contact person name"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="supplier@example.com"
            />

            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Enter supplier address"
          />

          <Input
            label="Payment Terms"
            value={formData.paymentTerms}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
            placeholder="e.g., Net 30, Net 60"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this supplier"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSupplier}
              disabled={!formData.name.trim()}
            >
              Create Supplier
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingSupplier(null)
          resetForm()
        }}
        title="Edit Supplier"
      >
        <div className="space-y-4">
          <Input
            label="Supplier Name *"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter supplier name"
            required
          />

          <Input
            label="Contact Name"
            value={formData.contactName}
            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
            placeholder="Enter contact person name"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="supplier@example.com"
            />

            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Enter supplier address"
          />

          <Input
            label="Payment Terms"
            value={formData.paymentTerms}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
            placeholder="e.g., Net 30, Net 60"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this supplier"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false)
                setEditingSupplier(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSupplier}
              disabled={!formData.name.trim()}
            >
              Update Supplier
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
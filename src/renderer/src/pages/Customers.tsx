import { useState, useEffect } from 'react'
import { Plus, Search, Mail, Phone, Heart, Edit2, Trash2, TrendingUp, DollarSign, ShoppingCart, Download, FileSpreadsheet, FileText, User } from 'lucide-react'
import Modal from '../components/ui/Modal'
import SmartDeleteDialog from '../components/SmartDeleteDialog'
import { ipc } from '../utils/ipc'
import { useToast } from '../contexts/ToastContext'
import { formatCurrency } from '@renderer/utils/formatNumber'

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  loyaltyTier: string
  totalSpent: number
  purchaseCount?: number
  createdAt?: string
  updatedAt?: string
}

export default function Customers(): JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(100)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    loyaltyTier: 'Bronze' as 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  })
  
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Delete dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteCheckResult, setDeleteCheckResult] = useState<any>(null)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadCustomers()
  }, [page, pageSize, debouncedSearch])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const data = await ipc.customers.getAll({
        limit: pageSize,
        offset: page * pageSize,
        searchTerm: debouncedSearch
      })
      
      setCustomers(Array.isArray(data.customers) ? data.customers : [])
      setTotalCount(data.totalCount || 0)
      setHasMore(data.hasMore || false)
      
      if (data.customers.length === 0 && page === 0 && !debouncedSearch) {
        const localCustomers = localStorage.getItem('customers')
        if (localCustomers) {
          const parsed = JSON.parse(localCustomers)
          setCustomers(parsed)
          setTotalCount(parsed.length)
        }
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
      const localCustomers = localStorage.getItem('customers')
      if (localCustomers) {
        const parsed = JSON.parse(localCustomers)
        setCustomers(parsed)
        setTotalCount(parsed.length)
        toast.warning('Using local backup data')
      }
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return false
    }
    if (formData.email.trim() && !formData.email.includes('@')) {
      toast.error('Please enter a valid email address')
      return false
    }
    if (!formData.phone.trim()) {
      toast.error('Phone is required')
      return false
    }
    return true
  }

  const handleAddCustomer = async () => {
    if (!validateForm()) return

    try {
      const customerData = {
        ...formData
        // totalSpent is automatically 0 for new customers
      }

      const result = await ipc.customers.create(customerData)
      
      if (result.success) {
        await loadCustomers()
        if (Array.isArray(customers)) {
          const updatedCustomers = [...customers, result.customer]
          localStorage.setItem('customers', JSON.stringify(updatedCustomers))
        }
        
        setShowAddModal(false)
        resetForm()
        toast.success('Customer added successfully!')
      } else {
        toast.error(result.message || 'Failed to add customer')
        if (result.existingCustomer) {
          toast.info(`Existing customer: ${result.existingCustomer.name}`)
        }
      }
    } catch (error: any) {
      console.error('Error adding customer:', error)
      toast.error(error?.message || 'Failed to add customer')
    }
  }

  const handleEditCustomer = async () => {
    if (!validateForm() || !selectedCustomer) return

    try {
      const result = await ipc.customers.update(selectedCustomer.id, formData)
      
      if (result.success) {
        await loadCustomers()
        setShowEditModal(false)
        resetForm()
        setSelectedCustomer(null)
        toast.success('Customer updated successfully!')
      } else {
        toast.error(result.message || 'Failed to update customer')
        if (result.existingCustomer) {
          toast.info(`Phone already used by: ${result.existingCustomer.name}`)
        }
      }
    } catch (error: any) {
      console.error('Error updating customer:', error)
      toast.error(error?.message || 'Failed to update customer')
    }
  }

  const handleDeleteCustomer = async (id: string, customer: Customer) => {
    try {
      // Check if customer can be deleted
      const result = await window.electron.ipcRenderer.invoke('delete:check-customer', {
        customerId: id
      })
      
      if (result.success) {
        setCustomerToDelete(customer)
        setDeleteCheckResult(result.data)
        setShowDeleteDialog(true)
      } else {
        toast.error('Failed to check customer dependencies')
      }
    } catch (error) {
      console.error('Failed to check customer:', error)
      toast.error('Failed to check customer')
    }
  }
  
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return
    
    try {
      const result = await window.electron.ipcRenderer.invoke('delete:hard-delete-customer', {
        customerId: customerToDelete.id
      })
      
      if (result.success) {
        toast.success('Customer deleted successfully')
        await loadCustomers()
      } else {
        toast.error(result.error || 'Failed to delete customer')
      }
    } catch (error) {
      console.error('Failed to delete customer:', error)
      toast.error('Failed to delete customer')
    }
  }
  
  const handleArchiveCustomer = async (reason?: string) => {
    if (!customerToDelete) return
    
    try {
      const result = await window.electron.ipcRenderer.invoke('delete:archive-customer', {
        customerId: customerToDelete.id,
        archivedBy: 'current-user', // TODO: Get from auth context
        reason
      })
      
      if (result.success) {
        toast.success('Customer archived successfully')
        await loadCustomers()
      } else {
        toast.error('Failed to archive customer')
      }
    } catch (error) {
      console.error('Failed to archive customer:', error)
      toast.error('Failed to archive customer')
    }
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      loyaltyTier: customer.loyaltyTier as 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
    })
    setShowEditModal(true)
  }

  const openHistoryModal = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowHistoryModal(true)
    setLoadingHistory(true)
    
    try {
      const history = await ipc.customers.getPurchaseHistory(customer.id)
      setSelectedCustomerHistory(history)
    } catch (error) {
      console.error('Failed to load purchase history:', error)
      toast.error('Failed to load purchase history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      loyaltyTier: 'Bronze'
    })
  }

  const handleExport = async (format: 'excel' | 'csv' | 'vcf') => {
    try {
      toast.info(`Exporting customers as ${format.toUpperCase()}...`)
      
      const result = await window.electron.ipcRenderer.invoke('customers:export', {
        format,
        searchTerm: debouncedSearch // Export only filtered customers if search is active
      })

      if (result.success) {
        // Create download link
        const blob = new Blob([result.data], { 
          type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                format === 'csv' ? 'text/csv' : 'text/vcard'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast.success(`Exported ${result.count} customers successfully!`)
      } else {
        toast.error(result.message || 'Failed to export customers')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export customers')
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'from-slate-600 to-slate-800'
      case 'Gold': return 'from-amber-500 to-amber-600'
      case 'Silver': return 'from-slate-400 to-slate-500'
      default: return 'from-amber-700 to-amber-800'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Platinum': return '💎'
      case 'Gold': return '👑'
      case 'Silver': return '⭐'
      default: return '🥉'
    }
  }

  // Stats calculations
  const totalRevenue = Array.isArray(customers) ? customers.reduce((sum, c) => sum + c.totalSpent, 0) : 0
  const averageSpent = totalCount > 0 ? totalRevenue / totalCount : 0
  
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = page * pageSize + 1
  const endIndex = Math.min((page + 1) * pageSize, totalCount)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r bg-clip-text">
            Customer Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage customer relationships and loyalty</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative group">
            <button className="btn-secondary flex items-center gap-2">
              <Download size={20} />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 rounded-t-lg"
              >
                <FileSpreadsheet size={18} className="text-green-600" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <FileText size={18} className="text-blue-600" />
                <span>CSV (.csv)</span>
              </button>
              <button
                onClick={() => handleExport('vcf')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 rounded-b-lg"
              >
                <User size={18} className="text-purple-600" />
                <span>vCard (.vcf)</span>
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Customers</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart size={24} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1" title={`$${totalRevenue.toFixed(2)}`}>
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <DollarSign size={24} className="text-success" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Average Spent</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1" title={`$${averageSpent.toFixed(2)}`}>
                {formatCurrency(averageSpent)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp size={24} className="text-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Controls */}
      <div className="glass-card p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(0)
              }}
              className="input-field w-24"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
        
        {/* Pagination Info */}
        {totalCount > 0 && (
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>
              Showing {startIndex} to {endIndex} of {totalCount} customers
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                First
              </button>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={!hasMore}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Heart size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {debouncedSearch ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {debouncedSearch ? 'Try a different search term' : 'Get started by adding your first customer'}
          </p>
          {!debouncedSearch && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={20} className="inline mr-2" />
              Add Customer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div key={customer.id} className="glass-card p-6 relative overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getTierColor(customer.loyaltyTier)} opacity-10 rounded-bl-full`}></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-2">
                    {customer.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-gradient-to-r ${getTierColor(customer.loyaltyTier)} text-white flex items-center gap-1 shrink-0`}>
                    <span>{getTierIcon(customer.loyaltyTier)}</span>
                    {customer.loyaltyTier}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Mail size={16} className="shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Phone size={16} className="shrink-0" />
                    {customer.phone}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Total Spent</p>
                      <p className="text-2xl font-bold text-primary" title={`$${customer.totalSpent.toFixed(2)}`}>
                        {formatCurrency(customer.totalSpent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Purchases</p>
                      <p className="text-2xl font-bold text-success">{customer.purchaseCount || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => openHistoryModal(customer)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors"
                    title="View purchase history"
                  >
                    <TrendingUp size={16} />
                    <span className="text-xs">History</span>
                  </button>
                  <button
                    onClick={() => openEditModal(customer)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                    <span className="text-xs">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id, customer)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete customer"
                  >
                    <Trash2 size={16} />
                    <span className="text-xs">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Add New Customer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email <span className="text-slate-400 text-xs">(optional)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Loyalty Tier
            </label>
            <select
              value={formData.loyaltyTier}
              onChange={(e) => setFormData({ ...formData, loyaltyTier: e.target.value as any })}
              className="input-field"
            >
              <option value="Bronze">🥉 Bronze</option>
              <option value="Silver">⭐ Silver</option>
              <option value="Gold">👑 Gold</option>
              <option value="Platinum">💎 Platinum</option>
            </select>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Tier can be upgraded based on total purchases
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button onClick={handleAddCustomer} className="btn-primary">
              Add Customer
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          resetForm()
          setSelectedCustomer(null)
        }}
        title="Edit Customer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email <span className="text-slate-400 text-xs">(optional)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Loyalty Tier
            </label>
            <select
              value={formData.loyaltyTier}
              onChange={(e) => setFormData({ ...formData, loyaltyTier: e.target.value as any })}
              className="input-field"
            >
              <option value="Bronze">🥉 Bronze</option>
              <option value="Silver">⭐ Silver</option>
              <option value="Gold">👑 Gold</option>
              <option value="Platinum">💎 Platinum</option>
            </select>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Note: Total Spent is automatically calculated from purchases
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setShowEditModal(false)
                resetForm()
                setSelectedCustomer(null)
              }}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button onClick={handleEditCustomer} className="btn-primary">
              Update Customer
            </button>
          </div>
        </div>
      </Modal>

      {/* Purchase History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false)
          setSelectedCustomer(null)
          setSelectedCustomerHistory([])
        }}
        title={`Purchase History - ${selectedCustomer?.name}`}
      >
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading purchase history...</p>
            </div>
          ) : selectedCustomerHistory.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No purchases yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedCustomerHistory.map((transaction: any) => (
                <div key={transaction.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      transaction.status === 'completed' 
                        ? 'bg-success/20 text-success'
                        : 'bg-error/20 text-error'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    {transaction.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          ${item.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-600 flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {transaction.paymentMethod.toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      ${transaction.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Purchases</p>
              <p className="text-2xl font-bold text-primary" title={`$${selectedCustomer?.totalSpent.toFixed(2) || '0.00'}`}>
                {selectedCustomer ? formatCurrency(selectedCustomer.totalSpent) : '$0.00'}
              </p>
            </div>
            <button
              onClick={() => {
                setShowHistoryModal(false)
                setSelectedCustomer(null)
                setSelectedCustomerHistory([])
              }}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Smart Delete Dialog */}
      <SmartDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setCustomerToDelete(null)
          setDeleteCheckResult(null)
        }}
        entityType="customer"
        entityName={customerToDelete?.name || ''}
        checkResult={deleteCheckResult}
        onDelete={handleConfirmDelete}
        onArchive={handleArchiveCustomer}
      />
    </div>
  )
}

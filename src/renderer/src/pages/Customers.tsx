import { useState, useEffect } from 'react'
import { Plus, Search, Mail, Phone, Heart, Edit2, Trash2, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { ipc } from '../utils/ipc'
import { useToast } from '../contexts/ToastContext'

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

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const data = await ipc.customers.getAll()
      setCustomers(data)
      
      if (data.length === 0) {
        const localCustomers = localStorage.getItem('customers')
        if (localCustomers) {
          setCustomers(JSON.parse(localCustomers))
        }
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
      const localCustomers = localStorage.getItem('customers')
      if (localCustomers) {
        setCustomers(JSON.parse(localCustomers))
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
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Valid email is required')
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
        const updatedCustomers = [...customers, result.customer]
        localStorage.setItem('customers', JSON.stringify(updatedCustomers))
        
        setShowAddModal(false)
        resetForm()
        toast.success('Customer added successfully!')
      } else {
        // Fallback to localStorage
        const newCustomer = {
          id: Date.now().toString(),
          ...customerData,
          createdAt: new Date().toISOString()
        }
        const updatedCustomers = [...customers, newCustomer]
        setCustomers(updatedCustomers)
        localStorage.setItem('customers', JSON.stringify(updatedCustomers))
        
        setShowAddModal(false)
        resetForm()
        toast.warning('Customer saved locally - database unavailable')
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      toast.error('Failed to add customer')
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
        toast.error('Failed to update customer')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('Failed to update customer')
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const result = await ipc.customers.delete(id)
      if (result.success) {
        await loadCustomers()
        toast.success('Customer deleted successfully!')
      } else {
        toast.error('Failed to delete customer')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Failed to delete customer')
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

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  )

  const totalCustomers = customers.length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r bg-clip-text">
            Customer Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage customer relationships and loyalty</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Customers</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalCustomers}</p>
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
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                ${totalRevenue.toFixed(2)}
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
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                ${averageSpent.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp size={24} className="text-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="flex gap-4">
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
        </div>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Heart size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {searchQuery ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchQuery ? 'Try a different search term' : 'Get started by adding your first customer'}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={20} className="inline mr-2" />
              Add Customer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
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
                      <p className="text-2xl font-bold text-primary">${customer.totalSpent.toFixed(2)}</p>
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
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg transition-colors"
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
                Email *
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
                Email *
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
              <p className="text-2xl font-bold text-primary">
                ${selectedCustomer?.totalSpent.toFixed(2) || '0.00'}
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
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Plus, Store, MapPin, Phone, Clock, Settings, ArrowRightLeft, Edit2, Trash2, X } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { ipc } from '../utils/ipc'

type StoreType = {
  id: string
  name: string
  location: string
  phone: string
  hours: string
  manager: string
  status: string
}

export default function Stores(): JSX.Element {
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    hours: '',
    manager: '',
    status: 'active'
  })

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      setLoading(true)
      const data = await ipc.stores.getAll()
      setStores(data)
    } catch (error) {
      console.error('Failed to load stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      phone: '',
      hours: '',
      manager: '',
      status: 'active'
    })
  }

  const handleAddStore = async () => {
    try {
      const result = await ipc.stores.create(formData)
      if (result.success) {
        await loadStores()
        setShowAddModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to add store:', error)
      alert('Failed to add store. Please try again.')
    }
  }

  const handleEditStore = async () => {
    if (!selectedStore) return
    
    try {
      const result = await ipc.stores.update(selectedStore.id, formData)
      if (result.success) {
        await loadStores()
        setShowEditModal(false)
        setSelectedStore(null)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to update store:', error)
      alert('Failed to update store. Please try again.')
    }
  }

  const handleDeleteStore = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store?')) return
    
    try {
      const result = await ipc.stores.delete(id)
      if (result.success) {
        await loadStores()
      }
    } catch (error) {
      console.error('Failed to delete store:', error)
      alert('Failed to delete store. Please try again.')
    }
  }

  const handleToggleStatus = async (store: StoreType) => {
    const newStatus = store.status === 'active' ? 'inactive' : 'active'
    try {
      const result = await ipc.stores.update(store.id, { ...store, status: newStatus })
      if (result.success) {
        await loadStores()
      }
    } catch (error) {
      console.error('Failed to toggle store status:', error)
      alert('Failed to toggle store status. Please try again.')
    }
  }

  const openEditModal = (store: StoreType) => {
    setSelectedStore(store)
    setFormData({
      name: store.name,
      location: store.location,
      phone: store.phone,
      hours: store.hours,
      manager: store.manager,
      status: store.status
    })
    setShowEditModal(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Store Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your store locations and settings</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Store
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading stores...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Store size={48} className="mx-auto mb-4 text-slate-400 opacity-50" />
            <p className="text-slate-600 dark:text-slate-400">No stores yet. Add your first store!</p>
          </div>
        ) : (
          stores.map((store) => (
            <div key={store.id} className="glass-card glass-card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Store className="text-primary" size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${store.status === 'active' ? 'bg-success/10 text-success' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                  {store.status}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{store.name}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                  <MapPin size={16} />
                  {store.location}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                  <Phone size={16} />
                  {store.phone}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                  <Clock size={16} />
                  {store.hours}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Manager: {store.manager}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(store)}
                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                    title="Edit store"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(store)}
                    className={`p-2 rounded-lg transition-colors ${
                      store.status === 'active' 
                        ? 'hover:bg-error/10 text-error' 
                        : 'hover:bg-success/10 text-success'
                    }`}
                    title={store.status === 'active' ? 'Deactivate store' : 'Activate store'}
                  >
                    <ArrowRightLeft size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteStore(store.id)}
                    className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors"
                    title="Delete store"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Store Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }} 
        title="Add New Store"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field w-full"
              placeholder="Enter store name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input-field w-full"
              placeholder="Enter address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field w-full"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Hours
            </label>
            <input
              type="text"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              className="input-field w-full"
              placeholder="9 AM - 9 PM"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Manager
            </label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="input-field w-full"
              placeholder="Manager name"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddStore}
              className="btn-primary flex-1"
            >
              Add Store
            </button>
            <button
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Store Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false)
          setSelectedStore(null)
          resetForm()
        }} 
        title="Edit Store"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field w-full"
              placeholder="Enter store name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input-field w-full"
              placeholder="Enter address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field w-full"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Hours
            </label>
            <input
              type="text"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              className="input-field w-full"
              placeholder="9 AM - 9 PM"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Manager
            </label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="input-field w-full"
              placeholder="Manager name"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleEditStore}
              className="btn-primary flex-1"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setShowEditModal(false)
                setSelectedStore(null)
                resetForm()
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

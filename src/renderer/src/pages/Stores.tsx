import { useState } from 'react'
import { Plus, Store, MapPin, Phone, Clock, Settings, ArrowRightLeft } from 'lucide-react'
import Modal from '../components/ui/Modal'

type StoreType = {
  id: string
  name: string
  location: string
  phone: string
  hours: string
  manager: string
  status: 'active' | 'inactive'
}

export default function Stores(): JSX.Element {
  const [stores, setStores] = useState<StoreType[]>([
    { id: '1', name: 'Main Store', location: '123 Main St, Downtown', phone: '(555) 123-4567', hours: '9 AM - 9 PM', manager: 'John Doe', status: 'active' },
    { id: '2', name: 'North Branch', location: '456 North Ave', phone: '(555) 234-5678', hours: '10 AM - 8 PM', manager: 'Jane Smith', status: 'active' },
    { id: '3', name: 'Mall Location', location: 'City Mall, Floor 2', phone: '(555) 345-6789', hours: '10 AM - 10 PM', manager: 'Mike Johnson', status: 'inactive' },
  ])
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStore, setNewStore] = useState({
    name: '',
    location: '',
    phone: '',
    hours: '',
    manager: ''
  })

  const handleAddStore = () => {
    const store: StoreType = {
      id: (stores.length + 1).toString(),
      ...newStore,
      status: 'active'
    }
    setStores([...stores, store])
    setShowAddModal(false)
    setNewStore({ name: '', location: '', phone: '', hours: '', manager: '' })
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
        {stores.map((store) => (
          <div key={store.id} className="glass-card glass-card-hover p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Store className="text-primary" size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${store.status === 'active' ? 'bg-success/10 text-success' : 'bg-slate-200 dark:bg-slate-700'}`}>
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
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <Settings size={18} className="text-slate-600 dark:text-slate-400" />
                </button>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <ArrowRightLeft size={18} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Store Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Store">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={newStore.name}
              onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
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
              value={newStore.location}
              onChange={(e) => setNewStore({ ...newStore, location: e.target.value })}
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
              value={newStore.phone}
              onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
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
              value={newStore.hours}
              onChange={(e) => setNewStore({ ...newStore, hours: e.target.value })}
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
              value={newStore.manager}
              onChange={(e) => setNewStore({ ...newStore, manager: e.target.value })}
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
              onClick={() => setShowAddModal(false)}
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

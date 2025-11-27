import { useState, useEffect } from 'react'
import { Plus, Users, Clock, Award, Mail, Phone, Edit2, Trash2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { ipc } from '../utils/ipc'
import { useToast } from '../contexts/ToastContext'

type Employee = {
  id: string
  name: string
  role: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  salary?: number
  performance?: number
  address?: string
  hireDate?: string
}

export default function Employees(): JSX.Element {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
    salary: 0,
    performance: 0
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await ipc.employees.getAll()
      setEmployees(data)
      
      if (data.length === 0) {
        const localEmployees = localStorage.getItem('employees')
        if (localEmployees) {
          setEmployees(JSON.parse(localEmployees))
        }
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
      const localEmployees = localStorage.getItem('employees')
      if (localEmployees) {
        setEmployees(JSON.parse(localEmployees))
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
    if (!formData.role.trim()) {
      toast.error('Role is required')
      return false
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Valid email is required')
      return false
    }
    
    // Phone validation - accepts multiple formats
    if (!formData.phone.trim()) {
      toast.error('Phone number is required')
      return false
    }
    
    // Remove all non-digit characters for validation
    const digitsOnly = formData.phone.replace(/\D/g, '')
    
    // Check if we have at least 10 digits (US phone number)
    if (digitsOnly.length < 10) {
      toast.error('Phone number must be at least 10 digits')
      return false
    }
    
    if (digitsOnly.length > 15) {
      toast.error('Phone number is too long (max 15 digits)')
      return false
    }
    
    // Optional: Validate format (US format check)
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Invalid phone number format. Use formats like: (555) 123-4567, 555-123-4567, or +1-555-123-4567')
      return false
    }
    
    return true
  }

  const handleAddEmployee = async () => {
    if (!validateForm()) return

    try {
      const employeeData = {
        ...formData,
        hireDate: new Date().toISOString()
      }

      const result = await ipc.employees.create(employeeData)
      
      if (result && result.success) {
        await loadEmployees()
        setShowAddModal(false)
        resetForm()
        toast.success('Employee added successfully!')
      } else {
        // Fallback to localStorage if database fails
        console.warn('Database creation failed, using localStorage fallback')
        const newEmployee = {
          id: Date.now().toString(),
          ...employeeData,
          status: employeeData.status || 'active',
          performance: employeeData.performance || 0,
          salary: employeeData.salary || 0
        }
        const updatedEmployees = [...employees, newEmployee]
        setEmployees(updatedEmployees)
        localStorage.setItem('employees', JSON.stringify(updatedEmployees))
        
        setShowAddModal(false)
        resetForm()
        toast.warning('Employee saved locally (database unavailable). Will sync when database is available.')
      }
    } catch (error) {
      console.error('Error adding employee:', error)
      
      // Try localStorage fallback
      try {
        const newEmployee = {
          id: Date.now().toString(),
          ...formData,
          hireDate: new Date().toISOString(),
          status: formData.status || 'active',
          performance: formData.performance || 0
        }
        const updatedEmployees = [...employees, newEmployee]
        setEmployees(updatedEmployees)
        localStorage.setItem('employees', JSON.stringify(updatedEmployees))
        
        setShowAddModal(false)
        resetForm()
        toast.warning('Employee saved locally only (database error). Data will be temporary.')
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        toast.error('Failed to add employee. Please try again or contact support.')
      }
    }
  }

  const handleEditEmployee = async () => {
    if (!validateForm() || !selectedEmployee) return

    try {
  const result = await ipc.employees.update(selectedEmployee.id, { employeeData: formData })
      
      if (result.success) {
        await loadEmployees()
        setShowEditModal(false)
        resetForm()
        setSelectedEmployee(null)
        toast.success('Employee updated successfully!')
      } else {
        toast.error('Failed to update employee')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      toast.error('Failed to update employee')
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      const result = await ipc.employees.delete(id)
      if (result.success) {
        await loadEmployees()
        toast.success('Employee deleted successfully!')
      } else {
        toast.error('Failed to delete employee')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('Failed to delete employee')
    }
  }

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({
      name: employee.name,
      role: employee.role,
      email: employee.email,
      phone: employee.phone,
      address: employee.address || '',
      status: employee.status,
      salary: employee.salary || 0,
      performance: employee.performance || 0
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
      salary: 0,
      performance: 0
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r  bg-clip-text">
            Employee Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your team and track performance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Employee
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading employees...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No employees yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Get started by adding your first employee</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={20} className="inline mr-2" />
            Add Employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <div key={emp.id} className="glass-card p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{emp.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{emp.role}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Mail size={16} className="shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Phone size={16} className="shrink-0" />
                  {emp.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock size={16} className="shrink-0" />
                  <span className="font-medium">Salary:</span>
                  <span className="ml-1">{emp.salary !== undefined ? `$${Number(emp.salary).toFixed(2)}` : '—'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                {emp.performance !== undefined ? (
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-accent" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {emp.performance}%
                    </span>
                  </div>
                ) : (
                  <div></div>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  emp.status === 'active' 
                    ? 'bg-success/10 text-success border border-success/20' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {emp.status}
                </span>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => openEditModal(emp)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEmployee(emp.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Add New Employee"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Role / Position *
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input-field"
                placeholder="e.g., Manager, Cashier, Sales Associate"
              />
            </div>
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
                placeholder="employee@example.com"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Salary (monthly)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="input-field"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              placeholder="123 Main St, City, State"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Performance (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.performance}
                onChange={(e) => setFormData({ ...formData, performance: Number(e.target.value) })}
                className="input-field"
                placeholder="85"
              />
            </div>
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
            <button onClick={handleAddEmployee} className="btn-primary">
              Add Employee
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          resetForm()
          setSelectedEmployee(null)
        }}
        title="Edit Employee"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Role / Position *
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input-field"
                placeholder="e.g., Manager, Cashier, Sales Associate"
              />
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Salary (monthly)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="input-field"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Performance (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.performance}
                onChange={(e) => setFormData({ ...formData, performance: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setShowEditModal(false)
                resetForm()
                setSelectedEmployee(null)
              }}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button onClick={handleEditEmployee} className="btn-primary">
              Update Employee
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { FileText, Download, TrendingUp, DollarSign, Package, Users, Calendar, Filter, X } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useToast } from '../contexts/ToastContext'

type Report = {
  id: string
  title: string
  category: 'Sales' | 'Inventory' | 'Financial' | 'Customer'
  description: string
  icon: 'trending' | 'dollar' | 'package' | 'users'
  lastGenerated: string
}

export default function Reports(): JSX.Element {
  const toast = useToast()
  const [reports] = useState<Report[]>([
    { id: '1', title: 'Daily Sales Report', category: 'Sales', description: 'Comprehensive daily sales analysis with trends', icon: 'trending', lastGenerated: '2024-01-16' },
    { id: '2', title: 'Financial Summary', category: 'Financial', description: 'Income, expenses, and profit margins', icon: 'dollar', lastGenerated: '2024-01-15' },
    { id: '3', title: 'Inventory Status', category: 'Inventory', description: 'Stock levels, low stock alerts, and reorder points', icon: 'package', lastGenerated: '2024-01-16' },
    { id: '4', title: 'Customer Analytics', category: 'Customer', description: 'Customer behavior, loyalty, and retention metrics', icon: 'users', lastGenerated: '2024-01-14' },
  ])

  // Custom Report Modal State
  const [showCustomReportModal, setShowCustomReportModal] = useState(false)
  const [customReportForm, setCustomReportForm] = useState({
    title: '',
    reportType: 'Sales' as 'Sales' | 'Inventory' | 'Financial' | 'Customer',
    dateFrom: '',
    dateTo: '',
    includeDetails: true,
    exportFormat: 'PDF' as 'PDF' | 'Excel' | 'CSV',
    filters: {
      category: '',
      store: '',
      employee: ''
    }
  })

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'trending': return <TrendingUp size={24} />
      case 'dollar': return <DollarSign size={24} />
      case 'package': return <Package size={24} />
      case 'users': return <Users size={24} />
      default: return <FileText size={24} />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Sales': return 'from-primary to-primary/80'
      case 'Financial': return 'from-success to-success/80'
      case 'Inventory': return 'from-accent to-accent/80'
      case 'Customer': return 'from-secondary to-secondary/80'
      default: return 'from-slate-500 to-slate-600'
    }
  }

  const handleDownload = (reportId: string): void => {
    const report = reports.find((r) => r.id === reportId)
    if (report) {
      toast.success(`Generating ${report.title}...`)
      // Simulate download
      setTimeout(() => {
        toast.info(`${report.title} downloaded successfully`)
      }, 1500)
    }
  }

  const validateCustomReport = (): boolean => {
    if (!customReportForm.title.trim()) {
      toast.error('Please enter a report title')
      return false
    }

    if (!customReportForm.dateFrom || !customReportForm.dateTo) {
      toast.error('Please select both start and end dates')
      return false
    }

    const fromDate = new Date(customReportForm.dateFrom)
    const toDate = new Date(customReportForm.dateTo)

    if (fromDate > toDate) {
      toast.error('Start date cannot be after end date')
      return false
    }

    return true
  }

  const handleGenerateCustomReport = (): void => {
    if (!validateCustomReport()) return

    // Generate report
    const reportData = {
      ...customReportForm,
      generatedAt: new Date().toISOString(),
      id: Date.now().toString()
    }

    console.log('Generating custom report:', reportData)
    toast.info('Generating report...')

    // Simulate report generation
    setTimeout(() => {
      toast.success(`${customReportForm.exportFormat} report "${customReportForm.title}" generated successfully!`)
      setShowCustomReportModal(false)
      resetCustomReportForm()
    }, 2000)
  }

  const resetCustomReportForm = (): void => {
    setCustomReportForm({
      title: '',
      reportType: 'Sales',
      dateFrom: '',
      dateTo: '',
      includeDetails: true,
      exportFormat: 'PDF',
      filters: {
        category: '',
        store: '',
        employee: ''
      }
    })
  }

  const handleCloseModal = (): void => {
    setShowCustomReportModal(false)
    resetCustomReportForm()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Generate and export business insights</p>
        </div>
        <button 
          onClick={() => setShowCustomReportModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FileText size={20} />
          Custom Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="glass-card p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCategoryColor(report.category)} flex items-center justify-center text-white`}>
                {getIcon(report.icon)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{report.title}</h3>
                    <span className="inline-block px-2 py-1 mt-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                      {report.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {report.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Last generated: {report.lastGenerated}
                  </span>
                  <button 
                    onClick={() => handleDownload(report.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Download size={16} />
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Quick Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">$12,450</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Today's Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success mb-1">156</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Orders Today</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-1">32</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Low Stock Items</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary mb-1">89</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">New Customers</div>
          </div>
        </div>
      </div>

      {/* Custom Report Modal */}
      <Modal isOpen={showCustomReportModal} onClose={handleCloseModal}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Custom Report</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Configure and generate a custom report</p>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Report Title */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Report Title *
            </label>
            <input
              type="text"
              value={customReportForm.title}
              onChange={(e) => setCustomReportForm({ ...customReportForm, title: e.target.value })}
              placeholder="e.g., Q1 Sales Performance"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Report Type *
            </label>
            <select
              value={customReportForm.reportType}
              onChange={(e) => setCustomReportForm({ ...customReportForm, reportType: e.target.value as any })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            >
              <option value="Sales">Sales Report</option>
              <option value="Inventory">Inventory Report</option>
              <option value="Financial">Financial Report</option>
              <option value="Customer">Customer Report</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                <Calendar size={16} className="inline mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={customReportForm.dateFrom}
                onChange={(e) => setCustomReportForm({ ...customReportForm, dateFrom: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                <Calendar size={16} className="inline mr-1" />
                End Date *
              </label>
              <input
                type="date"
                value={customReportForm.dateTo}
                onChange={(e) => setCustomReportForm({ ...customReportForm, dateTo: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Filters Section */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Optional Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={customReportForm.filters.category}
                  onChange={(e) => setCustomReportForm({ 
                    ...customReportForm, 
                    filters: { ...customReportForm.filters, category: e.target.value }
                  })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Food">Food</option>
                  <option value="Books">Books</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Store Location
                </label>
                <select
                  value={customReportForm.filters.store}
                  onChange={(e) => setCustomReportForm({ 
                    ...customReportForm, 
                    filters: { ...customReportForm.filters, store: e.target.value }
                  })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">All Stores</option>
                  <option value="Main Store">Main Store</option>
                  <option value="Downtown">Downtown</option>
                  <option value="Mall Branch">Mall Branch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Employee
                </label>
                <select
                  value={customReportForm.filters.employee}
                  onChange={(e) => setCustomReportForm({ 
                    ...customReportForm, 
                    filters: { ...customReportForm.filters, employee: e.target.value }
                  })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">All Employees</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Smith">Jane Smith</option>
                  <option value="Mike Johnson">Mike Johnson</option>
                </select>
              </div>
            </div>
          </div>

          {/* Include Details Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeDetails"
              checked={customReportForm.includeDetails}
              onChange={(e) => setCustomReportForm({ ...customReportForm, includeDetails: e.target.checked })}
              className="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="includeDetails" className="text-sm text-slate-900 dark:text-white cursor-pointer">
              Include detailed breakdown
            </label>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
              Export Format *
            </label>
            <div className="flex gap-3">
              {(['PDF', 'Excel', 'CSV'] as const).map((format) => (
                <label
                  key={format}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                    customReportForm.exportFormat === format
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format}
                    checked={customReportForm.exportFormat === format}
                    onChange={(e) => setCustomReportForm({ ...customReportForm, exportFormat: e.target.value as any })}
                    className="sr-only"
                  />
                  <FileText size={18} />
                  <span className="font-medium">{format}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCloseModal}
              className="flex-1 px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateCustomReport}
              className="flex-1 px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Generate Report
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

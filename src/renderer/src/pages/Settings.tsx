import { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Store, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  CreditCard, 
  Receipt, 
  Database,
  Globe,
  Download,
  Upload,
  Save,
  Sun,
  Moon,
  Monitor,
  Check
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'

export default function Settings(): JSX.Element {
  const { theme, setTheme, actualTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [activeTab, setActiveTab] = useState('general')
  
  // Store Settings
  const [storeName, setStoreName] = useState(() => localStorage.getItem('storeName') || 'My Store')
  const [storePhone, setStorePhone] = useState(() => localStorage.getItem('storePhone') || '')
  const [storeEmail, setStoreEmail] = useState(() => localStorage.getItem('storeEmail') || '')
  const [storeAddress, setStoreAddress] = useState(() => localStorage.getItem('storeAddress') || '')
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'USD')
  const [timezone, setTimezone] = useState(() => localStorage.getItem('timezone') || 'UTC')
  
  // Tax & Receipt
  const [taxRate, setTaxRate] = useState(() => localStorage.getItem('taxRate') || '10')
  const [receiptHeader, setReceiptHeader] = useState(() => localStorage.getItem('receiptHeader') || '')
  const [receiptFooter, setReceiptFooter] = useState(() => localStorage.getItem('receiptFooter') || 'Thank you for your business!')
  const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem('autoPrint') === 'true')
  
  // Notifications
  const [notifications, setNotifications] = useState(() => localStorage.getItem('notifications') !== 'false')
  const [lowStockAlert, setLowStockAlert] = useState(() => localStorage.getItem('lowStockAlert') || '10')
  const [salesNotifications, setSalesNotifications] = useState(() => localStorage.getItem('salesNotifications') !== 'false')
  const [emailNotifications, setEmailNotifications] = useState(() => localStorage.getItem('emailNotifications') !== 'false')
  
  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState(() => {
    const stored = localStorage.getItem('paymentMethods')
    return stored ? JSON.parse(stored) : {
      cash: true,
      credit: true,
      debit: true,
      mobile: true,
      giftCard: true
    }
  })
  
  // User Profile
  const [firstName, setFirstName] = useState(() => localStorage.getItem('firstName') || 'Admin')
  const [lastName, setLastName] = useState(() => localStorage.getItem('lastName') || 'User')
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || 'admin@example.com')
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem('userPhone') || '')
  
  // Backup
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem('autoBackup') !== 'false')
  
  const [saveSuccess, setSaveSuccess] = useState(false)

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'store', name: 'Store Info', icon: Store },
    { id: 'user', name: 'User Profile', icon: User },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'tax', name: 'Tax & Receipt', icon: Receipt },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'backup', name: 'Backup', icon: Database },
  ]

  const handleSave = () => {
    // Save all settings to localStorage
    localStorage.setItem('storeName', storeName)
    localStorage.setItem('storePhone', storePhone)
    localStorage.setItem('storeEmail', storeEmail)
    localStorage.setItem('storeAddress', storeAddress)
    localStorage.setItem('currency', currency)
    localStorage.setItem('timezone', timezone)
    localStorage.setItem('taxRate', taxRate)
    localStorage.setItem('receiptHeader', receiptHeader)
    localStorage.setItem('receiptFooter', receiptFooter)
    localStorage.setItem('autoPrint', autoPrint.toString())
    localStorage.setItem('notifications', notifications.toString())
    localStorage.setItem('lowStockAlert', lowStockAlert)
    localStorage.setItem('salesNotifications', salesNotifications.toString())
    localStorage.setItem('emailNotifications', emailNotifications.toString())
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods))
    localStorage.setItem('firstName', firstName)
    localStorage.setItem('lastName', lastName)
    localStorage.setItem('userEmail', userEmail)
    localStorage.setItem('userPhone', userPhone)
    localStorage.setItem('autoBackup', autoBackup.toString())
    
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods((prev: any) => ({
      ...prev,
      [method]: !prev[method]
    }))
  }

  const handleBackup = () => {
    const data = {
      settings: {
        storeName, storePhone, storeEmail, storeAddress, currency,
        language, timezone, taxRate, receiptHeader, receiptFooter,
        autoPrint, notifications, lowStockAlert, salesNotifications,
        emailNotifications, paymentMethods, autoBackup
      },
      products: JSON.parse(localStorage.getItem('products') || '[]'),
      stores: JSON.parse(localStorage.getItem('stores') || '[]'),
      employees: JSON.parse(localStorage.getItem('employees') || '[]'),
      customers: JSON.parse(localStorage.getItem('customers') || '[]')
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `saleselectron-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        
        // Restore settings
        if (data.settings) {
          Object.entries(data.settings).forEach(([key, value]) => {
            localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
          })
        }
        
        // Restore data
        if (data.products) localStorage.setItem('products', JSON.stringify(data.products))
        if (data.stores) localStorage.setItem('stores', JSON.stringify(data.stores))
        if (data.employees) localStorage.setItem('employees', JSON.stringify(data.employees))
        if (data.customers) localStorage.setItem('customers', JSON.stringify(data.customers))
        
        alert('Backup restored successfully! Please refresh the page.')
        window.location.reload()
      } catch (error) {
        alert('Failed to restore backup. Invalid file format.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your application preferences</p>
        </div>
        <button 
          onClick={handleSave} 
          className={`btn-primary flex items-center gap-2 transition-all ${
            saveSuccess ? 'bg-success hover:bg-success' : ''
          }`}
        >
          {saveSuccess ? <Check size={20} /> : <Save size={20} />}
          {saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 glass-card p-4 space-y-2 h-fit sticky top-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <tab.icon size={20} />
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 glass-card p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                  General Settings
                </h2>
                
                {/* Theme Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    <Palette className="inline mr-2" size={18} />
                    Appearance Theme
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Light Theme */}
                    <button
                      onClick={() => setTheme('light')}
                      className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                        theme === 'light'
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                      }`}
                    >
                      <Sun className={`mx-auto mb-3 ${theme === 'light' ? 'text-primary' : 'text-slate-400'}`} size={32} />
                      <div className="text-center">
                        <div className="font-semibold text-slate-900 dark:text-white">Light</div>
                        <div className="text-xs text-slate-500 mt-1">Bright & clear</div>
                      </div>
                      {theme === 'light' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>

                    {/* Dark Theme */}
                    <button
                      onClick={() => setTheme('dark')}
                      className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                        theme === 'dark'
                          ? 'border-secondary bg-secondary/5 shadow-lg shadow-secondary/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-secondary/50'
                      }`}
                    >
                      <Moon className={`mx-auto mb-3 ${theme === 'dark' ? 'text-secondary' : 'text-slate-400'}`} size={32} />
                      <div className="text-center">
                        <div className="font-semibold text-slate-900 dark:text-white">Dark</div>
                        <div className="text-xs text-slate-500 mt-1">Easy on eyes</div>
                      </div>
                      {theme === 'dark' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>

                    {/* Auto Theme */}
                    <button
                      onClick={() => setTheme('auto')}
                      className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                        theme === 'auto'
                          ? 'border-accent bg-accent/5 shadow-lg shadow-accent/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-accent/50'
                      }`}
                    >
                      <Monitor className={`mx-auto mb-3 ${theme === 'auto' ? 'text-accent' : 'text-slate-400'}`} size={32} />
                      <div className="text-center">
                        <div className="font-semibold text-slate-900 dark:text-white">Auto</div>
                        <div className="text-xs text-slate-500 mt-1">System default</div>
                      </div>
                      {theme === 'auto' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 mt-3">
                    Current: <span className="font-semibold text-primary capitalize">{actualTheme}</span> mode
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <Globe className="inline mr-2" size={18} />
                      Language
                    </label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="input-field w-full"
                    >
                      <option value="en">English</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="fr">Français (French)</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="zh">中文 (Chinese)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      {language === 'ar' && 'سيتم تطبيق التغييرات على الفور'}
                      {language === 'zh' && '更改将立即应用'}
                      {language === 'fr' && 'Les modifications seront appliquées immédiatement'}
                      {language === 'es' && 'Los cambios se aplicarán inmediatamente'}
                      {language === 'en' && 'Changes will be applied immediately'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Time Zone
                    </label>
                    <select 
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="UTC">UTC (GMT+0:00)</option>
                      <option value="EST">EST (GMT-5:00)</option>
                      <option value="PST">PST (GMT-8:00)</option>
                      <option value="CET">CET (GMT+1:00)</option>
                      <option value="JST">JST (GMT+9:00)</option>
                      <option value="AEST">AEST (GMT+10:00)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'store' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                Store Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Store Name
                  </label>
                  <input 
                    type="text" 
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="input-field w-full" 
                    placeholder="My Awesome Store"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input 
                      type="tel" 
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="input-field w-full" 
                      placeholder="+1 (555) 123-4567" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input 
                      type="email" 
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      className="input-field w-full" 
                      placeholder="store@example.com" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Address
                  </label>
                  <textarea 
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="input-field w-full" 
                    rows={3} 
                    placeholder="123 Main Street, City, State, ZIP" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Currency
                  </label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                Payment Methods
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Enable or disable payment methods available at checkout
              </p>
              <div className="space-y-3">
                {[
                  { key: 'cash', name: 'Cash', color: 'success' },
                  { key: 'credit', name: 'Credit Card', color: 'primary' },
                  { key: 'debit', name: 'Debit Card', color: 'secondary' },
                  { key: 'mobile', name: 'Mobile Payment', color: 'accent' },
                  { key: 'giftCard', name: 'Gift Card', color: 'error' }
                ].map(({ key, name, color }) => (
                  <div key={key} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    paymentMethods[key]
                      ? `border-${color} bg-${color}/5`
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${color} to-${color}/70 flex items-center justify-center`}>
                        <CreditCard size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{name}</div>
                        <div className="text-xs text-slate-500">
                          {paymentMethods[key] ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={paymentMethods[key]}
                        onChange={() => togglePaymentMethod(key)}
                        className="sr-only peer" 
                      />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                Tax & Receipt Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Default Tax Rate (%)
                  </label>
                  <input 
                    type="number" 
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="input-field w-full" 
                    placeholder="10"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Applied to all sales unless specified otherwise</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Receipt Header
                  </label>
                  <textarea 
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    className="input-field w-full" 
                    rows={3} 
                    placeholder="Your store name and address..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Receipt Footer
                  </label>
                  <textarea 
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    className="input-field w-full" 
                    rows={2} 
                    placeholder="Thank you for your business!"
                  />
                </div>
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="auto-print" 
                    checked={autoPrint}
                    onChange={(e) => setAutoPrint(e.target.checked)}
                    className="w-5 h-5 text-primary rounded focus:ring-primary" 
                  />
                  <label htmlFor="auto-print" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Auto-print receipt after sale
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                Notification Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell size={18} className="text-primary" />
                      Enable Notifications
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Receive alerts and updates</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Sales Notifications</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Get notified of new sales</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={salesNotifications}
                      onChange={(e) => setSalesNotifications(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secondary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-secondary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Email Notifications</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Receive updates via email</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-accent"></div>
                  </label>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Low Stock Alert Threshold
                  </label>
                  <input 
                    type="number" 
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(e.target.value)}
                    className="input-field w-full" 
                    placeholder="10"
                    min="0"
                  />
                  <p className="text-sm text-slate-500 mt-2">Alert when stock falls below this number</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Password
                  </label>
                  <input type="password" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <input type="password" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <input type="password" className="input-field w-full" />
                </div>
                <button className="btn-primary">Update Password</button>
                
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Two-Factor Authentication</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Add an extra layer of security</div>
                    </div>
                    <button className="btn-secondary">Enable</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                Backup & Restore
              </h2>
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl hover:shadow-lg hover:shadow-primary/10 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                      <Database size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">Database Backup</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Create a backup of all your data including products, sales, customers, and settings.
                      </p>
                      <button 
                        onClick={handleBackup}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Download size={18} />
                        Create Backup Now
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-2 border-secondary/30 rounded-xl hover:shadow-lg hover:shadow-secondary/10 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center flex-shrink-0">
                      <Upload size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">Restore from Backup</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Restore your data from a previous backup file. This will overwrite current data.
                      </p>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        className="hidden"
                        id="restore-backup"
                      />
                      <label 
                        htmlFor="restore-backup"
                        className="btn-secondary flex items-center gap-2 cursor-pointer inline-flex"
                      >
                        <Upload size={18} />
                        Choose Backup File
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-6 mt-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Monitor size={20} className="text-accent" />
                    Automatic Backups
                  </h3>
                  <div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                    <input 
                      type="checkbox" 
                      id="auto-backup" 
                      checked={autoBackup}
                      onChange={(e) => setAutoBackup(e.target.checked)}
                      className="w-5 h-5 text-accent rounded focus:ring-accent" 
                    />
                    <label htmlFor="auto-backup" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Enable automatic daily backups at 2:00 AM
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'user' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                User Profile
              </h2>
              <div className="flex items-center gap-6 mb-8 p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{firstName} {lastName}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{userEmail}</p>
                  <button className="btn-secondary mt-3">
                    <Upload size={16} className="inline mr-2" />
                    Change Photo
                  </button>
                  <p className="text-xs text-slate-500 mt-2">JPG, PNG or GIF. Max 2MB</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      First Name
                    </label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Last Name
                    </label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input-field w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input 
                    type="email" 
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Phone
                  </label>
                  <input 
                    type="tel" 
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="input-field w-full" 
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Role
                  </label>
                  <div className="input-field w-full bg-slate-100 dark:bg-slate-800 cursor-not-allowed">
                    <span className="px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-sm font-semibold">
                      Administrator
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Contact system administrator to change role</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

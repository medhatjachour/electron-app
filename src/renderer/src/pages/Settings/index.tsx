/**
 * Settings Page - Refactored
 * Clean, modular architecture with separated settings panels
 */

import { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  CreditCard, 
  Receipt, 
  Database,
  Save,
  Monitor,
  Tag,
  Users,
  Archive
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { useDisplaySettings as useDisplaySettingsContext } from '../../contexts/DisplaySettingsContext'
import { useSettings } from './useSettings'
import GeneralSettings from './GeneralSettings'
import DisplaySettings from './DisplaySettings'
import CategorySettings from './CategorySettings'
import UserManagementSettings from './UserManagementSettings'
import PaymentMethodsSettings from './PaymentMethodsSettings'
import TaxReceiptSettings from './TaxReceiptSettings'
import NotificationsSettings from './NotificationsSettings'
import BackupSettings from './BackupSettings'
import ArchiveManagementSettings from './ArchiveManagementSettings'
import type { SettingsTab } from './types'

export default function Settings() {
  const { theme, setTheme, actualTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { updateSettings: updateDisplaySettingsContext } = useDisplaySettingsContext()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const {
    taxReceiptSettings,
    setTaxReceiptSettings,
    notificationSettings,
    setNotificationSettings,
    paymentMethods,
    setPaymentMethods,
    backupSettings,
    setBackupSettings,
    displaySettings,
    setDisplaySettings,
    saveSettings
  } = useSettings()
  
  // Sync display settings with DisplaySettingsContext
  const handleDisplaySettingsChange = (newSettings: typeof displaySettings) => {
    setDisplaySettings(newSettings)
    updateDisplaySettingsContext(newSettings)
  }

  const tabs = [
    { id: 'general' as SettingsTab, name: 'General', icon: SettingsIcon },
    { id: 'display' as SettingsTab, name: 'Display', icon: Monitor },
    { id: 'categories' as SettingsTab, name: 'Categories', icon: Tag },
    { id: 'users' as SettingsTab, name: 'User Management', icon: Users },
    { id: 'payments' as SettingsTab, name: 'Payments', icon: CreditCard },
    { id: 'tax' as SettingsTab, name: 'Tax & Receipt', icon: Receipt },
    { id: 'notifications' as SettingsTab, name: 'Notifications', icon: Bell },
    { id: 'backup' as SettingsTab, name: 'Backup', icon: Database },
    { id: 'archive' as SettingsTab, name: 'Archive', icon: Archive },
  ]

  const handleSave = () => {
    const success = saveSettings()
    if (success) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  return (
    <div className="p-6 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your application preferences and configuration
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>

      {/* Save Success Message */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
            Settings saved successfully!
          </p>
        </div>
      )}

      {/* Tabs and Content */}
      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          {activeTab === 'general' && (
            <GeneralSettings
              theme={theme}
              onThemeChange={(theme: 'light' | 'dark' | 'system') => setTheme(theme as any)}
              actualTheme={actualTheme}
              language={language}
              onLanguageChange={setLanguage}
            />
          )}

          {activeTab === 'display' && (
            <DisplaySettings
              settings={displaySettings}
              onChange={handleDisplaySettingsChange}
            />
          )}

          {activeTab === 'categories' && (
            <CategorySettings />
          )}

       

          {activeTab === 'users' && (
            <UserManagementSettings />
          )}

          {activeTab === 'payments' && (
            <PaymentMethodsSettings
              settings={paymentMethods}
              onChange={setPaymentMethods}
            />
          )}

          {activeTab === 'tax' && (
            <TaxReceiptSettings
              settings={taxReceiptSettings}
              onChange={setTaxReceiptSettings}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsSettings
              settings={notificationSettings}
              onChange={setNotificationSettings}
            />
          )}

          {activeTab === 'backup' && (
            <BackupSettings
              settings={backupSettings}
              onChange={setBackupSettings}
            />
          )}

          {activeTab === 'archive' && (
            <ArchiveManagementSettings />
          )}
        </div>
      </div>
    </div>
  )
}

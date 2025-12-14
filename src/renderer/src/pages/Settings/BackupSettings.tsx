/**
 * Backup Settings Panel
 */

import { Database, Download, Upload, HardDrive } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import type { BackupSettings } from './types'

type Props = {
  settings: BackupSettings
  onChange: (settings: BackupSettings) => void
}

export default function BackupSettingsPanel({ settings, onChange }: Props) {
  const { t } = useLanguage()
  const handleChange = (field: keyof BackupSettings, value: boolean | string | number) => {
    onChange({ ...settings, [field]: value })
  }

  const handleBackup = () => {
    alert('Backup functionality will be implemented')
    // TODO: Implement backup via IPC
  }

  const handleRestore = () => {
    alert('Restore functionality will be implemented')
    // TODO: Implement restore via IPC
  }

  const handleSelectLocation = () => {
    alert('Folder selection dialog will be implemented')
    // TODO: Implement folder selection via Electron dialog
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {t('backupAndRestore')}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {t('manageBackupRestore')}
        </p>
      </div>

      {/* Manual Backup/Restore */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
            <Database size={20} />
          </div>
          <h4 className="font-semibold text-slate-900 dark:text-white">{t('manualBackup')}</h4>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('createBackupProtect')}
        </p>

        <div className="flex gap-3">
          <button onClick={handleBackup} className="btn-primary flex items-center gap-2">
            <Download size={18} />
            {t('createBackupNow')}
          </button>
          <button onClick={handleRestore} className="btn-secondary flex items-center gap-2">
            <Upload size={18} />
            {t('restoreFromBackup')}
          </button>
        </div>
      </div>

      {/* Automatic Backup */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/20 text-success rounded-lg flex items-center justify-center">
              <HardDrive size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">{t('automaticBackup')}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('scheduleRegularBackups')}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleChange('autoBackup', !settings.autoBackup)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoBackup ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.autoBackup && (
          <div className="space-y-4">
            {/* Backup Frequency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('backupFrequency')}
              </label>
              <select
                className="input-field"
                value={settings.backupFrequency}
                onChange={(e) => handleChange('backupFrequency', e.target.value)}
              >
                <option value="daily">{t('daily')}</option>
                <option value="weekly">{t('weekly')}</option>
                <option value="monthly">{t('monthly')}</option>
              </select>
            </div>

            {/* Backup Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('backupLocation')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field flex-1"
                  value={settings.backupLocation || t('defaultLocation')}
                  onChange={(e) => handleChange('backupLocation', e.target.value)}
                  placeholder={t('selectBackupFolder')}
                  readOnly
                />
                <button onClick={handleSelectLocation} className="btn-secondary px-4">
                  {t('browse')}
                </button>
              </div>
            </div>

            {/* Keep Backups */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('numberOfBackupsToKeep')}
              </label>
              <input
                type="number"
                className="input-field max-w-xs"
                value={settings.keepBackups}
                onChange={(e) => handleChange('keepBackups', parseInt(e.target.value) || 7)}
                min="1"
                max="30"
              />
              <p className="text-xs text-slate-500">
                {t('olderBackupsDeleted')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="glass-card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h5 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">{t('importantNotes')}</h5>
        <ul className="text-sm text-blue-900 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>{t('backupsIncludeAllData')}</li>
          <li>{t('storeBackupsSafely')}</li>
          <li>{t('testBackupsRegularly')}</li>
          <li>{t('databaseLockedDuringBackup')}</li>
        </ul>
      </div>
    </div>
  )
}

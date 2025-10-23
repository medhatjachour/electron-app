/**
 * Security Settings Panel
 */

import { Lock, Shield, Clock } from 'lucide-react'
import { useState } from 'react'
import type { SecuritySettings } from './types'

type Props = {
  settings: SecuritySettings
  onChange: (settings: SecuritySettings) => void
}

export default function SecuritySettingsPanel({ settings, onChange }: Props) {
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof SecuritySettings, value: string | boolean | number) => {
    setError(null)
    onChange({ ...settings, [field]: value })
  }

  const handlePasswordChange = () => {
    if (!settings.currentPassword) {
      setError('Current password is required')
      return
    }
    if (!settings.newPassword || settings.newPassword.length < 4) {
      setError('New password must be at least 4 characters')
      return
    }
    if (settings.newPassword !== settings.confirmPassword) {
      setError("Passwords don't match")
      return
    }
    // TODO: Implement password change via IPC
    setError(null)
    alert('Password change functionality will be implemented')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Security Settings
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Manage your account security and authentication options
        </p>
      </div>

      {/* Change Password */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
            <Lock size={20} />
          </div>
          <h4 className="font-semibold text-slate-900 dark:text-white">Change Password</h4>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Current Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="input-field"
              value={settings.currentPassword || ''}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              New Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="input-field"
              value={settings.newPassword || ''}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              placeholder="Enter new password (min 4 characters)"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm New Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="input-field"
              value={settings.confirmPassword || ''}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Show passwords</span>
          </label>

          <button onClick={handlePasswordChange} className="btn-primary">
            Update Password
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/20 text-success rounded-lg flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Two-Factor Authentication</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <button
            onClick={() => handleChange('twoFactorEnabled', !settings.twoFactorEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.twoFactorEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {settings.twoFactorEnabled && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Two-factor authentication setup will be completed in a future update.
            </p>
          </div>
        )}
      </div>

      {/* Session Timeout */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-accent/20 text-accent rounded-lg flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">Session Timeout</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Automatically log out after period of inactivity
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Timeout Duration (minutes)
          </label>
          <input
            type="number"
            className="input-field max-w-xs"
            value={settings.sessionTimeout}
            onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value) || 30)}
            min="5"
            max="1440"
            step="5"
          />
          <p className="text-xs text-slate-500">
            Between 5 minutes and 24 hours (1440 minutes)
          </p>
        </div>
      </div>
    </div>
  )
}

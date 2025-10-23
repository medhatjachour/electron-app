/**
 * User Profile Settings Panel
 */

import type { UserProfileSettings } from './types'

type Props = {
  settings: UserProfileSettings
  onChange: (settings: UserProfileSettings) => void
}

export default function UserProfileSettings({ settings, onChange }: Props) {
  const handleChange = (field: keyof UserProfileSettings, value: string) => {
    onChange({ ...settings, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          User Profile
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Manage your personal information and account details
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            First Name *
          </label>
          <input
            type="text"
            className="input-field"
            value={settings.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Enter first name"
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Last Name *
          </label>
          <input
            type="text"
            className="input-field"
            value={settings.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Enter last name"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email Address *
          </label>
          <input
            type="email"
            className="input-field"
            value={settings.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="your.email@example.com"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Phone Number
          </label>
          <input
            type="tel"
            className="input-field"
            value={settings.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      {/* Avatar URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Avatar URL (Optional)
        </label>
        <input
          type="url"
          className="input-field"
          value={settings.avatar || ''}
          onChange={(e) => handleChange('avatar', e.target.value)}
          placeholder="https://example.com/avatar.jpg"
        />
        <p className="text-xs text-slate-500">
          Enter a URL to your profile picture
        </p>
      </div>
    </div>
  )
}

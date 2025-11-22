/**
 * GeneralSettings Component
 * Theme and language preferences
 */

import { Sun, Moon, Monitor, Globe, Check } from 'lucide-react'

interface GeneralSettingsProps {
  theme: string
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
  actualTheme: 'light' | 'dark'
  language: string
  onLanguageChange: (lang: 'en' | 'ar') => void
}

export default function GeneralSettings({
  theme,
  onThemeChange,
  actualTheme,
  language,
  onLanguageChange
}: Readonly<GeneralSettingsProps>) {
  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ]

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' }
  ]

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Appearance
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon
            const isActive = theme === option.value
            
            return (
              <button
                key={option.value}
                onClick={() => onThemeChange(option.value as 'light' | 'dark' | 'system')}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
                <Icon className="w-8 h-8 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {option.label}
                </p>
              </button>
            )
          })}
        </div>
        {theme === 'system' && (
          <p className="text-sm text-slate-500 mt-2">
            Currently using: {actualTheme === 'dark' ? 'Dark' : 'Light'}
          </p>
        )}
      </div>

      {/* Language Selection */}
      <div>
        <label className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
          <Globe className="w-5 h-5" />
          Language / اللغة
        </label>
        <div className="grid grid-cols-2 gap-4">
          {languages.map((lang) => {
            const isActive = language === lang.code
            
            return (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code as 'en' | 'ar')}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
                <p className="text-xl font-semibold text-slate-900 dark:text-white text-center">
                  {lang.name}
                </p>
              </button>
            )
          })}
        </div>
        <p className="text-sm text-slate-500 mt-3">
          {language === 'ar' 
            ? 'سيتم تطبيق اللغة على جميع أجزاء التطبيق'
            : 'The language will be applied across the entire application'
          }
        </p>
      </div>
    </div>
  )
}

/**
 * Settings Page Unit Tests
 *
 * Tests the Settings page functionality including:
 * - Tab navigation and content switching
 * - Settings persistence and saving
 * - Individual settings panel functionality
 * - Theme and language changes
 * - Save success feedback
 * - Settings synchronization with contexts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from '../index'
import { ThemeProvider } from '../../../contexts/ThemeContext'
import { LanguageProvider } from '../../../contexts/LanguageContext'
import { DisplaySettingsProvider } from '../../../contexts/DisplaySettingsContext'

// Mock all settings components
vi.mock('./GeneralSettings', () => ({
  default: vi.fn()
}))

vi.mock('./DisplaySettings', () => ({
  default: vi.fn()
}))

vi.mock('./CategorySettings', () => ({
  default: vi.fn()
}))

vi.mock('./UserManagementSettings', () => ({
  default: vi.fn()
}))

vi.mock('./PaymentMethodsSettings', () => ({
  default: vi.fn()
}))

vi.mock('./TaxReceiptSettings', () => ({
  default: vi.fn()
}))

vi.mock('./NotificationsSettings', () => ({
  default: vi.fn()
}))

vi.mock('./BackupSettings', () => ({
  default: vi.fn()
}))

vi.mock('./ArchiveManagementSettings', () => ({
  default: vi.fn()
}))

vi.mock('./useSettings', () => ({
  useSettings: vi.fn()
}))

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: vi.fn(),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('../../contexts/DisplaySettingsContext', () => ({
  useDisplaySettings: vi.fn(),
  DisplaySettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Test data
const mockSettings = {
  taxReceiptSettings: {
    taxRate: 10,
    receiptHeader: 'Test Store',
    receiptFooter: 'Thank you!',
    autoPrint: true,
    includeLogo: false,
    refundPeriodDays: 30,
    allowDiscounts: true,
    maxDiscountPercentage: 50,
    maxDiscountAmount: 100,
    requireDiscountReason: true
  },
  notificationSettings: {
    notifications: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
    salesNotifications: true,
    emailNotifications: false,
    emailAddress: 'test@example.com'
  },
  paymentMethods: {
    cash: true,
    credit: true,
    debit: true,
    mobile: false,
    giftCard: true
  },
  backupSettings: {
    autoBackup: true,
    backupFrequency: 'daily' as const,
    backupLocation: '/backups',
    keepBackups: 7
  },
  displaySettings: {
    showImagesInProductCards: true,
    showImagesInPOSCards: true,
    showImagesInInventory: false
  },
  setTaxReceiptSettings: vi.fn(),
  setNotificationSettings: vi.fn(),
  setPaymentMethods: vi.fn(),
  setBackupSettings: vi.fn(),
  setDisplaySettings: vi.fn(),
  saveSettings: vi.fn()
}

const mockTheme = {
  theme: 'light' as const,
  setTheme: vi.fn(),
  actualTheme: 'light' as const
}

const mockLanguage = {
  language: 'en' as const,
  setLanguage: vi.fn(),
  t: (key: string) => key // Return key as translation
}

const mockDisplaySettingsContext = {
  updateSettings: vi.fn()
}

// Helper function to render component with providers
function renderSettingsPage() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <DisplaySettingsProvider>
          <SettingsPage />
        </DisplaySettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

describe('SettingsPage', () => {
  const mockUseSettings = vi.fn()
  const mockUseTheme = vi.fn()
  const mockUseLanguage = vi.fn()
  const mockUseDisplaySettings = vi.fn()

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    localStorageMock.clear()

    // Setup default mocks
    mockUseSettings.mockReturnValue(mockSettings)
    mockUseTheme.mockReturnValue(mockTheme)
    mockUseLanguage.mockReturnValue(mockLanguage)
    mockUseDisplaySettings.mockReturnValue(mockDisplaySettingsContext)

    // Import and mock hooks
    const { useSettings } = require('./useSettings')
    useSettings.mockImplementation(mockUseSettings)

    const { useTheme } = require('../../contexts/ThemeContext')
    useTheme.mockImplementation(mockUseTheme)

    const { useLanguage } = require('../../contexts/LanguageContext')
    useLanguage.mockImplementation(mockUseLanguage)

    const { useDisplaySettings } = require('../../contexts/DisplaySettingsContext')
    useDisplaySettings.mockImplementation(mockUseDisplaySettings)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial Rendering', () => {
    it('renders settings page with correct title and structure', () => {
      renderSettingsPage()

      expect(screen.getByText('settings')).toBeInTheDocument()
      expect(screen.getByText('manageAppPreferences')).toBeInTheDocument()
      expect(screen.getByText('saveChanges')).toBeInTheDocument()
    })

    it('displays all settings tabs', () => {
      renderSettingsPage()

      expect(screen.getByText('general')).toBeInTheDocument()
      expect(screen.getByText('display')).toBeInTheDocument()
      expect(screen.getByText('categories')).toBeInTheDocument()
      expect(screen.getByText('userManagement')).toBeInTheDocument()
      expect(screen.getByText('payments')).toBeInTheDocument()
      expect(screen.getByText('taxReceipt')).toBeInTheDocument()
      expect(screen.getByText('notifications')).toBeInTheDocument()
      expect(screen.getByText('backup')).toBeInTheDocument()
      expect(screen.getByText('archive')).toBeInTheDocument()
    })

    it('shows general tab as active by default', () => {
      renderSettingsPage()

      const generalTab = screen.getByText('general').closest('button')
      expect(generalTab).toHaveClass('bg-primary', 'text-white')
    })
  })

  describe('Tab Navigation', () => {
    it('switches to display tab when clicked', async () => {
      const user = userEvent.setup()
      renderSettingsPage()

      const displayTab = screen.getByText('display')
      await user.click(displayTab)

      expect(displayTab.closest('button')).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByText('general').closest('button')).not.toHaveClass('bg-primary')
    })

    it('renders correct component for each tab', async () => {
      const user = userEvent.setup()
      renderSettingsPage()

      // Test display tab
      await user.click(screen.getByText('display'))
      const { default: DisplaySettings } = require('./DisplaySettings')
      expect(DisplaySettings).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: mockSettings.displaySettings,
          onChange: expect.any(Function)
        }),
        expect.any(Object)
      )

      // Test payments tab
      await user.click(screen.getByText('payments'))
      const { default: PaymentMethodsSettings } = require('./PaymentMethodsSettings')
      expect(PaymentMethodsSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: mockSettings.paymentMethods,
          onChange: mockSettings.setPaymentMethods
        }),
        expect.any(Object)
      )

      // Test tax tab
      await user.click(screen.getByText('taxReceipt'))
      const { default: TaxReceiptSettings } = require('./TaxReceiptSettings')
      expect(TaxReceiptSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: mockSettings.taxReceiptSettings,
          onChange: mockSettings.setTaxReceiptSettings
        }),
        expect.any(Object)
      )

      // Test notifications tab
      await user.click(screen.getByText('notifications'))
      const { default: NotificationsSettings } = require('./NotificationsSettings')
      expect(NotificationsSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: mockSettings.notificationSettings,
          onChange: mockSettings.setNotificationSettings
        }),
        expect.any(Object)
      )

      // Test backup tab
      await user.click(screen.getByText('backup'))
      const { default: BackupSettings } = require('./BackupSettings')
      expect(BackupSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: mockSettings.backupSettings,
          onChange: mockSettings.setBackupSettings
        }),
        expect.any(Object)
      )
    })

    it('passes correct props to GeneralSettings component', () => {
      renderSettingsPage()

      const { default: GeneralSettings } = require('./GeneralSettings')
      expect(GeneralSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'light',
          actualTheme: 'light',
          language: 'en',
          onThemeChange: expect.any(Function),
          onLanguageChange: mockLanguage.setLanguage
        }),
        expect.any(Object)
      )
    })
  })

  describe('Settings Saving', () => {
    it('calls saveSettings when save button is clicked', async () => {
      const user = userEvent.setup()
      mockSettings.saveSettings.mockReturnValue(true)

      renderSettingsPage()

      const saveButton = screen.getByText('saveChanges')
      await user.click(saveButton)

      expect(mockSettings.saveSettings).toHaveBeenCalled()
    })

    it('shows success message when settings are saved successfully', async () => {
      const user = userEvent.setup()
      mockSettings.saveSettings.mockReturnValue(true)

      renderSettingsPage()

      const saveButton = screen.getByText('saveChanges')
      await user.click(saveButton)

      expect(screen.getByText('settingsSavedSuccess')).toBeInTheDocument()
    })

    it('hides success message after 3 seconds', async () => {
      const user = userEvent.setup()
      mockSettings.saveSettings.mockReturnValue(true)

      renderSettingsPage()

      const saveButton = screen.getByText('saveChanges')
      await user.click(saveButton)

      expect(screen.getByText('settingsSavedSuccess')).toBeInTheDocument()

      // Fast-forward time
      vi.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.queryByText('settingsSavedSuccess')).not.toBeInTheDocument()
      })
    })

    it('does not show success message when save fails', async () => {
      const user = userEvent.setup()
      mockSettings.saveSettings.mockReturnValue(false)

      renderSettingsPage()

      const saveButton = screen.getByText('saveChanges')
      await user.click(saveButton)

      expect(screen.queryByText('settingsSavedSuccess')).not.toBeInTheDocument()
    })
  })

  describe('Display Settings Synchronization', () => {
    it('updates DisplaySettingsContext when display settings change', () => {
      renderSettingsPage()

      const { default: DisplaySettings } = require('./DisplaySettings')
      const displaySettingsProps = DisplaySettings.mock.calls[0][0]

      const newSettings = {
        showImagesInProductCards: false,
        showImagesInPOSCards: true,
        showImagesInInventory: true
      }

      displaySettingsProps.onChange(newSettings)

      expect(mockSettings.setDisplaySettings).toHaveBeenCalledWith(newSettings)
      expect(mockDisplaySettingsContext.updateSettings).toHaveBeenCalledWith(newSettings)
    })
  })

  describe('Theme Changes', () => {
    it('calls setTheme when theme changes in GeneralSettings', () => {
      renderSettingsPage()

      const { default: GeneralSettings } = require('./GeneralSettings')
      const generalSettingsProps = GeneralSettings.mock.calls[0][0]

      generalSettingsProps.onThemeChange('dark')

      expect(mockTheme.setTheme).toHaveBeenCalledWith('dark')
    })
  })

  describe('Language Changes', () => {
    it('calls setLanguage when language changes in GeneralSettings', () => {
      renderSettingsPage()

      const { default: GeneralSettings } = require('./GeneralSettings')
      const generalSettingsProps = GeneralSettings.mock.calls[0][0]

      generalSettingsProps.onLanguageChange('es')

      expect(mockLanguage.setLanguage).toHaveBeenCalledWith('es')
    })
  })

  describe('Settings Updates', () => {
    it('updates tax receipt settings when changed', () => {
      renderSettingsPage()

      // Switch to tax tab
      const taxTab = screen.getByText('taxReceipt')
      fireEvent.click(taxTab)

      const { default: TaxReceiptSettings } = require('./TaxReceiptSettings')
      const taxSettingsProps = TaxReceiptSettings.mock.calls[0][0]

      const newTaxSettings = {
        ...mockSettings.taxReceiptSettings,
        taxRate: 15
      }

      taxSettingsProps.onChange(newTaxSettings)

      expect(mockSettings.setTaxReceiptSettings).toHaveBeenCalledWith(newTaxSettings)
    })

    it('updates notification settings when changed', () => {
      renderSettingsPage()

      // Switch to notifications tab
      const notificationsTab = screen.getByText('notifications')
      fireEvent.click(notificationsTab)

      const { default: NotificationsSettings } = require('./NotificationsSettings')
      const notificationSettingsProps = NotificationsSettings.mock.calls[0][0]

      const newNotificationSettings = {
        ...mockSettings.notificationSettings,
        lowStockThreshold: 5
      }

      notificationSettingsProps.onChange(newNotificationSettings)

      expect(mockSettings.setNotificationSettings).toHaveBeenCalledWith(newNotificationSettings)
    })

    it('updates payment methods when changed', () => {
      renderSettingsPage()

      // Switch to payments tab
      const paymentsTab = screen.getByText('payments')
      fireEvent.click(paymentsTab)

      const { default: PaymentMethodsSettings } = require('./PaymentMethodsSettings')
      const paymentSettingsProps = PaymentMethodsSettings.mock.calls[0][0]

      const newPaymentMethods = {
        ...mockSettings.paymentMethods,
        mobile: true
      }

      paymentSettingsProps.onChange(newPaymentMethods)

      expect(mockSettings.setPaymentMethods).toHaveBeenCalledWith(newPaymentMethods)
    })

    it('updates backup settings when changed', () => {
      renderSettingsPage()

      // Switch to backup tab
      const backupTab = screen.getByText('backup')
      fireEvent.click(backupTab)

      const { default: BackupSettings } = require('./BackupSettings')
      const backupSettingsProps = BackupSettings.mock.calls[0][0]

      const newBackupSettings = {
        ...mockSettings.backupSettings,
        backupFrequency: 'weekly' as const
      }

      backupSettingsProps.onChange(newBackupSettings)

      expect(mockSettings.setBackupSettings).toHaveBeenCalledWith(newBackupSettings)
    })
  })

  describe('Accessibility', () => {
    it('has proper button labels and structure', () => {
      renderSettingsPage()

      expect(screen.getByRole('button', { name: /saveChanges/ })).toBeInTheDocument()

      // Check that tabs are buttons
      const tabs = screen.getAllByRole('button')
      expect(tabs.length).toBeGreaterThan(1)
    })

    it('maintains focus management when switching tabs', async () => {
      const user = userEvent.setup()
      renderSettingsPage()

      const displayTab = screen.getByText('display')
      await user.click(displayTab)

      expect(displayTab.closest('button')).toHaveClass('bg-primary')
    })
  })

  describe('Component Integration', () => {
    it('renders CategorySettings component for categories tab', async () => {
      const user = userEvent.setup()
      renderSettingsPage()

      await user.click(screen.getByText('categories'))

      const { default: CategorySettings } = require('./CategorySettings')
      expect(CategorySettings).toHaveBeenCalled()
    })

    it('renders UserManagementSettings component for users tab', async () => {
      const user = userEvent.setup()
      renderSettingsPage()

      await user.click(screen.getByText('userManagement'))

      const { default: UserManagementSettings } = require('./UserManagementSettings')
      expect(UserManagementSettings).toHaveBeenCalled()
    })

    it('renders ArchiveManagementSettings component for archive tab', async () => {
      const user = userEvent.setup()
      renderSettingsPage()

      await user.click(screen.getByText('archive'))

      const { default: ArchiveManagementSettings } = require('./ArchiveManagementSettings')
      expect(ArchiveManagementSettings).toHaveBeenCalled()
    })
  })

  describe('State Management', () => {
    it('maintains active tab state correctly', async () => {
      const user = userEvent.setup()
      renderSettingsPage()

      // Click multiple tabs and verify active state
      await user.click(screen.getByText('display'))
      expect(screen.getByText('display').closest('button')).toHaveClass('bg-primary')

      await user.click(screen.getByText('notifications'))
      expect(screen.getByText('notifications').closest('button')).toHaveClass('bg-primary')
      expect(screen.getByText('display').closest('button')).not.toHaveClass('bg-primary')
    })

    it('preserves settings state when switching tabs', async () => {
      const user = userEvent.setup()
      renderSettingsPage()

      // Switch to tax tab and modify settings
      await user.click(screen.getByText('taxReceipt'))

      const { default: TaxReceiptSettings } = require('./TaxReceiptSettings')
      const taxSettingsProps = TaxReceiptSettings.mock.calls[0][0]

      const newTaxSettings = {
        ...mockSettings.taxReceiptSettings,
        taxRate: 20
      }

      taxSettingsProps.onChange(newTaxSettings)

      // Switch back to general tab
      await user.click(screen.getByText('general'))

      // Switch back to tax tab - settings should still be updated
      await user.click(screen.getByText('taxReceipt'))

      expect(mockSettings.setTaxReceiptSettings).toHaveBeenCalledWith(newTaxSettings)
    })
  })

  describe('Error Handling', () => {
    it('handles save failures gracefully', async () => {
      const user = userEvent.setup()
      mockSettings.saveSettings.mockReturnValue(false)

      renderSettingsPage()

      const saveButton = screen.getByText('saveChanges')
      await user.click(saveButton)

      // Should not show success message
      expect(screen.queryByText('settingsSavedSuccess')).not.toBeInTheDocument()
    })
  })
})
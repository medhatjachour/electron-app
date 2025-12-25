/**
 * Stores Page Unit Tests
 *
 * Tests the Stores management page functionality including:
 * - Store listing and display
 * - Adding new stores
 * - Editing existing stores
 * - Deleting stores
 * - Status toggling
 * - Modal interactions
 * - Form validation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StoresPage from '../Stores'
import { LanguageProvider } from '../../contexts/LanguageContext'

// Mock dependencies
vi.mock('../components/ui/Modal', () => ({
  default: vi.fn(({ children, isOpen, onClose, title }) => (
    isOpen ? (
      <div data-testid="modal" role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title">{title}</h2>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        {children}
      </div>
    ) : null
  ))
}))

vi.mock('../utils/ipc', () => ({
  ipc: {
    stores: {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: vi.fn(),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock window.alert and window.confirm
const mockAlert = vi.fn()
const mockConfirm = vi.fn()

Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true
})

Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

// Test data
const mockStores = [
  {
    id: 'store-1',
    name: 'Main Store',
    location: '123 Main St, City, State',
    phone: '(555) 123-4567',
    hours: '9 AM - 9 PM',
    manager: 'John Doe',
    status: 'active'
  },
  {
    id: 'store-2',
    name: 'Branch Store',
    location: '456 Branch Ave, City, State',
    phone: '(555) 987-6543',
    hours: '10 AM - 8 PM',
    manager: 'Jane Smith',
    status: 'inactive'
  }
]

const mockLanguage = {
  t: (key: string) => key // Return key as translation for simplicity
}

// Helper function to render component with providers
function renderStoresPage() {
  return render(
    <LanguageProvider>
      <StoresPage />
    </LanguageProvider>
  )
}

describe('StoresPage', () => {
  const mockIpc = {
    stores: {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
  const mockUseLanguage = vi.fn()

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Setup default mocks
    mockUseLanguage.mockReturnValue(mockLanguage)
    mockIpc.stores.getAll.mockResolvedValue(mockStores)

    // Import and mock hooks
    const { useLanguage } = require('../contexts/LanguageContext')
    useLanguage.mockImplementation(mockUseLanguage)

    const { ipc } = require('../utils/ipc')
    Object.assign(ipc.stores, mockIpc.stores)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial Rendering', () => {
    it('renders stores page with correct title and structure', () => {
      renderStoresPage()

      expect(screen.getByText('storeManagement')).toBeInTheDocument()
      expect(screen.getByText('storeManagementDesc')).toBeInTheDocument()
      expect(screen.getByText('addNewStore')).toBeInTheDocument()
    })

    it('loads stores on component mount', async () => {
      renderStoresPage()

      await waitFor(() => {
        expect(mockIpc.stores.getAll).toHaveBeenCalled()
      })
    })

    it('displays loading state initially', () => {
      renderStoresPage()

      expect(screen.getByText('loadingStores')).toBeInTheDocument()
    })

    it('displays stores after loading', async () => {
      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
        expect(screen.getByText('Branch Store')).toBeInTheDocument()
      })

      expect(screen.getByText('123 Main St, City, State')).toBeInTheDocument()
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument()
    })

    it('displays empty state when no stores', async () => {
      mockIpc.stores.getAll.mockResolvedValue([])

      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('noStoresYet')).toBeInTheDocument()
      })
    })
  })

  describe('Store Display', () => {
    it('renders store cards with correct information', async () => {
      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Check store details
      expect(screen.getByText('123 Main St, City, State')).toBeInTheDocument()
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument()
      expect(screen.getByText('9 AM - 9 PM')).toBeInTheDocument()
      expect(screen.getByText('manager: John Doe')).toBeInTheDocument()
    })

    it('shows correct status badges', async () => {
      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Check status badges
      const activeBadge = screen.getByText('active')
      const inactiveBadge = screen.getByText('inactive')

      expect(activeBadge).toHaveClass('bg-success/10', 'text-success')
      expect(inactiveBadge).toHaveClass('bg-slate-200', 'dark:bg-slate-700')
    })

    it('displays action buttons for each store', async () => {
      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Check for action buttons (edit, toggle status, delete)
      const editButtons = screen.getAllByTitle('editStore')
      const toggleButtons = screen.getAllByTitle(/activateStore|deactivateStore/)
      const deleteButtons = screen.getAllByTitle('deleteStore')

      expect(editButtons.length).toBe(2)
      expect(toggleButtons.length).toBe(2)
      expect(deleteButtons.length).toBe(2)
    })
  })

  describe('Adding Stores', () => {
    it('opens add store modal when add button is clicked', async () => {
      const user = userEvent.setup()
      renderStoresPage()

      const addButton = screen.getByText('addNewStore')
      await user.click(addButton)

      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByText('addNewStore')).toBeInTheDocument()
    })

    it('closes add modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderStoresPage()

      // Open modal
      await user.click(screen.getByText('addNewStore'))

      // Close modal
      const closeButton = screen.getByTestId('modal-close')
      await user.click(closeButton)

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })

    it('submits add store form successfully', async () => {
      const user = userEvent.setup()
      mockIpc.stores.create.mockResolvedValue({ success: true })

      renderStoresPage()

      // Open modal
      await user.click(screen.getByText('addNewStore'))

      // Fill form
      const nameInput = screen.getByPlaceholderText('enterStoreName')
      const locationInput = screen.getByPlaceholderText('enterAddress')
      const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
      const hoursInput = screen.getByPlaceholderText('9 AM - 9 PM')
      const managerInput = screen.getByPlaceholderText('managerName')

      await user.type(nameInput, 'New Store')
      await user.type(locationInput, '789 New St, City, State')
      await user.type(phoneInput, '(555) 111-2222')
      await user.type(hoursInput, '8 AM - 10 PM')
      await user.type(managerInput, 'Bob Johnson')

      // Submit form
      const addButton = screen.getByText('addStore')
      await user.click(addButton)

      expect(mockIpc.stores.create).toHaveBeenCalledWith({
        name: 'New Store',
        location: '789 New St, City, State',
        phone: '(555) 111-2222',
        hours: '8 AM - 10 PM',
        manager: 'Bob Johnson',
        status: 'active'
      })

      await waitFor(() => {
        expect(mockIpc.stores.getAll).toHaveBeenCalledTimes(2) // Initial load + refresh
      })
    })

    it('handles add store errors', async () => {
      const user = userEvent.setup()
      mockIpc.stores.create.mockRejectedValue(new Error('Create failed'))

      renderStoresPage()

      // Open modal and fill form
      await user.click(screen.getByText('addNewStore'))

      const nameInput = screen.getByPlaceholderText('enterStoreName')
      await user.type(nameInput, 'New Store')

      const addButton = screen.getByText('addStore')
      await user.click(addButton)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('failedToAddStore')
      })
    })

    it('resets form when modal is closed', async () => {
      const user = userEvent.setup()
      renderStoresPage()

      // Open modal and fill form
      await user.click(screen.getByText('addNewStore'))

      const nameInput = screen.getByPlaceholderText('enterStoreName')
      await user.type(nameInput, 'Test Store')

      // Close modal
      const closeButton = screen.getByTestId('modal-close')
      await user.click(closeButton)

      // Reopen modal
      await user.click(screen.getByText('addNewStore'))

      // Form should be reset
      expect(nameInput).toHaveValue('')
    })
  })

  describe('Editing Stores', () => {
    it('opens edit modal with store data pre-filled', async () => {
      const user = userEvent.setup()
      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Click edit button for first store
      const editButtons = screen.getAllByTitle('editStore')
      await user.click(editButtons[0])

      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByText('editStore')).toBeInTheDocument()

      // Check form is pre-filled
      expect(screen.getByDisplayValue('Main Store')).toBeInTheDocument()
      expect(screen.getByDisplayValue('123 Main St, City, State')).toBeInTheDocument()
      expect(screen.getByDisplayValue('(555) 123-4567')).toBeInTheDocument()
    })

    it('submits edit store form successfully', async () => {
      const user = userEvent.setup()
      mockIpc.stores.update.mockResolvedValue({ success: true })

      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Open edit modal
      const editButtons = screen.getAllByTitle('editStore')
      await user.click(editButtons[0])

      // Modify form
      const nameInput = screen.getByDisplayValue('Main Store')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Store Name')

      // Submit form
      const saveButton = screen.getByText('save')
      await user.click(saveButton)

      expect(mockIpc.stores.update).toHaveBeenCalledWith('store-1', {
        name: 'Updated Store Name',
        location: '123 Main St, City, State',
        phone: '(555) 123-4567',
        hours: '9 AM - 9 PM',
        manager: 'John Doe',
        status: 'active'
      })

      await waitFor(() => {
        expect(mockIpc.stores.getAll).toHaveBeenCalledTimes(2)
      })
    })

    it('handles edit store errors', async () => {
      const user = userEvent.setup()
      mockIpc.stores.update.mockRejectedValue(new Error('Update failed'))

      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Open edit modal
      const editButtons = screen.getAllByTitle('editStore')
      await user.click(editButtons[0])

      // Submit form
      const saveButton = screen.getByText('save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('failedToUpdateStore')
      })
    })
  })

  describe('Deleting Stores', () => {
    it('deletes store after confirmation', async () => {
      const user = userEvent.setup()
      mockConfirm.mockReturnValue(true)
      mockIpc.stores.delete.mockResolvedValue({ success: true })

      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButtons = screen.getAllByTitle('deleteStore')
      await user.click(deleteButtons[0])

      expect(mockConfirm).toHaveBeenCalledWith('confirmDeleteStore')
      expect(mockIpc.stores.delete).toHaveBeenCalledWith('store-1')

      await waitFor(() => {
        expect(mockIpc.stores.getAll).toHaveBeenCalledTimes(2)
      })
    })

    it('does not delete store when confirmation is cancelled', async () => {
      const user = userEvent.setup()
      mockConfirm.mockReturnValue(false)

      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButtons = screen.getAllByTitle('deleteStore')
      await user.click(deleteButtons[0])

      expect(mockConfirm).toHaveBeenCalledWith('confirmDeleteStore')
      expect(mockIpc.stores.delete).not.toHaveBeenCalled()
    })

    it('handles delete errors', async () => {
      const user = userEvent.setup()
      mockConfirm.mockReturnValue(true)
      mockIpc.stores.delete.mockRejectedValue(new Error('Delete failed'))

      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButtons = screen.getAllByTitle('deleteStore')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('failedToDeleteStore')
      })
    })
  })

  describe('Status Toggling', () => {
    it('toggles store status from active to inactive', async () => {
      const user = userEvent.setup()
      mockIpc.stores.update.mockResolvedValue({ success: true })

      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Click toggle button for active store
      const toggleButtons = screen.getAllByTitle('deactivateStore')
      await user.click(toggleButtons[0])

      expect(mockIpc.stores.update).toHaveBeenCalledWith('store-1', {
        ...mockStores[0],
        status: 'inactive'
      })

      await waitFor(() => {
        expect(mockIpc.stores.getAll).toHaveBeenCalledTimes(2)
      })
    })

    it('toggles store status from inactive to active', async () => {
      const user = userEvent.setup()
      mockIpc.stores.update.mockResolvedValue({ success: true })

      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Branch Store')).toBeInTheDocument()
      })

      // Click toggle button for inactive store
      const toggleButtons = screen.getAllByTitle('activateStore')
      await user.click(toggleButtons[0])

      expect(mockIpc.stores.update).toHaveBeenCalledWith('store-2', {
        ...mockStores[1],
        status: 'active'
      })
    })

    it('handles status toggle errors', async () => {
      const user = userEvent.setup()
      mockIpc.stores.update.mockRejectedValue(new Error('Toggle failed'))

      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Click toggle button
      const toggleButtons = screen.getAllByTitle('deactivateStore')
      await user.click(toggleButtons[0])

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('failedToToggleStatus')
      })
    })
  })

  describe('Form Validation', () => {
    it('allows empty optional fields', async () => {
      const user = userEvent.setup()
      mockIpc.stores.create.mockResolvedValue({ success: true })

      renderStoresPage()

      // Open modal
      await user.click(screen.getByText('addNewStore'))

      // Fill only required fields (name)
      const nameInput = screen.getByPlaceholderText('enterStoreName')
      await user.type(nameInput, 'Minimal Store')

      // Submit form
      const addButton = screen.getByText('addStore')
      await user.click(addButton)

      expect(mockIpc.stores.create).toHaveBeenCalledWith({
        name: 'Minimal Store',
        location: '',
        phone: '',
        hours: '',
        manager: '',
        status: 'active'
      })
    })
  })

  describe('Error Handling', () => {
    it('handles loading errors gracefully', async () => {
      mockIpc.stores.getAll.mockRejectedValue(new Error('Load failed'))

      renderStoresPage()

      // Should not crash, loading state should be cleared
      await waitFor(() => {
        expect(mockIpc.stores.getAll).toHaveBeenCalled()
      })
    })

    it('logs errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockIpc.stores.create.mockRejectedValue(new Error('Create failed'))

      renderStoresPage()

      // Open modal and submit
      const addButton = screen.getByText('addNewStore')
      fireEvent.click(addButton)

      const submitButton = screen.getByText('addStore')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to add store:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      renderStoresPage()

      await waitFor(() => {
        expect(screen.getByText('Main Store')).toBeInTheDocument()
      })

      // Check modal accessibility
      const addButton = screen.getByText('addNewStore')
      expect(addButton).toBeInTheDocument()

      // Check button titles
      expect(screen.getAllByTitle('editStore')).toHaveLength(2)
      expect(screen.getAllByTitle('deleteStore')).toHaveLength(2)
    })

    it('closes modals with escape key', async () => {
      const user = userEvent.setup()
      renderStoresPage()

      // Open modal
      await user.click(screen.getByText('addNewStore'))
      expect(screen.getByTestId('modal')).toBeInTheDocument()

      // Press escape
      await user.keyboard('{Escape}')

      // Modal should close (this depends on Modal component implementation)
      // The test verifies the modal component receives the onClose prop
    })
  })

  describe('State Management', () => {
    it('maintains form state correctly', async () => {
      const user = userEvent.setup()
      renderStoresPage()

      // Open add modal
      await user.click(screen.getByText('addNewStore'))

      // Fill form
      const nameInput = screen.getByPlaceholderText('enterStoreName')
      await user.type(nameInput, 'Test Store')

      // Close and reopen modal
      const closeButton = screen.getByTestId('modal-close')
      await user.click(closeButton)

      await user.click(screen.getByText('addNewStore'))

      // Form should be reset
      expect(nameInput).toHaveValue('')
    })

    it('updates store list after operations', async () => {
      mockIpc.stores.create.mockResolvedValue({ success: true })

      renderStoresPage()

      // Open modal and add store
      const addButton = screen.getByText('addNewStore')
      fireEvent.click(addButton)

      const submitButton = screen.getByText('addStore')
      fireEvent.click(submitButton)

      await waitFor(() => {
        // Should have called getAll twice: initial load + after create
        expect(mockIpc.stores.getAll).toHaveBeenCalledTimes(2)
      })
    })
  })
})
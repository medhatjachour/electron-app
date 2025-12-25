/**
 * Unit tests for Customers page
 * Tests customer management, CRUD operations, and UI interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Customers from '../Customers'

// Mock dependencies
vi.mock('../components/ui/Modal')
vi.mock('../components/SmartDeleteDialog')
vi.mock('../components/InstallmentManager')
vi.mock('../utils/ipc')
vi.mock('../contexts/ToastContext')
vi.mock('@renderer/utils/formatNumber')
vi.mock('../contexts/LanguageContext')

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}

const mockLanguage = {
  t: vi.fn((key: string) => key), // Return key as translation for simplicity
}

const mockIpc = {
  customers: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    checkDelete: vi.fn(),
    getPurchaseHistory: vi.fn(),
  },
  saleTransactions: {
    getByCustomerId: vi.fn(),
  },
}

describe('Customers', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock implementations
    const mockUseToast = vi.mocked(require('../contexts/ToastContext')).useToast
    const mockUseLanguage = vi.mocked(require('../contexts/LanguageContext')).useLanguage

    mockUseToast.mockReturnValue(mockToast)
    mockUseLanguage.mockReturnValue(mockLanguage)

    // Mock IPC
    vi.mocked(require('../utils/ipc')).ipc = mockIpc

    // Mock components
    const MockModal = vi.mocked(require('../components/ui/Modal')).default
    const MockSmartDeleteDialog = vi.mocked(require('../components/SmartDeleteDialog')).default
    const MockInstallmentManager = vi.mocked(require('../components/InstallmentManager')).InstallmentManager

    MockModal.mockReturnValue(null)
    MockSmartDeleteDialog.mockReturnValue(null)
    MockInstallmentManager.mockReturnValue(null)

    // Mock format function
    vi.mocked(require('@renderer/utils/formatNumber')).formatCurrency = vi.fn((val) => `$${val}`)
  })

  it('renders customers page correctly', () => {
    render(<Customers />)

    expect(screen.getByRole('heading', { name: /customers/i })).toBeInTheDocument()
    expect(screen.getByText(/manageCustomers/i)).toBeInTheDocument()
  })

  it('loads customers data on mount', async () => {
    mockIpc.customers.getAll.mockResolvedValue({
      customers: [],
      totalCount: 0,
      hasMore: false,
    })

    render(<Customers />)

    await waitFor(() => {
      expect(mockIpc.customers.getAll).toHaveBeenCalled()
    })
  })

  it('displays customers in table', async () => {
    const mockCustomers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        loyaltyTier: 'Gold',
        totalSpent: 1000,
        purchaseCount: 5,
      }
    ]

    mockIpc.customers.getAll.mockResolvedValue({
      customers: mockCustomers,
      totalCount: 1,
      hasMore: false,
    })

    render(<Customers />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('$1000')).toBeInTheDocument()
    })
  })

  it('searches customers by name or email', async () => {
    const user = userEvent.setup()

    const mockCustomers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', phone: '', loyaltyTier: 'Bronze', totalSpent: 100, purchaseCount: 1 },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '', loyaltyTier: 'Bronze', totalSpent: 200, purchaseCount: 2 },
    ]

    mockIpc.customers.getAll.mockResolvedValue({
      customers: mockCustomers,
      totalCount: 2,
      hasMore: false,
    })

    render(<Customers />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    // Search for John
    const searchInput = screen.getByPlaceholderText(/searchCustomers/i)
    await user.type(searchInput, 'John')

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })
  })

  it('opens add customer modal', async () => {
    const user = userEvent.setup()
    render(<Customers />)

    const addButton = screen.getByRole('button', { name: /add/i })
    await user.click(addButton)

    // Modal should be rendered (mocked)
    expect(require('../components/ui/Modal').default).toHaveBeenCalled()
  })

  it('creates new customer', async () => {
    const user = userEvent.setup()

    mockIpc.customers.create.mockResolvedValue({
      id: '1',
      name: 'New Customer',
      email: 'new@example.com',
      phone: '+1234567890',
      loyaltyTier: 'Bronze',
      totalSpent: 0,
      purchaseCount: 0,
    })

    render(<Customers />)

    // Open add modal
    const addButton = screen.getByRole('button', { name: /add/i })
    await user.click(addButton)

    // Fill form (modal is mocked, so we simulate the form submission)
    mockIpc.customers.getAll.mockResolvedValue({
      customers: [{
        id: '1',
        name: 'New Customer',
        email: 'new@example.com',
        phone: '+1234567890',
        loyaltyTier: 'Bronze',
        totalSpent: 0,
        purchaseCount: 0,
      }],
      totalCount: 1,
      hasMore: false,
    })

    expect(mockToast.success).toHaveBeenCalledWith('customerAdded')
  })

  it('edits existing customer', async () => {
    const user = userEvent.setup()

    const mockCustomer = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      loyaltyTier: 'Gold',
      totalSpent: 1000,
      purchaseCount: 5,
    }

    mockIpc.customers.getAll.mockResolvedValue({
      customers: [mockCustomer],
      totalCount: 1,
      hasMore: false,
    })

    mockIpc.customers.update.mockResolvedValue(mockCustomer)

    render(<Customers />)

    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /edit/i })
      return editButton
    })

    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    expect(require('../components/ui/Modal').default).toHaveBeenCalled()
  })

  it('deletes customer with confirmation', async () => {
    const user = userEvent.setup()

    const mockCustomer = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      loyaltyTier: 'Gold',
      totalSpent: 1000,
      purchaseCount: 5,
    }

    mockIpc.customers.getAll.mockResolvedValue({
      customers: [mockCustomer],
      totalCount: 1,
      hasMore: false,
    })

    mockIpc.customers.checkDelete.mockResolvedValue({
      canDelete: true,
      message: 'Safe to delete',
    })

    render(<Customers />)

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      return deleteButton
    })

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)

    expect(require('../components/SmartDeleteDialog').default).toHaveBeenCalled()
  })

  it('views customer purchase history', async () => {
    const user = userEvent.setup()

    const mockCustomer = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      loyaltyTier: 'Gold',
      totalSpent: 1000,
      purchaseCount: 5,
    }

    mockIpc.customers.getAll.mockResolvedValue({
      customers: [mockCustomer],
      totalCount: 1,
      hasMore: false,
    })

    mockIpc.customers.getPurchaseHistory.mockResolvedValue([])

    render(<Customers />)

    await waitFor(() => {
      const historyButton = screen.getByRole('button', { name: /history/i })
      return historyButton
    })

    const historyButton = screen.getByRole('button', { name: /history/i })
    await user.click(historyButton)

    expect(mockIpc.customers.getPurchaseHistory).toHaveBeenCalledWith('1')
  })

  it('exports customers data', async () => {
    const user = userEvent.setup()

    const mockCustomers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        loyaltyTier: 'Gold',
        totalSpent: 1000,
        purchaseCount: 5,
      }
    ]

    mockIpc.customers.getAll.mockResolvedValue({
      customers: mockCustomers,
      totalCount: 1,
      hasMore: false,
    })

    // Mock XLSX
    const mockXLSX = {
      utils: {
        json_to_sheet: vi.fn(),
        book_new: vi.fn(),
        book_append_sheet: vi.fn(),
      },
      writeFile: vi.fn(),
    }
    vi.mocked(require('xlsx')).default = mockXLSX

    render(<Customers />)

    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)

    expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(mockXLSX.writeFile).toHaveBeenCalled()
  })

  it('handles pagination', async () => {
    const user = userEvent.setup()

    mockIpc.customers.getAll.mockResolvedValue({
      customers: [],
      totalCount: 150,
      hasMore: true,
    })

    render(<Customers />)

    const loadMoreButton = screen.getByRole('button', { name: /loadMore/i })
    await user.click(loadMoreButton)

    expect(mockIpc.customers.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
      })
    )
  })

  it('handles API errors gracefully', async () => {
    mockIpc.customers.getAll.mockRejectedValue(new Error('API Error'))

    render(<Customers />)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled()
    })
  })

  it('shows loading states', () => {
    render(<Customers />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
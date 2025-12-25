/**
 * Unit tests for Sales page
 * Tests sales data loading, filtering, and UI interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Sales from '../Sales'

// Mock dependencies
vi.mock('../utils/ipc')
vi.mock('../components/Pagination')
vi.mock('../utils/formatNumber')
vi.mock('./Sales/RefundItemsModal')
vi.mock('../components/InstallmentManager')
vi.mock('@/shared/utils/refundCalculations')
vi.mock('../contexts/LanguageContext')
vi.mock('../contexts/ToastContext')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => ({ search: '' }),
  }
})

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}

const mockLanguage = {
  t: vi.fn((key: string) => key), // Return key as translation for simplicity
}

const mockIpc = {
  saleTransactions: {
    getAll: vi.fn(),
    getById: vi.fn(),
    refundItems: vi.fn(),
  },
  customers: {
    getAll: vi.fn(),
  },
}

describe('Sales', () => {
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
    const MockPagination = vi.mocked(require('../components/Pagination')).default
    const MockRefundModal = vi.mocked(require('./Sales/RefundItemsModal')).default
    const MockInstallmentManager = vi.mocked(require('../components/InstallmentManager')).InstallmentManager

    MockPagination.mockReturnValue(<div>Pagination</div>)
    MockRefundModal.mockReturnValue(null)
    MockInstallmentManager.mockReturnValue(null)

    // Mock format functions
    vi.mocked(require('../utils/formatNumber')).formatCurrency = vi.fn((val) => `$${val}`)
    vi.mocked(require('../utils/formatNumber')).formatLargeNumber = vi.fn((val) => val.toString())

    // Mock refund calculations
    vi.mocked(require('@/shared/utils/refundCalculations')).calculateRefundedAmount = vi.fn(() => 0)
  })

  const renderSales = () => {
    return render(
      <BrowserRouter>
        <Sales />
      </BrowserRouter>
    )
  }

  it('renders sales page correctly', () => {
    renderSales()

    expect(screen.getByRole('heading', { name: /salesManagement/i })).toBeInTheDocument()
    expect(screen.getByText(/trackSales/i)).toBeInTheDocument()
  })

  it('loads sales data on mount', async () => {
    mockIpc.saleTransactions.getAll.mockResolvedValue([])
    mockIpc.customers.getAll.mockResolvedValue([])

    renderSales()

    await waitFor(() => {
      expect(mockIpc.saleTransactions.getAll).toHaveBeenCalled()
      expect(mockIpc.customers.getAll).toHaveBeenCalled()
    })
  })

  it('displays sales data in table', async () => {
    const mockSales = [
      {
        id: '1',
        total: 100,
        status: 'completed',
        createdAt: '2024-01-01T10:00:00Z',
        customerName: 'John Doe',
        items: [],
        paymentMethod: 'cash',
      }
    ]

    mockIpc.saleTransactions.getAll.mockResolvedValue(mockSales)
    mockIpc.customers.getAll.mockResolvedValue([])

    renderSales()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('$100')).toBeInTheDocument()
    })
  })

  it('filters sales by status', async () => {
    const user = userEvent.setup()

    const mockSales = [
      { id: '1', total: 100, status: 'completed', createdAt: '2024-01-01T10:00:00Z', customerName: 'John', items: [], paymentMethod: 'cash' },
      { id: '2', total: 200, status: 'pending', createdAt: '2024-01-01T11:00:00Z', customerName: 'Jane', items: [], paymentMethod: 'card' },
    ]

    mockIpc.saleTransactions.getAll.mockResolvedValue(mockSales)
    mockIpc.customers.getAll.mockResolvedValue([])

    renderSales()

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Jane')).toBeInTheDocument()
    })

    // Filter by completed status
    const statusFilter = screen.getByRole('combobox', { name: /status/i })
    await user.selectOptions(statusFilter, 'completed')

    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.queryByText('Jane')).not.toBeInTheDocument()
  })

  it('searches sales by customer name', async () => {
    const user = userEvent.setup()

    const mockSales = [
      { id: '1', total: 100, status: 'completed', createdAt: '2024-01-01T10:00:00Z', customerName: 'John Doe', items: [], paymentMethod: 'cash' },
      { id: '2', total: 200, status: 'completed', createdAt: '2024-01-01T11:00:00Z', customerName: 'Jane Smith', items: [], paymentMethod: 'card' },
    ]

    mockIpc.saleTransactions.getAll.mockResolvedValue(mockSales)
    mockIpc.customers.getAll.mockResolvedValue([])

    renderSales()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    // Search for John
    const searchInput = screen.getByPlaceholderText(/searchSales/i)
    await user.type(searchInput, 'John')

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
  })

  it('handles refresh button click', async () => {
    const user = userEvent.setup()

    mockIpc.saleTransactions.getAll.mockResolvedValue([])
    mockIpc.customers.getAll.mockResolvedValue([])

    renderSales()

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    expect(mockIpc.saleTransactions.getAll).toHaveBeenCalledTimes(2) // Initial + refresh
  })

  it('opens sale details modal', async () => {
    const user = userEvent.setup()

    const mockSales = [
      {
        id: '1',
        total: 100,
        status: 'completed',
        createdAt: '2024-01-01T10:00:00Z',
        customerName: 'John Doe',
        items: [],
        paymentMethod: 'cash',
      }
    ]

    mockIpc.saleTransactions.getAll.mockResolvedValue(mockSales)
    mockIpc.customers.getAll.mockResolvedValue([])
    mockIpc.saleTransactions.getById.mockResolvedValue(mockSales[0])

    renderSales()

    await waitFor(() => {
      const viewButton = screen.getByRole('button', { name: /view/i })
      return viewButton
    })

    const viewButton = screen.getByRole('button', { name: /view/i })
    await user.click(viewButton)

    expect(mockIpc.saleTransactions.getById).toHaveBeenCalledWith('1')
  })

  it('exports sales data', async () => {
    const user = userEvent.setup()

    const mockSales = [
      {
        id: '1',
        total: 100,
        status: 'completed',
        createdAt: '2024-01-01T10:00:00Z',
        customerName: 'John Doe',
        items: [],
        paymentMethod: 'cash',
      }
    ]

    mockIpc.saleTransactions.getAll.mockResolvedValue(mockSales)
    mockIpc.customers.getAll.mockResolvedValue([])

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

    renderSales()

    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)

    expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(mockXLSX.writeFile).toHaveBeenCalled()
  })

  it('handles API errors gracefully', async () => {
    mockIpc.saleTransactions.getAll.mockRejectedValue(new Error('API Error'))

    renderSales()

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled()
    })
  })

  it('shows loading state initially', () => {
    renderSales()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
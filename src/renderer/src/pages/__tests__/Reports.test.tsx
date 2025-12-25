/**
 * Unit tests for Reports page
 * Tests report generation, data loading, and UI interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import EnhancedReports from '../Reports'

// Mock dependencies
vi.mock('../../shared/utils/refundCalculations')
vi.mock('../components/ui/Modal')
vi.mock('../contexts/ToastContext')
vi.mock('../contexts/LanguageContext')

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}

const mockLanguage = {
  t: vi.fn((key: string) => key), // Return key as translation for simplicity
}

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock window.api
const mockApi = {
  saleTransactions: {
    getByDateRange: vi.fn(),
  },
  finance: {
    getTransactions: vi.fn(),
  },
  reports: {
    getSalesData: vi.fn(),
    getInventoryData: vi.fn(),
    getFinancialData: vi.fn(),
    getCustomerData: vi.fn(),
  },
}

;(global.window as any).api = mockApi

describe('EnhancedReports', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock implementations
    const mockUseToast = vi.mocked(require('../contexts/ToastContext')).useToast
    const mockUseLanguage = vi.mocked(require('../contexts/LanguageContext')).useLanguage

    mockUseToast.mockReturnValue(mockToast)
    mockUseLanguage.mockReturnValue(mockLanguage)

    // Mock Modal component
    const MockModal = vi.fn(({ children, isOpen }) => isOpen ? <div>{children}</div> : null)
    vi.mocked(require('../components/ui/Modal')).default = MockModal
  })

  const renderReports = () => {
    return render(
      <BrowserRouter>
        <EnhancedReports />
      </BrowserRouter>
    )
  }

  it('renders reports page correctly', () => {
    renderReports()

    expect(screen.getByRole('heading', { name: /reports/i })).toBeInTheDocument()
    expect(screen.getByText(/generateComprehensive/i)).toBeInTheDocument()
  })

  it('loads today stats on mount', async () => {
    mockApi.saleTransactions.getByDateRange.mockResolvedValue([])
    mockApi.finance.getTransactions.mockResolvedValue([])

    renderReports()

    await waitFor(() => {
      expect(mockApi.saleTransactions.getByDateRange).toHaveBeenCalled()
      expect(mockApi.finance.getTransactions).toHaveBeenCalled()
    })
  })

  it('loads activity feed on mount', async () => {
    mockApi.saleTransactions.getByDateRange.mockResolvedValue([])
    mockApi.finance.getTransactions.mockResolvedValue([])

    renderReports()

    await waitFor(() => {
      expect(mockApi.saleTransactions.getByDateRange).toHaveBeenCalledTimes(2) // Once for stats, once for activity
    })
  })

  it('displays dashboard stats correctly', async () => {
    const mockSales = [
      {
        id: '1',
        total: 100,
        items: [{ product: { baseCost: 50 }, quantity: 1, refundedQuantity: 0 }]
      }
    ]
    const mockExpenses = [
      { id: '1', type: 'expense', amount: 25 }
    ]

    mockApi.saleTransactions.getByDateRange.mockResolvedValue(mockSales)
    mockApi.finance.getTransactions.mockResolvedValue(mockExpenses)

    renderReports()

    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument() // Revenue
      expect(screen.getByText('$75.00')).toBeInTheDocument() // Expenses (COGS 50 + operational 25)
      expect(screen.getByText('$25.00')).toBeInTheDocument() // Profit
    })
  })

  it('handles refresh button click', async () => {
    const user = userEvent.setup()
    mockApi.saleTransactions.getByDateRange.mockResolvedValue([])
    mockApi.finance.getTransactions.mockResolvedValue([])

    renderReports()

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    expect(mockToast.success).toHaveBeenCalledWith('Data refreshed successfully')
  })

  it('opens report generation modal', async () => {
    const user = userEvent.setup()
    renderReports()

    const generateButton = screen.getByRole('button', { name: /generateReport/i })
    await user.click(generateButton)

    // Modal should be rendered (mocked)
    expect(require('../components/ui/Modal').default).toHaveBeenCalled()
  })

  it('generates sales report', async () => {
    const user = userEvent.setup()
    mockApi.reports.getSalesData.mockResolvedValue({
      success: true,
      data: {
        summary: { totalSales: 10, totalRevenue: 1000 },
        saleTransactions: [],
        byPaymentMethod: {},
        byCategory: {},
        topProducts: [],
        dailyBreakdown: []
      }
    })

    renderReports()

    // Open modal and select sales report
    const generateButton = screen.getByRole('button', { name: /generateReport/i })
    await user.click(generateButton)

    const salesOption = screen.getByRole('radio', { name: /sales/i })
    await user.click(salesOption)

    const generateReportButton = screen.getByRole('button', { name: /generate/i })
    await user.click(generateReportButton)

    await waitFor(() => {
      expect(mockApi.reports.getSalesData).toHaveBeenCalled()
    })
  })

  it('generates financial report', async () => {
    const user = userEvent.setup()
    mockApi.reports.getFinancialData.mockResolvedValue({
      success: true,
      data: {
        summary: {
          totalRevenue: 1000,
          totalExpenses: 600,
          netProfit: 400
        },
        transactions: [],
        dailyBreakdown: [],
        expensesByCategory: {}
      }
    })

    renderReports()

    // Open modal and select financial report
    const generateButton = screen.getByRole('button', { name: /generateReport/i })
    await user.click(generateButton)

    const financialOption = screen.getByRole('radio', { name: /financial/i })
    await user.click(financialOption)

    const generateReportButton = screen.getByRole('button', { name: /generate/i })
    await user.click(generateReportButton)

    await waitFor(() => {
      expect(mockApi.reports.getFinancialData).toHaveBeenCalled()
    })
  })

  it('exports report to PDF', async () => {
    const user = userEvent.setup()

    // Mock jsPDF
    const mockJsPDF = vi.fn()
    mockJsPDF.prototype.text = vi.fn()
    mockJsPDF.prototype.save = vi.fn()
    vi.mocked(require('jspdf')).default = mockJsPDF

    renderReports()

    // Generate a report first
    mockApi.reports.getSalesData.mockResolvedValue({
      success: true,
      data: {
        summary: { totalSales: 10, totalRevenue: 1000 },
        saleTransactions: [],
        byPaymentMethod: {},
        byCategory: {},
        topProducts: [],
        dailyBreakdown: []
      }
    })

    const generateButton = screen.getByRole('button', { name: /generateReport/i })
    await user.click(generateButton)

    const salesOption = screen.getByRole('radio', { name: /sales/i })
    await user.click(salesOption)

    const generateReportButton = screen.getByRole('button', { name: /generate/i })
    await user.click(generateReportButton)

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /exportPdf/i })
      return exportButton
    })

    const exportButton = screen.getByRole('button', { name: /exportPdf/i })
    await user.click(exportButton)

    expect(mockJsPDF).toHaveBeenCalled()
  })

  it('handles API errors gracefully', async () => {
    mockApi.saleTransactions.getByDateRange.mockRejectedValue(new Error('API Error'))

    renderReports()

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled()
    })
  })

  it('shows loading states', () => {
    renderReports()

    // Should show loading initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
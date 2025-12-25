/**
 * Inventory Page Unit Tests
 *
 * Tests the Inventory management page functionality including:
 * - Data loading and display
 * - Filtering and sorting
 * - Export functionality
 * - Stock movement operations
 * - Item management (CRUD)
 * - Tab navigation
 * - Error handling
 * - Keyboard shortcuts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import InventoryPage from '../Inventory/index'
import { AuthProvider } from '../../contexts/AuthContext'
import { LanguageProvider } from '../../contexts/LanguageContext'
import { ToastProvider } from '../../contexts/ToastContext'
import { DisplaySettingsProvider } from '../../contexts/DisplaySettingsContext'
import * as XLSX from 'xlsx'

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn()
  }
})

vi.mock('../../hooks/useBackendSearch', () => ({
  useBackendSearch: vi.fn(),
  useFilterMetadata: vi.fn()
}))

vi.mock('../../hooks/useDebounce', () => ({
  useDebounce: vi.fn()
}))

vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  default: vi.fn()
}))

vi.mock('../../hooks/useOptimisticUpdate', () => ({
  useOptimisticUpdate: vi.fn()
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: vi.fn()
}))

vi.mock('../../contexts/ToastContext', () => ({
  useToast: vi.fn()
}))

vi.mock('../../contexts/DisplaySettingsContext', () => ({
  useDisplaySettings: vi.fn()
}))

vi.mock('./components/InventoryTable', () => ({
  default: vi.fn()
}))

vi.mock('./components/Pagination', () => ({
  default: vi.fn()
}))

vi.mock('./components/ProductAnalytics', () => ({
  default: vi.fn()
}))

vi.mock('./components/StockHistory', () => ({
  default: vi.fn()
}))

vi.mock('./components/InventoryFilters', () => ({
  default: vi.fn()
}))

vi.mock('./components/InventoryMetrics', () => ({
  default: vi.fn()
}))

vi.mock('./components/ItemDetailDrawer', () => ({
  default: vi.fn()
}))

vi.mock('../../components/StockMovementDialog', () => ({
  default: vi.fn()
}))

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn()
  },
  writeFile: vi.fn()
}))

vi.mock('../../../../shared/utils/logger', () => ({
  default: {
    error: vi.fn()
  }
}))

// Mock window.api
const mockApi = {
  stockMovements: {
    record: vi.fn()
  },
  products: {
    delete: vi.fn()
  }
}

Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true
})

// Mock globalThis.api for delete operations
Object.defineProperty(globalThis, 'api', {
  value: mockApi,
  writable: true
})

// Test data
const mockUser = {
  id: 'user-1',
  name: 'Test User',
  role: 'admin'
}

const mockItems = [
  {
    id: 'item-1',
    name: 'Test Product',
    baseSKU: 'TEST-001',
    category: 'Electronics',
    basePrice: 99.99,
    totalStock: 50,
    stockValue: 4999.50,
    retailValue: 7499.25,
    variantCount: 3,
    stockStatus: 'normal',
    description: 'Test product description'
  },
  {
    id: 'item-2',
    name: 'Another Product',
    baseSKU: 'TEST-002',
    category: 'Clothing',
    basePrice: 29.99,
    totalStock: 25,
    stockValue: 749.75,
    retailValue: 1124.63,
    variantCount: 2,
    stockStatus: 'low',
    description: 'Another test product'
  }
]

const mockMetrics = {
  totalItems: 2,
  totalValue: 5749.25,
  lowStockItems: 1,
  outOfStockItems: 0,
  averagePrice: 64.99
}

const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  setPage: vi.fn()
}

const mockRefetch = vi.fn()

// Helper function to render component with providers
function renderInventoryPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <DisplaySettingsProvider>
              <InventoryPage />
            </DisplaySettingsProvider>
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('InventoryPage', () => {
  const mockNavigate = vi.fn()
  const mockToast = {
    success: vi.fn(),
    error: vi.fn()
  }
  const mockUseBackendSearch = vi.fn()
  const mockUseFilterMetadata = vi.fn()
  const mockUseDebounce = vi.fn()
  const mockUseKeyboardShortcuts = vi.fn()
  const mockUseOptimisticUpdate = vi.fn()
  const mockUseAuth = vi.fn()
  const mockUseLanguage = vi.fn()
  const mockUseToast = vi.fn()
  const mockUseDisplaySettings = vi.fn()

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Setup default mocks
    mockUseAuth.mockReturnValue({ user: mockUser })
    mockUseLanguage.mockReturnValue({
      t: (key: string) => key // Return key as translation for simplicity
    })
    mockUseToast.mockReturnValue(mockToast)
    mockUseDisplaySettings.mockReturnValue({
      settings: { showImagesInInventory: true }
    })
    mockUseFilterMetadata.mockReturnValue({
      metadata: { categories: [{ name: 'Electronics' }, { name: 'Clothing' }] }
    })
    mockUseDebounce.mockImplementation((value) => value) // Return value immediately
    mockUseKeyboardShortcuts.mockImplementation(() => {}) // No-op
    mockUseOptimisticUpdate.mockReturnValue({
      execute: vi.fn(),
      isOptimistic: false
    })

    // Mock useBackendSearch
    mockUseBackendSearch.mockReturnValue({
      data: mockItems,
      loading: false,
      error: null,
      totalCount: 2,
      pagination: mockPagination,
      metrics: mockMetrics,
      refetch: mockRefetch
    })

    // Import and mock react-router-dom
    // useNavigate is already mocked at the top

    // Import and mock hooks
    const { useBackendSearch, useFilterMetadata } = require('../../hooks/useBackendSearch')
    useBackendSearch.mockImplementation(mockUseBackendSearch)
    useFilterMetadata.mockImplementation(mockUseFilterMetadata)

    const { useDebounce } = require('../../hooks/useDebounce')
    useDebounce.mockImplementation(mockUseDebounce)

    const { useKeyboardShortcuts } = require('../../hooks/useKeyboardShortcuts')
    useKeyboardShortcuts.mockImplementation(mockUseKeyboardShortcuts)

    const { useOptimisticUpdate } = require('../../hooks/useOptimisticUpdate')
    useOptimisticUpdate.mockImplementation(mockUseOptimisticUpdate)

    const { useAuth } = require('../../hooks/useAuth')
    useAuth.mockImplementation(mockUseAuth)

    const { useLanguage } = require('../../contexts/LanguageContext')
    useLanguage.mockImplementation(mockUseLanguage)

    const { useToast } = require('../../contexts/ToastContext')
    useToast.mockImplementation(mockUseToast)

    const { useDisplaySettings } = require('../../contexts/DisplaySettingsContext')
    useDisplaySettings.mockImplementation(mockUseDisplaySettings)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial Rendering', () => {
    it('renders inventory page with correct title and structure', () => {
      renderInventoryPage()

      expect(screen.getByText('inventoryManagement')).toBeInTheDocument()
      expect(screen.getByText('inventoryTrackStock')).toBeInTheDocument()
      expect(screen.getByRole('searchbox')).toBeInTheDocument()
      expect(screen.getByText('inventoryProducts')).toBeInTheDocument()
      expect(screen.getByText('inventoryAnalytics')).toBeInTheDocument()
      expect(screen.getByText('inventoryHistory')).toBeInTheDocument()
    })

    it('displays loading state initially', () => {
      mockUseBackendSearch.mockReturnValueOnce({
        ...mockUseBackendSearch(),
        loading: true
      })

      renderInventoryPage()

      // Check if InventoryTable is called with loading prop
      const { default: InventoryTable } = require('./components/InventoryTable')
      expect(InventoryTable).toHaveBeenCalledWith(
        expect.objectContaining({ loading: true }),
        expect.any(Object)
      )
    })

    it('displays error state when data loading fails', () => {
      mockUseBackendSearch.mockReturnValueOnce({
        ...mockUseBackendSearch(),
        error: 'Failed to load inventory'
      })

      renderInventoryPage()

      expect(screen.getByText('Error Loading Inventory')).toBeInTheDocument()
      expect(screen.getByText('Failed to load inventory')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('shows products tab by default', () => {
      renderInventoryPage()

      expect(screen.getByText('inventoryProducts')).toHaveClass('bg-primary', 'text-white')
      expect(screen.queryByText('inventoryAnalytics')).not.toHaveClass('bg-primary')
      expect(screen.queryByText('inventoryHistory')).not.toHaveClass('bg-primary')
    })

    it('switches to analytics tab when clicked', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const analyticsTab = screen.getByText('inventoryAnalytics')
      await user.click(analyticsTab)

      expect(analyticsTab).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByText('inventoryProducts')).not.toHaveClass('bg-primary')
    })

    it('switches to history tab when clicked', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const historyTab = screen.getByText('inventoryHistory')
      await user.click(historyTab)

      expect(historyTab).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByText('inventoryProducts')).not.toHaveClass('bg-primary')
    })

    it('shows search and filters only on products tab', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      // Search should be visible on products tab
      expect(screen.getByRole('searchbox')).toBeInTheDocument()

      // Switch to analytics tab
      await user.click(screen.getByText('inventoryAnalytics'))

      // Search should not be visible
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('updates search query when user types', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, 'test product')

      expect(searchInput).toHaveValue('test product')
    })

    it('debounces search input', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, 'test')

      // useDebounce should be called with the search value
      expect(mockUseDebounce).toHaveBeenCalledWith('test', 300)
    })

    it('resets pagination when search changes', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, 'new search')

      expect(mockPagination.setPage).toHaveBeenCalledWith(1)
    })
  })

  describe('Filtering', () => {
    it('toggles filters panel when filter button is clicked', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const filterButton = screen.getByText('inventoryFilters')
      expect(filterButton).toHaveAttribute('aria-expanded', 'false')

      await user.click(filterButton)

      expect(filterButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('passes correct props to InventoryFilters component', () => {
      renderInventoryPage()

      const { default: InventoryFilters } = require('./components/InventoryFilters')
      expect(InventoryFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: ['Electronics', 'Clothing'],
          filters: expect.objectContaining({
            search: '',
            categories: [],
            stockStatus: [],
            priceRange: { min: 0, max: Infinity },
            stockRange: { min: 0, max: Infinity }
          })
        }),
        expect.any(Object)
      )
    })
  })

  describe('Sorting', () => {
    it('passes sort options to InventoryTable', () => {
      renderInventoryPage()

      const { default: InventoryTable } = require('./components/InventoryTable')
      expect(InventoryTable).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOptions: { field: 'name', direction: 'asc' }
        }),
        expect.any(Object)
      )
    })

    it('updates sort options when sort changes', () => {
      renderInventoryPage()

      const { default: InventoryTable } = require('./components/InventoryTable')
      const tableProps = InventoryTable.mock.calls[0][0]
      tableProps.onSortChange({ field: 'basePrice', direction: 'desc' })

      // Should trigger re-render with new sort options
      expect(InventoryTable).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOptions: { field: 'basePrice', direction: 'desc' }
        }),
        expect.any(Object)
      )
    })
  })

  describe('Export Functionality', () => {
    it('exports inventory data to Excel when export button is clicked', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const exportButton = screen.getByText(/inventoryExportExcel/)
      await user.click(exportButton)

      await waitFor(() => {
        expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
        expect(XLSX.utils.book_new).toHaveBeenCalled()
        expect(XLSX.utils.book_append_sheet).toHaveBeenCalled()
        expect(XLSX.writeFile).toHaveBeenCalledWith(
          expect.any(Object),
          expect.stringMatching(/^inventory-export-\d{4}-\d{2}-\d{2}\.xlsx$/)
        )
      })

      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('Export completed: 2 items exported')
      )
    })

    it('shows loading state during export', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const exportButton = screen.getByText(/inventoryExportExcel/)
      await user.click(exportButton)

      // Button should show loading state
      expect(screen.getByText('inventoryExporting')).toBeInTheDocument()
    })

    it('handles export errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock XLSX.writeFile to throw error
      const { writeFile } = require('xlsx')
      writeFile.mockImplementation(() => {
        throw new Error('Export failed')
      })

      renderInventoryPage()

      const exportButton = screen.getByText(/inventoryExportExcel/)
      await user.click(exportButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Export failed: Export failed')
      })
    })

    it('disables export button when no items', () => {
      mockUseBackendSearch.mockReturnValueOnce({
        ...mockUseBackendSearch(),
        data: []
      })

      renderInventoryPage()

      const exportButton = screen.getByText(/inventoryExportExcel/)
      expect(exportButton).toBeDisabled()
    })
  })

  describe('Add Item Functionality', () => {
    it('navigates to products page with create parameter when add button is clicked', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const addButton = screen.getByText('Add Item')
      await user.click(addButton)

      expect(mockNavigate).toHaveBeenCalledWith('/products?create=true')
    })
  })

  describe('Refresh Functionality', () => {
    it('calls refetch when refresh button is clicked', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const refreshButton = screen.getByText('inventoryRefreshData')
      await user.click(refreshButton)

      expect(mockRefetch).toHaveBeenCalled()
    })

    it('shows loading state when refreshing', () => {
      mockUseBackendSearch.mockReturnValueOnce({
        ...mockUseBackendSearch(),
        loading: true
      })

      renderInventoryPage()

      const refreshButton = screen.getByText('inventoryRefreshData')
      expect(refreshButton).toBeDisabled()
    })
  })

  describe('Stock Movement', () => {
    it('opens stock movement dialog when adjust stock is triggered', () => {
      renderInventoryPage()

      const { default: ItemDetailDrawer } = require('./components/ItemDetailDrawer')
      const drawerProps = ItemDetailDrawer.mock.calls[0][0]

      drawerProps.onAdjustStock('variant-1', 'Test Product', 'Size M', 10)

      const { default: StockMovementDialog } = require('../../components/StockMovementDialog')
      expect(StockMovementDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: true,
          productName: 'Test Product',
          variantLabel: 'Size M',
          currentStock: 10
        }),
        expect.any(Object)
      )
    })

    it('records stock movement successfully', async () => {
      renderInventoryPage()

      // Trigger stock movement dialog
      const { default: ItemDetailDrawer } = require('./components/ItemDetailDrawer')
      const drawerProps = ItemDetailDrawer.mock.calls[0][0]
      drawerProps.onAdjustStock('variant-1', 'Test Product', 'Size M', 10)

      // Mock successful API response
      mockApi.stockMovements.record.mockResolvedValue({ success: true })

      const { default: StockMovementDialog } = require('../../components/StockMovementDialog')
      const dialogProps = StockMovementDialog.mock.calls.find(call =>
        call[0].isOpen
      )[0]

      await dialogProps.onConfirm({
        mode: 'add',
        value: 5,
        reason: 'Restock',
        notes: 'Additional stock arrived'
      })

      expect(mockApi.stockMovements.record).toHaveBeenCalledWith({
        variantId: 'variant-1',
        mode: 'add',
        value: 5,
        reason: 'Restock',
        notes: 'Additional stock arrived',
        userId: 'user-1'
      })

      expect(mockToast.success).toHaveBeenCalledWith('Stock added successfully')
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('handles stock movement errors', async () => {
      renderInventoryPage()

      // Trigger stock movement dialog
      const { default: ItemDetailDrawer } = require('./components/ItemDetailDrawer')
      const drawerProps = ItemDetailDrawer.mock.calls[0][0]
      drawerProps.onAdjustStock('variant-1', 'Test Product', 'Size M', 10)

      // Mock failed API response
      mockApi.stockMovements.record.mockResolvedValue({
        success: false,
        error: 'Stock movement failed'
      })

      const { default: StockMovementDialog } = require('../../components/StockMovementDialog')
      const dialogProps = StockMovementDialog.mock.calls.find(call =>
        call[0].isOpen
      )[0]

      await dialogProps.onConfirm({
        mode: 'add',
        value: 5,
        reason: 'Restock',
        notes: 'Additional stock arrived'
      })

      expect(mockToast.error).toHaveBeenCalledWith('Stock movement failed')
    })
  })

  describe('Item Deletion', () => {
    it('handles item deletion with optimistic updates', () => {
      renderInventoryPage()

      const { default: ItemDetailDrawer } = require('./components/ItemDetailDrawer')
      const drawerProps = ItemDetailDrawer.mock.calls[0][0]

      const mockExecuteDelete = vi.fn()
      mockUseOptimisticUpdate.mockReturnValue({
        execute: mockExecuteDelete,
        isOptimistic: false
      })

      drawerProps.onDelete('item-1')

      expect(mockExecuteDelete).toHaveBeenCalled()
    })

    it('shows success toast on successful deletion', () => {
      const mockExecuteDelete = vi.fn().mockResolvedValue(undefined)
      mockUseOptimisticUpdate.mockReturnValue({
        execute: mockExecuteDelete,
        isOptimistic: false
      })

      renderInventoryPage()

      const { default: ItemDetailDrawer } = require('./components/ItemDetailDrawer')
      const drawerProps = ItemDetailDrawer.mock.calls[0][0]

      drawerProps.onDelete('item-1')

      expect(mockExecuteDelete).toHaveBeenCalledWith({
        operation: expect.any(Function),
        optimisticUpdate: expect.any(Function),
        rollback: expect.any(Function),
        description: 'delete item item-1'
      })
    })
  })

  describe('Item Detail Drawer', () => {
    it('opens item detail drawer when item is clicked', () => {
      renderInventoryPage()

      const { default: InventoryTable } = require('./components/InventoryTable')
      const tableProps = InventoryTable.mock.calls[0][0]

      tableProps.onItemClick(mockItems[0])

      const { default: ItemDetailDrawer } = require('./components/ItemDetailDrawer')
      expect(ItemDetailDrawer).toHaveBeenCalledWith(
        expect.objectContaining({
          item: mockItems[0]
        }),
        expect.any(Object)
      )
    })

    it('closes item detail drawer', () => {
      renderInventoryPage()

      // Open drawer first
      const { default: InventoryTable } = require('./components/InventoryTable')
      const tableProps = InventoryTable.mock.calls[0][0]
      tableProps.onItemClick(mockItems[0])

      // Close drawer
      const { default: ItemDetailDrawer } = require('./components/ItemDetailDrawer')
      const drawerProps = ItemDetailDrawer.mock.calls.find(call =>
        call[0].item
      )[0]

      drawerProps.onClose()

      // Should be called again with null item
      expect(ItemDetailDrawer).toHaveBeenLastCalledWith(
        expect.objectContaining({
          item: null
        }),
        expect.any(Object)
      )
    })
  })

  describe('Pagination', () => {
    it('renders pagination component when items exist', () => {
      renderInventoryPage()

      const { default: Pagination } = require('./components/Pagination')
      expect(Pagination).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          itemsPerPage: 50
        }),
        expect.any(Object)
      )
    })

    it('does not render pagination when no items', () => {
      mockUseBackendSearch.mockReturnValueOnce({
        ...mockUseBackendSearch(),
        data: []
      })

      renderInventoryPage()

      const { default: Pagination } = require('./components/Pagination')
      expect(Pagination).not.toHaveBeenCalled()
    })
  })

  describe('Metrics Sidebar', () => {
    it('renders inventory metrics with correct data', () => {
      renderInventoryPage()

      const { default: InventoryMetrics } = require('./components/InventoryMetrics')
      expect(InventoryMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: mockMetrics,
          loading: false,
          items: mockItems
        }),
        expect.any(Object)
      )
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('registers keyboard shortcuts for inventory actions', () => {
      renderInventoryPage()

      expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith([
        expect.objectContaining({
          key: 'n',
          ctrlKey: true,
          action: expect.any(Function),
          description: 'Create new item'
        }),
        expect.objectContaining({
          key: 'e',
          ctrlKey: true,
          action: expect.any(Function),
          description: 'Export inventory'
        }),
        expect.objectContaining({
          key: 'r',
          ctrlKey: true,
          action: expect.any(Function),
          description: 'Refresh inventory data'
        }),
        expect.objectContaining({
          key: 'f',
          ctrlKey: true,
          action: expect.any(Function),
          description: 'Toggle filters'
        })
      ])
    })
  })

  describe('Lazy Loading', () => {
    it('renders suspense fallback for analytics tab', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      await user.click(screen.getByText('inventoryAnalytics'))

      expect(screen.getByText('Loading Analytics...')).toBeInTheDocument()
    })

    it('renders suspense fallback for history tab', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      await user.click(screen.getByText('inventoryHistory'))

      expect(screen.getByText('Loading Stock History...')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('retries data loading when retry button is clicked', async () => {
      const user = userEvent.setup()

      mockUseBackendSearch.mockReturnValueOnce({
        ...mockUseBackendSearch(),
        error: 'Network error'
      })

      renderInventoryPage()

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      expect(mockRefetch).toHaveBeenCalled()
    })

    it('logs errors during export', async () => {
      const user = userEvent.setup()
      const logger = require('../../../../shared/utils/logger').default

      // Mock XLSX to throw error
      const { writeFile } = require('xlsx')
      writeFile.mockImplementation(() => {
        throw new Error('File system error')
      })

      renderInventoryPage()

      const exportButton = screen.getByText(/inventoryExportExcel/)
      await user.click(exportButton)

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith('Export error:', expect.any(Error))
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderInventoryPage()

      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'inventorySearchPlaceholder')
      expect(screen.getByRole('toolbar')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /inventoryRefreshData/ })).toHaveAttribute('aria-busy', 'false')
    })

    it('updates aria-expanded for filter button', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      const filterButton = screen.getByText('inventoryFilters')
      expect(filterButton).toHaveAttribute('aria-expanded', 'false')

      await user.click(filterButton)
      expect(filterButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('has proper button labels for actions', () => {
      renderInventoryPage()

      expect(screen.getByRole('button', { name: 'Add new inventory item' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /inventoryExportExcel/ })).toBeInTheDocument()
    })
  })
})
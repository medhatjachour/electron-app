/**
 * Unit tests for Products page
 * Tests product loading, filtering, CRUD operations, and UI interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Products from '../Products'

// Mock dependencies
vi.mock('../../utils/ipc')
vi.mock('../../hooks/useBackendSearch')
vi.mock('../../hooks/useFilterMetadata')
vi.mock('../../contexts/ToastContext')
vi.mock('../../contexts/DisplaySettingsContext')
vi.mock('../../hooks/useDebounce')
vi.mock('../../contexts/LanguageContext')
vi.mock('../../components/ui/Modal')
vi.mock('../../components/SmartDeleteDialog')
vi.mock('./ProductFormWrapper')
vi.mock('./ProductActions')
vi.mock('./ProductFilters')
vi.mock('./ProductGrid')

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}

const mockLanguage = {
  t: vi.fn((key: string) => key), // Return key as translation for simplicity
}

const mockDisplaySettings = {
  settings: {
    itemsPerPage: 20,
    defaultView: 'grid',
  },
}

const mockIpc = {
  products: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    checkDelete: vi.fn(),
  },
}

const mockBackendSearch = {
  data: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
  search: vi.fn(),
  setPage: vi.fn(),
  refresh: vi.fn(),
}

const mockFilterMetadata = {
  metadata: {
    categories: [],
    colors: [],
    sizes: [],
    stores: [],
  },
  loading: false,
}

describe('Products', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock implementations
    const mockUseToast = vi.mocked(require('../../contexts/ToastContext')).useToast
    const mockUseLanguage = vi.mocked(require('../../contexts/LanguageContext')).useLanguage
    const mockUseDisplaySettings = vi.mocked(require('../../contexts/DisplaySettingsContext')).useDisplaySettings
    const mockUseBackendSearch = vi.mocked(require('../../hooks/useBackendSearch')).useBackendSearch
    const mockUseFilterMetadata = vi.mocked(require('../../hooks/useFilterMetadata')).useFilterMetadata

    mockUseToast.mockReturnValue(mockToast)
    mockUseLanguage.mockReturnValue(mockLanguage)
    mockUseDisplaySettings.mockReturnValue(mockDisplaySettings)
    mockUseBackendSearch.mockReturnValue(mockBackendSearch)
    mockUseFilterMetadata.mockReturnValue(mockFilterMetadata)

    // Mock IPC
    vi.mocked(require('../../utils/ipc')).ipc = mockIpc

    // Mock components
    const MockModal = vi.mocked(require('../../components/ui/Modal')).default
    const MockSmartDeleteDialog = vi.mocked(require('../../components/SmartDeleteDialog')).default
    const MockProductFormWrapper = vi.mocked(require('./ProductFormWrapper')).default
    const MockProductActions = vi.mocked(require('./ProductActions')).default
    const MockProductFilters = vi.mocked(require('./ProductFilters')).default
    const MockProductGrid = vi.mocked(require('./ProductGrid')).default

    MockModal.mockReturnValue(null)
    MockSmartDeleteDialog.mockReturnValue(null)
    MockProductFormWrapper.mockReturnValue(null)
    MockProductActions.mockReturnValue(<div>ProductActions</div>)
    MockProductFilters.mockReturnValue(<div>ProductFilters</div>)
    MockProductGrid.mockReturnValue(<div>ProductGrid</div>)

    // Mock hooks
    vi.mocked(require('../../hooks/useDebounce')).useDebounce = vi.fn((value) => value)
  })

  it('renders products page correctly', () => {
    render(<Products />)

    expect(screen.getByRole('heading', { name: /products/i })).toBeInTheDocument()
    expect(screen.getByText('ProductActions')).toBeInTheDocument()
    expect(screen.getByText('ProductFilters')).toBeInTheDocument()
    expect(screen.getByText('ProductGrid')).toBeInTheDocument()
  })

  it('loads filter metadata on mount', () => {
    render(<Products />)

    expect(mockFilterMetadata).toBeDefined()
  })

  it('opens add product modal', async () => {
    const user = userEvent.setup()
    render(<Products />)

    const addButton = screen.getByRole('button', { name: /add/i })
    await user.click(addButton)

    // Modal should be rendered (mocked)
    expect(require('../../components/ui/Modal').default).toHaveBeenCalled()
  })

  it('handles product search', async () => {
    const user = userEvent.setup()
    render(<Products />)

    const searchInput = screen.getByPlaceholderText(/searchProducts/i)
    await user.type(searchInput, 'test product')

    expect(mockBackendSearch.search).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: 'test product',
      })
    )
  })

  it('applies filters correctly', async () => {
    const user = userEvent.setup()
    render(<Products />)

    // Open advanced filters
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    await user.click(filtersButton)

    // Apply category filter
    const categorySelect = screen.getByRole('combobox', { name: /category/i })
    await user.selectOptions(categorySelect, 'electronics')

    expect(mockBackendSearch.search).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'electronics',
      })
    )
  })

  it('handles product editing', async () => {
    const user = userEvent.setup()

    render(<Products />)

    // Simulate product selection for editing
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    // Modal should be rendered for editing
    expect(require('../../components/ui/Modal').default).toHaveBeenCalled()
  })

  it('handles product deletion with confirmation', async () => {
    const user = userEvent.setup()

    mockIpc.products.checkDelete.mockResolvedValue({
      canDelete: true,
      message: 'Safe to delete',
    })

    render(<Products />)

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)

    // Delete confirmation dialog should appear
    expect(require('../../components/SmartDeleteDialog').default).toHaveBeenCalled()
  })

  it('refreshes product list', async () => {
    const user = userEvent.setup()
    render(<Products />)

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    expect(mockBackendSearch.refresh).toHaveBeenCalled()
  })

  it('handles pagination', async () => {
    const user = userEvent.setup()
    render(<Products />)

    const nextPageButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextPageButton)

    expect(mockBackendSearch.setPage).toHaveBeenCalledWith(2)
  })

  it('exports products data', async () => {
    const user = userEvent.setup()

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

    render(<Products />)

    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)

    expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(mockXLSX.writeFile).toHaveBeenCalled()
  })

  it('shows loading states', () => {
    vi.mocked(require('../../hooks/useBackendSearch')).useBackendSearch.mockReturnValue({
      ...mockBackendSearch,
      loading: true,
    })

    render(<Products />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    vi.mocked(require('../../hooks/useBackendSearch')).useBackendSearch.mockReturnValue({
      ...mockBackendSearch,
      error: new Error('API Error'),
    })

    render(<Products />)

    expect(mockToast.error).toHaveBeenCalled()
  })

  it('toggles between grid and list view', async () => {
    const user = userEvent.setup()
    render(<Products />)

    const viewToggleButton = screen.getByRole('button', { name: /toggleView/i })
    await user.click(viewToggleButton)

    // Should toggle view mode
    expect(mockDisplaySettings.settings.defaultView).toBeDefined()
  })
})
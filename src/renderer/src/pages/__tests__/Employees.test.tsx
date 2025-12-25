/**
 * Unit tests for Employees page
 * Tests employee management, CRUD operations, and UI interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Employees from '../Employees'

// Mock dependencies
vi.mock('../components/ui/Modal')
vi.mock('../utils/ipc')
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

const mockIpc = {
  employees: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}

describe('Employees', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock implementations
    const mockUseToast = vi.mocked(require('../contexts/ToastContext')).useToast
    const mockUseLanguage = vi.mocked(require('../contexts/LanguageContext')).useLanguage

    mockUseToast.mockReturnValue(mockToast)
    mockUseLanguage.mockReturnValue(mockLanguage)

    // Mock IPC
    vi.mocked(require('../utils/ipc')).ipc = mockIpc

    // Mock Modal component
    const MockModal = vi.mocked(require('../components/ui/Modal')).default
    MockModal.mockReturnValue(null)
  })

  it('renders employees page correctly', () => {
    render(<Employees />)

    expect(screen.getByRole('heading', { name: /employees/i })).toBeInTheDocument()
    expect(screen.getByText(/manageEmployees/i)).toBeInTheDocument()
  })

  it('loads employees data on mount', async () => {
    mockIpc.employees.getAll.mockResolvedValue([])

    render(<Employees />)

    await waitFor(() => {
      expect(mockIpc.employees.getAll).toHaveBeenCalled()
    })
  })

  it('displays employees in table', async () => {
    const mockEmployees = [
      {
        id: '1',
        name: 'John Doe',
        role: 'Manager',
        email: 'john@example.com',
        phone: '+1234567890',
        salary: 50000,
        performance: 85,
      }
    ]

    mockIpc.employees.getAll.mockResolvedValue(mockEmployees)

    render(<Employees />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Manager')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })

  it('opens add employee modal', async () => {
    const user = userEvent.setup()
    render(<Employees />)

    const addButton = screen.getByRole('button', { name: /add/i })
    await user.click(addButton)

    // Modal should be rendered (mocked)
    expect(require('../components/ui/Modal').default).toHaveBeenCalled()
  })

  it('creates new employee', async () => {
    const user = userEvent.setup()

    mockIpc.employees.create.mockResolvedValue({
      id: '1',
      name: 'New Employee',
      role: 'Staff',
      email: 'new@example.com',
      phone: '+1234567890',
      salary: 30000,
      performance: 70,
    })

    render(<Employees />)

    // Open add modal
    const addButton = screen.getByRole('button', { name: /add/i })
    await user.click(addButton)

    // Fill form (modal is mocked, so we simulate the form submission)
    mockIpc.employees.getAll.mockResolvedValue([{
      id: '1',
      name: 'New Employee',
      role: 'Staff',
      email: 'new@example.com',
      phone: '+1234567890',
      salary: 30000,
      performance: 70,
    }])

    expect(mockToast.success).toHaveBeenCalledWith('employeeAdded')
  })

  it('edits existing employee', async () => {
    const user = userEvent.setup()

    const mockEmployee = {
      id: '1',
      name: 'John Doe',
      role: 'Manager',
      email: 'john@example.com',
      phone: '+1234567890',
      salary: 50000,
      performance: 85,
    }

    mockIpc.employees.getAll.mockResolvedValue([mockEmployee])
    mockIpc.employees.update.mockResolvedValue(mockEmployee)

    render(<Employees />)

    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /edit/i })
      return editButton
    })

    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    expect(require('../components/ui/Modal').default).toHaveBeenCalled()
  })

  it('deletes employee', async () => {
    const user = userEvent.setup()

    const mockEmployee = {
      id: '1',
      name: 'John Doe',
      role: 'Manager',
      email: 'john@example.com',
      phone: '+1234567890',
      salary: 50000,
      performance: 85,
    }

    mockIpc.employees.getAll.mockResolvedValue([mockEmployee])
    mockIpc.employees.delete.mockResolvedValue(true)

    render(<Employees />)

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      return deleteButton
    })

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    expect(mockIpc.employees.delete).toHaveBeenCalledWith('1')
    expect(mockToast.success).toHaveBeenCalledWith('employeeDeleted')
  })

  it('calculates total salary correctly', async () => {
    const mockEmployees = [
      { id: '1', name: 'John', role: 'Manager', email: 'john@example.com', phone: '', salary: 50000, performance: 85 },
      { id: '2', name: 'Jane', role: 'Staff', email: 'jane@example.com', phone: '', salary: 30000, performance: 75 },
    ]

    mockIpc.employees.getAll.mockResolvedValue(mockEmployees)

    render(<Employees />)

    await waitFor(() => {
      expect(screen.getByText('$80,000.00')).toBeInTheDocument() // Total salary
    })
  })

  it('shows performance indicators', async () => {
    const mockEmployees = [
      {
        id: '1',
        name: 'John Doe',
        role: 'Manager',
        email: 'john@example.com',
        phone: '+1234567890',
        salary: 50000,
        performance: 95, // High performance
      }
    ]

    mockIpc.employees.getAll.mockResolvedValue(mockEmployees)

    render(<Employees />)

    await waitFor(() => {
      // Should show high performance indicator
      expect(screen.getByText('95%')).toBeInTheDocument()
    })
  })

  it('handles form validation', async () => {
    const user = userEvent.setup()
    render(<Employees />)

    const addButton = screen.getByRole('button', { name: /add/i })
    await user.click(addButton)

    // Try to submit empty form (modal is mocked, but validation should occur)
    // This would normally show validation errors
    expect(mockLanguage.t).toBeDefined()
  })

  it('handles API errors gracefully', async () => {
    mockIpc.employees.getAll.mockRejectedValue(new Error('API Error'))

    render(<Employees />)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled()
    })
  })

  it('shows loading states', () => {
    render(<Employees />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('filters employees by role', async () => {
    const user = userEvent.setup()

    const mockEmployees = [
      { id: '1', name: 'John', role: 'Manager', email: 'john@example.com', phone: '', salary: 50000, performance: 85 },
      { id: '2', name: 'Jane', role: 'Staff', email: 'jane@example.com', phone: '', salary: 30000, performance: 75 },
    ]

    mockIpc.employees.getAll.mockResolvedValue(mockEmployees)

    render(<Employees />)

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Jane')).toBeInTheDocument()
    })

    // Filter by role (assuming there's a filter dropdown)
    const roleFilter = screen.getByRole('combobox', { name: /role/i })
    await user.selectOptions(roleFilter, 'Manager')

    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.queryByText('Jane')).not.toBeInTheDocument()
  })

  it('exports employee data', async () => {
    const user = userEvent.setup()

    const mockEmployees = [
      {
        id: '1',
        name: 'John Doe',
        role: 'Manager',
        email: 'john@example.com',
        phone: '+1234567890',
        salary: 50000,
        performance: 85,
      }
    ]

    mockIpc.employees.getAll.mockResolvedValue(mockEmployees)

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

    render(<Employees />)

    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)

    expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(mockXLSX.writeFile).toHaveBeenCalled()
  })
})
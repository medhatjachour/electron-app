/**
 * Unit tests for Dashboard page
 * Tests dashboard data loading, stats display, and component interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../Dashboard'

// Mock dependencies
vi.mock('../../contexts/AuthContext')
vi.mock('../../contexts/LanguageContext')
vi.mock('./components/DashboardStats')
vi.mock('./components/RecentActivity')
vi.mock('./components/QuickActions')
vi.mock('./components/SalesChart', () => ({ default: () => <div>SalesChart</div> }))
vi.mock('./components/TopProducts', () => ({ default: () => <div>TopProducts</div> }))
vi.mock('./components/InventoryAlerts', () => ({ default: () => <div>InventoryAlerts</div> }))
vi.mock('./components/GoalTracking', () => ({ default: () => <div>GoalTracking</div> }))
vi.mock('./components/NotificationCenter', () => ({ default: () => <div>NotificationCenter</div> }))
vi.mock('../../../../shared/utils/logger')

const mockAuth = {
  user: { id: '1', username: 'testuser', fullName: 'Test User' },
  logout: vi.fn(),
}

const mockLanguage = {
  t: vi.fn((key: string) => key), // Return key as translation for simplicity
}

// Mock window.api
const mockApi = {
  dashboard: {
    getStats: vi.fn(),
    getRecentActivity: vi.fn(),
  },
}

;(global.window as any).api = mockApi

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock implementations
    const mockUseAuth = vi.mocked(require('../../contexts/AuthContext')).useAuth
    const mockUseLanguage = vi.mocked(require('../../contexts/LanguageContext')).useLanguage

    mockUseAuth.mockReturnValue(mockAuth)
    mockUseLanguage.mockReturnValue(mockLanguage)

    // Mock dashboard components
    const MockDashboardStats = vi.mocked(require('./components/DashboardStats')).default
    const MockRecentActivity = vi.mocked(require('./components/RecentActivity')).default
    const MockQuickActions = vi.mocked(require('./components/QuickActions')).default

    MockDashboardStats.mockReturnValue(<div>DashboardStats</div>)
    MockRecentActivity.mockReturnValue(<div>RecentActivity</div>)
    MockQuickActions.mockReturnValue(<div>QuickActions</div>)
  })

  it('renders dashboard correctly', () => {
    render(<Dashboard />)

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByText(/welcomeBack/i)).toBeInTheDocument()
  })

  it('loads dashboard data on mount', async () => {
    mockApi.dashboard.getStats.mockResolvedValue({
      todayRevenue: 1000,
      todayOrders: 10,
      totalProducts: 50,
      lowStockItems: 5,
      totalCustomers: 25,
      revenueChange: 15.5,
      ordersChange: 8.2,
    })

    mockApi.dashboard.getRecentActivity.mockResolvedValue([])

    render(<Dashboard />)

    await waitFor(() => {
      expect(mockApi.dashboard.getStats).toHaveBeenCalled()
      expect(mockApi.dashboard.getRecentActivity).toHaveBeenCalled()
    })
  })

  it('displays loading state initially', () => {
    render(<Dashboard />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders dashboard components after loading', async () => {
    mockApi.dashboard.getStats.mockResolvedValue({
      todayRevenue: 1000,
      todayOrders: 10,
      totalProducts: 50,
      lowStockItems: 5,
      totalCustomers: 25,
      revenueChange: 15.5,
      ordersChange: 8.2,
    })

    mockApi.dashboard.getRecentActivity.mockResolvedValue([])

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('DashboardStats')).toBeInTheDocument()
      expect(screen.getByText('RecentActivity')).toBeInTheDocument()
      expect(screen.getByText('QuickActions')).toBeInTheDocument()
    })
  })

  it('handles refresh button click', async () => {
    const user = userEvent.setup()

    mockApi.dashboard.getStats.mockResolvedValue({
      todayRevenue: 1000,
      todayOrders: 10,
      totalProducts: 50,
      lowStockItems: 5,
      totalCustomers: 25,
      revenueChange: 15.5,
      ordersChange: 8.2,
    })

    mockApi.dashboard.getRecentActivity.mockResolvedValue([])

    render(<Dashboard />)

    await waitFor(() => {
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      return refreshButton
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    expect(mockApi.dashboard.getStats).toHaveBeenCalledTimes(2) // Initial load + refresh
  })

  it('shows refreshing state during data reload', async () => {
    const user = userEvent.setup()

    mockApi.dashboard.getStats.mockResolvedValue({
      todayRevenue: 1000,
      todayOrders: 10,
      totalProducts: 50,
      lowStockItems: 5,
      totalCustomers: 25,
      revenueChange: 15.5,
      ordersChange: 8.2,
    })

    mockApi.dashboard.getRecentActivity.mockResolvedValue([])

    render(<Dashboard />)

    await waitFor(() => {
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      return refreshButton
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })

    // Click refresh
    await user.click(refreshButton)

    // Should show refreshing state
    expect(refreshButton).toBeDisabled()
  })

  it('renders lazy-loaded components', async () => {
    mockApi.dashboard.getStats.mockResolvedValue({
      todayRevenue: 1000,
      todayOrders: 10,
      totalProducts: 50,
      lowStockItems: 5,
      totalCustomers: 25,
      revenueChange: 15.5,
      ordersChange: 8.2,
    })

    mockApi.dashboard.getRecentActivity.mockResolvedValue([])

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('SalesChart')).toBeInTheDocument()
      expect(screen.getByText('TopProducts')).toBeInTheDocument()
      expect(screen.getByText('InventoryAlerts')).toBeInTheDocument()
      expect(screen.getByText('GoalTracking')).toBeInTheDocument()
      expect(screen.getByText('NotificationCenter')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockApi.dashboard.getStats.mockRejectedValue(new Error('API Error'))

    render(<Dashboard />)

    await waitFor(() => {
      // Should still render but with error state or default values
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    })
  })

  it('auto-refreshes data periodically', async () => {
    vi.useFakeTimers()

    mockApi.dashboard.getStats.mockResolvedValue({
      todayRevenue: 1000,
      todayOrders: 10,
      totalProducts: 50,
      lowStockItems: 5,
      totalCustomers: 25,
      revenueChange: 15.5,
      ordersChange: 8.2,
    })

    mockApi.dashboard.getRecentActivity.mockResolvedValue([])

    render(<Dashboard />)

    // Initial load
    await waitFor(() => {
      expect(mockApi.dashboard.getStats).toHaveBeenCalledTimes(1)
    })

    // Fast-forward 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000)

    await waitFor(() => {
      expect(mockApi.dashboard.getStats).toHaveBeenCalledTimes(2)
    })

    vi.useRealTimers()
  })

  it('cleans up interval on unmount', () => {
    vi.useFakeTimers()

    mockApi.dashboard.getStats.mockResolvedValue({
      todayRevenue: 1000,
      todayOrders: 10,
      totalProducts: 50,
      lowStockItems: 5,
      totalCustomers: 25,
      revenueChange: 15.5,
      ordersChange: 8.2,
    })

    mockApi.dashboard.getRecentActivity.mockResolvedValue([])

    const { unmount } = render(<Dashboard />)

    // Clear timers on unmount
    unmount()

    vi.useRealTimers()
  })
})
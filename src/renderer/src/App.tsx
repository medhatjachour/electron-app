/**
 * Main Application Component
 * Features:
 * - Lazy Loading for Code Splitting
 * - Error Boundaries for graceful error handling
 * - Performance Monitoring
 * - Route-based Code Splitting
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, Component, ReactNode } from 'react'
import RootLayout from '../components/layout/RootLayout'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ToastProvider } from './contexts/ToastContext'
import PageLoader from './components/ui/PageLoader'
import Login from './pages/Login'

// Lazy load pages for optimal performance (code splitting)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Sales = lazy(() => import('./pages/Sales'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Finance = lazy(() => import('./pages/Finance'))
const Stores = lazy(() => import('./pages/Stores'))
const Products = lazy(() => import('./pages/Products'))
const POS = lazy(() => import('./pages/POS'))
const Employees = lazy(() => import('./pages/Employees'))
const Customers = lazy(() => import('./pages/Customers'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))

// Error Boundary for graceful error handling
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="glass-card p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => window.location.reload()} className="btn-primary px-6 py-2">
              Reload Application
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/dashboard"
                      element={
                        <RequireAuth>
                          <RootLayoutWrapper>
                            <Dashboard />
                          </RootLayoutWrapper>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/sales"
                      element={
                        <RequireAuth>
                          <RootLayoutWrapper>
                            <Sales />
                          </RootLayoutWrapper>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/inventory"
                      element={
                        <RequireAuth>
                          <RootLayoutWrapper>
                            <Inventory />
                          </RootLayoutWrapper>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/finance"
                      element={
                        <RequireAuth>
                          <RootLayoutWrapper>
                            <Finance />
                          </RootLayoutWrapper>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/stores"
                      element={
                        <RequireAuth>
                          <RootLayoutWrapper>
                            <Stores />
                          </RootLayoutWrapper>
                        </RequireAuth>
                      }
                    />
            <Route
              path="/products"
              element={
                <RequireAuth>
                  <RootLayoutWrapper>
                    <Products />
                  </RootLayoutWrapper>
                </RequireAuth>
              }
            />
            <Route
              path="/pos"
              element={
                <RequireAuth>
                  <RootLayoutWrapper>
                    <POS />
                  </RootLayoutWrapper>
                </RequireAuth>
              }
            />
            <Route
              path="/employees"
              element={
                <RequireAuth>
                  <RootLayoutWrapper>
                    <Employees />
                  </RootLayoutWrapper>
                </RequireAuth>
              }
            />
            <Route
              path="/customers"
              element={
                <RequireAuth>
                  <RootLayoutWrapper>
                    <Customers />
                  </RootLayoutWrapper>
                </RequireAuth>
              }
            />
            <Route
              path="/reports"
              element={
                <RequireAuth>
                  <RootLayoutWrapper>
                    <Reports />
                  </RootLayoutWrapper>
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <RootLayoutWrapper>
                    <Settings />
                  </RootLayoutWrapper>
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RootLayoutWrapper({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return <RootLayout userRole={user?.role || 'admin'}>{children}</RootLayout>
}

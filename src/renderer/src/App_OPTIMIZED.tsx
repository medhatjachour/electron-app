/**
 * App.tsx with Enterprise-Grade Optimizations
 * - Lazy Loading for Code Splitting
 * - Performance Monitoring
 * - Error Boundaries
 * - Route-based Code Splitting
 */

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, Suspense, lazy, useEffect } from 'react'
import RootLayout from '../components/layout/RootLayout'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ToastProvider } from './contexts/ToastContext'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { auditLogger } from './services/security'

// Lazy load pages for code splitting (Performance Optimization)
const Dashboard = lazy(() => import('./pages/Dashboard_OPTIMIZED'))
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

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading page...</p>
      </div>
    </div>
  )
}

// Error Boundary for graceful error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    auditLogger.log('error_boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="text-center max-w-md">
            <div className="glass-card p-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary px-6 py-2"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function LoginForm() {
  const [username, setUsername] = useState('0000')
  const [password, setPassword] = useState('0000')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Log page view
    auditLogger.log('page_view', { page: 'login' })
  }, [])

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      setError(null)
      setLoading(true)
      
      const startTime = performance.now()
      const user = await auth.login(username, password)
      const endTime = performance.now()

      if (user) {
        // Log successful login with performance metrics
        auditLogger.log('login_success', {
          username,
          duration: endTime - startTime,
        })
        navigate('/dashboard')
      } else {
        setError('Invalid credentials')
        auditLogger.log('login_failed', { username, reason: 'invalid_credentials' })
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed')
      auditLogger.log('login_error', { username, error: err?.message })
    } finally {
      setLoading(false)
    }
  }

  const demo = async () => {
    setUsername('0000')
    setPassword('0000')
    await handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900/20">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 space-y-6">
          {/* Logo/Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-slate-400">Sign in to SalesElectron</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Username</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-800 text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-800 text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800/50 text-slate-400">Quick access</span>
            </div>
          </div>

          {/* Demo Button */}
          <button onClick={demo} className="btn-secondary w-full py-2.5" disabled={loading}>
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              Demo Login (0000)
            </span>
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500">
            Secure desktop POS system • Version 2.0.0
          </p>
        </div>
      </div>
    </div>
  )
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
                    <Route path="/login" element={<LoginForm />} />
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
  
  useEffect(() => {
    if (user) {
      auditLogger.log('page_access', {
        userId: user.id,
        username: user.username,
        role: user.role,
      })
    }
  }, [user])

  if (!user) return <Navigate to="/login" replace />
  return children
}

function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return <RootLayout userRole={user?.role || 'admin'}>{children}</RootLayout>
}

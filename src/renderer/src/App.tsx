import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import RootLayout from '../components/layout/RootLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import Stores from './pages/Stores';
import Products from './pages/Products';
import POS from './pages/POS';
import Employees from './pages/Employees';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function LoginForm() {
  const [username, setUsername] = useState('0000')
  const [password, setPassword] = useState('0000')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const auth = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      setError(null)
      setLoading(true)
      const user = await auth.login(username, password)
      if (user) navigate('/dashboard')
      else setError('Invalid credentials')
    } catch (err: any) {
      setError(err?.message || 'Login failed')
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary-900/20">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 space-y-6">
          {/* Logo/Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-neutral-400">Sign in to SalesElectron</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error-300">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Username</label>
              <input
                className="input-field"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Password</label>
              <input
                className="input-field"
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-neutral-800/50 text-neutral-400">Quick access</span>
            </div>
          </div>

          {/* Demo Button */}
          <button 
            onClick={demo} 
            className="btn-secondary w-full py-2.5"
            disabled={loading}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Demo Login (0000)
            </span>
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-neutral-500">
            Secure desktop POS system • Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}

function DashboardPage({ role }: Readonly<{ role: string }>) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome, <span className="font-semibold">{role}</span>!</p>
      {/* Add charts, KPIs, etc. here */}
    </div>
  );
}

export default function AppRoutes() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
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
          </BrowserRouter>
        </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return <RootLayout userRole={user?.role || 'admin'}>{children}</RootLayout>
}

// ...existing code...

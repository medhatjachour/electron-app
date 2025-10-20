import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react'

type User = { id: string; username: string; role: string } | null

type AuthContextType = {
  user: User
  login: (username: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)

  const login = async (username: string, password: string) => {
    try {
      // Try using preload API if available
      // @ts-ignore
      if (typeof window !== 'undefined' && (window as any).api?.auth?.login) {
        // @ts-ignore
        const res = await (window as any).api.auth.login(username, password)
        setUser(res)
        return res
      }
    } catch (e) {
      console.error('API login failed', e)
    }

    // Fallback: mock user (admin)
    // Accept default dev credentials 0000/0000
    if (username === '0000' && password === '0000') {
      const mockDefault = { id: '0', username: '0000', role: 'admin' }
      setUser(mockDefault)
      return mockDefault
    }

    const mock = { id: '1', username, role: 'admin' }
    setUser(mock)
    return mock
  }

  const logout = () => {
    setUser(null)
    try {
      // @ts-ignore
      if (typeof globalThis !== 'undefined' && (globalThis as any).api?.auth?.logout) {
        // @ts-ignore
        ;(globalThis as any).api.auth.logout()
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('logout IPC failed', e)
    }
  }

  const value = useMemo(() => ({ user, login, logout }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

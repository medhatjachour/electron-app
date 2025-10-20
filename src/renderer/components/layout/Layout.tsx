import React from 'react'
import Sidebar from './Sidebar'
import { useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
  userRole: string
}

export default function Layout({ children, userRole }: LayoutProps) {
  const location = useLocation()

  // If we're on the login page, don't show the layout
  if (location.pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen">
      <Sidebar userRole={userRole} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">{children}</main>
    </div>
  )
}
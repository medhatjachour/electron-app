import React from 'react'

export default function Button({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * Customer search and selection component
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Customer } from './types'

type Props = {
  customers: Customer[]
  selectedCustomer: Customer | null
  customerQuery: string
  onSelectCustomer: (customer: Customer | null) => void
  onQueryChange: (query: string) => void
}

export default function CustomerSelect({
  customers,
  selectedCustomer,
  customerQuery,
  onSelectCustomer,
  onQueryChange
}: Props) {
  const [showDropdown, setShowDropdown] = useState(false)

  const filteredCustomers = (() => {
    if (!customerQuery.trim()) return []
    const query = customerQuery.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.includes(customerQuery)
    ).slice(0, 5)
  })()

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Customer (Optional)</label>
      <div className="relative">
        <input
          type="text"
          placeholder="Search or enter name..."
          className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors pr-8"
          value={selectedCustomer ? selectedCustomer.name : customerQuery}
          onChange={(e) => {
            onQueryChange(e.target.value)
            onSelectCustomer(null)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        />
        {selectedCustomer && (
          <button
            onClick={() => {
              onSelectCustomer(null)
              onQueryChange('')
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X size={14} />
          </button>
        )}
        
        {/* Customer Dropdown */}
        {showDropdown && filteredCustomers.length > 0 && !selectedCustomer && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  onSelectCustomer(customer)
                  onQueryChange('')
                  setShowDropdown(false)
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div className="text-sm font-medium text-slate-900 dark:text-white">{customer.name}</div>
                <div className="text-[10px] text-slate-500">{customer.email} • {customer.phone}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * QuickActions Component
 * Role-based quick action shortcuts
 */

import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  ClipboardList,
  Users,
  Store,
  UserCog,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'

interface Props {
  userRole: string
}

export default function QuickActions({ userRole }: Props) {
  const { user } = useAuth()
  const { warning } = useToast()
  const navigate = useNavigate()
  const allActions = [
    {
      label: 'New Sale',
      icon: ShoppingCart,
      href: '/pos',
      color: 'primary',
      roles: ['admin', 'manager', 'sales'],
    },
    {
      label: 'Add Product',
      icon: Plus,
      href: '/products',
      color: 'blue',
      roles: ['admin', 'manager', 'inventory'],
    },
    {
      label: 'Check Inventory',
      icon: ClipboardList,
      href: '/inventory',
      color: 'purple',
      roles: ['admin', 'manager', 'inventory'],
    },
    {
      label: 'View Reports',
      icon: BarChart3,
      href: '/finance',
      color: 'emerald',
      roles: ['admin', 'manager', 'finance'],
    },
    {
      label: 'Manage Customers',
      icon: Users,
      href: '/customers',
      color: 'amber',
      roles: ['admin', 'manager', 'sales'],
    },
    {
      label: 'Manage Stores',
      icon: Store,
      href: '/stores',
      color: 'indigo',
      roles: ['admin', 'manager'],
    },
    {
      label: 'Manage Employees',
      icon: UserCog,
      href: '/employees',
      color: 'pink',
      roles: ['admin', 'manager'],
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      color: 'slate',
      roles: ['admin', 'manager'],
    },
  ]

  const availableActions = allActions.filter(action => 
    action.roles.includes(userRole)
  )

  const colorClasses: Record<string, { bg: string; hover: string; icon: string }> = {
    primary: { bg: 'bg-primary/10', hover: 'hover:bg-primary/20', icon: 'text-primary' },
    blue: { bg: 'bg-blue-500/10', hover: 'hover:bg-blue-500/20', icon: 'text-blue-600' },
    purple: { bg: 'bg-purple-500/10', hover: 'hover:bg-purple-500/20', icon: 'text-purple-600' },
    emerald: { bg: 'bg-emerald-500/10', hover: 'hover:bg-emerald-500/20', icon: 'text-emerald-600' },
    amber: { bg: 'bg-amber-500/10', hover: 'hover:bg-amber-500/20', icon: 'text-amber-600' },
    indigo: { bg: 'bg-indigo-500/10', hover: 'hover:bg-indigo-500/20', icon: 'text-indigo-600' },
    pink: { bg: 'bg-pink-500/10', hover: 'hover:bg-pink-500/20', icon: 'text-pink-600' },
    slate: { bg: 'bg-slate-500/10', hover: 'hover:bg-slate-500/20', icon: 'text-slate-600' },
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {availableActions.slice(0, 6).map((action, index) => {
          const Icon = action.icon
          const colors = colorClasses[action.color]
          
          return (
            <button
              key={index}
              onClick={() => {
                if (!user) {
                  warning('Please log in to access this feature', 4000)
                } else {
                  navigate(action.href)
                }
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-lg ${colors.bg} ${colors.hover} transition-colors group cursor-pointer border-0`}
            >
              <Icon className={`w-6 h-6 ${colors.icon} mb-1 group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

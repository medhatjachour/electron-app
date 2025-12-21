import React, { useEffect, useState } from 'react'
import { Bell, AlertTriangle, X } from 'lucide-react'

interface NotificationItem {
  id: string
  type: 'reminder' | 'overdue'
  message: string
  customerName?: string
  amount?: number
  dueDate?: string
}

interface NotificationsProps {
  onClose?: () => void
}

export const Notifications: React.FC<NotificationsProps> = ({ onClose: _onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [reminders, overdue] = await Promise.all([
          window.api.installments.getUpcomingReminders(7),
          window.api.installments.getOverdue()
        ])

        const notificationItems: NotificationItem[] = []

        reminders.forEach((reminder: any) => {
          notificationItems.push({
            id: `reminder-${reminder.id}`,
            type: 'reminder',
            message: `Payment due soon for ${reminder.customer?.name || 'Unknown Customer'}`,
            customerName: reminder.customer?.name,
            amount: reminder.amount,
            dueDate: reminder.dueDate
          })
        })

        overdue.forEach((item: any) => {
          notificationItems.push({
            id: `overdue-${item.id}`,
            type: 'overdue',
            message: `Overdue payment for ${item.customer?.name || 'Unknown Customer'}`,
            customerName: item.customer?.name,
            amount: item.amount,
            dueDate: item.dueDate
          })
        })

        setNotifications(notificationItems)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        <Bell size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No notifications</p>
      </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="p-4 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border ${
              notification.type === 'overdue'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                {notification.type === 'overdue' ? (
                  <AlertTriangle className="text-red-500 mt-0.5" size={16} />
                ) : (
                  <Bell className="text-yellow-500 mt-0.5" size={16} />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {notification.message}
                  </p>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {notification.amount && `Amount: $${notification.amount.toFixed(2)}`}
                    {notification.dueDate && ` • Due: ${new Date(notification.dueDate).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
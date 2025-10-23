/**
 * InventoryAlerts Component
 * Low stock and out of stock alerts
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Package, ArrowRight } from 'lucide-react'

export default function InventoryAlerts() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      // @ts-ignore
      const lowStock = await (globalThis as any).api?.inventory?.getLowStock(10)
      setAlerts((lowStock || []).slice(0, 5))
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" />
          Inventory Alerts
        </h3>
        <Link
          to="/inventory"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View All
          <ArrowRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="p-1.5 rounded bg-amber-500/10 mt-0.5">
                <Package size={14} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {item.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stock: {item.totalStock} units • {item.baseSKU}
                </p>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400">
                Low
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            All inventory levels are healthy
          </p>
        </div>
      )}
    </div>
  )
}

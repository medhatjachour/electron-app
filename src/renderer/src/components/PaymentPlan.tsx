import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Installment {
  id: string
  amount: number
  dueDate: string
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  paidDate?: string
  notes?: string
}

interface Deposit {
  id: string
  amount: number
  paidDate: string
  status: 'PAID'
  notes?: string
}

interface PaymentPlanProps {
  customerId: string
  saleId?: string
  refreshTrigger?: number
}

export const PaymentPlan: React.FC<PaymentPlanProps> = ({
  customerId,
  saleId,
  refreshTrigger = 0
}) => {
  const { showToast } = useToast()
  const [installments, setInstallments] = useState<Installment[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  const loadPaymentPlan = async () => {
    if (!customerId) return

    try {
      setLoading(true)

      // Load deposits and installments for this customer
      const [depositsResult, installmentsResult] = await Promise.all([
        (window as any).api.deposits.getByCustomer(customerId),
        (window as any).api.installments.getByCustomer(customerId)
      ])

      // Filter for deposits/installments linked to this sale if saleId is provided
      const filteredDeposits = saleId
        ? depositsResult.filter((d: any) => d.saleId === saleId)
        : depositsResult

      const filteredInstallments = saleId
        ? installmentsResult.filter((i: any) => i.saleId === saleId)
        : installmentsResult

      setDeposits(filteredDeposits || [])
      setInstallments(filteredInstallments || [])
    } catch (error) {
      console.error('Error loading payment plan:', error)
      showToast('error', 'Failed to load payment plan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPaymentPlan()
  }, [customerId, saleId, refreshTrigger])

  const markInstallmentAsPaid = async (installmentId: string) => {
    try {
      setMarkingPaid(installmentId)

      const result = await (window as any).api.installments.markAsPaid({
        installmentId: installmentId,
        paidDate: new Date().toISOString()
      })

      if (result.success) {
        showToast('success', 'Installment marked as paid')
        loadPaymentPlan() // Refresh the data
      } else {
        throw new Error(result.error || 'Failed to mark installment as paid')
      }
    } catch (error) {
      console.error('Error marking installment as paid:', error)
      showToast('error', 'Failed to mark installment as paid')
    } finally {
      setMarkingPaid(null)
    }
  }

  const getStatusColor = (status: string, dueDate?: string) => {
    const today = new Date()
    const due = dueDate ? new Date(dueDate) : null

    if (status === 'PAID') {
      return 'text-green-600 dark:text-green-400'
    }

    if (status === 'OVERDUE' || (due && due < today && status === 'PENDING')) {
      return 'text-red-600 dark:text-red-400'
    }

    return 'text-slate-600 dark:text-slate-400'
  }

  const getStatusIcon = (status: string, dueDate?: string) => {
    const today = new Date()
    const due = dueDate ? new Date(dueDate) : null

    if (status === 'PAID') {
      return <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
    }

    if (status === 'OVERDUE' || (due && due < today && status === 'PENDING')) {
      return <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
    }

    return <Clock size={16} className="text-slate-600 dark:text-slate-400" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalDeposits = deposits.reduce((sum, deposit) => sum + deposit.amount, 0)
  const totalInstallments = installments.reduce((sum, installment) => sum + installment.amount, 0)
  const pendingInstallments = installments.filter(i => i.status === 'PENDING')

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-800 dark:text-green-200">Deposits</span>
          </div>
          <div className="text-lg font-bold text-green-900 dark:text-green-100">
            ${totalDeposits.toFixed(2)}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-800 dark:text-blue-200">Installments</span>
          </div>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
            ${totalInstallments.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Deposits List */}
      {deposits.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">
            Deposits Paid
          </h5>
          <div className="space-y-2">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-medium text-green-900 dark:text-green-100">
                      ${deposit.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      Paid on {formatDate(deposit.paidDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Installments List */}
      {installments.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">
            Installments ({pendingInstallments.length} pending)
          </h5>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {installments.map((installment) => (
              <div key={installment.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                installment.status === 'PAID'
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  : installment.status === 'OVERDUE' || (new Date(installment.dueDate) < new Date() && installment.status === 'PENDING')
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  {getStatusIcon(installment.status, installment.dueDate)}
                  <div>
                    <div className={`font-medium ${getStatusColor(installment.status, installment.dueDate)}`}>
                      ${installment.amount.toFixed(2)}
                    </div>
                    <div className={`text-xs ${getStatusColor(installment.status, installment.dueDate)}`}>
                      Due: {formatDate(installment.dueDate)}
                      {installment.status === 'PAID' && installment.paidDate && (
                        <span className="ml-2">• Paid: {formatDate(installment.paidDate)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {installment.status === 'PENDING' && (
                  <button
                    onClick={() => markInstallmentAsPaid(installment.id)}
                    disabled={markingPaid === installment.id}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {markingPaid === installment.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                    ) : (
                      <CheckCircle size={12} />
                    )}
                    Mark Paid
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {installments.length === 0 && deposits.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Calendar size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No payment plan set up yet</p>
          <p className="text-xs mt-1">Add deposits and installments to get started</p>
        </div>
      )}
    </div>
  )
}
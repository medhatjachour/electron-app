import { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import { Line } from 'react-chartjs-2'

export default function Finance() {
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    // mock transactions
    setTransactions([
      { id: 't1', type: 'income', amount: 1000 },
      { id: 't2', type: 'expense', amount: 200 }
    ])
  }, [])

  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [
      { label: 'Income', data: [1000, 1200, 900, 1500], borderColor: 'green', backgroundColor: 'rgba(34,197,94,0.2)' }
    ]
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Finance</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-2">Income / Expenses</h3>
          <Line data={data as any} />
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">Recent Transactions</h3>
          <div className="space-y-2">
            {transactions.map(t => <div key={t.id} className="p-2 border rounded">{t.type} — ${t.amount}</div>)}
          </div>
        </Card>
      </div>
    </div>
  )
}

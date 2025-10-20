import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Layout from '../components/Layout';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  createdAt: string;
}

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const transactions = await window.api.transactions.getAll();
      setTransactions(transactions);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.api.transactions.create({
        type,
        amount: Number(amount),
        description,
      });
      await loadTransactions();
      setAmount('');
      setDescription('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDateFilter = async () => {
    try {
      const filteredTransactions = await window.api.transactions.getByDateRange(
        startDate,
        endDate
      );
      setTransactions(filteredTransactions);
    } catch (err) {
      console.error('Error filtering transactions:', err);
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const profitLoss = totalIncome - totalExpenses;

  const chartData = {
    labels: transactions.map((t) => new Date(t.createdAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Income',
        data: transactions
          .filter((t) => t.type === 'income')
          .map((t) => t.amount),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Expenses',
        data: transactions
          .filter((t) => t.type === 'expense')
          .map((t) => t.amount),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Financial Management</h1>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-green-800">Total Income</h3>
            <p className="text-2xl font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-red-800">Total Expenses</h3>
            <p className="text-2xl font-bold text-red-600">
              ${totalExpenses.toFixed(2)}
            </p>
          </div>
          <div
            className={`p-6 rounded-lg shadow-md ${
              profitLoss >= 0 ? 'bg-blue-50' : 'bg-yellow-50'
            }`}
          >
            <h3 className="text-lg font-medium">Net Profit/Loss</h3>
            <p
              className={`text-2xl font-bold ${
                profitLoss >= 0 ? 'text-blue-600' : 'text-yellow-600'
              }`}
            >
              ${Math.abs(profitLoss).toFixed(2)}
              {profitLoss >= 0 ? ' Profit' : ' Loss'}
            </p>
          </div>
        </div>

        {/* Add Transaction Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Record Transaction</h2>
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Transaction
            </button>
          </form>
        </div>

        {/* Financial Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Financial Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              onClick={handleDateFilter}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Filter
            </button>
          </div>
          <Line data={chartData} />
        </div>

        {/* Transactions Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
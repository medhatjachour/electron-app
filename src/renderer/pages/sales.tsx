import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Layout from '../components/Layout';

interface Sale {
  id: string;
  product: {
    name: string;
    price: number;
  };
  quantity: number;
  total: number;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadProducts();
    loadSales();
  }, []);

  const loadProducts = async () => {
    try {
      const products = await window.api.products.getAll();
      setProducts(products);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const loadSales = async () => {
    try {
      const sales = await window.api.sales.getAll();
      setSales(sales);
    } catch (err) {
      console.error('Error loading sales:', err);
    }
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.api.sales.create({
        productId: selectedProduct,
        quantity: quantity
      });
      await loadSales();
      await loadProducts();
      setSelectedProduct('');
      setQuantity(1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDateFilter = async () => {
    try {
      const filteredSales = await window.api.sales.getByDateRange(startDate, endDate);
      setSales(filteredSales);
    } catch (err) {
      console.error('Error filtering sales:', err);
    }
  };

  const chartData = {
    labels: sales.map(sale => new Date(sale.createdAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Sales Amount',
        data: sales.map(sale => sale.total),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Sales Management</h1>

        {/* Create Sale Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Record New Sale</h2>
          <form onSubmit={handleCreateSale} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (${product.price}) - Stock: {product.stock}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantity
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Sale
            </button>
          </form>
        </div>

        {/* Sales History Filter */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Sales History</h2>
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
        </div>

        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Sales Performance</h2>
          <Line data={chartData} />
        </div>

        {/* Sales Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Sales</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{sale.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${sale.total.toFixed(2)}
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
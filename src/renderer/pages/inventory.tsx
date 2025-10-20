import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
    loadLowStockProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const products = await window.api.products.getAll();
      setProducts(products);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const loadLowStockProducts = async () => {
    try {
      const products = await window.api.products.getLowStock();
      setLowStockProducts(products);
    } catch (err) {
      console.error('Error loading low stock products:', err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.api.products.create({
        name,
        sku,
        price: Number(price),
        stock: Number(stock),
      });
      await loadProducts();
      setName('');
      setSku('');
      setPrice('');
      setStock('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      await window.api.products.update(id, { stock: newStock });
      await loadProducts();
      await loadLowStockProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Inventory Management</h1>

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold text-red-700 mb-4">
              Low Stock Alerts
            </h2>
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-4 bg-white rounded-md"
                >
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <span className="text-gray-500 ml-2">({product.sku})</span>
                  </div>
                  <span className="text-red-600">Stock: {product.stock}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Product Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SKU
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Initial Stock
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Product
            </button>
          </form>
        </div>

        {/* Products Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Product List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={product.stock}
                        onChange={(e) =>
                          handleUpdateStock(product.id, Number(e.target.value))
                        }
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleUpdateStock(product.id, product.stock + 1)
                        }
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        +
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStock(product.id, Math.max(0, product.stock - 1))
                        }
                        className="text-red-600 hover:text-red-900"
                      >
                        -
                      </button>
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
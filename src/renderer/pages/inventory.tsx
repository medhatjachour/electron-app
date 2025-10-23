import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import Pagination from '../src/components/Pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const ITEMS_PER_PAGE = 50;

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

  // Filter and paginate products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Inventory Management</h1>

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg shadow-md mb-8 border border-red-200 dark:border-red-800">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">
              Low Stock Alerts
            </h2>
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-md border border-red-100 dark:border-red-900"
                >
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">{product.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">({product.sku})</span>
                  </div>
                  <span className="text-red-600 dark:text-red-400 font-semibold">Stock: {product.stock}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Product Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Add New Product</h2>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-2">
                SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-2">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-2">
                Initial Stock
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Add Product
            </button>
          </form>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Product List</h2>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-64"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white font-medium">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white font-semibold">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={product.stock}
                        onChange={(e) =>
                          handleUpdateStock(product.id, Number(e.target.value))
                        }
                        className="w-20 px-3 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleUpdateStock(product.id, product.stock + 1)
                        }
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-3 font-bold text-lg"
                      >
                        +
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStock(product.id, Math.max(0, product.stock - 1))
                        }
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold text-lg"
                      >
                        -
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="products"
          />
        </div>
      </div>
    </Layout>
  );
}
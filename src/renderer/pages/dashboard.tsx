import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

declare global {
  interface Window {
    api: {
      sales: {
        getByDateRange: (startDate: string, endDate: string) => Promise<any>;
      };
      products: {
        getLowStock: () => Promise<any>;
      };
    };
  }
}

interface Sale {
  total: number;
  createdAt: string;
}

interface Product {
  name: string;
  stock: number;
}

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get last 7 days of sales
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const salesData = await window.api.sales.getByDateRange(
          startDate.toISOString(),
          endDate.toISOString()
        );
        setSales(salesData);

        // Get low stock products
        const products = await window.api.products.getLowStock();
        setLowStockProducts(products);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchData();
  }, []);

  const salesChartData = {
    labels: sales.map(sale => 
      new Date(sale.createdAt).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Daily Sales',
        data: sales.map(sale => sale.total),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Sales Last 7 Days</h2>
          <Line data={salesChartData} />
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Low Stock Alerts</h2>
          <div className="space-y-4">
            {lowStockProducts.map((product) => (
              <div
                key={product.name}
                className="flex justify-between items-center p-4 bg-red-50 rounded-md"
              >
                <span className="font-medium">{product.name}</span>
                <span className="text-red-600">Stock: {product.stock}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
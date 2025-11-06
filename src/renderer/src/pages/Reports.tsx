import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Users,
  Calendar,
  Printer,
  FileSpreadsheet,
  BarChart3,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';

interface QuickInsights {
  todayRevenue: number;
  todayOrders: number;
  lowStockItems: number;
  newCustomers: number;
}

interface ReportFormState {
  reportType: 'sales' | 'inventory' | 'financial' | 'customer' | null;
  startDate: string;
  endDate: string;
}

const Reports: React.FC = () => {
  const { error, success } = useToast();
  const [loading, setLoading] = useState(false);
  const [quickInsights, setQuickInsights] = useState<QuickInsights | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [reportForm, setReportForm] = useState<ReportFormState>({
    reportType: null,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadQuickInsights();
  }, []);

  const loadQuickInsights = async () => {
    try {
      const response = await window.api.reports.getQuickInsights();
      if (response.success && response.data) {
        setQuickInsights(response.data);
      } else {
        console.error('Failed to load quick insights:', response.error);
        error('Failed to load quick insights');
      }
    } catch (err) {
      console.error('Failed to load quick insights:', err);
      error('Failed to load quick insights');
    }
  };

  const handleGenerateReport = async () => {
    if (!reportForm.reportType) return;

    setLoading(true);
    try {
      const options = {
        startDate: new Date(reportForm.startDate),
        endDate: new Date(reportForm.endDate)
      };

      let response;
      switch (reportForm.reportType) {
        case 'sales':
          response = await window.api.reports.getSalesData(options);
          break;
        case 'inventory':
          response = await window.api.reports.getInventoryData(options);
          break;
        case 'financial':
          response = await window.api.reports.getFinancialData(options);
          break;
        case 'customer':
          response = await window.api.reports.getCustomerData(options);
          break;
      }

      if (response.success && response.data) {
        setReportData(response.data);
        setShowPreview(true);
        success('Report generated successfully');
      } else {
        console.error('Failed to generate report:', response.error);
        error(response.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!reportData || !reportForm.reportType) return;

    // Create a hidden iframe for printing instead of popup
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      error('Failed to create print preview');
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(generateReportHTML());
    iframeDoc.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
    
    success('Print dialog opened');
  };

  const handleExportCSV = () => {
    if (!reportData || !reportForm.reportType) return;

    let csvContent = '';
    switch (reportForm.reportType) {
      case 'sales':
        csvContent = generateSalesCSV();
        break;
      case 'inventory':
        csvContent = generateInventoryCSV();
        break;
      case 'financial':
        csvContent = generateFinancialCSV();
        break;
      case 'customer':
        csvContent = generateCustomerCSV();
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportForm.reportType}-report-${reportForm.startDate}-to-${reportForm.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    success('Report exported as CSV');
  };

  const generateReportHTML = () => {
    const title = reportForm.reportType?.toUpperCase() + ' REPORT';
    const dateRange = `${reportForm.startDate} to ${reportForm.endDate}`;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #1e40af; margin-bottom: 10px; }
    .date-range { color: #64748b; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background-color: #f1f5f9; font-weight: 600; }
    .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-item { margin: 10px 0; }
    .label { font-weight: 600; color: #64748b; }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="date-range">Period: ${dateRange}</div>
  ${generateReportContent()}
</body>
</html>
    `;
  };

  const generateReportContent = () => {
    if (!reportData || !reportForm.reportType) return '';

    switch (reportForm.reportType) {
      case 'sales':
        return `
          <div class="summary">
            <div class="summary-item"><span class="label">Total Revenue:</span> ${formatCurrency(reportData.summary?.totalRevenue || 0)}</div>
            <div class="summary-item"><span class="label">Total Sales:</span> ${reportData.summary?.totalSales || 0}</div>
            <div class="summary-item"><span class="label">Average Order Value:</span> ${formatCurrency(reportData.summary?.averageOrderValue || 0)}</div>
          </div>
          <h2>Top Products</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${(reportData.topProducts || []).map((p: any) => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.quantity}</td>
                  <td>${formatCurrency(p.revenue)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      
      case 'inventory':
        return `
          <div class="summary">
            <div class="summary-item"><span class="label">Total Inventory Value:</span> ${formatCurrency(reportData.summary?.totalValue || 0)}</div>
            <div class="summary-item"><span class="label">Total Products:</span> ${reportData.summary?.totalProducts || 0}</div>
            <div class="summary-item"><span class="label">Low Stock Items:</span> ${reportData.summary?.lowStockCount || 0}</div>
            <div class="summary-item"><span class="label">Out of Stock:</span> ${reportData.summary?.outOfStockCount || 0}</div>
          </div>
          <h2>Inventory by Category</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Stock</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(reportData.byCategory || {}).map(([category, data]: [string, any]) => `
                <tr>
                  <td>${category}</td>
                  <td>${data.count}</td>
                  <td>${formatNumber(data.stock)}</td>
                  <td>${formatCurrency(data.value)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      
      case 'financial':
        return `
          <div class="summary">
            <div class="summary-item"><span class="label">Total Revenue:</span> ${formatCurrency(reportData.summary?.totalRevenue || 0)}</div>
            <div class="summary-item"><span class="label">Total Expenses:</span> ${formatCurrency(reportData.summary?.totalExpenses || 0)}</div>
            <div class="summary-item"><span class="label">Net Profit:</span> ${formatCurrency(reportData.summary?.netProfit || 0)}</div>
            <div class="summary-item"><span class="label">Profit Margin:</span> ${reportData.summary?.profitMargin || 0}%</div>
          </div>
          <h2>Daily Financial Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Expenses</th>
                <th>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              ${(reportData.dailyBreakdown || []).map((d: any) => `
                <tr>
                  <td>${d.date}</td>
                  <td>${formatCurrency(d.revenue)}</td>
                  <td>${formatCurrency(d.expenses)}</td>
                  <td>${formatCurrency(d.netProfit)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      
      case 'customer':
        return `
          <div class="summary">
            <div class="summary-item"><span class="label">Total Customers:</span> ${reportData.summary?.totalCustomers || 0}</div>
            <div class="summary-item"><span class="label">Total Spent:</span> ${formatCurrency(reportData.summary?.totalSpent || 0)}</div>
            <div class="summary-item"><span class="label">Average Spent per Customer:</span> ${formatCurrency(reportData.summary?.averageSpent || 0)}</div>
          </div>
          <h2>Top Customers</h2>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Loyalty Tier</th>
                <th>Total Spent</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              ${(reportData.topCustomers || []).map((c: any) => `
                <tr>
                  <td>${c.name}</td>
                  <td>${c.loyaltyTier}</td>
                  <td>${formatCurrency(c.totalSpent)}</td>
                  <td>${c.orderCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      
      default:
        return '';
    }
  };

  const generateSalesCSV = () => {
    const headers = 'Product,Quantity Sold,Revenue\n';
    const rows = (reportData.topProducts || []).map((p: any) => 
      `"${p.name}",${p.quantity},${p.revenue}`
    ).join('\n');
    return headers + rows;
  };

  const generateInventoryCSV = () => {
    const headers = 'Category,Products,Stock,Total Value\n';
    const rows = Object.entries(reportData.byCategory || {}).map(([category, data]: [string, any]) => 
      `"${category}",${data.count},${data.stock},${data.value}`
    ).join('\n');
    return headers + rows;
  };

  const generateFinancialCSV = () => {
    const headers = 'Date,Revenue,Expenses,Net Profit\n';
    const rows = (reportData.dailyBreakdown || []).map((d: any) => 
      `${d.date},${d.revenue},${d.expenses},${d.netProfit}`
    ).join('\n');
    return headers + rows;
  };

  const generateCustomerCSV = () => {
    const headers = 'Customer,Loyalty Tier,Total Spent,Orders\n';
    const rows = (reportData.topCustomers || []).map((c: any) => 
      `"${c.name}","${c.loyaltyTier}",${c.totalSpent},${c.orderCount}`
    ).join('\n');
    return headers + rows;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const reportTypes = [
    {
      id: 'sales',
      title: 'Sales Report',
      description: 'Detailed sales analysis with revenue breakdown',
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      id: 'inventory',
      title: 'Inventory Report',
      description: 'Stock levels, values, and low stock alerts',
      icon: Package,
      color: 'text-green-600'
    },
    {
      id: 'financial',
      title: 'Financial Report',
      description: 'Revenue, expenses, and profit analysis',
      icon: DollarSign,
      color: 'text-purple-600'
    },
    {
      id: 'customer',
      title: 'Customer Report',
      description: 'Customer analytics and loyalty insights',
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Business Reports</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Generate comprehensive reports and analytics
          </p>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Today's Revenue</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {quickInsights ? formatCurrency(quickInsights.todayRevenue) : '$0.00'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Today's Orders</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {quickInsights ? quickInsights.todayOrders : '0'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Low Stock Items</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {quickInsights ? quickInsights.lowStockItems : '0'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">New Customers (30d)</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {quickInsights ? quickInsights.newCustomers : '0'}
          </p>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => setReportForm({ ...reportForm, reportType: report.id as any })}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${report.color.replace('text-', 'bg-').replace('600', '500/10')}`}>
                  <Icon className={`w-7 h-7 ${report.color.replace('600', '600 dark:').replace('600 dark:', '600 dark:text-').replace('600 dark:text-', '600 dark:text-') + '400'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{report.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{report.description}</p>
                  <button
                    className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm group-hover:gap-3 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportForm({ ...reportForm, reportType: report.id as any });
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate Report Modal */}
      {reportForm.reportType && (
        <Modal
          isOpen={!!reportForm.reportType && !showPreview}
          onClose={() => setReportForm({ ...reportForm, reportType: null })}
          title={`Generate ${reportTypes.find(r => r.id === reportForm.reportType)?.title}`}
        >
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={reportForm.startDate}
                    onChange={(e) => setReportForm({ ...reportForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">End Date</label>
                  <input
                    type="date"
                    value={reportForm.endDate}
                    onChange={(e) => setReportForm({ ...reportForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="flex-1 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
              <button
                onClick={() => setReportForm({ ...reportForm, reportType: null })}
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Report Preview Modal */}
      {showPreview && reportData && (
        <Modal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setReportData(null);
            setReportForm({ ...reportForm, reportType: null });
          }}
          title={`${reportTypes.find(r => r.id === reportForm.reportType)?.title} - Preview`}
        >
          <div className="space-y-4">
            {/* Summary Section */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-6 rounded-lg border border-primary/20">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                {reportForm.reportType === 'sales' && (
                  <>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(reportData.summary?.totalRevenue || 0)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Sales</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {reportData.summary?.totalSales || 0}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Avg Order Value</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(reportData.summary?.averageOrderValue || 0)}
                      </p>
                    </div>
                  </>
                )}
                
                {reportForm.reportType === 'inventory' && (
                  <>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Value</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(reportData.summary?.totalValue || 0)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Products</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {reportData.summary?.totalProducts || 0}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Low Stock</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {reportData.summary?.lowStockCount || 0}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Out of Stock</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {reportData.summary?.outOfStockCount || 0}
                      </p>
                    </div>
                  </>
                )}
                
                {reportForm.reportType === 'financial' && (
                  <>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(reportData.summary?.totalRevenue || 0)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(reportData.summary?.totalExpenses || 0)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Net Profit</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(reportData.summary?.netProfit || 0)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Profit Margin</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {reportData.summary?.profitMargin || 0}%
                      </p>
                    </div>
                  </>
                )}
                
                {reportForm.reportType === 'customer' && (
                  <>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Customers</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {reportData.summary?.totalCustomers || 0}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Spent</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(reportData.summary?.totalSpent || 0)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm col-span-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Avg Spent per Customer</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(reportData.summary?.averageSpent || 0)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Detailed Data Table */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Detailed Breakdown</h3>
              
              {reportForm.reportType === 'sales' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Product</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {(reportData.topProducts || []).map((p: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{p.name}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-medium">{p.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-semibold">{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {reportForm.reportType === 'inventory' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Products</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {Object.entries(reportData.byCategory || {}).map(([category, data]: [string, any], i: number) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{category}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-medium">{data.count}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-medium">{formatNumber(data.stock)}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-semibold">{formatCurrency(data.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {reportForm.reportType === 'financial' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Date</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Expenses</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {(reportData.dailyBreakdown || []).map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{d.date}</td>
                          <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400 font-medium">{formatCurrency(d.revenue)}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400 font-medium">{formatCurrency(d.expenses)}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-semibold">{formatCurrency(d.netProfit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {reportForm.reportType === 'customer' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Tier</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Spent</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {(reportData.topCustomers || []).map((c: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{c.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {c.loyaltyTier}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-semibold">{formatCurrency(c.totalSpent)}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-medium">{c.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleExportPDF}
                className="flex-1 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print / Save as PDF
              </button>
              <button
                onClick={handleExportCSV}
                className="flex-1 bg-green-600 dark:bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setReportData(null);
                  setReportForm({ ...reportForm, reportType: null });
                }}
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Reports;

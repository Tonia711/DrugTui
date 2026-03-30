import { useState } from "react";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Building2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedReport, setSelectedReport] = useState("inventory");

  // Sample data for charts
  const inventoryTrendData = [
    { month: "Jan", total: 850, inStock: 720, lowStock: 95, expired: 35 },
    { month: "Feb", total: 890, inStock: 755, lowStock: 100, expired: 35 },
    { month: "Mar", total: 920, inStock: 780, lowStock: 105, expired: 35 },
    { month: "Apr", total: 950, inStock: 810, lowStock: 105, expired: 35 },
    { month: "May", total: 985, inStock: 840, lowStock: 110, expired: 35 },
    { month: "Jun", total: 1020, inStock: 870, lowStock: 115, expired: 35 },
  ];

  const procurementData = [
    { month: "Jan", orders: 25, value: 45000 },
    { month: "Feb", orders: 28, value: 52000 },
    { month: "Mar", orders: 32, value: 58000 },
    { month: "Apr", orders: 30, value: 54000 },
    { month: "May", orders: 35, value: 63000 },
    { month: "Jun", orders: 38, value: 68000 },
  ];

  const departmentRequestData = [
    { name: "Emergency", value: 145 },
    { name: "ICU", value: 98 },
    { name: "Surgery", value: 86 },
    { name: "Pediatrics", value: 72 },
    { name: "Cardiology", value: 64 },
  ];

  const categoryDistribution = [
    { name: "Antibiotics", value: 320 },
    { name: "Analgesics", value: 280 },
    { name: "Cardiovascular", value: 195 },
    { name: "Respiratory", value: 145 },
    { name: "Others", value: 80 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const handleExportReport = (reportType) => {
    console.log(`Exporting ${reportType} report for period: ${selectedPeriod}`);
    alert(`${reportType} report exported successfully!`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FileText size={14} />
          <span>Reports</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last 12 Months</option>
          </select>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setSelectedReport("inventory")}
              className={`flex items-center gap-2 px-6 py-3 text-xs transition-colors border-b-2 ${
                selectedReport === "inventory"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Package size={14} />
              Inventory Report
            </button>
            <button
              onClick={() => setSelectedReport("procurement")}
              className={`flex items-center gap-2 px-6 py-3 text-xs transition-colors border-b-2 ${
                selectedReport === "procurement"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <DollarSign size={14} />
              Procurement Report
            </button>
            <button
              onClick={() => setSelectedReport("department")}
              className={`flex items-center gap-2 px-6 py-3 text-xs transition-colors border-b-2 ${
                selectedReport === "department"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Building2 size={14} />
              Department Report
            </button>
            <button
              onClick={() => setSelectedReport("financial")}
              className={`flex items-center gap-2 px-6 py-3 text-xs transition-colors border-b-2 ${
                selectedReport === "financial"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <TrendingUp size={14} />
              Financial Summary
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Report */}
      {selectedReport === "inventory" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Total Items</div>
                <Package size={14} className="text-blue-500" />
              </div>
              <div className="text-sm text-gray-900">1,020</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-green-600">
                  +3.4% from last month
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">In Stock</div>
                <Package size={14} className="text-green-500" />
              </div>
              <div className="text-sm text-gray-900">870</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-green-600">
                  +3.6% from last month
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Low Stock</div>
                <Package size={14} className="text-yellow-500" />
              </div>
              <div className="text-sm text-gray-900">115</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-yellow-500" />
                <span className="text-xs text-yellow-600">
                  +4.5% from last month
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Expired</div>
                <Package size={14} className="text-red-500" />
              </div>
              <div className="text-sm text-gray-900">35</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-gray-600">No change</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Inventory Trend */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-900">Inventory Trend</h3>
                <button
                  onClick={() => handleExportReport("Inventory Trend")}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <Download size={12} />
                  Export
                </button>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={inventoryTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Total Items"
                  />
                  <Line
                    type="monotone"
                    dataKey="inStock"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="In Stock"
                  />
                  <Line
                    type="monotone"
                    dataKey="lowStock"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Low Stock"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-900">Category Distribution</h3>
                <button
                  onClick={() => handleExportReport("Category Distribution")}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <Download size={12} />
                  Export
                </button>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={() => handleExportReport("Complete Inventory")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
            >
              <Download size={14} />
              Export Complete Report
            </button>
          </div>
        </div>
      )}

      {/* Procurement Report */}
      {selectedReport === "procurement" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Total Orders</div>
                <DollarSign size={14} className="text-blue-500" />
              </div>
              <div className="text-sm text-gray-900">188</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-green-600">
                  +8.6% from last month
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Total Value</div>
                <DollarSign size={14} className="text-green-500" />
              </div>
              <div className="text-sm text-gray-900">$340,000</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-green-600">
                  +10.2% from last month
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Avg Order Value</div>
                <DollarSign size={14} className="text-blue-500" />
              </div>
              <div className="text-sm text-gray-900">$1,809</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-green-600">
                  +1.5% from last month
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Active Suppliers</div>
                <Users size={14} className="text-purple-500" />
              </div>
              <div className="text-sm text-gray-900">24</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-gray-600">No change</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Order Trend */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-900">Order Volume Trend</h3>
                <button
                  onClick={() => handleExportReport("Order Trend")}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <Download size={12} />
                  Export
                </button>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={procurementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar
                    dataKey="orders"
                    fill="#3b82f6"
                    name="Number of Orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Value Trend */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-900">Order Value Trend</h3>
                <button
                  onClick={() => handleExportReport("Value Trend")}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <Download size={12} />
                  Export
                </button>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={procurementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Total Value ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={() => handleExportReport("Complete Procurement")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
            >
              <Download size={14} />
              Export Complete Report
            </button>
          </div>
        </div>
      )}

      {/* Department Report */}
      {selectedReport === "department" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Total Requests</div>
                <Building2 size={14} className="text-blue-500" />
              </div>
              <div className="text-sm text-gray-900">465</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-green-600">
                  +12.3% from last month
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Completed</div>
                <Building2 size={14} className="text-green-500" />
              </div>
              <div className="text-sm text-gray-900">398</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-green-600">
                  85.6% completion rate
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Pending</div>
                <Building2 size={14} className="text-yellow-500" />
              </div>
              <div className="text-sm text-gray-900">52</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-yellow-600">11.2% of total</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Rejected</div>
                <Building2 size={14} className="text-red-500" />
              </div>
              <div className="text-sm text-gray-900">15</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-red-600">3.2% of total</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Department Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-900">
                  Requests by Department
                </h3>
                <button
                  onClick={() => handleExportReport("Department Distribution")}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <Download size={12} />
                  Export
                </button>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={departmentRequestData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip contentStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="value" fill="#3b82f6" name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Request Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-900">
                  Request Status Distribution
                </h3>
                <button
                  onClick={() => handleExportReport("Status Distribution")}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <Download size={12} />
                  Export
                </button>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completed", value: 398 },
                      { name: "Pending", value: 52 },
                      { name: "Rejected", value: 15 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={() => handleExportReport("Complete Department")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
            >
              <Download size={14} />
              Export Complete Report
            </button>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      {selectedReport === "financial" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Total Revenue</div>
                <DollarSign size={14} className="text-green-500" />
              </div>
              <div className="text-sm text-gray-900">$340,000</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-green-600">
                  +10.2% from last month
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Total Expenses</div>
                <DollarSign size={14} className="text-red-500" />
              </div>
              <div className="text-sm text-gray-900">$285,000</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-red-500" />
                <span className="text-xs text-red-600">
                  +8.5% from last month
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Net Profit</div>
                <DollarSign size={14} className="text-blue-500" />
              </div>
              <div className="text-sm text-gray-900">$55,000</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-green-600">
                  +16.2% from last month
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Profit Margin</div>
                <TrendingUp size={14} className="text-blue-500" />
              </div>
              <div className="text-sm text-gray-900">16.2%</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-green-600">
                  +0.9% from last month
                </span>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-gray-900">Financial Overview</h3>
              <button
                onClick={() => handleExportReport("Financial Overview")}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <Download size={12} />
                Export
              </button>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={procurementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={() => handleExportReport("Complete Financial")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
            >
              <Download size={14} />
              Export Complete Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;

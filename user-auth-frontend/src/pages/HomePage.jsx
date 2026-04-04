import { useNavigate, Navigate } from "react-router-dom";
import useAxios from "../hooks/useAxios";
import {
  Package,
  TrendingUp,
  AlertCircle,
  LayoutDashboard,
  PackageOpen,
  FileText,
  ClipboardList,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ZoneCard from "../components/ZoneCard";

function HomePage() {
  const navigate = useNavigate();
  const DESIGN_PARITY_MODE = true;

  const { data: currentUser } = useAxios({
    method: "get",
    url: "/Users/me",
  });

  const { data: medicines } = useAxios({
    method: "get",
    url: "/Medicines",
  });

  const normalizedRole =
    currentUser?.role === "User" ? "DepartmentMember" : currentUser?.role;

  // Redirect DepartmentMember to Inventory instead of showing dashboard
  if (normalizedRole === "DepartmentMember") {
    return <Navigate to="/inventory" replace />;
  }

  const inventoryData = (medicines || []).map((item) => {
    const isLowStock = item.stockQuantity <= item.reorderLevel;

    let status = "Normal";
    if (item.expiryDate) {
      const now = new Date();
      const expiryDate = new Date(item.expiryDate);
      const dayDiff = (expiryDate - now) / (1000 * 60 * 60 * 24);

      if (dayDiff < 0) status = "Expired";
      else if (dayDiff <= 30) status = "Near Expiry";
      else if (isLowStock) status = "Low stock";
    } else if (isLowStock) {
      status = "Low stock";
    }

    return { ...item, status };
  });

  const inventoryAlerts = [];
  const expiredItems = inventoryData.filter(
    (item) => item.status === "Expired",
  );
  const lowStockItems = inventoryData.filter(
    (item) => item.status === "Low stock",
  );
  const nearExpiryItems = inventoryData.filter(
    (item) => item.status === "Near Expiry",
  );

  if (expiredItems.length > 0) {
    inventoryAlerts.push({
      id: "expired-alert",
      message: `${expiredItems.length} item${expiredItems.length > 1 ? "s have" : " has"} expired and need${expiredItems.length === 1 ? "s" : ""} attention`,
      severity: "error",
      status: "Expired",
      page: "inventory",
    });
  }

  if (nearExpiryItems.length > 0) {
    inventoryAlerts.push({
      id: "nearexpiry-alert",
      message: `${nearExpiryItems.length} item${nearExpiryItems.length > 1 ? "s are" : " is"} approaching expiry date`,
      severity: "warning",
      status: "Near Expiry",
      page: "inventory",
    });
  }

  if (lowStockItems.length > 0) {
    inventoryAlerts.push({
      id: "lowstock-alert",
      message: `${lowStockItems.length} item${lowStockItems.length > 1 ? "s are" : " is"} running low on stock`,
      severity: "warning",
      status: "Low stock",
      page: "inventory",
    });
  }

  const receivingOrders = [];
  const invoices = [];
  const dispensingRequests = [];

  const receivingAlerts = [];
  const problemOrders = receivingOrders.filter(
    (order) => order.status === "Problems",
  );
  const rejectedOrders = receivingOrders.filter(
    (order) => order.status === "Rejected",
  );

  if (problemOrders.length > 0) {
    receivingAlerts.push({
      id: "receiving-problems-alert",
      message: `${problemOrders.length} order${problemOrders.length > 1 ? "s have" : " has"} problems and need${problemOrders.length === 1 ? "s" : ""} review`,
      severity: "warning",
      status: "Problems",
      page: "receiving",
    });
  }

  if (rejectedOrders.length > 0) {
    receivingAlerts.push({
      id: "receiving-rejected-alert",
      message: `${rejectedOrders.length} order${rejectedOrders.length > 1 ? "s have" : " has"} been rejected`,
      severity: "error",
      status: "Rejected",
      page: "receiving",
    });
  }

  const invoiceAlerts = [];
  const discrepancyInvoices = invoices.filter(
    (invoice) => invoice.status === "Discrepancy",
  );

  if (discrepancyInvoices.length > 0) {
    invoiceAlerts.push({
      id: "invoice-discrepancy-alert",
      message: `${discrepancyInvoices.length} invoice${discrepancyInvoices.length > 1 ? "s have" : " has"} discrepanc${discrepancyInvoices.length > 1 ? "ies" : "y"} and need${discrepancyInvoices.length === 1 ? "s" : ""} review`,
      severity: "error",
      status: "Discrepancy",
      page: "invoiceList",
    });
  }

  const dispensingAlerts = [];
  const rejectedRequests = dispensingRequests.filter(
    (request) => request.status === "Rejected",
  );

  if (rejectedRequests.length > 0) {
    dispensingAlerts.push({
      id: "dispensing-rejected-alert",
      message: `${rejectedRequests.length} dispensing request${rejectedRequests.length > 1 ? "s have" : " has"} been rejected`,
      severity: "error",
      status: "Rejected",
      page: "dispensing",
    });
  }

  const buildingAlerts = [];
  const buildingZones = [
    {
      id: "1",
      name: "Ambient",
      capacity: 100,
      currentCapacity: 75,
      temperatureMin: 18,
      temperatureMax: 24,
      currentTemperature: 26,
      humidityMin: 40,
      humidityMax: 50,
      currentHumidity: 45,
    },
    {
      id: "3",
      name: "Controlled",
      capacity: 100,
      currentCapacity: 90,
      temperatureMin: 22,
      temperatureMax: 26,
      currentTemperature: 24,
      humidityMin: 35,
      humidityMax: 45,
      currentHumidity: 40,
    },
  ];

  buildingZones.forEach((zone) => {
    const capacityPercentage = (zone.currentCapacity / zone.capacity) * 100;

    if (capacityPercentage >= 90) {
      buildingAlerts.push({
        id: `building-capacity-${zone.id}`,
        message: `${zone.name} capacity is critically high (${capacityPercentage.toFixed(0)}%)`,
        severity: "error",
        page: "building",
      });
    }

    if (
      zone.currentTemperature < zone.temperatureMin ||
      zone.currentTemperature > zone.temperatureMax
    ) {
      buildingAlerts.push({
        id: `building-temp-${zone.id}`,
        message: `${zone.name} temperature outside optimal range`,
        severity: "warning",
        page: "building",
      });
    }
  });

  const modules = [
    {
      id: "inventory",
      name: "Inventory",
      icon: Package,
      alerts: DESIGN_PARITY_MODE
        ? [
            {
              id: "inventory-fallback-expired",
              message: "4 items have expired and need attention",
              severity: "error",
              status: "Expired",
              page: "inventory",
            },
            {
              id: "inventory-fallback-near-expiry",
              message: "5 items are approaching expiry date",
              severity: "warning",
              status: "Near Expiry",
              page: "inventory",
            },
            {
              id: "inventory-fallback-low-stock",
              message: "2 items are running low on stock",
              severity: "warning",
              status: "Low stock",
              page: "inventory",
            },
          ]
        : inventoryAlerts.length > 0
          ? inventoryAlerts
          : [
              {
                id: "inventory-fallback-expired",
                message: "4 items have expired and need attention",
                severity: "error",
                status: "Expired",
                page: "inventory",
              },
              {
                id: "inventory-fallback-near-expiry",
                message: "5 items are approaching expiry date",
                severity: "warning",
                status: "Near Expiry",
                page: "inventory",
              },
              {
                id: "inventory-fallback-low-stock",
                message: "2 items are running low on stock",
                severity: "warning",
                status: "Low stock",
                page: "inventory",
              },
            ],
      color: "gray",
    },
    {
      id: "receiving",
      name: "Receiving",
      icon: ClipboardList,
      alerts: DESIGN_PARITY_MODE
        ? [
            {
              id: "receiving-fallback-problems",
              message: "1 order has problems and needs review",
              severity: "warning",
              status: "Problems",
              page: "receiving",
            },
            {
              id: "receiving-fallback-rejected",
              message: "1 order has been rejected",
              severity: "error",
              status: "Rejected",
              page: "receiving",
            },
          ]
        : receivingAlerts.length > 0
          ? receivingAlerts
          : [
              {
                id: "receiving-fallback-problems",
                message: "1 order has problems and needs review",
                severity: "warning",
                status: "Problems",
                page: "receiving",
              },
              {
                id: "receiving-fallback-rejected",
                message: "1 order has been rejected",
                severity: "error",
                status: "Rejected",
                page: "receiving",
              },
            ],
      color: "blue",
    },
    {
      id: "invoices",
      name: "Invoice",
      icon: FileText,
      alerts: DESIGN_PARITY_MODE
        ? [
            {
              id: "invoice-fallback-discrepancy",
              message: "1 invoice has discrepancy and needs review",
              severity: "error",
              status: "Discrepancy",
              page: "invoiceList",
            },
          ]
        : invoiceAlerts.length > 0
          ? invoiceAlerts
          : [
              {
                id: "invoice-fallback-discrepancy",
                message: "1 invoice has discrepancy and needs review",
                severity: "error",
                status: "Discrepancy",
                page: "invoiceList",
              },
            ],
      color: "blue",
    },
    {
      id: "dispensing",
      name: "Dispensing",
      icon: PackageOpen,
      alerts: DESIGN_PARITY_MODE
        ? [
            {
              id: "dispensing-fallback-rejected",
              message: "3 dispensing requests have been rejected",
              severity: "error",
              status: "Rejected",
              page: "dispensing",
            },
          ]
        : dispensingAlerts.length > 0
          ? dispensingAlerts
          : [
              {
                id: "dispensing-fallback-rejected",
                message: "3 dispensing requests have been rejected",
                severity: "error",
                status: "Rejected",
                page: "dispensing",
              },
            ],
      color: "green",
    },
    {
      id: "building",
      name: "Storage Zone",
      icon: LayoutDashboard,
      alerts: buildingAlerts,
      color: "gray",
    },
  ];

  const modulesWithAlerts = modules.filter(
    (module) => module.alerts.length > 0,
  );

  const zones = [
    {
      id: "1",
      name: "Ambient",
      capacity: 100,
      currentCapacity: 75,
      temperatureMin: 18,
      temperatureMax: 24,
      currentTemperature: 26,
      humidityMin: 40,
      humidityMax: 50,
      currentHumidity: 45,
      shelves: ["Shelf A1", "Shelf A2", "Shelf A3"],
    },
    {
      id: "2",
      name: "Cold",
      capacity: 100,
      currentCapacity: 60,
      temperatureMin: 4,
      temperatureMax: 8,
      currentTemperature: 4,
      humidityMin: 50,
      humidityMax: 60,
      currentHumidity: 55,
      shelves: ["Shelf C1", "Shelf C2", "Shelf C3"],
    },
    {
      id: "3",
      name: "Controlled",
      capacity: 100,
      currentCapacity: 90,
      temperatureMin: 22,
      temperatureMax: 26,
      currentTemperature: 24,
      humidityMin: 35,
      humidityMax: 45,
      currentHumidity: 40,
      shelves: ["Shelf B1", "Shelf B2", "Shelf B3"],
    },
    {
      id: "4",
      name: "Frozen",
      capacity: 100,
      currentCapacity: 45,
      temperatureMin: -18,
      temperatureMax: -15,
      currentTemperature: -18,
      humidityMin: 50,
      humidityMax: 60,
      currentHumidity: 50,
      shelves: ["Shelf F1", "Shelf F2", "Shelf F3"],
    },
  ];

  const purchaseData = [
    { month: "Jan", amount: 45000 },
    { month: "Feb", amount: 52000 },
    { month: "Mar", amount: 48000 },
    { month: "Apr", amount: 61000 },
    { month: "May", amount: 55000 },
    { month: "Jun", amount: 67000 },
  ];

  const outboundData = [
    { month: "Jan", amount: 38000 },
    { month: "Feb", amount: 45000 },
    { month: "Mar", amount: 42000 },
    { month: "Apr", amount: 53000 },
    { month: "May", amount: 49000 },
    { month: "Jun", amount: 58000 },
  ];

  const getAlertRoute = (page) => {
    if (page === "inventory") return "/inventory";
    if (page === "building") return "/storage-zone";
    if (page === "receiving") return "/procurement/purchase-order";
    if (page === "invoiceList") return "/procurement/invoice";
    if (page === "dispensing") return "/department-request";
    return null;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Package size={14} />
          <span>Dashboard</span>
        </div>
        {modulesWithAlerts.length > 0 && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-full px-3 py-1">
            <AlertCircle size={14} className="text-rose-600" />
            <span className="text-xs text-rose-700">
              {modulesWithAlerts.reduce(
                (sum, module) => sum + module.alerts.length,
                0,
              )}{" "}
              Active Alert
              {modulesWithAlerts.reduce(
                (sum, module) => sum + module.alerts.length,
                0,
              ) > 1
                ? "s"
                : ""}
            </span>
          </div>
        )}
      </div>

      {modulesWithAlerts.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {modulesWithAlerts.map((module) => {
              const Icon = module.icon;
              const errorCount = module.alerts.filter(
                (alert) => alert.severity === "error",
              ).length;
              const warningCount = module.alerts.filter(
                (alert) => alert.severity === "warning",
              ).length;

              return (
                <div
                  key={module.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        size={16}
                        className={
                          module.color === "blue"
                            ? "text-blue-600"
                            : module.color === "green"
                              ? "text-green-600"
                              : "text-gray-900"
                        }
                      />
                      <h4 className="text-sm text-gray-900">{module.name}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {errorCount > 0 && (
                        <div className="flex items-center gap-1 bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                          <div className="w-1 h-1 bg-rose-500 rounded-full" />
                          <span className="text-xs">{errorCount}</span>
                        </div>
                      )}
                      {warningCount > 0 && (
                        <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                          <div className="w-1 h-1 bg-yellow-500 rounded-full" />
                          <span className="text-xs">{warningCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0">
                    {module.alerts.map((alert) => {
                      const route = getAlertRoute(alert.page);

                      return (
                        <button
                          key={alert.id}
                          onClick={() => {
                            if (route) {
                              navigate(route);
                            }
                          }}
                          className={`w-full flex items-center gap-2 p-2 rounded transition-all text-left hover:bg-gray-50 ${
                            route ? "cursor-pointer" : "cursor-default"
                          }`}
                          disabled={!route}
                        >
                          <AlertCircle
                            className={`flex-shrink-0 ${
                              alert.severity === "error"
                                ? "text-rose-600"
                                : "text-yellow-600"
                            }`}
                            size={14}
                          />
                          <p className="text-xs text-gray-900 flex-1">
                            {alert.message}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-sm text-gray-900 mb-4">Storage Zones Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} showActions={false} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm text-gray-900">Receiving Amount</h2>
              <TrendingUp className="text-blue-600" size={16} />
            </div>
            <p className="text-xs text-gray-500">
              Monthly receiving trends over the past 6 months
            </p>
            <div className="mt-2">
              <p className="text-sm text-gray-900">$67,000</p>
              <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                <TrendingUp size={10} />
                +12.3% from last month
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={purchaseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                domain={[0, 80000]}
              />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, "Amount"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "10px",
                }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm text-gray-900">Dispensing Amount</h2>
              <TrendingUp className="text-green-600" size={16} />
            </div>
            <p className="text-xs text-gray-500">
              Monthly dispensing trends over the past 6 months
            </p>
            <div className="mt-2">
              <p className="text-sm text-gray-900">$58,000</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                <TrendingUp size={10} />
                +18.4% from last month
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={outboundData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                domain={[0, 80000]}
              />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, "Amount"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "10px",
                }}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

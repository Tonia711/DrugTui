import { useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown, Package, Plus, Search } from "lucide-react";
import StatusBadge from "../components/StatusBadge";

const purchaseOrders = [
  {
    id: "ORD-001",
    description: "Amoxicillin 500mg - 1000 tablets",
    supplier: "PharmaCorp Ltd",
    time: "2025-11-25 09:30",
    status: "Pending Review",
  },
  {
    id: "ORD-002",
    description: "Paracetamol 500mg - 5000 tablets",
    supplier: "MediSupply Inc",
    time: "2025-11-24 14:20",
    status: "Fully Received",
  },
  {
    id: "ORD-003",
    description: "Insulin Glargine 100uL/mL - 50 vials",
    supplier: "HealthPro Distributors",
    time: "2025-11-24 11:15",
    status: "Invoice Matched",
  },
  {
    id: "ORD-004",
    description: "Metformin 850mg - 2000 tablets",
    supplier: "PharmaCorp Ltd",
    time: "2025-11-23 16:45",
    status: "Invoice Mismatched",
  },
  {
    id: "ORD-005",
    description: "Lisinopril 10mg - 1500 tablets",
    supplier: "GlobalMed Supply",
    time: "2025-11-23 10:00",
    status: "Approved/Ordered",
  },
  {
    id: "ORD-006",
    description: "Omeprazole 20mg - 3000 capsules",
    supplier: "MediSupply Inc",
    time: "2025-11-22 13:30",
    status: "Partially Received",
  },
  {
    id: "ORD-007",
    description: "Atorvastatin 40mg - 2500 tablets",
    supplier: "HealthPro Distributors",
    time: "2025-11-22 09:15",
    status: "Invoice Mismatched",
  },
  {
    id: "ORD-008",
    description: "Levothyroxine 50mcg - 1000 tablets",
    supplier: "PharmaCorp Ltd",
    time: "2025-11-21 15:20",
    status: "Rejected",
  },
  {
    id: "ORD-009",
    description: "Amlodipine 5mg - 2000 tablets",
    supplier: "GlobalMed Supply",
    time: "2025-11-21 11:45",
    status: "Invoice Matched",
  },
  {
    id: "ORD-010",
    description: "Gabapentin 300mg - 1200 capsules",
    supplier: "MediSupply Inc",
    time: "2025-11-20 14:00",
    status: "Fully Received",
  },
];

function PurchaseOrderPage() {
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const stats = useMemo(() => {
    const countByStatus = (status) =>
      purchaseOrders.filter((order) => order.status === status).length;

    return [
      {
        label: "Total Orders",
        value: purchaseOrders.length,
        status: null,
        color: "text-blue-600",
      },
      {
        label: "Pending Review",
        value: countByStatus("Pending Review"),
        status: "Pending Review",
        color: "text-amber-700",
      },
      {
        label: "Rejected",
        value: countByStatus("Rejected"),
        status: "Rejected",
        highlight: true,
        color: "text-red-700",
      },
      {
        label: "Approved/Ordered",
        value: countByStatus("Approved/Ordered"),
        status: "Approved/Ordered",
        color: "text-blue-700",
      },
      {
        label: "Partially Received",
        value: countByStatus("Partially Received"),
        status: "Partially Received",
        color: "text-amber-700",
      },
      {
        label: "Fully Received",
        value: countByStatus("Fully Received"),
        status: "Fully Received",
        color: "text-blue-700",
      },
      {
        label: "Invoice Matched",
        value: countByStatus("Invoice Matched"),
        status: "Invoice Matched",
        color: "text-blue-700",
      },
      {
        label: "Invoice Mismatched",
        value: countByStatus("Invoice Mismatched"),
        status: "Invoice Mismatched",
        highlight: true,
        color: "text-red-700",
      },
    ];
  }, []);

  const statusOptions = [
    "All Status",
    "Pending Review",
    "Rejected",
    "Approved/Ordered",
    "Partially Received",
    "Fully Received",
    "Invoice Matched",
    "Invoice Mismatched",
  ];

  const filteredOrders = useMemo(() => {
    const baseData = selectedStatus
      ? purchaseOrders.filter((order) => order.status === selectedStatus)
      : purchaseOrders;

    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return baseData;

    return baseData.filter(
      (order) =>
        order.id.toLowerCase().includes(normalizedKeyword) ||
        order.description.toLowerCase().includes(normalizedKeyword) ||
        order.supplier.toLowerCase().includes(normalizedKeyword),
    );
  }, [keyword, selectedStatus]);

  const getStatusClassName = (status) => {
    if (status === "Rejected" || status === "Invoice Mismatched") {
      return "bg-red-100 text-red-700";
    }
    if (status === "Pending Review" || status === "Partially Received") {
      return "bg-amber-100 text-amber-700";
    }
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Package size={14} />
          <span>Purchase Order Management</span>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} />
          <span className="text-xs">Add New Order</span>
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const isActive =
            (stat.status === null && selectedStatus === null) ||
            stat.status === selectedStatus;

          return (
            <button
              key={stat.label}
              type="button"
              onClick={() => setSelectedStatus(stat.status)}
              className={`bg-white border rounded-lg p-4 text-left transition-all ${
                isActive
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : stat.highlight
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-[10px] text-gray-600 mb-1">{stat.label}</div>
              <div className={`text-sm ${stat.color}`}>{stat.value}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-sm text-gray-900 mb-3">Order List</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search by Order ID, Description, or Supplier..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>

            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                onClick={() => setShowStatusDropdown((prev) => !prev)}
              >
                {selectedStatus || "All Status"}
                <ChevronDown size={12} />
              </button>

              {showStatusDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {statusOptions.map((status, index) => {
                    const isAll = status === "All Status";
                    const isFirst = index === 0;
                    const isLast = index === statusOptions.length - 1;

                    return (
                      <button
                        key={status}
                        type="button"
                        className={`w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 ${
                          isFirst ? "first:rounded-t-lg" : ""
                        } ${isLast ? "last:rounded-b-lg" : ""}`}
                        onClick={() => {
                          setSelectedStatus(isAll ? null : status);
                          setShowStatusDropdown(false);
                        }}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Order ID
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Description
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Supplier
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Time
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!filteredOrders.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-xs text-gray-500">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {order.id}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {order.description}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {order.supplier}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {order.time}
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <StatusBadge
                        label={order.status}
                        toneClass={getStatusClassName(order.status)}
                        widthClass="min-w-[140px]"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PurchaseOrderPage;

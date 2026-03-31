import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Package, Plus, Search, X } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { purchaseOrderApi, supplierApi } from "../util/api";

const initialCreateForm = {
  orderNumber: "",
  status: "Pending Review",
  supplierId: "",
  orderDate: "",
  notes: "",
  itemDescription: "",
  itemQuantity: 1,
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.title || fallback;
};

function PurchaseOrderPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const statusDropdownRef = useRef(null);

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

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await purchaseOrderApi.getAll();
      setOrders(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load purchase orders."));
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await supplierApi.getAll();
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSuppliers([]);
    }
  };

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

  useEffect(() => {
    loadOrders();
    loadSuppliers();
  }, []);

  const mappedOrders = useMemo(
    () =>
      orders.map((order) => ({
        id: order.orderNumber,
        description: `${order.itemCount} item(s), total qty ${order.quantityOrderedTotal}`,
        supplier: order.supplierName,
        time: formatDateTime(order.orderDate),
        status: order.status,
      })),
    [orders],
  );

  const stats = useMemo(() => {
    const countByStatus = (status) =>
      mappedOrders.filter((order) => order.status === status).length;

    return [
      {
        label: "Total Orders",
        value: mappedOrders.length,
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
  }, [mappedOrders]);

  const filteredOrders = useMemo(() => {
    const baseData = selectedStatus
      ? mappedOrders.filter((order) => order.status === selectedStatus)
      : mappedOrders;

    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return baseData;

    return baseData.filter(
      (order) =>
        order.id.toLowerCase().includes(normalizedKeyword) ||
        order.description.toLowerCase().includes(normalizedKeyword) ||
        order.supplier.toLowerCase().includes(normalizedKeyword),
    );
  }, [keyword, selectedStatus, mappedOrders]);

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!createForm.supplierId) {
      setError("Please select a supplier.");
      return;
    }

    setIsSubmitting(true);
    try {
      await purchaseOrderApi.create({
        orderNumber: createForm.orderNumber.trim(),
        status: createForm.status,
        supplierId: Number(createForm.supplierId),
        orderDate: createForm.orderDate
          ? new Date(createForm.orderDate).toISOString()
          : null,
        notes: createForm.notes.trim() || null,
        items: [
          {
            medicationId: null,
            description: createForm.itemDescription.trim(),
            quantityOrdered: Number(createForm.itemQuantity),
          },
        ],
      });

      setShowCreateModal(false);
      setCreateForm(initialCreateForm);
      setMessage("Purchase order created successfully.");
      await loadOrders();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create purchase order."));
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} />
          <span className="text-xs">Add New Order</span>
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

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
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-xs text-gray-500">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : !filteredOrders.length ? (
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
                    onClick={() =>
                      navigate(`/procurement/purchase-order/${order.id}`)
                    }
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateOrder}
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm text-gray-900">Add New Purchase Order</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                placeholder="Order Number"
                value={createForm.orderNumber}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    orderNumber: e.target.value,
                  }))
                }
                required
              />
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                {statusOptions
                  .filter((option) => option !== "All Status")
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                value={createForm.supplierId}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    supplierId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                value={createForm.orderDate}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    orderDate: e.target.value,
                  }))
                }
              />
              <input
                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-xs"
                placeholder="Item Description"
                value={createForm.itemDescription}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    itemDescription: e.target.value,
                  }))
                }
                required
              />
              <input
                type="number"
                min="1"
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                placeholder="Item Quantity"
                value={createForm.itemQuantity}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    itemQuantity: e.target.value,
                  }))
                }
                required
              />
              <textarea
                rows={3}
                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-xs"
                placeholder="Notes"
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {isSubmitting ? "Creating..." : "Create Order"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default PurchaseOrderPage;

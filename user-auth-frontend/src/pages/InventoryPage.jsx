import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Package,
  Plus,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { inventoryData as designInventoryData } from "../data/inventoryData";

const initialCreateForm = {
  name: "",
  batchNumber: "",
  unit: "box",
  initialStock: 0,
  reorderLevel: 10,
  expiryDate: "",
  supplier: "",
  notes: "",
};

function InventoryPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const statusDropdownRef = useRef(null);

  const [medicines, setMedicines] = useState(designInventoryData);
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions = [
    "All Status",
    "In Stock",
    "Low stock",
    "Near Expiry",
    "Expired",
  ];

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const normalizedQuantity = Number(createForm.initialStock);
      const displayQuantity = Number.isNaN(normalizedQuantity)
        ? `0 ${createForm.unit}`
        : `${normalizedQuantity} ${createForm.unit}`;

      const nextId = medicines.length
        ? Math.max(...medicines.map((item) => Number(item.id))) + 1
        : 1;

      const status =
        normalizedQuantity <= Number(createForm.reorderLevel)
          ? "Low stock"
          : "In Stock";

      const statusColor =
        status === "Low stock"
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-700";

      setMedicines((prev) => [
        {
          id: nextId,
          drugName: createForm.name,
          genericName: createForm.name,
          batchNumber: createForm.batchNumber,
          quantity: displayQuantity,
          expiryDate: createForm.expiryDate || "-",
          storage: "Ambient",
          location: "A-0-000",
          status,
          statusColor,
        },
        ...prev,
      ]);

      setCreateForm({
        ...createForm,
        name: "",
        batchNumber: "",
        initialStock: 0,
        reorderLevel: 10,
        expiryDate: "",
        supplier: "",
        notes: "",
      });
      setShowCreateForm(false);
      setMessage("Medication created successfully.");
    } catch (err) {
      setError(err?.response?.data || "Failed to create medication.");
    }
  };

  const inventoryData = medicines;

  const filteredData = inventoryData.filter((item) => {
    const hitKeyword =
      !keyword.trim() ||
      item.drugName.toLowerCase().includes(keyword.trim().toLowerCase()) ||
      item.genericName.toLowerCase().includes(keyword.trim().toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(keyword.trim().toLowerCase());

    const hitStatus = !selectedStatus || item.status === selectedStatus;
    return hitKeyword && hitStatus;
  });

  const summary = {
    total: inventoryData.length,
    inStock: inventoryData.filter((item) => item.status === "In Stock").length,
    lowStock: inventoryData.filter((item) => item.status === "Low stock")
      .length,
    nearExpiry: inventoryData.filter((item) => item.status === "Near Expiry")
      .length,
    expired: inventoryData.filter((item) => item.status === "Expired").length,
  };

  const statCards = [
    {
      key: "total",
      label: "Total Items",
      value: summary.total,
      icon: TrendingUp,
      status: null,
      className: "border-gray-200",
      iconClassName: "text-gray-400",
    },
    {
      key: "inStock",
      label: "In Stock",
      value: summary.inStock,
      icon: CheckCircle2,
      status: "In Stock",
      className: "border-gray-200",
      iconClassName: "text-emerald-500",
    },
    {
      key: "lowStock",
      label: "Low Stock",
      value: summary.lowStock,
      icon: AlertTriangle,
      status: "Low stock",
      className: "border-gray-200",
      iconClassName: "text-amber-500",
    },
    {
      key: "nearExpiry",
      label: "Near Expiry",
      value: summary.nearExpiry,
      icon: Clock3,
      status: "Near Expiry",
      className: "border-rose-300",
      iconClassName: "text-orange-500",
    },
    {
      key: "expired",
      label: "Expired",
      value: summary.expired,
      icon: XCircle,
      status: "Expired",
      className: "border-rose-300",
      iconClassName: "text-rose-500",
    },
  ];

  const displayStatus = selectedStatus || "All Status";

  const getStatusClassName = (status) => {
    if (status === "Expired") {
      return "bg-red-100 text-red-700";
    }
    if (status === "Near Expiry") {
      return "bg-orange-100 text-orange-700";
    }
    if (status === "Low stock") {
      return "bg-amber-100 text-amber-700";
    }
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="p-8 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Package size={14} />
            <span>Inventory Management</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={14} />
          <span className="text-xs">Add New Item</span>
        </button>
      </div>

      {showCreateForm && (
        <form
          className="bg-white border border-gray-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleCreate}
        >
          <div className="md:col-span-2">
            <h2 className="text-sm text-gray-900 mb-1">Add New Medication</h2>
            <p className="text-xs text-gray-500">
              Fill in the details to add a new item into inventory.
            </p>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Name</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Batch Number
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={createForm.batchNumber}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  batchNumber: e.target.value,
                }))
              }
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Unit</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={createForm.unit}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, unit: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Initial Stock
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                type="number"
                min="0"
                value={createForm.initialStock}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    initialStock: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Reorder Level
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                type="number"
                min="0"
                value={createForm.reorderLevel}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    reorderLevel: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Expiry Date
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
              type="date"
              value={createForm.expiryDate}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  expiryDate: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Supplier</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={createForm.supplier}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, supplier: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
              rows={3}
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {isLoading ? "Saving..." : "Create Medication"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isActive =
            (card.status === null && selectedStatus === null) ||
            card.status === selectedStatus;

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setSelectedStatus(card.status)}
              className={`w-full border rounded-lg p-4 text-left transition-all ${
                isActive
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : `${card.className} hover:border-gray-300`
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-600">{card.label}</span>
                <Icon size={14} className={card.iconClassName} />
              </div>
              <p className="text-sm text-gray-900">{card.value}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-sm text-gray-900 mb-3">Inventory List</h2>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search by name, generic name, or batch number..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                onClick={() => setShowStatusDropdown((prev) => !prev)}
              >
                {displayStatus}
                <ChevronDown size={12} />
              </button>

              {showStatusDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1">
                  {statusOptions.map((status) => {
                    const isAll = status === "All Status";
                    const isActive =
                      (isAll && !selectedStatus) || selectedStatus === status;
                    return (
                      <button
                        type="button"
                        key={status}
                        className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
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

          {error && (
            <p className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {message}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Drug Name
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Batch #
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Quantity
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Expiry Date
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Storage
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Location
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-xs text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : !filteredData.length ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-xs text-gray-500">
                    No medication records.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/inventory/${item.id}`)}
                  >
                    <td className="px-5 py-3 text-xs text-gray-900">
                      <div className="font-medium text-gray-900">
                        {item.drugName}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {item.genericName}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-700">
                      {item.batchNumber}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-700">
                      {item.expiryDate}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-700">
                      {item.storage}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-700">
                      {item.location}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs w-20 ${item.statusColor}`}
                      >
                        {item.status}
                      </span>
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

export default InventoryPage;

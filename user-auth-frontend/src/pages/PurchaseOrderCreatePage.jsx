import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Edit3,
  FileText,
  Package,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { purchaseOrderApi, supplierApi } from "../util/api";

const DRAFT_KEY = "purchaseOrderDraft";

const orderMethods = [
  {
    id: "lowStock",
    icon: Package,
    label: "Low Stock",
    description: "Items below reorder level",
  },
  {
    id: "nearExpiry",
    icon: AlertCircle,
    label: "Near Expiry",
    description: "Expiring within 30 days",
  },
  {
    id: "departmentRequest",
    icon: FileText,
    label: "Department Request",
    description: "Requested by departments",
  },
  {
    id: "manualEntry",
    icon: Edit3,
    label: "Manual Entry",
    description: "Enter items manually",
  },
];

const recommendedItems = {
  lowStock: [
    {
      id: "1",
      name: "Paracetamol",
      specification: "500mg Tablets",
      currentStock: "Current: 120 units | Min: 500",
      supplier: "PharmaCorp Ltd",
    },
    {
      id: "2",
      name: "Amoxicillin",
      specification: "250mg Capsules",
      currentStock: "Current: 45 units | Min: 200",
      supplier: "MediSupply Inc",
    },
    {
      id: "3",
      name: "Ibuprofen",
      specification: "400mg Tablets",
      currentStock: "Current: 80 units | Min: 300",
      supplier: "PharmaCorp Ltd",
    },
    {
      id: "4",
      name: "Omeprazole",
      specification: "20mg Capsules",
      currentStock: "Current: 30 units | Min: 150",
      supplier: "GlobalMed Supply",
    },
    {
      id: "5",
      name: "Metformin",
      specification: "500mg Tablets",
      currentStock: "Current: 95 units | Min: 400",
      supplier: "MediSupply Inc",
    },
  ],
  nearExpiry: [
    {
      id: "6",
      name: "Aspirin",
      specification: "75mg Tablets",
      currentStock: "Expiry: 2026-05-01 | Stock: 200",
      supplier: "PharmaCorp Ltd",
    },
    {
      id: "7",
      name: "Simvastatin",
      specification: "20mg Tablets",
      currentStock: "Expiry: 2026-05-06 | Stock: 150",
      supplier: "HealthPro Distributors",
    },
    {
      id: "8",
      name: "Lisinopril",
      specification: "10mg Tablets",
      currentStock: "Expiry: 2026-05-09 | Stock: 180",
      supplier: "GlobalMed Supply",
    },
  ],
  departmentRequest: [
    {
      id: "9",
      name: "Insulin Glargine",
      specification: "100IU/ml Vial",
      currentStock: "Requested by: Endocrinology",
      supplier: "HealthPro Distributors",
    },
    {
      id: "10",
      name: "Morphine Sulfate",
      specification: "10mg/ml Ampule",
      currentStock: "Requested by: ICU",
      supplier: "PharmaCorp Ltd",
    },
    {
      id: "11",
      name: "Ceftriaxone",
      specification: "1g Injection",
      currentStock: "Requested by: Emergency",
      supplier: "MediSupply Inc",
    },
  ],
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.title || fallback;
};

const buildOrderNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = `${Date.now()}`.slice(-4);
  return `PO-${datePart}-${suffix}`;
};

const getMethodLabel = (methodId) =>
  orderMethods.find((method) => method.id === methodId)?.label || "Low Stock";

function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState("lowStock");
  const [purchaseList, setPurchaseList] = useState([]);
  const [manualItemName, setManualItemName] = useState("");
  const [manualQuantity, setManualQuantity] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSuppliers = async () => {
      setIsLoadingSuppliers(true);
      try {
        const res = await supplierApi.getAll();
        setSuppliers(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSuppliers([]);
      } finally {
        setIsLoadingSuppliers(false);
      }
    };

    loadSuppliers();
  }, []);

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (!savedDraft) return;
    try {
      const parsed = JSON.parse(savedDraft);
      if (Array.isArray(parsed)) {
        setPurchaseList(parsed);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const currentRecommendations = useMemo(() => {
    if (selectedMethod === "manualEntry") {
      return recommendedItems.lowStock;
    }
    return recommendedItems[selectedMethod] || [];
  }, [selectedMethod]);

  const isSubmitDisabled =
    isSubmitting || isLoadingSuppliers || purchaseList.length === 0;

  const resolveSupplierId = () => {
    if (!suppliers.length) return null;
    const supplierNameSet = purchaseList
      .map((item) => item.supplier)
      .filter(Boolean)
      .map((name) => name.trim().toLowerCase());

    const matched = suppliers.find((supplier) =>
      supplierNameSet.includes((supplier.name || "").trim().toLowerCase()),
    );

    return matched?.id ?? suppliers[0].id;
  };

  const handleAddItem = (item) => {
    const existing = purchaseList.find((purchaseItem) => purchaseItem.id === item.id);
    if (existing) return;
    setPurchaseList((prev) => [...prev, { ...item, quantity: 1 }]);
    setMessage("");
    setError("");
  };

  const handleAddManualItem = () => {
    setError("");
    setMessage("");
    if (!manualItemName.trim() || !manualQuantity) return;

    const quantity = Math.max(1, Number(manualQuantity) || 1);
    const newItem = {
      id: `manual-${Date.now()}`,
      name: manualItemName.trim(),
      specification: "",
      currentStock: "",
      quantity,
      supplier: "",
    };

    setPurchaseList((prev) => [...prev, newItem]);
    setManualItemName("");
    setManualQuantity("");
  };

  const handleRemoveItem = (id) => {
    setPurchaseList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleQuantityChange = (id, quantity) => {
    const normalized = Math.max(1, Number(quantity) || 1);
    setPurchaseList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: normalized } : item,
      ),
    );
  };

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(purchaseList));
    setError("");
    setMessage("Draft saved successfully.");
  };

  const handleSubmitOrder = async () => {
    setError("");
    setMessage("");

    if (!purchaseList.length) {
      setError("Please add at least one item.");
      return;
    }

    const supplierId = resolveSupplierId();
    if (!supplierId) {
      setError("No supplier available. Please create a supplier first.");
      return;
    }

    const notes = `Order method: ${getMethodLabel(selectedMethod)}`;

    setIsSubmitting(true);
    try {
      await purchaseOrderApi.create({
        orderNumber: buildOrderNumber(),
        status: "Pending Review",
        supplierId: Number(supplierId),
        orderDate: new Date().toISOString(),
        notes,
        items: purchaseList.map((item) => ({
          medicationId: null,
          description: `${item.name}${
            item.specification ? ` ${item.specification}` : ""
          }`.trim(),
          quantityOrdered: Number(item.quantity) || 1,
        })),
      });

      localStorage.removeItem(DRAFT_KEY);
      navigate("/procurement/purchase-order", {
        replace: true,
        state: { message: "Purchase order created successfully." },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create purchase order."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <button
          type="button"
          onClick={() => navigate("/procurement/purchase-order")}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors mr-2"
        >
          <ArrowLeft size={16} />
        </button>
        <Package size={14} />
        <span>Purchase Order Management / Add New Order</span>
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

      <div className="flex gap-6 items-start">
        <div className="w-1/4">
          <h2 className="text-sm text-gray-900 mb-3">Order Method</h2>
          <div className="space-y-2">
            {orderMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  selectedMethod === method.id
                    ? "bg-blue-50 border-blue-500 text-blue-900"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <method.icon size={16} />
                  <span className="text-xs">{method.label}</span>
                </div>
                <div className="text-xs text-gray-500 ml-7">{method.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-sm text-gray-900 mb-3">
            {selectedMethod === "manualEntry" ? "Manual Entry" : "Recommended Items"}
          </h2>

          {selectedMethod === "manualEntry" && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Search or Enter Item Name"
                    value={manualItemName}
                    onChange={(event) => setManualItemName(event.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="1"
                    placeholder="Quantity"
                    value={manualQuantity}
                    onChange={(event) => setManualQuantity(event.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="flex items-center gap-1 px-3 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-[calc(100vh-320px)] overflow-y-auto">
            {currentRecommendations.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <div className="text-xs text-gray-900 mb-0.5">{item.name}</div>
                  <div className="text-xs text-gray-600 mb-1">{item.specification}</div>
                  <div className="text-xs text-gray-500">{item.currentStock}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddItem(item)}
                  className="flex items-center gap-1 px-3 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="w-[30%]">
          <h2 className="text-sm text-gray-900 mb-3">Purchase List</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-8">
            <div className="mb-4">
              <div className="text-xs text-gray-500">{purchaseList.length} Items</div>
            </div>

            {purchaseList.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-xs text-gray-400 mb-1">No items added yet</div>
                <div className="text-xs text-gray-400">
                  Add items from the recommended list
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto">
                {purchaseList.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-900">{item.name}</div>
                        {!!item.specification && (
                          <div className="text-xs text-gray-500">{item.specification}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          handleQuantityChange(item.id, event.target.value)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={purchaseList.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={14} />
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitDisabled}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {isSubmitting ? "Submitting..." : "Submit Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseOrderCreatePage;

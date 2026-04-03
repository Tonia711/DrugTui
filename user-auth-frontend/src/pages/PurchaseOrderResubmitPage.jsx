import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import api, { purchaseOrderApi } from "../util/api";

const DRAFT_KEY_PREFIX = "purchaseOrderResubmitDraft:";

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

const buildOrderNumber = () => `MOD-${Date.now().toString().slice(-6)}`;

function PurchaseOrderResubmitPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("lowStock");
  const [purchaseList, setPurchaseList] = useState([]);
  const [manualItemName, setManualItemName] = useState("");
  const [manualQuantity, setManualQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!orderId) {
        setError("Order ID is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const [meRes, orderRes] = await Promise.all([
          api.get("/Users/me"),
          purchaseOrderApi.getByOrderNumber(orderId),
        ]);

        const me = meRes.data || null;
        const loadedOrder = orderRes.data || null;

        setCurrentUser(me);
        setOrder(loadedOrder);

        const draftKey = `${DRAFT_KEY_PREFIX}${orderId}`;
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          try {
            const parsed = JSON.parse(draftRaw);
            if (Array.isArray(parsed?.items)) {
              setSelectedMethod(parsed.selectedMethod || "lowStock");
              setPurchaseList(
                parsed.items
                  .map((item, index) => ({
                    id: item.id ?? `draft-${index}`,
                    name: item.name || item.description || "",
                    specification:
                      item.specification || item.unit || item.spec || "",
                    quantity: Math.max(
                      1,
                      Number(item.quantity ?? item.quantityOrdered) || 1,
                    ),
                    supplier: item.supplier || loadedOrder?.supplierName || "",
                  }))
                  .filter((item) => item.name),
              );
              setNotes(parsed.notes || "");
              setIsLoading(false);
              return;
            }
          } catch {
            localStorage.removeItem(draftKey);
          }
        }

        const mappedItems = (loadedOrder?.items || []).map((item, index) => ({
          id: item.id ?? `item-${index}`,
          name: item.description || "",
          specification: item.unit || item.specification || "",
          quantity: Math.max(1, Number(item.quantityOrdered) || 1),
          supplier: loadedOrder?.supplierName || "",
        }));

        setPurchaseList(
          mappedItems.length
            ? mappedItems
            : [
                {
                  id: `new-${Date.now()}`,
                  name: "",
                  specification: "",
                  quantity: 1,
                  supplier: loadedOrder?.supplierName || "",
                },
              ],
        );
        setNotes(loadedOrder?.notes || "");
      } catch (err) {
        const message =
          typeof err?.response?.data === "string"
            ? err.response.data
            : "Failed to load order data.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [orderId]);

  const canEditRejectedOrder = useMemo(() => {
    if (!currentUser || !order) return false;
    const isManager = currentUser.role === "Admin";
    const isOwner =
      !!currentUser.id &&
      !!order.createdByUserId &&
      Number(currentUser.id) === Number(order.createdByUserId);
    return order.status === "Rejected" && (isManager || isOwner);
  }, [currentUser, order]);

  const currentRecommendations = useMemo(() => {
    if (selectedMethod === "manualEntry") {
      return recommendedItems.lowStock;
    }
    return recommendedItems[selectedMethod] || [];
  }, [selectedMethod]);

  const orderNumberLabel = order?.orderNumber || "-";

  const getOrderMethodLabel = (methodId) =>
    orderMethods.find((method) => method.id === methodId)?.label || "Low Stock";

  const handlePurchaseItemChange = (id, field, value) => {
    setPurchaseList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "quantity") {
          return { ...item, quantity: Math.max(1, Number(value) || 1) };
        }
        return { ...item, [field]: value };
      }),
    );
  };

  const handleAddRecommended = (item) => {
    if (purchaseList.find((purchaseItem) => purchaseItem.id === item.id))
      return;
    setPurchaseList((prev) => [
      ...prev,
      {
        id: item.id,
        name: item.name,
        specification: item.specification,
        quantity: 1,
        supplier: item.supplier || "",
      },
    ]);
  };

  const handleAddManualItem = () => {
    if (!manualItemName.trim()) return;

    setPurchaseList((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        name: manualItemName.trim(),
        specification: "",
        quantity: Math.max(1, Number(manualQuantity) || 1),
        supplier: order?.supplierName || "",
      },
    ]);
    setManualItemName("");
    setManualQuantity("");
  };

  const handleRemoveItem = (id) => {
    setPurchaseList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveDraft = () => {
    if (!orderId) return;
    localStorage.setItem(
      `${DRAFT_KEY_PREFIX}${orderId}`,
      JSON.stringify({ selectedMethod, items: purchaseList, notes }),
    );
    setError("");
  };

  const handleSubmit = async () => {
      if (!orderId) {
        setError("Order ID is missing.");
        return;
      }
    
      if (!canEditRejectedOrder) {
        setError("You do not have permission to edit this order.");
        return;
      }

    const normalizedItems = purchaseList
      .map((item) => ({
        medicationId: item.medicationId ?? null,
        description:
          `${item.name}${item.specification ? ` ${item.specification}` : ""}`.trim(),
        quantityOrdered: Math.max(1, Number(item.quantity) || 1),
      }))
      .filter((item) => item.description);

    if (!normalizedItems.length) {
      setError("Please add at least one valid item.");
      return;
    }

    setError("");
    try {
      setIsSubmitting(true);
      await purchaseOrderApi.resubmit(orderId, {
        notes:
          `${notes.trim()}${notes.trim() ? "\n" : ""}Order method: ${getOrderMethodLabel(selectedMethod)}`.trim(),
        items: normalizedItems,
      });

      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${orderId}`);
      navigate(`/procurement/purchase-order/${orderId}`, {
        replace: true,
        state: { message: "Order modified and resubmitted successfully." },
      });
    } catch (err) {
      const message =
        typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to resubmit order.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <button
          type="button"
          onClick={() => navigate(`/procurement/purchase-order/${orderId}`)}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <Package size={14} />
        <span>Purchase Order Management / Modify Rejected Order</span>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-xs text-gray-500">
          Loading order data...
        </div>
      ) : error ? (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-6 text-xs text-red-700">
          {error}
        </div>
      ) : !order ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-xs text-gray-500">
          Order not found.
        </div>
      ) : !canEditRejectedOrder ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-xs text-red-700">
          You are not allowed to modify this order, or it is no longer rejected.
        </div>
      ) : (
        <div>
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
                    <div className="text-xs text-gray-500 ml-7">
                      {method.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-sm text-gray-900 mb-3">
                {selectedMethod === "manualEntry"
                  ? "Manual Entry"
                  : "Recommended Items"}
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
                        onChange={(event) =>
                          setManualItemName(event.target.value)
                        }
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Quantity"
                        value={manualQuantity}
                        onChange={(event) =>
                          setManualQuantity(event.target.value)
                        }
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
                      <div className="text-xs text-gray-900 mb-0.5">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {item.specification}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.currentStock}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddRecommended(item)}
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
                  <div className="text-xs text-gray-500">
                    {purchaseList.length} Items
                  </div>
                </div>

                {purchaseList.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-xs text-gray-400 mb-1">
                      No items added yet
                    </div>
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
                            <div className="text-xs text-gray-900">
                              {item.name}
                            </div>
                            {item.specification && (
                              <div className="text-xs text-gray-500">
                                {item.specification}
                              </div>
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
                            value={item.quantity}
                            onChange={(event) =>
                              handlePurchaseItemChange(
                                item.id,
                                "quantity",
                                event.target.value,
                              )
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-700 mb-2">
                      Resubmit Notes
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Optional note for resubmission..."
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>

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
                    onClick={handleSubmit}
                    disabled={isSubmitting || purchaseList.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                    {isSubmitting ? "Submitting..." : "Resubmit Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseOrderResubmitPage;

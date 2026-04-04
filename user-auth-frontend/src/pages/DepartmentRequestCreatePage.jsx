import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PackageOpen,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import api, { departmentApi, departmentRequestApi } from "../util/api";

const DRAFT_KEY = "departmentRequestDraft";

const previousOrders = [
  {
    id: "prev-1",
    name: "Amoxicillin 500mg",
    specification: "100 tablets/bottle",
    lastOrderQty: 500,
    frequency: "High",
  },
  {
    id: "prev-2",
    name: "Ibuprofen 400mg",
    specification: "100 tablets/bottle",
    lastOrderQty: 300,
    frequency: "High",
  },
  {
    id: "prev-3",
    name: "Paracetamol 500mg",
    specification: "100 tablets/bottle",
    lastOrderQty: 800,
    frequency: "High",
  },
  {
    id: "prev-4",
    name: "Omeprazole 20mg",
    specification: "30 capsules/box",
    lastOrderQty: 200,
    frequency: "Medium",
  },
  {
    id: "prev-5",
    name: "Metformin 500mg",
    specification: "100 tablets/bottle",
    lastOrderQty: 400,
    frequency: "Medium",
  },
  {
    id: "prev-6",
    name: "Lisinopril 10mg",
    specification: "100 tablets/bottle",
    lastOrderQty: 250,
    frequency: "Medium",
  },
  {
    id: "prev-7",
    name: "Atorvastatin 20mg",
    specification: "30 tablets/box",
    lastOrderQty: 150,
    frequency: "Low",
  },
  {
    id: "prev-8",
    name: "Amlodipine 5mg",
    specification: "100 tablets/bottle",
    lastOrderQty: 180,
    frequency: "Low",
  },
];

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.title || fallback;
};

const buildRequestNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = `${Date.now()}`.slice(-4);
  return `REQ-${datePart}-${suffix}`;
};

function DepartmentRequestCreatePage() {
  const navigate = useNavigate();

  const [requestList, setRequestList] = useState([]);
  const [manualItemName, setManualItemName] = useState("");
  const [manualQuantity, setManualQuantity] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [notes, setNotes] = useState("");
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const res = await departmentApi.getAll();
        const data = Array.isArray(res.data) ? res.data : [];
        setDepartments(data);
        if (data.length) {
          setDepartmentId(String(data[0].id));
        }
      } catch {
        setDepartments([]);
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await api.get("/Users/me");
        const me = res.data || null;
        setCurrentUser(me);
        const normalizedRole =
          me?.role === "User" ? "DepartmentMember" : me?.role;
        if (normalizedRole === "DepartmentMember" && me?.departmentId) {
          setDepartmentId(String(me.departmentId));
        }
      } catch {
        setCurrentUser(null);
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.items)) {
        setRequestList(parsed.items);
        setDepartmentId(parsed.departmentId || "");
        setNotes(parsed.notes || "");
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const filteredPreviousOrders = previousOrders.filter((item) =>
    item.name.toLowerCase().includes(manualItemName.toLowerCase()),
  );

  const isSubmitDisabled =
    isSubmitting ||
    isLoadingDepartments ||
    !departmentId ||
    requestList.length === 0;

  const handleAddPreviousItem = (item) => {
    const newItem = {
      id: `prev-${Date.now()}`,
      name: item.name,
      specification: item.specification,
      quantityRequested: item.lastOrderQty,
    };
    setRequestList((prev) => [...prev, newItem]);
    setManualItemName("");
    setMessage("");
    setError("");
  };

  const handleAddManualItem = () => {
    setMessage("");
    setError("");

    if (!manualItemName.trim() || !manualQuantity) return;

    const newItem = {
      id: `manual-${Date.now()}`,
      name: manualItemName.trim(),
      specification: "",
      quantityRequested: Math.max(1, Number.parseInt(manualQuantity, 10) || 1),
    };

    setRequestList((prev) => [...prev, newItem]);
    setManualItemName("");
    setManualQuantity("");
  };

  const handleRemoveItem = (id) => {
    setRequestList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleQuantityChange = (id, quantity) => {
    const normalized = Math.max(1, Number(quantity) || 1);
    setRequestList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantityRequested: normalized } : item,
      ),
    );
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        items: requestList,
        departmentId,
        notes,
      }),
    );
    setError("");
    setMessage("Draft saved successfully.");
  };

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    if (!departmentId) {
      setError("Please select a department.");
      return;
    }

    const normalizedItems = requestList
      .map((item) => ({
        medicationId: null,
        description:
          `${item.name}${item.specification ? ` ${item.specification}` : ""}`.trim(),
        quantityRequested: Math.max(1, Number(item.quantityRequested) || 1),
        quantityApproved: 0,
      }))
      .filter((item) => item.description);

    if (!normalizedItems.length) {
      setError("Please add at least one valid item.");
      return;
    }

    setIsSubmitting(true);
    try {
      await departmentRequestApi.create({
        requestNumber: buildRequestNumber(),
        status: "Pending Acceptance",
        departmentId: Number(departmentId),
        requestedAt: new Date().toISOString(),
        notes: notes.trim() || null,
        items: normalizedItems,
      });

      localStorage.removeItem(DRAFT_KEY);
      navigate("/department-request/mine", {
        replace: true,
        state: { message: "Department request created successfully." },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create department request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <button
          type="button"
          onClick={() => navigate("/department-request/mine")}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors mr-2"
        >
          <ArrowLeft size={16} />
        </button>
        <PackageOpen size={14} />
        <span>Department Request / Add New Request</span>
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

      <div className="flex gap-6">
        <div className="flex-1">
          <h2 className="text-sm text-gray-900 mb-3">Manual Entry</h2>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
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
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={manualQuantity}
                  onChange={(event) => setManualQuantity(event.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
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

          <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
            <h3 className="text-sm text-gray-900 mb-3">Previous Orders</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredPreviousOrders.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                  onClick={() => handleAddPreviousItem(item)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-900 mb-1">
                        {item.name}
                      </div>
                      {item.specification && (
                        <div className="text-[10px] text-gray-500 mb-1">
                          {item.specification}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] text-gray-500">
                          Last Order:{" "}
                          <span className="text-gray-900">
                            {item.lastOrderQty} units
                          </span>
                        </div>
                        <div
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            item.frequency === "High"
                              ? "bg-green-50 text-green-700"
                              : item.frequency === "Medium"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.frequency} Frequency
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddPreviousItem(item);
                      }}
                      className="text-gray-400 hover:text-green-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Plus size={16} className="stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[30%]">
          <h2 className="text-sm text-gray-900 mb-3">Request List</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-8">
            <div className="space-y-3 mb-4">
              <label className="block text-xs text-gray-700">Department</label>
              <select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={
                  isLoadingDepartments ||
                  currentUser?.role === "DepartmentMember" ||
                  currentUser?.role === "User"
                }
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <div className="text-[10px] text-gray-500">
                {requestList.length} Items
              </div>
            </div>

            {requestList.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-xs text-gray-400 mb-1">
                  No items added yet
                </div>
                <div className="text-[10px] text-gray-400">
                  Add items using manual entry
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto">
                {requestList.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-900">{item.name}</div>
                        {item.specification && (
                          <div className="text-[10px] text-gray-500">
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
                      <label className="text-[10px] text-gray-600">Qty:</label>
                      <input
                        type="number"
                        value={item.quantityRequested}
                        onChange={(event) =>
                          handleQuantityChange(
                            item.id,
                            Number.parseInt(event.target.value, 10) || 1,
                          )
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 mb-2">
              <label className="block text-xs text-gray-700">
                Request Notes
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Optional note for request..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={requestList.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={14} />
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentRequestCreatePage;
